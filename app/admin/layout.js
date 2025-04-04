// app/admin/layout.js
import AdminShell from '@/components/AdminShell'

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage your photos and pricing',
}

export default function AdminLayout({ children }) {
  return (
    <AdminShell>{children}</AdminShell>
  )
}
