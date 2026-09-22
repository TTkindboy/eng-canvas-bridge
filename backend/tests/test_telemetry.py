import json
from pathlib import Path

import logfire
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.main import request_attributes_mapper
from app.routers.pdfs import router


@pytest.mark.parametrize("metadata", [
    None, "not JSON", "[]", '{"user_name": 123}',
    json.dumps({"user_name": "x" * 257}),
])
def test_invalid_or_missing_metadata_does_not_block_upload(capfire, metadata):
    app = FastAPI()
    app.include_router(router)
    logfire.instrument_fastapi(app, request_attributes_mapper=request_attributes_mapper)
    document = (Path(__file__).parent / "data" / "Eng11syllabus2026odds1.docx").read_bytes()
    with TestClient(app) as client:
        response = client.post(
            "/pdfs/upload",
            files={"pdf": ("schedule.docx", document)},
            data={"metadata": metadata} if metadata is not None else {},
        )
    assert response.status_code == 200
    assert len(response.json()["odd"]) == 13
    spans = capfire.exporter.exported_spans
    upload = next(span for span in spans if span.name == "parse uploaded schedule {filename}")
    assert "user_name" not in upload.attributes
    request_span = next(
        span for span in spans
        if span.name == "POST /pdfs/upload"
        and span.attributes.get("logfire.span_type") != "pending_span"
    )
    assert json.loads(request_span.attributes["fastapi.arguments.values"]) == {"metadata": None}


@pytest.mark.parametrize("broken", [False, True])
def test_upload_trace_keeps_debug_context_on_success_and_failure(capfire, broken):
    app = FastAPI()
    app.include_router(router)
    logfire.instrument_fastapi(app, request_attributes_mapper=request_attributes_mapper)
    document = (
        b"PK invalid docx"
        if broken else
        (Path(__file__).parent / "data" / "Eng11syllabus2026odds1.docx").read_bytes()
    )
    metadata = {
        "user_id": "7", "user_name": "Zoë Student",
        "course_id": "42", "course_name": "English 11",
        "file_id": "123", "extension_version": "0.2.0",
    }
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/pdfs/upload",
            files={"pdf": ("Week 1 – schedule.docx", document)},
            data={"metadata": json.dumps({**metadata, "unexpected": "not logged"})},
        )
    assert response.status_code == (500 if broken else 200)
    spans = [
        span for span in capfire.exporter.exported_spans
        if span.attributes.get("logfire.span_type") != "pending_span"
    ]
    upload = next(span for span in spans if span.name == "parse uploaded schedule {filename}")
    assert upload.attributes["logfire.msg"] == "parse uploaded schedule Week 1 – schedule.docx"
    for key, value in metadata.items():
        assert upload.attributes[key] == value
    assert upload.attributes["file_size_bytes"] == len(document)
    parser = next(span for span in spans if span.name == "parse eng11 schedule")
    assert parser.parent.span_id == upload.context.span_id
    assert "data" not in parser.attributes
    assert "unexpected" not in upload.attributes
    request_span = next(span for span in spans if span.name == "POST /pdfs/upload")
    assert request_span.context.trace_id == upload.context.trace_id
    values = json.loads(request_span.attributes["fastapi.arguments.values"])
    assert set(values) == {"metadata"}
    if broken:
        assert any(event.name == "exception" for event in parser.events)
    else:
        assert upload.attributes["odd_count"] == 13
        assert upload.attributes["even_count"] == 0
