import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@gradio/client';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体数据
    const body = await request.json();
    const { audio_file, context = '', language = 'auto', enable_itn = false } = body;

    // 验证必需参数
    if (!audio_file) {
      return NextResponse.json(
        { error: 'audio_file is required' },
        { status: 400 }
      );
    }

    console.log('Processing ASR request...', { 
      hasAudio: !!audio_file, 
      context, 
      language, 
      enableITN: enable_itn 
    });

    // 连接到Gradio服务器
    const client = await Client.connect("https://qwen-qwen3-asr-demo.ms.show/");
    console.log('Connected to Gradio server');

    // 准备音频文件数据
    let gradioFile;
    
    if (audio_file.data && audio_file.name) {
      // 将base64转换为Blob
      const binaryString = atob(audio_file.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: audio_file.type || 'audio/wav' });
      gradioFile = new File([blob], audio_file.name, { type: audio_file.type || 'audio/wav' });
    } else {
      return NextResponse.json(
        { error: 'Invalid audio file format' },
        { status: 400 }
      );
    }

    console.log('Calling Gradio API...');
    
    // 调用Gradio API
    const result = await client.predict("/asr_inference", {
      audio_file: gradioFile,
      context: context,
      language: language,
      enable_itn: enable_itn,
    });

    console.log('Gradio API response:', result);

    // 返回结果
    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('ASR Inference Error:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to process ASR inference',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'ASR Inference API Proxy',
    endpoints: {
      POST: '/api/asr-inference',
      description: 'Proxy for Gradio ASR inference API'
    },
    parameters: {
      audio_file: 'required - audio file data',
      context: 'optional - context information (default: "")',
      language: 'optional - language setting (default: "auto")',
      enable_itn: 'optional - enable inverse text normalization (default: false)'
    }
  });
}