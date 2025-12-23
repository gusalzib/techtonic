// src/utils/datetime.js
import { DateTime } from 'luxon';

/**
 * Takes a UTC datetime (ISO string or Date) and a timezone,
 * and returns [date, time] formatted for that timezone.
 *
 * @param {string|Date} date - UTC date/time from backend (e.g. "2025-12-01T16:52:28.795Z")
 * @param {string} timezone - IANA timezone id (e.g. "Europe/Stockholm", "Asia/Damascus")
 * @returns {[string, string]} [ "YYYY-MM-DD", "HH:mm" ]
 */
export function transformDateWithTimezone(date, timezone = 'Europe/Stockholm') {
  if (!date) return ['_', '_'];

  let dt;

  if (typeof date === 'string') {
    // assume ISO from backend in UTC
    dt = DateTime.fromISO(date, { zone: 'utc' });
  } else {
    // assume JS Date
    dt = DateTime.fromJSDate(date).setZone('utc');
  }

  dt = dt.setZone(timezone);

  const day  = dt.toFormat('yyyy-LL-dd');
  const time = dt.toFormat('HH:mm');

  return [day, time];
}
