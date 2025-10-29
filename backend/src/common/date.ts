import { startOfMonth, endOfMonth } from "date-fns";
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";

const EL_SALVADOR_TZ = "America/El_Salvador";

/**
 * Get the start and end of the month in El Salvador timezone
 * @param date - The date to get the month range for (defaults to current date)
 * @returns Object with start and end dates in UTC
 */
export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  // Convert the input date to El Salvador timezone
  const zonedDate = utcToZonedTime(date, EL_SALVADOR_TZ);
  
  // Get start and end of month in the local timezone
  const startOfMonthLocal = startOfMonth(zonedDate);
  const endOfMonthLocal = endOfMonth(zonedDate);
  
  // Convert back to UTC for database queries
  const start = zonedTimeToUtc(startOfMonthLocal, EL_SALVADOR_TZ);
  const end = zonedTimeToUtc(endOfMonthLocal, EL_SALVADOR_TZ);
  
  return { start, end };
}

/**
 * Convert a UTC date to El Salvador timezone
 */
export function toElSalvadorTime(date: Date): Date {
  return utcToZonedTime(date, EL_SALVADOR_TZ);
}

/**
 * Convert an El Salvador timezone date to UTC
 */
export function fromElSalvadorTime(date: Date): Date {
  return zonedTimeToUtc(date, EL_SALVADOR_TZ);
}

