import calendar
from datetime import date, datetime
from pathlib import Path

import pytest
from inline_snapshot import snapshot

from app.pdf_parsing import (
    Eng10Schedule,
    PlannerNote,
    extract_lines_from_pdf,
    nearest_matching_date,
)

pytestmark = pytest.mark.time_machine(datetime(2026, 4, 5, 12, 0))  # The day I wrote the tests (fixed anchor date so tests are deterministic)


@pytest.mark.parametrize(  # TODO: Also check x num of random dates and verify existence and closest(idk how i would do that)
    "month,day,weekday,expected",
    [
        # Exact Matches # TODO: maybe separate test for easier debugging
        pytest.param(1, 6, calendar.TUESDAY, date(2026, 1, 6), id="int-weekday"),
        pytest.param(1, 6, "T", date(2026, 1, 6), id="single-char-abbr"),
        pytest.param(1, 8, "Th", date(2026, 1, 8), id="two-char-abbr"),
        pytest.param(6, 17, calendar.WEDNESDAY, date(2026, 6, 17), id="arbitrary-date"),
        # Year resolution, nearest match isn't current year
        pytest.param(1, 6, calendar.MONDAY, date(2025, 1, 6), id="year-resolution-1ya"),
        pytest.param(1, 6, calendar.FRIDAY, date(2023, 1, 6), id="year-resolution-3ya"),
        # TODO: add a couple more edge cases(maybe including weekends 🫤)
    ],
)
def test_nearest_matching_date(month, day, weekday, expected):
    assert nearest_matching_date(month, day, weekday) == expected


def test_impossible_nearest_matching_date():
    with pytest.raises(AssertionError):
        nearest_matching_date(2, 30, calendar.MONDAY)


@pytest.fixture
def sample_pdf_bytes():
    return (Path(__file__).parent / "data" / "eng10_sep-oct.pdf").read_bytes()  # TODO: maybe switch to a more abridged schedule


def test_extract_and_parse_full_pdf(sample_pdf_bytes: bytes):
    schedule = Eng10Schedule.from_pdf_text(extract_lines_from_pdf(sample_pdf_bytes))
    assert schedule == snapshot(
        Eng10Schedule(
            odd_days=[
                PlannerNote(
                    title="Introductions; Discuss East/West", todo_date=date(2025, 9, 8)
                ),
                PlannerNote(title="Discuss East/West", todo_date=date(2025, 9, 10)),
                PlannerNote(
                    title="- East/West In-class Writing (ICW); Start Shooting an Elephant in class",
                    todo_date=date(2025, 9, 12),
                ),
                PlannerNote(
                    title="Discuss Shooting an Elephant", todo_date=date(2025, 9, 16)
                ),
                PlannerNote(
                    title="Start A Modest Proposal  in class",
                    todo_date=date(2025, 9, 18),
                ),
                PlannerNote(
                    title="Finish A Modest Proposal", todo_date=date(2025, 9, 22)
                ),
                PlannerNote(
                    title="Start A Small Place in Class", todo_date=date(2025, 9, 24)
                ),
                PlannerNote(
                    title="A Small Place 1-19; Shooting an Elephant RP",
                    todo_date=date(2025, 9, 26),
                ),
                PlannerNote(
                    title="A Small Place 19-52; Group 1 Slides",
                    todo_date=date(2025, 9, 30),
                ),
                PlannerNote(
                    title="A Small Place 52-81; Group 2 Slides",
                    todo_date=date(2025, 10, 6),
                ),
                PlannerNote(
                    title="Start Frankenstein in Class", todo_date=date(2025, 10, 8)
                ),
                PlannerNote(title="Frankenstein, 15-37", todo_date=date(2025, 10, 10)),
                PlannerNote(
                    title="Frankenstein, 38-64; A Small Place RP due",
                    todo_date=date(2025, 10, 16),
                ),
                PlannerNote(title="Frankenstein, 65-90", todo_date=date(2025, 10, 20)),
                PlannerNote(
                    title="Frankenstein, 90-112; VOL 1 test",
                    todo_date=date(2025, 10, 22),
                ),
                PlannerNote(
                    title="Frankenstein, 113-137", todo_date=date(2025, 10, 24)
                ),
                PlannerNote(
                    title="Frankenstein, 138-162", todo_date=date(2025, 10, 28)
                ),
                PlannerNote(
                    title="Frankenstein; VOL 2 ICW", todo_date=date(2025, 10, 30)
                ),
            ],
            even_days=[
                PlannerNote(
                    title="Introductions; Discuss East/West", todo_date=date(2025, 9, 9)
                ),
                PlannerNote(title="Discuss East/West", todo_date=date(2025, 9, 11)),
                PlannerNote(
                    title="- East/West In-class Writing (ICW); Start Shooting an Elephant in class",
                    todo_date=date(2025, 9, 15),
                ),
                PlannerNote(
                    title="Discuss Shooting an Elephant", todo_date=date(2025, 9, 17)
                ),
                PlannerNote(
                    title="Start A Modest Proposal  in class",
                    todo_date=date(2025, 9, 19),
                ),
                PlannerNote(
                    title="Finish A Modest Proposal", todo_date=date(2025, 9, 25)
                ),
                PlannerNote(
                    title="Shooting an Elephant RP; Start A Small Place in Class",
                    todo_date=date(2025, 9, 29),
                ),
                PlannerNote(title="A Small Place 1-19", todo_date=date(2025, 10, 1)),
                PlannerNote(
                    title="A Small Place 19-52; Group 1 Slides",
                    todo_date=date(2025, 10, 3),
                ),
                PlannerNote(
                    title="A Small Place 52-81; Group 2 Slides",
                    todo_date=date(2025, 10, 7),
                ),
                PlannerNote(
                    title="Start Frankenstein in Class", todo_date=date(2025, 10, 9)
                ),
                PlannerNote(
                    title="Frankenstein, 15-37; A Small Place RP due",
                    todo_date=date(2025, 10, 15),
                ),
                PlannerNote(title="Frankenstein, 38-64", todo_date=date(2025, 10, 17)),
                PlannerNote(title="Frankenstein, 65-90", todo_date=date(2025, 10, 21)),
                PlannerNote(
                    title="Frankenstein, 90-112; VOL 1 test",
                    todo_date=date(2025, 10, 23),
                ),
                PlannerNote(
                    title="Frankenstein, 113-137", todo_date=date(2025, 10, 27)
                ),
                PlannerNote(
                    title="Frankenstein, 138-162", todo_date=date(2025, 10, 29)
                ),
                PlannerNote(
                    title="Frankenstein; VOL 2 ICW", todo_date=date(2025, 10, 31)
                ),
            ],
        )
    )
