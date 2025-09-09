import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"
import { prisma } from "@/lib/db"

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

        try {
          // DB 연결 시도
          let user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          })

          if (!user) {
            console.log("User not found, creating new user")
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split('@')[0],
              },
            })
            console.log("New user created in DB:", user.email)
          } else {
            console.log("Existing user found in DB:", user.email)
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (dbError) {
          console.error("Database error, falling back to in-memory:", dbError)
          
          // DB 연결 실패 시 메모리 기반 인증
          const user = {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
          }

          console.log("Using in-memory auth for:", user.email)
          return user
        }
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
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }