'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface ASRResult {
  recognition_result: string;
  language_detection: string;
}

export default function ASRPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [context, setContext] = useState('');
  const [language, setLanguage] = useState('auto');
  const [enableITN, setEnableITN] = useState(false);
  const [result, setResult] = useState<ASRResult | null>(null);
  const { toast } = useToast();

  // 获取当前页面的完整URL
  const getProxyUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/asr-inference`;
    }
    return '/api/asr-inference';
  };

  // 复制URL到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: "代理URL已复制到剪贴板",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "复制失败",
        description: "请手动复制URL",
        variant: "destructive",
      });
    }
  };

  // 复制API调用示例
  const copyApiExample = () => {
    const example = `// JavaScript 示例
const response = await fetch('${getProxyUrl()}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    audio_file: {
      data: 'base64编码的音频数据',
      name: 'audio.wav',
      type: 'audio/wav',
      size: 12345
    },
    context: '上下文信息（可选）',
    language: 'auto', // 或 'zh', 'en', 'ja', 'ko'
    enable_itn: false // 是否启用逆文本标准化
  }),
});

const result = await response.json();
console.log('识别结果:', result.data[0]);
console.log('语种检测:', result.data[1]);`;

    copyToClipboard(example);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      toast({
        title: "错误",
        description: "请选择音频文件",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 将文件转换为base64
      const arrayBuffer = await audioFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      // 创建文件对象，模拟Gradio客户端需要的格式
      const fileData = {
        data: base64,
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
      };

      const response = await fetch('/api/asr-inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_file: fileData,
          context,
          language,
          enable_itn: enableITN,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      setResult({
        recognition_result: data.data[0],
        language_detection: data.data[1],
      });

      toast({
        title: "成功",
        description: "语音识别完成",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : '处理失败',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">语音识别服务</h1>
        <p className="text-muted-foreground">
          上传音频文件进行语音识别，支持多种语言和上下文信息
        </p>
      </div>

      {/* 代理URL卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            API 代理地址
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(getProxyUrl())}
            >
              复制URL
            </Button>
          </CardTitle>
          <CardDescription>
            使用此URL调用语音识别API，解决跨域问题
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Input
                value={getProxyUrl()}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(getProxyUrl())}
              >
                复制
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• 方法: POST</p>
              <p>• Content-Type: application/json</p>
              <p>• 支持所有现代编程语言调用</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 输入表单 */}
        <Card>
          <CardHeader>
            <CardTitle>输入设置</CardTitle>
            <CardDescription>
              配置语音识别参数并上传音频文件
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audio-file">音频文件 *</Label>
                <Input
                  id="audio-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                {audioFile && (
                  <p className="text-sm text-muted-foreground">
                    已选择: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">上下文信息（可选）</Label>
                <Textarea
                  id="context"
                  placeholder="输入上下文信息以提高识别准确度..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">语言设置</Label>
                <Select value={language} onValueChange={setLanguage} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动检测</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="en">英文</SelectItem>
                    <SelectItem value="ja">日文</SelectItem>
                    <SelectItem value="ko">韩文</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="itn"
                  checked={enableITN}
                  onCheckedChange={setEnableITN}
                  disabled={isLoading}
                />
                <Label htmlFor="itn">启用逆文本标准化（ITN）</Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !audioFile}>
                {isLoading ? '处理中...' : '开始识别'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 结果显示 */}
        <Card>
          <CardHeader>
            <CardTitle>识别结果</CardTitle>
            <CardDescription>
              语音识别的输出结果
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">识别结果</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm">{result.recognition_result}</p>
                  </div>
                </div>
                
                {result.language_detection && (
                  <div>
                    <Label className="text-sm font-medium">语种检测结果</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <p className="text-sm">{result.language_detection}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>等待识别结果...</p>
                <p className="text-sm mt-2">请上传音频文件并点击"开始识别"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API 说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            API 使用说明
            <Button
              variant="outline"
              size="sm"
              onClick={copyApiExample}
            >
              复制示例代码
            </Button>
          </CardTitle>
          <CardDescription>
            如何使用语音识别API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <p><strong>端点：</strong> POST {getProxyUrl()}</p>
              <p><strong>参数：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code>audio_file</code> (必需): 音频文件数据</li>
                <li><code>context</code> (可选): 上下文信息，默认为空字符串</li>
                <li><code>language</code> (可选): 语言设置，默认为"auto"</li>
                <li><code>enable_itn</code> (可选): 是否启用逆文本标准化，默认为false</li>
              </ul>
              <p><strong>返回：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code>data[0]</code>: 识别结果文本</li>
                <li><code>data[1]</code>: 语种检测结果（仅在auto模式下返回）</li>
              </ul>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <h4 className="font-medium mb-2">请求示例：</h4>
              <pre className="text-xs overflow-x-auto">
{`{
  "audio_file": {
    "data": "base64编码的音频数据",
    "name": "audio.wav",
    "type": "audio/wav",
    "size": 12345
  },
  "context": "上下文信息",
  "language": "auto",
  "enable_itn": false
}`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-md">
              <h4 className="font-medium mb-2">响应示例：</h4>
              <pre className="text-xs overflow-x-auto">
{`{
  "success": true,
  "data": [
    "这是识别出的文本内容",
    "检测到的语言：中文"
  ]
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}