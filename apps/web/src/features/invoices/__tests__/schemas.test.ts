import {
  approveInvoiceSchema,
  rejectInvoiceSchema,
} from "@/features/invoices/schemas"

describe("rejectInvoiceSchema", () => {
  // TC-69
  it.each([
    ["empty", ""],
    ["spaces only", "   "],
    ["501 characters", "a".repeat(501)],
  ])("rejects a reason that is %s (TC-69)", (_label, reason) => {
    expect(rejectInvoiceSchema.safeParse({ reason }).success).toBe(false)
  })

  it("accepts 500 characters and trims the reason (TC-69)", () => {
    expect(
      rejectInvoiceSchema.safeParse({ reason: "a".repeat(500) }).success,
    ).toBe(true)
    expect(rejectInvoiceSchema.parse({ reason: "  fix tax  " }).reason).toBe(
      "fix tax",
    )
  })
})

describe("approveInvoiceSchema", () => {
  it("accepts a missing, blank or 500-character comment (TC-69)", () => {
    expect(approveInvoiceSchema.safeParse({}).success).toBe(true)
    expect(approveInvoiceSchema.safeParse({ comment: "   " }).success).toBe(
      true,
    )
    expect(
      approveInvoiceSchema.safeParse({ comment: "a".repeat(500) }).success,
    ).toBe(true)
  })

  it("rejects a 501-character comment (TC-69)", () => {
    expect(
      approveInvoiceSchema.safeParse({ comment: "a".repeat(501) }).success,
    ).toBe(false)
  })
})
