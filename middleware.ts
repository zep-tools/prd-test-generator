export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/prd/:path*",
    "/github/:path*",
    "/test-cases/:path*",
    "/admin/:path*",
  ]
}