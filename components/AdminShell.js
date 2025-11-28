'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from '@/lib/auth-client'
import { useState, useEffect } from 'react'
import apiClient from '@/lib/apiClient'

const navItems = [
  { name: 'Manage Photos', href: '/admin/photos' },
  { name: 'Manage Sizes', href: '/admin/sizes' },
  { name: 'Manage Frames', href: '/admin/frames' },
  { name: 'Manage Formats', href: '/admin/formats' },
  { name: 'Manage Prices', href: '/admin/prices' },
  { name: 'Manage Categories', href: '/admin/categories' },
  { name: 'Manage Orders', href: '/admin/orders' },
]

export default function AdminShell({ children }) {
  const pathname = usePathname()
  const { data: session, isPending } = useSession()
  const [pendingCount, setPendingCount] = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const res = await apiClient.get('/api/orders')
        const data = res.data
        // Make sure data is an array before filtering
        const count = Array.isArray(data) ? data.filter(o => o.status === 'paid').length : 0
        setPendingCount(count)
      } catch (err) {
        console.error('Error fetching pending orders count:', err)
      }
    }
    fetchPendingCount()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex flex-col items-center space-y-2 mb-6">
          <Image
            src="/android-chrome-192x192-rev.png"
            alt="Logo"
            width={100}
            height={100}
            className="rounded bg-white p-1"
          />
        </div>
        <h2 className="text-xl font-bold mb-6">Admin Dashboard</h2>
        <nav className="space-y-2">
          {navItems.map(({ name, href }) => (
            <Link
              key={name}
              href={href}
              className={`block px-3 py-2 rounded hover:bg-gray-700 ${
                pathname.startsWith(href) ? 'bg-gray-800' : ''
              }`}
            >
              {name}
              {name === 'Manage Orders' && pendingCount > 0 && (
                <span className="ml-2 inline-block bg-green-800 text-white text-xs font-bold rounded-full px-2">
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User menu at bottom of sidebar */}
        {session && (
          <div className="mt-auto pt-4 border-t border-gray-700">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 w-full px-3 py-2 rounded hover:bg-gray-700"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {session.user?.name?.charAt(0)?.toUpperCase() || session.user?.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-sm truncate">{session.user?.email}</span>
              </button>
              {showUserMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-gray-800 rounded shadow-lg">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 rounded"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        {session ? (
          children
        ) : (
          <div className="text-center mt-20">
            <p className="text-lg mb-4 text-gray-800">You must be signed in to access admin.</p>
            <Link href="/sign-in" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
              Sign In
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
