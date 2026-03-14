const MONTH_IN_TEXT_PATTERN =
  /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec|schedule)\b/i

export function isEnglishCourse(name: string) {
  return name.toLowerCase().includes("english")
}

export function isSchedule(text: string) {
  return MONTH_IN_TEXT_PATTERN.test(text)
}
