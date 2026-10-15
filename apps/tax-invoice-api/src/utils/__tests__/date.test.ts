import { getDateRangeUTC } from '../date'

describe('getDateRangeUTC', () => {
  const tz = 'Asia/Ho_Chi_Minh' // UTC+7

  it('should return correct UTC boundaries for a single Vietnam day', () => {
    const result = getDateRangeUTC('2026-06-11', '2026-06-11', tz)

    // June 11 00:00 VN = June 10 17:00 UTC
    expect(result.$gte).toEqual(new Date('2026-06-10T17:00:00.000Z'))
    // June 12 00:00 VN = June 11 17:00 UTC (exclusive)
    expect(result.$lt).toEqual(new Date('2026-06-11T17:00:00.000Z'))
  })

  it('should return correct UTC boundaries for a multi-day range', () => {
    const result = getDateRangeUTC('2026-06-01', '2026-06-03', tz)

    // June 1 00:00 VN = May 31 17:00 UTC
    expect(result.$gte).toEqual(new Date('2026-05-31T17:00:00.000Z'))
    // June 4 00:00 VN = June 3 17:00 UTC (exclusive)
    expect(result.$lt).toEqual(new Date('2026-06-03T17:00:00.000Z'))
  })

  it('should handle UTC timezone (offset 0)', () => {
    const result = getDateRangeUTC('2026-06-11', '2026-06-11', 'UTC')

    expect(result.$gte).toEqual(new Date('2026-06-11T00:00:00.000Z'))
    expect(result.$lt).toEqual(new Date('2026-06-12T00:00:00.000Z'))
  })

  it('should handle negative offset timezone (America/New_York)', () => {
    // EDT is UTC-4 in June
    const result = getDateRangeUTC('2026-06-11', '2026-06-11', 'America/New_York')

    // June 11 00:00 ET = June 11 04:00 UTC
    expect(result.$gte).toEqual(new Date('2026-06-11T04:00:00.000Z'))
    // June 12 00:00 ET = June 12 04:00 UTC
    expect(result.$lt).toEqual(new Date('2026-06-12T04:00:00.000Z'))
  })

  it('should capture an invoice created early morning Vietnam time', () => {
    const range = getDateRangeUTC('2026-06-11', '2026-06-11', tz)

    // Invoice created at 2026-06-11 03:00 VN = 2026-06-10T20:00:00Z
    const invoiceCreatedAt = new Date('2026-06-10T20:00:00.000Z')

    expect(invoiceCreatedAt.getTime()).toBeGreaterThanOrEqual(range.$gte.getTime())
    expect(invoiceCreatedAt.getTime()).toBeLessThan(range.$lt.getTime())
  })

  it('should exclude an invoice from the previous Vietnam day', () => {
    const range = getDateRangeUTC('2026-06-11', '2026-06-11', tz)

    // Invoice created at 2026-06-10 23:59 VN = 2026-06-10T16:59:00Z
    const invoiceCreatedAt = new Date('2026-06-10T16:59:00.000Z')

    expect(invoiceCreatedAt.getTime()).toBeLessThan(range.$gte.getTime())
  })

  it('should handle non-zero-padded date strings (e.g. 2026-6-1)', () => {
    const result = getDateRangeUTC('2026-6-1', '2026-6-1', tz)

    // Same as 2026-06-01
    const expected = getDateRangeUTC('2026-06-01', '2026-06-01', tz)

    expect(result.$gte).toEqual(expected.$gte)
    expect(result.$lt).toEqual(expected.$lt)
  })
})
