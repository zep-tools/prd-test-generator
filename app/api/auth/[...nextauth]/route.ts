import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"

// 환경변수 검증
if (!process.env.NEXTAUTH_SECRET) {
  console.warn("WARNING: NEXTAUTH_SECRET is not set")
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("Login attempt for:", credentials?.email)
        
        if (!credentials?.email) {
          console.log("Missing email")
          return null
        }

        // 비밀번호는 1234만 허용 (임시)
        if (credentials.password !== "1234") {
          console.log("Wrong password - must be 1234")
          return null
        }

        // 데이터베이스 없이 임시로 사용자 반환
        const user = {
          id: credentials.email,
          email: credentials.email,
          name: credentials.email.split('@')[0],
        }

        console.log("Login successful for:", user.email)
        return user
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }