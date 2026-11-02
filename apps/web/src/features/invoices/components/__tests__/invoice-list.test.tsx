import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import InvoicesPage from "@/app/(dashboard)/invoices/page"
import { apiClient } from "@/services/api-client"
import { useCurrentUser } from "@/hooks/use-current-user"

jest.mock("@/services/api-client", () => ({ apiClient: jest.fn() }))
jest.mock("@/hooks/use-current-user", () => ({ useCurrentUser: jest.fn() }))

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>

describe("Invoices list status filter", () => {
  // TC-46
  it("requests status=rejected when the Rejected filter is chosen (TC-46)", async () => {
    ;(useCurrentUser as jest.Mock).mockReturnValue({
      data: { role: "user", email: "lan@example.com" },
    })
    mockApiClient.mockResolvedValue({
      status: "success",
      message: "OK",
      data: {
        invoices: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
    })
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <InvoicesPage />
      </QueryClientProvider>,
    )

    await user.click(await screen.findByRole("button", { name: /Status/ }))
    await user.click(screen.getByRole("button", { name: "Rejected" }))

    await waitFor(() =>
      expect(
        mockApiClient.mock.calls.some(([path]) =>
          String(path).includes("status=rejected"),
        ),
      ).toBe(true),
    )
  })
})
