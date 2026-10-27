import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">404 – Page not found</h2>
      <Link href="/" className="text-sm underline">
        Back to home
      </Link>
    </div>
  )
}
