import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  // Fix DATABASE_URL encoding issue
  let databaseUrl = process.env.DATABASE_URL
  
  if (databaseUrl && databaseUrl.includes('%40')) {
    // Replace %40 with @ in the password part only
    databaseUrl = databaseUrl.replace('Ehdgh%400625', 'Ehdgh@0625')
    console.log('Fixed DATABASE_URL encoding')
  }
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl || process.env.DATABASE_URL
      }
    },
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