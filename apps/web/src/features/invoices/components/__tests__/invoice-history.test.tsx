import { render, screen, within } from "@testing-library/react"
import { InvoiceHistory } from "@/features/invoices/components/invoice-history"
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

const getItems = () =>
  within(screen.getByRole("list", { name: "History" })).getAllByRole(
    "listitem",
  )

describe("InvoiceHistory", () => {
  // TC-47
  it("lists every event newest first with label, actor and local time, leaving the input oldest first", () => {
    const histories = [
      entry({ eventType: "created", createdAt: "2026-11-03T02:10:00.000Z" }),
      entry({ eventType: "submitted", createdAt: "2026-11-03T02:12:00.000Z" }),
      entry({
        eventType: "approved",
        actor: "finance.thu@example.com",
        createdAt: "2026-11-05T01:00:00.000Z",
      }),
    ]

    render(<InvoiceHistory histories={histories} />)

    const items = getItems()
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent("Approved")
    expect(items[0]).toHaveTextContent("finance.thu@example.com")
    expect(items[0]).toHaveTextContent(
      new Date("2026-11-05T01:00:00.000Z").toLocaleString(),
    )
    expect(items[1]).toHaveTextContent("Submitted")
    expect(items[2]).toHaveTextContent("Created")
    expect(items[2]).toHaveTextContent("lan@example.com")
    expect(histories.map((e) => e.eventType)).toEqual([
      "created",
      "submitted",
      "approved",
    ])
  })

  // TC-48
  it("shows a rejection reason, and an approval comment only when present", () => {
    render(
      <InvoiceHistory
        histories={[
          entry({ eventType: "rejected", reason: "Tax should be 10%" }),
          entry({ eventType: "approved", comment: "Matches PO-2291." }),
          entry({ eventType: "approved" }),
        ]}
      />,
    )

    const [noComment, withComment, rejected] = getItems()
    expect(rejected).toHaveTextContent("Reason: Tax should be 10%")
    expect(withComment).toHaveTextContent("Comment: Matches PO-2291.")
    expect(noComment).toHaveTextContent("Approved")
    expect(noComment).not.toHaveTextContent("Comment:")
  })

  // TC-49
  it("shows each change of an edited event as Field: old → new", () => {
    render(
      <InvoiceHistory
        histories={[
          entry({
            eventType: "edited",
            changes: {
              tax: { old: 80, new: 100 },
              description: { old: "Office chairs", new: null },
            },
          }),
        ]}
      />,
    )

    expect(screen.getByText("Tax: $80.00 → $100.00")).toBeInTheDocument()
    expect(
      screen.getByText("Description: Office chairs → —"),
    ).toBeInTheDocument()
  })

  // TC-50
  it("shows the approved text for legacy entries", () => {
    render(
      <InvoiceHistory
        histories={[
          entry({
            eventType: "edited",
            actor: null,
            legacy: true,
            changes: { tax: { old: 80, new: 100 } },
          }),
          entry({ eventType: null, actor: null, legacy: true }),
        ]}
      />,
    )

    const [untyped, legacyEdit] = getItems()
    expect(legacyEdit).toHaveTextContent(
      "Edited (before audit tracking). Actor not recorded.",
    )
    expect(legacyEdit).toHaveTextContent("Tax: $80.00 → $100.00")
    expect(untyped).toHaveTextContent(
      "Recorded before audit tracking. Details not available.",
    )
  })

  // TC-51
  it("says so when there is no history", () => {
    render(<InvoiceHistory histories={[]} />)

    expect(screen.getByText("No history recorded yet.")).toBeInTheDocument()
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument()
  })

  // TC-70
  it("shows all 30 events with no paging or collapsing", () => {
    const histories = Array.from({ length: 30 }, (_, i) =>
      entry({
        eventType: i % 2 === 0 ? "rejected" : "resubmitted",
        reason: i % 2 === 0 ? `Reason ${i}` : undefined,
      }),
    )

    render(<InvoiceHistory histories={histories} />)

    expect(getItems()).toHaveLength(30)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
