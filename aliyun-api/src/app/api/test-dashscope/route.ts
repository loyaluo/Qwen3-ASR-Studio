import { NextRequest, NextResponse } from 'next/server'
import * as dashscope from 'dashscope'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 })
    }

    // Set API key
    dashscope.apiKey = apiKey

    // Test with a simple text conversation first
    const response = await dashscope.Generation.call({
      model: 'qwen-turbo',
      messages: [
        { role: 'user', content: 'Hello, please respond with "API test successful"' }
      ]
    })

    console.log('Test API Response:', JSON.stringify(response, null, 2))

    return NextResponse.json({
      success: true,
      response: response,
      message: 'DashScope API connection test successful'
    })

  } catch (error) {
    console.error('DashScope test error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Test failed',
        details: error.toString(),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}