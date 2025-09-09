import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Fix DATABASE_URL before creating Prisma client
if (process.env.DATABASE_URL) {
  const originalUrl = process.env.DATABASE_URL
  
  // Remove any whitespace from the URL
  let fixedUrl = originalUrl.replace(/\s+/g, '')
  
  // The password Ehdgh@0625 needs special handling
  // In the URL, the @ in the password must be %40
  // But %400625 is wrong, it should be %400625 -> Ehdgh%400625
  if (fixedUrl.includes('Ehdgh%400625')) {
    // This is correct encoding, keep it
    console.log('DATABASE_URL has correct encoding')
  } else if (fixedUrl.includes('Ehdgh@0625')) {
    // Need to encode the @ in password
    fixedUrl = fixedUrl.replace('Ehdgh@0625', 'Ehdgh%400625')
    console.log('Fixed @ encoding in password')
  }
  
  process.env.DATABASE_URL = fixedUrl
  console.log('DATABASE_URL processed')
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