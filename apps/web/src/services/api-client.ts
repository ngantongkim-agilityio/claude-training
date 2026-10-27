const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1"

let cachedToken: string | null = null
let cacheExpiresAt = 0
let pendingTokenRequest: Promise<string | null> | null = null

const getTokenExpiration = (token: string): number => {
  try {
    const payload = token.split(".")[1]
    const decoded = JSON.parse(atob(payload))
    return (decoded.exp ?? 0) * 1000
  } catch {
    return 0
  }
}

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedToken && Date.now() < cacheExpiresAt) {
    return cachedToken
  }

  if (pendingTokenRequest) {
    return pendingTokenRequest
  }

  pendingTokenRequest = (async () => {
    try {
      const res = await fetch("/api/token")
      if (!res.ok) return null
      const data = await res.json()
      const token = data.token ?? null

      cachedToken = token
      cacheExpiresAt = token ? getTokenExpiration(token) : 0

      return token
    } catch {
      return null
    } finally {
      pendingTokenRequest = null
    }
  })()

  return pendingTokenRequest
}

interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>
  skipAuth?: boolean
}

export const apiClient = async <T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { skipAuth = false, headers = {}, ...rest } = options

  const authHeaders: Record<string, string> = {}
  if (!skipAuth) {
    const token = await getAccessToken()
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
    ...rest,
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }))
    throw new Error(error.message ?? "API request failed")
  }

  return response.json() as Promise<T>
}
