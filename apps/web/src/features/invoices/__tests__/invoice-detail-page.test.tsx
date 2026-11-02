import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import InvoiceDetailPage from "@/app/(dashboard)/invoices/[invoiceNumber]/page"
import { apiClient } from "@/services/api-client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { invoiceKeys } from "@/hooks/use-invoices"
import type { Invoice, InvoiceHistoryEntry } from "@/features/invoices/types"

jest.mock("@/services/api-client", () => ({
  ...jest.requireActual("@/services/api-client"),
  apiClient: jest.fn(),
}))
jest.mock("@/hooks/use-current-user", () => ({ useCurrentUser: jest.fn() }))
jest.mock("next/navigation", () => ({
  useParams: () => ({ invoiceNumber: "INV-1" }),
  useRouter: () => ({ push: jest.fn() }),
}))

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>
const mockUseCurrentUser = useCurrentUser as jest.Mock

const created: InvoiceHistoryEntry = {
  eventType: "created",
  actor: "lan@example.com",
  changes: {},
  createdAt: "2026-11-03T02:10:00.000Z",
}

const invoiceResponse = (overrides: Partial<Invoice> = {}) => ({
  status: "success",
  message: "OK",
  data: {
    invoice: {
      invoiceNumber: "INV-1",
      user: "lan@example.com",
      status: "draft",
      amount: 1000,
      tax: 80,
      description: "Office chairs",
      createdAt: "2026-11-03T02:10:00.000Z",
      updatedAt: "2026-11-03T02:10:00.000Z",
      histories: [created],
      ...overrides,
    } satisfies Invoice,
  },
})

const asUser = (role: "user" | "admin", email: string) =>
  mockUseCurrentUser.mockReturnValue({ data: { role, email } })

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <InvoiceDetailPage />
    </QueryClientProvider>,
  )
  return queryClient
}

const renderPageWithRerender = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  // A fresh element each time, so React re-renders and re-reads the mocked user
  const ui = () => (
    <QueryClientProvider client={queryClient}>
      <InvoiceDetailPage />
    </QueryClientProvider>
  )
  const { rerender } = render(ui())
  return { rerender: () => rerender(ui()) }
}

const calledPaths = () => mockApiClient.mock.calls.map(([path]) => path)

describe("InvoiceDetailPage history", () => {
  // TC-52
  it("follows the page's loading and error states and never calls /history", async () => {
    asUser("user", "lan@example.com")
    let fail: (error: Error) => void = () => {}
    mockApiClient.mockReturnValue(
      new Promise((_, reject) => {
        fail = reject
      }),
    )

    renderPage()

    expect(screen.queryByText("History")).not.toBeInTheDocument()
    fail(new Error("Network error"))
    expect(
      await screen.findByText(/Failed to load invoice/),
    ).toBeInTheDocument()
    expect(screen.queryByText("History")).not.toBeInTheDocument()
    expect(calledPaths()).toEqual(["/invoices/INV-1"])
    expect(calledPaths().some((path) => path.includes("/history"))).toBe(false)
  })

  // TC-53
  it("shows an admin the same events with real emails on another user's invoice", async () => {
    asUser("admin", "finance.minh@example.com")
    mockApiClient.mockResolvedValue(
      invoiceResponse({
        status: "approved",
        histories: [
          created,
          { ...created, eventType: "submitted" },
          {
            ...created,
            eventType: "approved",
            actor: "finance.thu@example.com",
          },
        ],
      }),
    )

    const queryClient = renderPage()

    const list = await screen.findByRole("list", { name: "History" })
    const items = within(list).getAllByRole("listitem")
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent("finance.thu@example.com")
    expect(items[2]).toHaveTextContent("lan@example.com")
    // TC-47: the cached histories the T4 banner will read stay oldest first
    const cached = queryClient.getQueryData<ReturnType<typeof invoiceResponse>>(
      invoiceKeys.detail("INV-1"),
    )
    expect(cached?.data.invoice.histories?.map((e) => e.eventType)).toEqual([
      "created",
      "submitted",
      "approved",
    ])
  })

  // TC-71: mocked UI behaviour only; it does not prove the current API records the event
  it("puts the new event on top after an action succeeds, without a reload", async () => {
    asUser("user", "lan@example.com")
    let submitted = false
    mockApiClient.mockImplementation(async (_path, options) => {
      if (options?.method === "PATCH") {
        submitted = true
        return { data: { invoiceNumber: "INV-1", status: "submitted" } }
      }
      return submitted
        ? invoiceResponse({
            status: "submitted",
            histories: [
              created,
              {
                ...created,
                eventType: "submitted",
                createdAt: "2026-11-03T02:12:00.000Z",
              },
            ],
          })
        : invoiceResponse()
    })
    const user = userEvent.setup()

    renderPage()

    const list = await screen.findByRole("list", { name: "History" })
    expect(within(list).getAllByRole("listitem")).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Submit" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Submit" }))

    await waitFor(() => {
      const items = within(
        screen.getByRole("list", { name: "History" }),
      ).getAllByRole("listitem")
      expect(items).toHaveLength(2)
      expect(items[0]).toHaveTextContent("Submitted")
    })
    // Same list element: the page refetched in the background instead of reloading
    expect(screen.getByRole("list", { name: "History" })).toBe(list)
  })
})

const rejectedEntry = (
  overrides: Partial<InvoiceHistoryEntry> = {},
): InvoiceHistoryEntry => ({
  eventType: "rejected",
  actor: "finance.thu@example.com",
  changes: {},
  createdAt: "2026-11-04T03:00:00.000Z",
  reason: "Tax should be 10% of the amount.",
  ...overrides,
})

const buttonNames = () =>
  screen.queryAllByRole("button").map((button) => button.textContent?.trim())

describe("InvoiceDetailPage actions by status", () => {
  const ACTIONS = ["Submit", "Approve", "Reject", "Edit", "Delete", "Resubmit"]
  const visibleActions = () =>
    ACTIONS.filter((name) => buttonNames().includes(name))

  // TC-42
  it.each([
    ["draft", "user", ["Submit", "Edit", "Delete"]],
    ["submitted", "user", ["Edit", "Delete"]],
    ["rejected", "user", ["Delete", "Edit", "Resubmit"]],
    ["approved", "user", []],
    ["draft", "admin", []],
    ["submitted", "admin", ["Approve", "Reject"]],
    ["rejected", "admin", []],
    ["approved", "admin", []],
  ] as const)(
    "%s invoice, %s: shows %j (TC-42)",
    async (status, role, expected) => {
      asUser(
        role,
        role === "admin" ? "finance@example.com" : "lan@example.com",
      )
      mockApiClient.mockResolvedValue(
        invoiceResponse({
          status,
          histories: [
            created,
            ...(status === "rejected" ? [rejectedEntry()] : []),
          ],
        }),
      )

      renderPage()

      await screen.findByText("Office chairs")
      expect([...visibleActions()].sort()).toEqual([...expected].sort())
    },
  )

  // TC-42 (AC-5): on rejected, Edit lives in the banner and Delete in the header
  it("puts Edit in the banner and Delete in the header on a rejected invoice (TC-42)", async () => {
    asUser("user", "lan@example.com")
    mockApiClient.mockResolvedValue(
      invoiceResponse({
        status: "rejected",
        histories: [created, rejectedEntry()],
      }),
    )

    renderPage()

    const banner = await screen.findByRole("region", { name: /Rejected/ })
    expect(within(banner).getByRole("button", { name: "Edit" })).toBeVisible()
    expect(
      within(banner).queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Delete" })).toBeVisible()
  })
})

describe("InvoiceDetailPage rejection banner", () => {
  // TC-43
  it("shows who rejected, when and why, with exactly one Resubmit for the owner (TC-43)", async () => {
    asUser("user", "lan@example.com")
    mockApiClient.mockResolvedValue(
      invoiceResponse({
        status: "rejected",
        histories: [created, rejectedEntry()],
      }),
    )

    renderPage()

    const date = new Date("2026-11-04T03:00:00.000Z").toLocaleDateString()
    expect(
      await screen.findByText(`Rejected by finance.thu@example.com on ${date}`),
    ).toBeVisible()
    expect(screen.getByText("Tax should be 10% of the amount.")).toBeVisible()
    expect(screen.getAllByRole("button", { name: "Resubmit" })).toHaveLength(1)
  })

  it("shows an admin the banner without Edit or Resubmit (TC-43)", async () => {
    asUser("admin", "finance.minh@example.com")
    mockApiClient.mockResolvedValue(
      invoiceResponse({
        status: "rejected",
        histories: [created, rejectedEntry()],
      }),
    )

    renderPage()

    expect(
      await screen.findByText(/Rejected by finance.thu@example.com on /),
    ).toBeVisible()
    expect(screen.queryByRole("button", { name: "Resubmit" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull()
  })

  it("shows no banner while the invoice is not rejected (TC-43)", async () => {
    asUser("user", "lan@example.com")
    mockApiClient.mockResolvedValue(
      invoiceResponse({
        status: "submitted",
        histories: [created, rejectedEntry()],
      }),
    )

    renderPage()

    await screen.findByText("Office chairs")
    expect(screen.queryByText(/Rejected by/)).not.toBeInTheDocument()
  })

  // TC-44
  it.each([
    ["no rejected entry", [created]],
    [
      "a rejected entry without a reason",
      [created, rejectedEntry({ reason: undefined, actor: null })],
    ],
  ])("shows the no-reason banner for %s (TC-44)", async (_label, histories) => {
    asUser("user", "lan@example.com")
    mockApiClient.mockResolvedValue(
      invoiceResponse({ status: "rejected", histories }),
    )

    renderPage()

    expect(
      await screen.findByText("Rejected. No reason was recorded."),
    ).toBeVisible()
    expect(
      screen.getByText(
        "This invoice was rejected before reasons were recorded.",
      ),
    ).toBeVisible()
    expect(screen.getAllByRole("button", { name: "Resubmit" })).toHaveLength(1)
  })

  // TC-68
  it("shows the second rejection when the invoice was rejected twice (TC-68)", async () => {
    asUser("user", "lan@example.com")
    mockApiClient.mockResolvedValue(
      invoiceResponse({
        status: "rejected",
        histories: [
          created,
          rejectedEntry({ reason: "First reason", actor: "a@example.com" }),
          { ...created, eventType: "resubmitted" },
          rejectedEntry({ reason: "Second reason", actor: "b@example.com" }),
        ],
      }),
    )

    renderPage()

    expect(
      await screen.findByText(/Rejected by b@example.com on /),
    ).toBeVisible()
    const banner = screen.getByRole("region", { name: /Rejected/ })
    expect(within(banner).getByText("Second reason")).toBeVisible()
    expect(within(banner).queryByText("First reason")).toBeNull()
  })

  // TC-45
  it("resubmits with only the status, then shows submitted without the banner and gives admins Approve/Reject (TC-45)", async () => {
    asUser("user", "lan@example.com")
    let resubmitted = false
    mockApiClient.mockImplementation(async (_path, options) => {
      if (options?.method === "PATCH") {
        resubmitted = true
        return { data: { invoiceNumber: "INV-1", status: "submitted" } }
      }
      return resubmitted
        ? invoiceResponse({
            status: "submitted",
            histories: [created, rejectedEntry()],
          })
        : invoiceResponse({
            status: "rejected",
            histories: [created, rejectedEntry()],
          })
    })
    const user = userEvent.setup()

    const { rerender } = renderPageWithRerender()

    await user.click(await screen.findByRole("button", { name: "Resubmit" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Resubmit invoice INV-1?")).toBeVisible()
    expect(
      within(dialog).getByText(
        "The invoice goes back to finance for review. Check that you've fixed what the rejection reason describes.",
      ),
    ).toBeVisible()
    await user.click(within(dialog).getByRole("button", { name: "Resubmit" }))

    await waitFor(() =>
      expect(screen.queryByText(/Rejected by/)).not.toBeInTheDocument(),
    )
    const patch = mockApiClient.mock.calls.find(
      ([, options]) => options?.method === "PATCH",
    )
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({
      status: "submitted",
    })
    expect(screen.getByText("submitted")).toBeVisible()

    asUser("admin", "finance.minh@example.com")
    rerender()
    expect(
      await screen.findByRole("button", { name: "Approve" }),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Reject" })).toBeVisible()
  })
})
