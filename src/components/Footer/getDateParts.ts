interface DatetimeParts {
  weekday: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
}

export const getDateParts = (
  date: Date,
  intlLocale: "en-CA" | "fr-CA",
): DatetimeParts => {
  const parts = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    weekday: getPart("weekday"),
    day: String(date.getUTCDate()),
    month: getPart("month"),
    year: getPart("year"),
    hour: getPart("hour"),
    minute: getPart("minute"),
  };
};
