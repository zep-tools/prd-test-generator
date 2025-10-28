'use client'

// Authentication disabled - SessionProvider removed
// import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  // No session management - public access
  return <>{children}</>
}