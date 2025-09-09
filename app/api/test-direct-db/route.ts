import { NextResponse } from 'next/server'

export async function GET() {
  const results = {
    envVars: {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      DIRECT_URL: process.env.DIRECT_URL ? 'Set' : 'Not set',
    },
    testResults: [] as string[],
    error: null as string | null,
  }

  // Test with direct PostgreSQL connection (no Prisma)
  try {
    const { Pool } = await import('pg')
    
    // Try with original URL
    results.testResults.push('Testing with original DATABASE_URL...')
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    
    const client = await pool.connect()
    const result = await client.query('SELECT 1 as test')
    client.release()
    await pool.end()
    
    results.testResults.push('✅ Direct PostgreSQL connection successful!')
    results.testResults.push(`Query result: ${JSON.stringify(result.rows)}`)
    
  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error)
    results.testResults.push(`❌ Direct connection failed: ${results.error}`)
  }

  return NextResponse.json(results)
}