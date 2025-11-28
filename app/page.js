'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export default function Home() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to admin if already signed in
  useEffect(() => {
    if (!isPending && session) {
      router.push('/admin')
    }
  }, [isPending, session, router])

  const handleContinue = () => {
    setIsLoading(true)
    router.push('/admin')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <Image
            src="/android-chrome-192x192.png"
            alt="Greg Taylor Photography Logo"
            width={120}
            height={120}
            className="mb-4"
          />
          <h1 className="text-2xl font-bold text-center text-gray-900">Greg Taylor Photography</h1>
          <h2 className="text-xl text-center text-gray-700">Admin Portal</h2>
        </div>

        <div className="space-y-6">
          <p className="text-center text-gray-600">
            Please sign in to access the administration area.
          </p>

          {session ? (
            <button
              className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              onClick={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Continue to Admin'}
            </button>
          ) : (
            <div className="flex justify-center">
              <Link
                href="/sign-in"
                className="px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Sign In to Admin
              </Link>
            </div>
          )}
        </div>

        <div className="pt-6 text-sm text-center text-gray-500">
          <p>© {new Date().getFullYear()} Greg Taylor Photography. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
