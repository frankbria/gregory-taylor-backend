'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

const navItems = [
  { name: 'Manage Photos', href: '/admin/photos' },
  { name: 'Manage Sizes', href: '/admin/sizes' },
  { name: 'Manage Frames', href: '/admin/frames' },
  { name: 'Manage Formats', href: '/admin/formats' },
  { name: 'Manage Prices', href: '/admin/prices' },
  { name: 'Manage Categories', href: '/admin/categories' },
]

export default function AdminShell({ children }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4 space-y-4 overflow-y-auto">
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
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <SignedIn>{children}</SignedIn>
        <SignedOut>
          <div className="text-center mt-20">
            <p className="text-lg mb-4 text-gray-800">You must be signed in to access admin.</p>
            <Link href="/sign-in?redirect_url=/admin" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
              Sign In
            </Link>
          </div>
        </SignedOut>
      </main>
    </div>
  )
}
