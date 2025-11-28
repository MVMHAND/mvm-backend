export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout wraps all /admin routes including /admin/login
  // Auth checks are handled by middleware and individual pages
  return <>{children}</>
}
