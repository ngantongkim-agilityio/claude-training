import { QueryClient } from "@tanstack/react-query"

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  })

let browserQueryClient: QueryClient | undefined

// Server: fresh instance per request to avoid shared state across users
// Client: singleton to preserve cache between re-renders
export const getQueryClient = () => {
  if (typeof window === "undefined") {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
