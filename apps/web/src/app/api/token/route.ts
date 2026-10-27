import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth0 } from "@/lib/auth"

// Unified token endpoint: returns Auth0 access token or local JWT
export const GET = async () => {
  const session = await auth0.getSession()

  if (session) {
    const { token } = await auth0.getAccessToken()
    return NextResponse.json({ token })
  }

  const cookieStore = await cookies()
  const localToken = cookieStore.get("local_token")?.value

  if (localToken) {
    return NextResponse.json({ token: localToken })
  }

  return NextResponse.json({ token: null }, { status: 401 })
}
