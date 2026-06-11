/** Zona horaria de referencia para horarios de partidos (Venezuela). */
export const MATCH_TIMEZONE = "America/Caracas";

const dateShortOptions: Intl.DateTimeFormatOptions = {
  timeZone: MATCH_TIMEZONE,
  day: "2-digit",
  month: "short",
};

const timeOptions: Intl.DateTimeFormatOptions = {
  timeZone: MATCH_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const dayHeadingOptions: Intl.DateTimeFormatOptions = {
  timeZone: MATCH_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
};

const dayKeyOptions: Intl.DateTimeFormatOptions = {
  timeZone: MATCH_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

export function formatMatchDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", dateShortOptions);
}

export function formatMatchTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-VE", timeOptions);
}

export function formatMatchDayHeading(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", dayHeadingOptions);
}

/** Clave estable (YYYY-MM-DD) del día calendario en Caracas. */
export function getMatchDayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", dayKeyOptions);
}
