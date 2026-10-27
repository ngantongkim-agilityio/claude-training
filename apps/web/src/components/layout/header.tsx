import { MobileMenuButton } from "./mobile-menu-button"
import { UserAvatarDropdown } from "./user-avatar-dropdown"

interface HeaderProps {
  userEmail?: string
  isAdmin?: boolean
  isLoading?: boolean
}

export const Header = ({ userEmail, isAdmin, isLoading }: HeaderProps) => {
  return (
    <header className="flex h-14 items-center gap-4 border-b px-4">
      <MobileMenuButton />
      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-sm font-medium md:hidden">Tax Invoice</h1>
        <div className="ml-auto flex items-center">
          <UserAvatarDropdown email={userEmail} isAdmin={isAdmin} isLoading={isLoading} />
        </div>
      </div>
    </header>
  )
}
