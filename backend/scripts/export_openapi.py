import json
from pathlib import Path
from app.main import app

(Path(__file__).resolve().parent.parent / "openapi.json").write_text(
    json.dumps(app.openapi(), indent=2) + "\n",
    encoding="utf-8"
)
print("OpenAPI schema exported to openapi.json")
