import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { InvoiceStatusActions } from "@/features/invoices/components/invoice-status-actions"
import { ApiError, apiClient } from "@/services/api-client"
import type { InvoiceStatus } from "@/features/invoices/types"

jest.mock("@/services/api-client", () => ({
  ...jest.requireActual("@/services/api-client"),
  apiClient: jest.fn(),
}))
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>

const UPDATED_AT = "2026-11-03T02:10:00.000Z"
const CHANGED = "This invoice has changed since you opened it."

const detailResponse = {
  status: "success",
  message: "OK",
  data: { invoice: { invoiceNumber: "INV-1", status: "submitted" } },
}

const renderActions = (userRole: "user" | "admin", status: InvoiceStatus) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <InvoiceStatusActions
        invoiceNumber="INV-1"
        status={status}
        userRole={userRole}
        updatedAt={UPDATED_AT}
      />
    </QueryClientProvider>,
  )
}

const patchCalls = () =>
  mockApiClient.mock.calls.filter(([, options]) => options?.method === "PATCH")

const patchBody = (index = 0) =>
  JSON.parse(String(patchCalls()[index][1]?.body))

// GETs (the detail refetch) resolve; PATCH behaviour is set per test
const mockPatch = (result: () => Promise<unknown>) =>
  mockApiClient.mockImplementation(async (_path, options) =>
    options?.method === "PATCH" ? result() : detailResponse,
  )

const openRejectDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Reject" }))
  return screen.findByRole("alertdialog")
}

const openApproveDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Approve" }))
  return screen.findByRole("alertdialog")
}

describe("Reject dialog", () => {
  // TC-38
  it("keeps Reject invoice disabled while the reason is blank or only spaces (TC-38)", async () => {
    renderActions("admin", "submitted")
    const user = userEvent.setup()

    const dialog = await openRejectDialog(user)

    expect(
      within(dialog).getByText("Reject invoice INV-1?"),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        "The owner will see your reason on the invoice and can fix and resubmit it.",
      ),
    ).toBeInTheDocument()
    expect(within(dialog).getByText("0/500")).toBeInTheDocument()
    expect(
      within(dialog).getByText("Enter a reason to reject this invoice."),
    ).toBeInTheDocument()
    const confirm = within(dialog).getByRole("button", {
      name: "Reject invoice",
    })
    expect(confirm).toBeDisabled()

    const field = within(dialog).getByLabelText("Reason for rejection")
    expect(field).toHaveAttribute(
      "placeholder",
      "Explain what needs to change, e.g. Tax should be 10% of the amount.",
    )
    await user.type(field, "   ")
    await waitFor(() => expect(confirm).toBeDisabled())
    expect(patchCalls()).toHaveLength(0)
  })

  it("enables Reject invoice for a 500-character reason (TC-38)", async () => {
    renderActions("admin", "submitted")
    const user = userEvent.setup()

    const dialog = await openRejectDialog(user)
    await user.click(within(dialog).getByLabelText("Reason for rejection"))
    await user.paste("a".repeat(500))

    expect(within(dialog).getByText("500/500")).toBeInTheDocument()
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Reject invoice" }),
      ).toBeEnabled(),
    )
  })

  it("sends the trimmed reason with expectedUpdatedAt on confirm (TC-38, TC-67)", async () => {
    mockPatch(async () => ({ data: { invoiceNumber: "INV-1" } }))
    renderActions("admin", "submitted")
    const user = userEvent.setup()

    const dialog = await openRejectDialog(user)
    await user.type(
      within(dialog).getByLabelText("Reason for rejection"),
      " Tax should be 10% ",
    )
    await user.click(
      await within(dialog).findByRole("button", { name: "Reject invoice" }),
    )

    await waitFor(() => expect(patchCalls()).toHaveLength(1))
    expect(patchBody()).toEqual({
      status: "rejected",
      reason: "Tax should be 10%",
      expectedUpdatedAt: UPDATED_AT,
    })
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    )
  })

  // TC-40
  it("stays open with the API message and keeps the typed reason on a 400 (TC-40)", async () => {
    mockPatch(async () => {
      throw new ApiError("Reason is too long", 400)
    })
    renderActions("admin", "submitted")
    const user = userEvent.setup()

    const dialog = await openRejectDialog(user)
    await user.type(
      within(dialog).getByLabelText("Reason for rejection"),
      "Wrong tax",
    )
    await user.click(
      await within(dialog).findByRole("button", { name: "Reject invoice" }),
    )

    expect(await within(dialog).findByText("Reason is too long")).toBeVisible()
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Reason for rejection")).toHaveValue(
      "Wrong tax",
    )
    expect(within(dialog).queryByRole("button", { name: "Reload" })).toBeNull()
  })

  // TC-67
  it("shows the changed message with Reload on a 409, Reload refetches and keeps the reason (TC-67)", async () => {
    mockPatch(async () => {
      throw new ApiError("Invoice was modified", 409)
    })
    renderActions("admin", "submitted")
    const user = userEvent.setup()

    const dialog = await openRejectDialog(user)
    await user.type(
      within(dialog).getByLabelText("Reason for rejection"),
      "Wrong tax",
    )
    await user.click(
      await within(dialog).findByRole("button", { name: "Reject invoice" }),
    )

    expect(await within(dialog).findByText(CHANGED)).toBeVisible()
    const getsBefore = mockApiClient.mock.calls.filter(
      ([path, options]) => path === "/invoices/INV-1" && !options?.method,
    ).length

    await user.click(within(dialog).getByRole("button", { name: "Reload" }))

    await waitFor(() =>
      expect(
        mockApiClient.mock.calls.filter(
          ([path, options]) => path === "/invoices/INV-1" && !options?.method,
        ).length,
      ).toBeGreaterThan(getsBefore),
    )
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Reason for rejection")).toHaveValue(
      "Wrong tax",
    )
    // The fresh copy is loaded, so the stale-version message goes away
    await waitFor(() => expect(within(dialog).queryByText(CHANGED)).toBeNull())
  })
})

describe("Approve dialog", () => {
  // TC-39
  it("approves without a comment and omits comment from the body (TC-39, TC-67)", async () => {
    mockPatch(async () => ({ data: { invoiceNumber: "INV-1" } }))
    renderActions("admin", "submitted")
    const user = userEvent.setup()

    const dialog = await openApproveDialog(user)

    expect(
      within(dialog).getByText("Approve invoice INV-1?"),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText("Approved invoices can't be changed."),
    ).toBeInTheDocument()
    expect(within(dialog).getByText("0/500")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Approve" }))

    await waitFor(() => expect(patchCalls()).toHaveLength(1))
    expect(patchBody()).toEqual({
      status: "approved",
      expectedUpdatedAt: UPDATED_AT,
    })
  })

  it("approves with a trimmed comment (TC-39)", async () => {
    mockPatch(async () => ({ data: { invoiceNumber: "INV-1" } }))
    renderActions("admin", "submitted")
    const user = userEvent.setup()

    const dialog = await openApproveDialog(user)
    await user.type(
      within(dialog).getByLabelText("Comment (optional)"),
      " Looks good ",
    )
    await user.click(within(dialog).getByRole("button", { name: "Approve" }))

    await waitFor(() => expect(patchCalls()).toHaveLength(1))
    expect(patchBody()).toEqual({
      status: "approved",
      comment: "Looks good",
      expectedUpdatedAt: UPDATED_AT,
    })
  })

  // TC-67
  it("shows the changed message with Reload on a 409, Reload refetches and keeps the comment (TC-67)", async () => {
    mockPatch(async () => {
      throw new ApiError("Invoice was modified", 409)
    })
    renderActions("admin", "submitted")
    const user = userEvent.setup()

    const dialog = await openApproveDialog(user)
    await user.type(within(dialog).getByLabelText("Comment (optional)"), "Ok")
    await user.click(within(dialog).getByRole("button", { name: "Approve" }))

    expect(await within(dialog).findByText(CHANGED)).toBeVisible()
    const getsBefore = mockApiClient.mock.calls.filter(
      ([path, options]) => path === "/invoices/INV-1" && !options?.method,
    ).length

    await user.click(within(dialog).getByRole("button", { name: "Reload" }))

    await waitFor(() =>
      expect(
        mockApiClient.mock.calls.filter(
          ([path, options]) => path === "/invoices/INV-1" && !options?.method,
        ).length,
      ).toBeGreaterThan(getsBefore),
    )
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Comment (optional)")).toHaveValue(
      "Ok",
    )
  })

  // TC-40 (approve side of AC-3)
  it("stays open with the API message on a 400 (TC-40)", async () => {
    mockPatch(async () => {
      throw new ApiError("Comment is too long", 400)
    })
    renderActions("admin", "submitted")
    const user = userEvent.setup()

    const dialog = await openApproveDialog(user)
    await user.type(within(dialog).getByLabelText("Comment (optional)"), "Ok")
    await user.click(within(dialog).getByRole("button", { name: "Approve" }))

    expect(
      await within(dialog).findByText("Comment is too long"),
    ).toBeVisible()
    expect(within(dialog).getByLabelText("Comment (optional)")).toHaveValue(
      "Ok",
    )
  })
})

describe("Submit dialog", () => {
  // TC-41
  it("shows the approved wording and no longer says the invoice cannot be edited (TC-41)", async () => {
    renderActions("user", "draft")
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Submit" }))
    const dialog = await screen.findByRole("alertdialog")

    expect(
      within(dialog).getByText("Submit invoice INV-1?"),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        "The invoice goes to finance for review. You can still edit it while it's under review, and every change is recorded in its history.",
      ),
    ).toBeInTheDocument()
    expect(dialog).not.toHaveTextContent("can no longer be edited")
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toBeVisible()
  })
})
