import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth"
import { getLocalToken } from "@/features/auth/actions"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

const Layout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const session = await auth0.getSession()

  if (!session) {
    const localToken = await getLocalToken()

    if (!localToken) {
      redirect("/login")
    }
  }

  return <DashboardLayout>{children}</DashboardLayout>
}

export default Layout
