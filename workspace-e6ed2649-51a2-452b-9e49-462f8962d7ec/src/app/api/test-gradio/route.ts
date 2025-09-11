import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing Gradio connection...');
    
    // 简单的GET请求测试
    const response = await fetch('https://qwen-qwen3-asr-demo.ms.show/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ASR-Proxy/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('Gradio page loaded successfully, length:', html.length);
    
    return NextResponse.json({
      success: true,
      message: 'Gradio connection test successful',
      status: response.status,
      contentLength: html.length
    });
    
  } catch (error) {
    console.error('Gradio connection test failed:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Gradio connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}