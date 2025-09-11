import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing simple connection to Gradio...');
    
    // 测试基本的HTTP连接
    const response = await fetch('https://qwen-qwen3-asr-demo.ms.show/', {
      method: 'GET',
      timeout: 10000 // 10秒超时
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log('Response length:', text.length);
    
    // 检查是否包含Gradio相关内容
    const hasGradio = text.includes('gradio') || text.includes('Gradio');
    console.log('Contains Gradio content:', hasGradio);
    
    return NextResponse.json({
      success: true,
      message: 'Connection test successful',
      status: response.status,
      contentLength: text.length,
      hasGradioContent: hasGradio
    });
    
  } catch (error) {
    console.error('Connection test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}