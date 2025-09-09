import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
        try {
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

          // 사용자 조회
          let user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          })

          if (!user) {
            console.log("User not found, creating new user")
            // 신규 사용자 생성 (password 필드 제외)
            try {
              user = await prisma.user.create({
                data: {
                  email: credentials.email,
                  name: credentials.email.split('@')[0],
                },
              })
              console.log("New user created:", user.email)
            } catch (error) {
              console.error("Error creating user:", error)
              return null
            }
          }

          console.log("Login successful for:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }