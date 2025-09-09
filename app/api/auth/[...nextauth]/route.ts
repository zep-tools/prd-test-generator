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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // 사용자 조회
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          // 신규 사용자는 비밀번호 1234로 자동 생성
          const hashedPassword = await bcrypt.hash("1234", 10)
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              name: credentials.email.split('@')[0],
            },
          })
          
          // 신규 사용자는 입력한 비밀번호가 1234인 경우만 로그인 허용
          if (credentials.password === "1234") {
            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
            }
          }
          return null
        }

        // 기존 사용자는 비밀번호 검증
        if (user.password) {
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            return null
          }
        } else {
          // 비밀번호가 없는 기존 사용자는 1234로 설정
          if (credentials.password === "1234") {
            const hashedPassword = await bcrypt.hash("1234", 10)
            await prisma.user.update({
              where: { id: user.id },
              data: { password: hashedPassword }
            })
          } else {
            return null
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
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