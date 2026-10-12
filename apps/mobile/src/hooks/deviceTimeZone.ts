import { getCalendars } from "expo-localization";

/** The device's IANA time zone (expo-localization); the database checks it can use it. */
export function deviceTimeZone(): string {
  return getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}
