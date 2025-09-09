import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

// Test database connection
export async function testConnection() {
  try {
    await prisma.$connect()
    console.log('Database connected successfully')
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}