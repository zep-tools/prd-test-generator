// Authentication middleware disabled - all routes are now public
// export { default } from "next-auth/middleware"

// export const config = {
//   matcher: [
//     "/prd/:path*",
//     "/github/:path*",
//     "/test-cases/:path*",
//     "/admin/:path*",
//   ]
// }

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware is now pass-through - no authentication required
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}