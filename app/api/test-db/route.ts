import { NextResponse } from 'next/server'
import { prisma, testConnection } from '@/lib/db'

export async function GET() {
  const results = {
    envVars: {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'Not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
    },
    dbConnection: false,
    userCount: null as number | null,
    error: null as string | null,
    errorStack: null as string | null,
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
    if (error instanceof Error) {
      results.error = error.message
      results.errorStack = error.stack || null
      
      // Check for common connection issues
      if (error.message.includes('P1001')) {
        results.error = 'Cannot reach database server. Check if DATABASE_URL is correct and server is accessible.'
      } else if (error.message.includes('P1002')) {
        results.error = 'Database server was reached but timed out.'
      } else if (error.message.includes('P1003')) {
        results.error = 'Database does not exist.'
      }
    } else {
      results.error = String(error)
    }
    console.error('DB Test Error:', error)
  }

  return NextResponse.json(results)
}