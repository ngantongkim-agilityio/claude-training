import { DateTime } from 'luxon'

import { env } from '@/configs'

// Normalize "2026-6-1" → "2026-06-01" for Luxon's strict ISO parser
const normalizeDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/**
 * Compute UTC boundaries for a date range expressed in business calendar days.
 *
 * business date → application timezone → UTC boundary → MongoDB query
 *
 * Example: from="2026-06-11", to="2026-06-11", tz="Asia/Ho_Chi_Minh"
 * → $gte: 2026-06-10T17:00:00.000Z (June 11 00:00 VN)
 * → $lt:  2026-06-11T17:00:00.000Z (June 12 00:00 VN — exclusive)
 */
export const getDateRangeUTC = (
  from: string,
  to: string,
  timezone: string = env.APP_TIMEZONE,
): { $gte: Date; $lt: Date } => {
  const start = DateTime.fromISO(normalizeDate(from), { zone: timezone }).startOf('day').toUTC().toJSDate()
  const end = DateTime.fromISO(normalizeDate(to), { zone: timezone }).startOf('day').plus({ days: 1 }).toUTC().toJSDate()

  return { $gte: start, $lt: end }
}
