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
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Try a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`
    console.log('Database query successful')
    
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    throw error // Re-throw to get full error details
  }
}