import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  
  const mlApiUrl = process.env.ML_API_URL || 'http://localhost:5000'
  
  const response = await fetch(`${mlApiUrl}/predict`, {
    method: 'POST',
    body: formData,  // forward the CSV file directly
  })

  const result = await response.json()
  return NextResponse.json(result)
}