'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { toast } = useToast();

  // 获取当前页面的完整URL
  const getProxyUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/asr-inference`;
    }
    return '/api/asr-inference';
  };

  // 复制URL到剪贴板
  const copyToClipboard = async () => {
    try {
      const url = getProxyUrl();
      await navigator.clipboard.writeText(url);
      toast({
        title: "复制成功",
        description: "API地址已复制到剪贴板",
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <img
          src="/logo.svg"
          alt="Z.ai Logo"
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">欢迎使用 AI 服务平台</h1>
        <p className="text-xl text-muted-foreground mb-8">
          提供多种AI服务，包括语音识别、图像生成等功能
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">语音识别服务</CardTitle>
              <CardDescription>
                上传音频文件进行语音识别，支持多种语言
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/asr">
                <Button className="w-full">开始使用</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">API 文档</CardTitle>
              <CardDescription>
                查看详细的API使用说明和代码示例
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/api-docs">
                <Button className="w-full" variant="outline">查看文档</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">连接测试</CardTitle>
              <CardDescription>
                测试API连接和功能状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/test">
                <Button className="w-full" variant="secondary">测试连接</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow opacity-50">
            <CardHeader>
              <CardTitle className="text-lg">图像生成服务</CardTitle>
              <CardDescription>
                使用AI生成高质量图像
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>即将推出</Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow opacity-50">
            <CardHeader>
              <CardTitle className="text-lg">文本生成服务</CardTitle>
              <CardDescription>
                智能文本生成和处理服务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>即将推出</Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">快速开始</h3>
          <p className="text-sm text-muted-foreground mb-3">
            复制API地址，即可开始使用语音识别服务
          </p>
          <div className="flex items-center space-x-2 max-w-md mx-auto">
            <input
              type="text"
              value={getProxyUrl()}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-background border rounded-md"
            />
            <Button
              size="sm"
              onClick={copyToClipboard}
            >
              复制
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}