import {
  formatChange,
  getEventLabel,
  getLatestRejection,
  toNewestFirst,
} from "@/features/invoices/history"
import type { InvoiceHistoryEntry } from "@/features/invoices/types"

const entry = (
  overrides: Partial<InvoiceHistoryEntry> = {},
): InvoiceHistoryEntry => ({
  eventType: "created",
  actor: "lan@example.com",
  changes: {},
  createdAt: "2026-11-03T02:10:00.000Z",
  ...overrides,
})

describe("toNewestFirst", () => {
  it("returns the entries newest first without changing the input order", () => {
    const histories = [
      entry({ eventType: "created" }),
      entry({ eventType: "submitted" }),
      entry({ eventType: "approved" }),
    ]

    const result = toNewestFirst(histories)

    expect(result.map((e) => e.eventType)).toEqual([
      "approved",
      "submitted",
      "created",
    ])
    expect(histories.map((e) => e.eventType)).toEqual([
      "created",
      "submitted",
      "approved",
    ])
  })
})

describe("getEventLabel", () => {
  it.each([
    ["created", "Created"],
    ["edited", "Edited"],
    ["submitted", "Submitted"],
    ["resubmitted", "Resubmitted"],
    ["approved", "Approved"],
    ["rejected", "Rejected"],
  ] as const)("labels %s as %s", (eventType, label) => {
    expect(getEventLabel(entry({ eventType }))).toBe(label)
  })

  it("labels a legacy edit with the approved text", () => {
    expect(
      getEventLabel(
        entry({
          eventType: "edited",
          actor: null,
          legacy: true,
          changes: { tax: { old: 80, new: 100 } },
        }),
      ),
    ).toBe("Edited (before audit tracking). Actor not recorded.")
  })

  it("labels a legacy entry without a type with the approved text", () => {
    expect(
      getEventLabel(entry({ eventType: null, actor: null, legacy: true })),
    ).toBe("Recorded before audit tracking. Details not available.")
  })
})

describe("formatChange", () => {
  it("formats amounts in the detail page format", () => {
    expect(formatChange("tax", { old: 80, new: 100 })).toBe(
      "Tax: $80.00 → $100.00",
    )
    expect(formatChange("amount", { old: 1000, new: 1250.5 })).toBe(
      "Amount: $1,000.00 → $1,250.50",
    )
  })

  it("shows a dash for a missing value", () => {
    expect(
      formatChange("description", { old: "Office chairs", new: null }),
    ).toBe("Description: Office chairs → —")
    expect(formatChange("description", { old: "", new: "Desks" })).toBe(
      "Description: — → Desks",
    )
    expect(formatChange("tax", { new: 100 })).toBe("Tax: — → $100.00")
  })

  it("formats an amount stored as a numeric string", () => {
    expect(formatChange("tax", { old: "80", new: 100 })).toBe(
      "Tax: $80.00 → $100.00",
    )
  })

  it("capitalizes an unknown field and shows its values as text", () => {
    expect(formatChange("currency", { old: "USD", new: "VND" })).toBe(
      "Currency: USD → VND",
    )
  })
})

describe("getLatestRejection", () => {
  it("returns the last rejected entry when there are several (AC-6)", () => {
    const histories = [
      entry({ eventType: "created" }),
      entry({ eventType: "rejected", reason: "first" }),
      entry({ eventType: "resubmitted" }),
      entry({ eventType: "rejected", reason: "second" }),
    ]

    expect(getLatestRejection(histories)?.reason).toBe("second")
  })

  it("returns null when no entry is a rejection (AC-6)", () => {
    expect(
      getLatestRejection([
        entry({ eventType: "created" }),
        entry({ eventType: "submitted" }),
      ]),
    ).toBeNull()
    expect(getLatestRejection([])).toBeNull()
  })

  it("does not change the input order (AC-6)", () => {
    const histories = [
      entry({ eventType: "rejected", reason: "a" }),
      entry({ eventType: "submitted" }),
    ]

    getLatestRejection(histories)

    expect(histories.map((e) => e.eventType)).toEqual(["rejected", "submitted"])
  })
})
