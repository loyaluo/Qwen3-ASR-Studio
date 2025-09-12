import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "通义千问录音文件识别 API 代理服务器",
  description: "解决跨域问题的音频转录服务，提供完整的 API 文档和代理接口，支持多语言识别、ITN 逆文本规范化等功能",
  keywords: ["通义千问", "录音文件识别", "API 代理", "跨域", "音频转录", "ASR", "ITN", "阿里云百炼"],
  authors: [{ name: "API Proxy Server" }],
  openGraph: {
    title: "通义千问录音文件识别 API 代理",
    description: "解决跨域问题的音频转录服务",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "通义千问录音文件识别 API 代理",
    description: "解决跨域问题的音频转录服务",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
