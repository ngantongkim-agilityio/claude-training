import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import InvoiceDetailPage from "@/app/(dashboard)/invoices/[invoiceNumber]/page"
import { apiClient } from "@/services/api-client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { invoiceKeys } from "@/hooks/use-invoices"
import type { Invoice, InvoiceHistoryEntry } from "@/features/invoices/types"

jest.mock("@/services/api-client", () => ({ apiClient: jest.fn() }))
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
