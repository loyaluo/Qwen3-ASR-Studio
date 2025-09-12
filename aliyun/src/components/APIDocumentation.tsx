'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, CheckCircle, Code, FileText, Globe, Shield, Zap } from 'lucide-react'

interface APIDocumentationProps {
  baseUrl: string
}

export default function APIDocumentation({ baseUrl }: APIDocumentationProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const proxyUrl = `${baseUrl}/api/proxy/transcribe`
  
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const curlExample = `curl -X POST "${proxyUrl}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "audioUrl": "https://example.com/audio.mp3",
    "context": "可选的上下文文本",
    "enableItn": true,
    "language": "zh",
    "stream": false
  }'

# 流式调用示例
curl -X POST "${baseUrl}/api/proxy/transcribe-stream" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "audioUrl": "https://example.com/audio.mp3",
    "context": "可选的上下文文本",
    "enableItn": true,
    "language": "zh"
  }'`

  const javascriptExample = `// 使用 fetch API - 非流式调用
const response = await fetch('${proxyUrl}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    audioUrl: 'https://example.com/audio.mp3',
    context: '可选的上下文文本',
    enableItn: true,  // 启用逆文本规范化
    language: 'zh',    // 指定中文识别
    stream: false     // 非流式模式
  })
});

const result = await response.json();
console.log(result);

// 流式调用示例
const streamResponse = await fetch('${baseUrl}/api/proxy/transcribe-stream', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    audioUrl: 'https://example.com/audio.mp3',
    context: '可选的上下文文本',
    enableItn: true,
    language: 'zh'
  })
});

const reader = streamResponse.body.getReader();
const decoder = new TextDecoder();
let fullText = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.success && data.text) {
          console.log('实时转录:', data.text);
          fullText = data.text;
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  }
}

console.log('最终结果:', fullText);`

  const pythonExample = `import requests

url = '${proxyUrl}'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}
data = {
    'audioUrl': 'https://example.com/audio.mp3',
    'context': '可选的上下文文本',
    'enableItn': True,  # 启用逆文本规范化
    'language': 'zh',    # 指定中文识别
    'stream': False     # 非流式模式
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)

# 流式调用示例
import json

stream_url = '${baseUrl}/api/proxy/transcribe-stream'
stream_data = {
    'audioUrl': 'https://example.com/audio.mp3',
    'context': '可选的上下文文本',
    'enableItn': True,
    'language': 'zh'
}

stream_response = requests.post(stream_url, headers=headers, json=data, stream=True)
full_text = ''

for line in stream_response.iter_lines():
    if line.startswith(b'data: '):
        try:
            data = json.loads(line[6:])  # 移除 'data: ' 前缀
            if data.get('success') and data.get('text'):
                print('实时转录:', data['text'])
                full_text = data['text']
        except:
            pass

print('最终结果:', full_text)`

  const formDataExample = `// 使用 FormData 上传文件
const formData = new FormData();
formData.append('audio', fileInput.files[0]);
formData.append('context', '可选的上下文文本');
formData.append('enableItn', 'true');  // 启用 ITN
formData.append('language', 'zh');    // 可选：不指定或设为 "auto" 进行自动检测

const response = await fetch('${proxyUrl}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            API 代理服务器
          </CardTitle>
          <CardDescription>
            解决跨域问题的通义千问录音文件识别 API 代理服务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                此代理服务器解决了 JavaScript 跨域请求问题，您可以直接在前端应用中调用这些 API。
              </AlertDescription>
            </Alert>
            
            <div>
              <label className="text-sm font-medium">代理端点 URL</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                  {proxyUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(proxyUrl, 'url')}
                  className="flex items-center gap-2"
                >
                  {copied === 'url' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      复制
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            API 接口文档
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">请求方法</span>
                  <div className="mt-1">
                    <Badge variant="secondary">POST</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">内容类型</span>
                  <div className="mt-1">
                    <Badge variant="outline">application/json</Badge>
                    <Badge variant="outline" className="ml-2">multipart/form-data</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">请求头</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <code className="text-sm">Authorization</code>
                    <p className="text-sm text-gray-600 mt-1">Bearer token (您的阿里云百炼 API Key)</p>
                  </div>
                  <div>
                    <code className="text-sm">Content-Type</code>
                    <p className="text-sm text-gray-600 mt-1">application/json 或 multipart/form-data</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">请求参数</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">audioUrl</code>
                      <Badge variant="outline" className="text-xs">可选</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">音频文件的公网访问 URL</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">audio</code>
                      <Badge variant="outline" className="text-xs">可选</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">音频文件 (仅支持 multipart/form-data)</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">context</code>
                      <Badge variant="outline" className="text-xs">可选</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">上下文文本，用于提高识别准确率</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">enableItn</code>
                      <Badge variant="outline" className="text-xs">可选</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">是否启用逆文本规范化 (ITN)，默认 false</p>
                    <p className="text-xs text-gray-500 mt-1">启用后会将"一百二十三"转换为"123"等格式</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">language</code>
                      <Badge variant="outline" className="text-xs">可选</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">指定识别语言，如 "zh", "en", "ja 等</p>
                    <p className="text-xs text-gray-500 mt-1">不指定或设为 "auto" 时自动检测语言</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">响应格式</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "text": "识别的文本内容",
    "language": "检测到的语言",
    "confidence": 0.95,
    "usage": {
      "input_tokens": 100,
      "output_tokens": 50
    }
  }
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">错误响应</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`{
  "success": false,
  "error": "错误信息",
  "details": "详细错误描述"
}`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            代码示例
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="formdata">FormData</TabsTrigger>
            </TabsList>
            
            <TabsContent value="curl" className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{curlExample}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(curlExample, 'curl')}
                  className="absolute top-2 right-2"
                >
                  {copied === 'curl' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="javascript" className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{javascriptExample}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(javascriptExample, 'javascript')}
                  className="absolute top-2 right-2"
                >
                  {copied === 'javascript' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="python" className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{pythonExample}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(pythonExample, 'python')}
                  className="absolute top-2 right-2"
                >
                  {copied === 'python' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="formdata" className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{formDataExample}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(formDataExample, 'formdata')}
                  className="absolute top-2 right-2"
                >
                  {copied === 'formdata' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            功能特性
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">支持的功能</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ 跨域请求支持</li>
                <li>✅ 多种音频格式</li>
                <li>✅ 上下文增强</li>
                <li>✅ 语种检测</li>
                <li>✅ 置信度评分</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">音频限制</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>📁 文件大小：≤ 10MB</li>
                <li>⏱️ 时长：≤ 3 分钟</li>
                <li>🎵 采样率：16kHz</li>
                <li>🔊 声道：单声道</li>
                <li>📋 格式：多种格式支持</li>
              </ul>
            </div>

            {/* Streaming API Documentation */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                流式输出功能
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">什么是流式输出？</h4>
                    <p className="text-sm text-blue-800">
                      流式输出允许您在音频转录过程中实时查看中间结果，而不是等待整个音频处理完成。
                      模型会逐步生成转录结果，您可以立即看到每个中间结果，最终结果由这些中间结果拼接而成。
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">两种调用方式</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 border">
                        <h5 className="font-medium text-gray-900 mb-1">非流式调用</h5>
                        <p className="text-xs text-gray-600 mb-2">等待完整处理结果</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          POST /api/proxy/transcribe
                        </code>
                        <ul className="text-xs text-gray-600 mt-2 space-y-1">
                          <li>• 一次性返回完整结果</li>
                          <li>• 适合简单集成</li>
                          <li>• 等待时间较长</li>
                        </ul>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <h5 className="font-medium text-gray-900 mb-1">流式调用</h5>
                        <p className="text-xs text-gray-600 mb-2">实时返回转录结果</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          POST /api/proxy/transcribe-stream
                        </code>
                        <ul className="text-xs text-gray-600 mt-2 space-y-1">
                          <li>• 实时返回中间结果</li>
                          <li>• 优秀的用户体验</li>
                          <li>• 支持中途停止</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">流式响应格式</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                      <pre>{`// 每个流式消息的格式 (SSE)
data: {"success":true,"text":"欢迎","done":false,"usage":null}

data: {"success":true,"text":"欢迎使用","done":false,"usage":null}

data: {"success":true,"text":"欢迎使用阿里","done":false,"usage":null}

data: {"success":true,"text":"欢迎使用阿里云","done":false,"usage":null}

data: {"success":true,"text":"欢迎使用阿里云。","done":false,"usage":null}

data: {"success":true,"done":true}`}</pre>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">success</code>
                        <span className="text-xs text-gray-600">boolean - 操作是否成功</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">text</code>
                        <span className="text-xs text-gray-600">string - 当前转录文本</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">done</code>
                        <span className="text-xs text-gray-600">boolean - 是否完成转录</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">usage</code>
                        <span className="text-xs text-gray-600">object - Token 使用统计（完成时提供）</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">错误处理</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="bg-red-900 text-red-100 p-2 rounded text-xs overflow-x-auto mb-2">
                        <pre>{`data: {"success":false,"error":"API Error: Invalid API key","details":"..."}`}</pre>
                      </div>
                      <p className="text-xs text-red-800">
                        流式调用中如果发生错误，会返回包含错误信息的消息。您应该监听错误消息并适当处理。
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">使用场景</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h5 className="font-medium text-green-900 text-sm mb-1">推荐使用流式</h5>
                        <ul className="text-xs text-green-800 space-y-1">
                          <li>• 长音频文件 (&gt;30秒)</li>
                          <li>• 需要实时反馈的应用</li>
                          <li>• 用户交互式界面</li>
                          <li>• 需要显示进度的场景</li>
                          <li>• 实时字幕应用</li>
                        </ul>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <h5 className="font-medium text-orange-900 text-sm mb-1">推荐使用非流式</h5>
                        <ul className="text-xs text-orange-800 space-y-1">
                          <li>• 短音频文件 (&lt;10秒)</li>
                          <li>• 批量处理任务</li>
                          <li>• 后台自动化处理</li>
                          <li>• 简单的 API 集成</li>
                          <li>• 不需要实时反馈</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">最佳实践</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <ul className="text-xs text-yellow-800 space-y-2">
                        <li><strong>连接管理：</strong>确保在转录完成后或发生错误时正确关闭连接</li>
                        <li><strong>错误重试：</strong>实现适当的重试机制，处理网络问题</li>
                        <li><strong>用户体验：</strong>在流式模式下显示加载状态和进度指示器</li>
                        <li><strong>资源清理：</strong>及时清理不再需要的流式连接和资源</li>
                        <li><strong>缓冲处理：</strong>考虑对快速连续的流式消息进行适当的缓冲</li>
                        <li><strong>超时设置：</strong>为流式连接设置合理的超时时间</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">性能对比</h4>
                    <div className="bg-white border rounded-lg p-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">特性</th>
                            <th className="text-center py-2">非流式</th>
                            <th className="text-center py-2">流式</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2">首次响应时间</td>
                            <td className="text-center">完整处理时间</td>
                            <td className="text-center">1-3秒</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">用户体验</td>
                            <td className="text-center">等待焦虑</td>
                            <td className="text-center">实时反馈</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">资源消耗</td>
                            <td className="text-center">较低</td>
                            <td className="text-center">中等</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">实现复杂度</td>
                            <td className="text-center">简单</td>
                            <td className="text-center">中等</td>
                          </tr>
                          <tr>
                            <td className="py-2">适用音频长度</td>
                            <td className="text-center">短音频</td>
                            <td className="text-center">任意长度</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}