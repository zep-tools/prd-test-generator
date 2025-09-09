import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Fix DATABASE_URL before creating Prisma client - use DIRECT_URL if available
if (process.env.DIRECT_URL && !process.env.DIRECT_URL.includes('%40')) {
  console.log('Using DIRECT_URL instead of DATABASE_URL')
  process.env.DATABASE_URL = process.env.DIRECT_URL
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('%40')) {
  // URL encode the password properly
  const originalUrl = process.env.DATABASE_URL
  // Replace the problematic password encoding
  const fixedUrl = originalUrl.replace('Ehdgh%400625', encodeURIComponent('Ehdgh@0625'))
  process.env.DATABASE_URL = fixedUrl
  console.log('Fixed DATABASE_URL encoding in environment')
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