import { NextRequest, NextResponse } from 'next/server'

// Direct HTTP API implementation to avoid SDK issues
export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null
  
  try {
    const formData = await request.formData()
    const apiKey = formData.get('apiKey') as string
    const audioFile = formData.get('audio') as File | null
    const audioUrl = formData.get('audioUrl') as string
    const context = formData.get('context') as string

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 })
    }

    if (!audioFile && !audioUrl) {
      return NextResponse.json({ error: 'Audio file or URL is required' }, { status: 400 })
    }

    console.log('Starting transcription process...')
    console.log('API Key provided:', apiKey ? 'Yes' : 'No')
    console.log('Audio file:', audioFile ? audioFile.name : 'None')
    console.log('Audio URL:', audioUrl || 'None')
    console.log('Context:', context || 'None')

    let audioInput: string

    if (audioFile) {
      // For local files, we need to handle file upload properly
      // Since DashScope API requires file URLs or base64 encoding, we'll use a different approach
      
      // Convert file to base64
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const base64 = buffer.toString('base64')
      const mimeType = audioFile.type || 'audio/wav'
      
      // Create a data URL
      audioInput = `data:${mimeType};base64,${base64}`
      
      console.log('File converted to data URL, size:', buffer.length, 'bytes')
    } else {
      // Use URL directly for remote files
      audioInput = audioUrl
      console.log('Using remote audio URL:', audioUrl)
    }

    // Prepare the request body for DashScope HTTP API
    const requestBody = {
      model: 'qwen3-asr-flash',
      input: {
        messages: [
          {
            role: 'system',
            content: [
              { text: context || '' }
            ]
          },
          {
            role: 'user',
            content: [
              { audio: audioInput }
            ]
          }
        ]
      },
      parameters: {
        result_format: 'message',
        asr_options: {
          enable_lid: true,
          enable_itn: false
        }
      }
    }

    console.log('Sending request to DashScope API...')
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    // Make the API call to DashScope HTTP API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('API Response status:', response.status)
    console.log('API Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DashScope API error response:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(`API Error: ${errorJson.message || errorJson.error || 'Unknown error'}`)
      } catch (parseError) {
        throw new Error(`API Error (${response.status}): ${errorText}`)
      }
    }

    const responseText = await response.text()
    console.log('Raw API Response:', responseText)

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', parseError)
      console.error('Response text:', responseText)
      throw new Error('Invalid JSON response from API')
    }

    console.log('Parsed API Response:', JSON.stringify(data, null, 2))

    // Extract the transcription result
    if (data.output && data.output.choices && data.output.choices.length > 0) {
      const choice = data.output.choices[0]
      const content = choice.message.content

      console.log('Message content:', content)

      // Find the text content in the response
      let text = ''
      let language = undefined
      let confidence = undefined

      if (Array.isArray(content)) {
        const textContent = content.find(item => item.text)
        if (textContent) {
          text = textContent.text
          console.log('Found text content:', text)
        }
      }

      // Try to extract language and confidence from the response if available
      if (data.usage) {
        console.log('Usage info:', data.usage)
      }

      // Check if there's additional ASR information in the response
      if (choice.message && choice.message.asr_result) {
        const asrResult = choice.message.asr_result
        language = asrResult.language
        confidence = asrResult.confidence
        console.log('ASR result:', asrResult)
      }

      return NextResponse.json({
        text: text || '无法识别音频内容',
        language,
        confidence,
        rawResponse: data // Include raw response for debugging
      })
    } else {
      console.error('Invalid API response structure - missing choices:', data)
      throw new Error('Invalid API response structure: missing choices')
    }

  } catch (error) {
    console.error('Transcription error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available')
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Transcription failed',
        details: error.toString(),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    // Note: For base64 approach, we don't need to clean up temporary files
    // If we were using temporary files, we would clean them up here
  }
}