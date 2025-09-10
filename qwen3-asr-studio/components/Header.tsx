import React from 'react';
import { PipIcon } from './icons/PipIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface HeaderProps {
  onSettingsClick: () => void;
  onPipError: (message: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onPipError }) => {
  const handlePipClick = async () => {
    // Use Document Picture-in-Picture API if available
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 380,
          height: 520,
        });

        // Fetch pip.html and write its contents to the PiP window's document.
        const response = await fetch('/pip.html');
        if (!response.ok) {
          throw new Error(`Failed to fetch pip.html: ${response.statusText}`);
        }
        const html = await response.text();
        pipWindow.document.write(html);
        pipWindow.document.close();

      } catch (error) {
        console.error('Failed to open document PiP window:', error);
        onPipError('打开画中画窗口失败。用户可能已拒绝请求。');
      }
    } else {
      onPipError('您的浏览器不支持此功能。请使用最新版本的 Chrome 或 Edge 浏览器。');
    }
  };

  return (
    <header className="flex items-center justify-between">
      <div className="flex-1"></div>
      <div className="flex items-center justify-center flex-shrink-0 mx-4">
        <a href="https://qwen3-asr-studio.pages.dev/" target="_blank" rel="noopener noreferrer">
          <img
            src="https://modelscope.oss-cn-beijing.aliyuncs.com/resource/00EE8C99-9C05-4236-A6D0-B58FF172D31B.png"
            alt="Qwen3 ASR Studio"
            className="h-14 sm:h-16 w-auto cursor-pointer"
          />
        </a>
      </div>
      <div className="flex-1 flex justify-end items-center gap-2">
        <button
          onClick={onSettingsClick}
          title="设置"
          aria-label="打开设置"
          className="p-2 rounded-full text-content-200 hover:bg-base-200 hover:text-content-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
        <button
          onClick={handlePipClick}
          title="输入法模式 (画中画)"
          aria-label="打开输入法模式"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-content-200 hover:bg-base-200 hover:text-content-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          <PipIcon className="w-5 h-5" />
          输入法模式
        </button>
      </div>
    </header>
  );
};
