import { type NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth"

const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl
  const isRsc = request.headers.get("rsc") === "1"

  if (pathname.startsWith("/api/") || isRsc) {
    return NextResponse.next()
  }

  const response = await auth0.middleware(request)

  if (pathname === "/auth/logout") {
    response.cookies.delete("local_token")
  }

  if (pathname === "/") {
    const redirect = NextResponse.redirect(new URL("/invoices", request.url))
    for (const cookie of response.headers.getSetCookie()) {
      redirect.headers.append("set-cookie", cookie)
    }
    return redirect
  }

  return response
}

export default proxy

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
