import { NextResponse } from 'next/server'
import { prisma, testConnection } from '@/lib/db'

export async function GET() {
  const results = {
    envVars: {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
    },
    dbConnection: false,
    userCount: null as number | null,
    error: null as string | null,
  }

  try {
    // Test connection
    results.dbConnection = await testConnection()
    
    if (results.dbConnection) {
      // Try to count users
      const count = await prisma.user.count()
      results.userCount = count
    }
  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error)
    console.error('DB Test Error:', error)
  }

  return NextResponse.json(results)
}