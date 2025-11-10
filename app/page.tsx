// [TAG: UI]
// Landing page with redirect handled by AuthProvider

"use client"

import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="text-slate-400 text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  // AuthProvider will handle the redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-slate-400 text-lg">Redirecting to login...</div>
      </div>
    </div>
  )
}
