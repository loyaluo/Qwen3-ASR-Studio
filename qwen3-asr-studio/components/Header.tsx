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

        // Dynamically construct the PiP window's HTML, mirroring pip.html
        const head = pipWindow.document.head;
        const body = pipWindow.document.body;

        pipWindow.document.documentElement.lang = 'zh-CN';

        const metaCharset = pipWindow.document.createElement('meta');
        metaCharset.setAttribute('charset', 'UTF-8');
        head.appendChild(metaCharset);
        
        const metaViewport = pipWindow.document.createElement('meta');
        metaViewport.name = 'viewport';
        metaViewport.content = 'width=device-width, initial-scale=1.0';
        head.appendChild(metaViewport);

        const iconLink = pipWindow.document.createElement('link');
        iconLink.rel = 'icon';
        iconLink.type = 'image/png';
        iconLink.href = 'https://cdn-avatars.huggingface.co/v1/production/uploads/620760a26e3b7210c2ff1943/-s1gyJfvbE1RgO5iBeNOi.png';
        iconLink.sizes.add('200x200');
        head.appendChild(iconLink);

        const title = pipWindow.document.createElement('title');
        title.innerText = '输入法模式 - Qwen3-ASR';
        head.appendChild(title);

        const tailwindScript = pipWindow.document.createElement('script');
        tailwindScript.src = "https://cdn.tailwindcss.com";
        head.appendChild(tailwindScript);

        const tailwindConfigScript = pipWindow.document.createElement('script');
        tailwindConfigScript.innerHTML = `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'brand-primary': '#10b981',
                  'brand-secondary': '#059669',
                  'base-100': '#1f2937',
                  'base-200': '#374151',
                  'base-300': '#4b5563',
                  'content-100': '#f3f4f6',
                  'content-200': '#d1d5db',
                },
              },
            },
          }
        `;
        head.appendChild(tailwindConfigScript);

        const importMapScript = pipWindow.document.createElement('script');
        importMapScript.type = 'importmap';
        importMapScript.innerHTML = JSON.stringify({
          imports: {
            "react-dom/": "https://aistudiocdn.com/react-dom@^19.1.1/",
            "react/": "https://aistudiocdn.com/react@^19.1.1/",
            "react": "https://aistudiocdn.com/react@^19.1.1",
            "@gradio/client": "https://aistudiocdn.com/@gradio/client@^1.17.1"
          }
        });
        head.appendChild(importMapScript);

        const bufferPolyfillScript = pipWindow.document.createElement('script');
        bufferPolyfillScript.type = 'module';
        bufferPolyfillScript.innerHTML = `
          (async () => {
            if (typeof window.global === 'undefined') {
              window.global = window;
            }
            if (typeof window.Buffer === 'undefined') {
              const buffer = await import('https://cdn.jsdelivr.net/npm/buffer@6.0.3/index.js');
              window.Buffer = buffer.Buffer;
            }
          })();
        `;
        head.appendChild(bufferPolyfillScript);

        body.className = "bg-base-100";
        const rootDiv = pipWindow.document.createElement('div');
        rootDiv.id = 'root';
        body.appendChild(rootDiv);

        const appScript = pipWindow.document.createElement('script');
        appScript.type = 'module';
        appScript.src = '/pip.tsx';
        body.appendChild(appScript);

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
