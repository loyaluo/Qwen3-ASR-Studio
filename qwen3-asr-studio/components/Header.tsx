import React from 'react';
import { PipIcon } from './icons/PipIcon';
import { SettingsIcon } from './icons/SettingsIcon';

export const Header: React.FC<{ onSettingsClick: () => void }> = ({ onSettingsClick }) => {
  const handlePipClick = async () => {
    // Fallback to a normal popup window
    const openPopup = () => {
        window.open(
            '/pip.html', 
            'Qwen3-ASR-Studio-Input-Mode', 
            'width=380,height=520,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=no'
        );
    }

    // Use Document Picture-in-Picture API if available
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 380,
          height: 520,
        });

        // Fetch pip.html and write its contents to the PiP window's document.
        // This is more robust than manually creating each element.
        const response = await fetch('/pip.html');
        if (!response.ok) {
          throw new Error(`Failed to fetch pip.html: ${response.statusText}`);
        }
        const html = await response.text();
        pipWindow.document.write(html);
        pipWindow.document.close();

      } catch (error) {
        console.error('Failed to open document PiP window, falling back to popup:', error);
        openPopup();
      }
    } else {
      openPopup();
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
      <div className="flex-1 flex justify-end gap-2">
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
          className="p-2 rounded-full text-content-200 hover:bg-base-200 hover:text-content-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          <PipIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};
