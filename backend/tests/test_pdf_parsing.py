import calendar
from datetime import date
import pytest
from app.pdf_parsing import nearest_matching_date

BASE_DATE = date(2026, 4, 5) # The day I wrote the tests (fixed anchor date so tests are deterministic)

@pytest.mark.parametrize( # TODO: Also check x num of random dates and verify existence and closest(idk how i would do that)
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
    assert nearest_matching_date(month, day, weekday, base_date=BASE_DATE) == expected

def test_impossible_nearest_matching_date():
    with pytest.raises(AssertionError):
        nearest_matching_date(2, 30, calendar.MONDAY, base_date=BASE_DATE)
