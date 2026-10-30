import { formatAmount } from "@/utils/format"

describe("formatAmount", () => {
  it("formats a number the way the detail page shows amounts", () => {
    expect(formatAmount(80)).toBe("$80.00")
    expect(formatAmount(1234.5)).toBe("$1,234.50")
  })

  it("shows a dash when the value is missing", () => {
    expect(formatAmount(undefined)).toBe("—")
    expect(formatAmount(null)).toBe("—")
  })
})
