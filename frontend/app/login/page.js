'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/?view=login')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl" />
        <div className="w-32 h-4 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
