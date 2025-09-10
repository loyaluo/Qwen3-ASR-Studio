
import React, { useState, useEffect } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { LanguageIcon } from './icons/LanguageIcon';
import { LoaderIcon } from './icons/LoaderIcon';

interface ResultDisplayProps {
  transcription: string;
  detectedLanguage: string;
  isLoading: boolean;
  loadingStatus?: string;
}

const loadingMessages = [
  "正在初始化模型...",
  "正在处理您的音频...",
  "执行神经网络分析...",
  "正在识别语音内容...",
  "生成最终转录文本...",
  "快好了...",
];


export const ResultDisplay: React.FC<ResultDisplayProps> = ({ transcription, detectedLanguage, isLoading, loadingStatus }) => {
  const [copied, setCopied] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (isLoading && !loadingStatus) {
      let messageIndex = 0;
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 2500);

      return () => {
        clearInterval(interval);
        setLoadingMessage(loadingMessages[0]);
      };
    }
  }, [isLoading, loadingStatus]);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
  };
  
  const hasResult = transcription || detectedLanguage;

  return (
    <div className="flex flex-col flex-grow p-4 rounded-lg bg-base-200 border border-base-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-content-100">识别结果</h3>
        {transcription && (
          <button
            onClick={handleCopy}
            className="flex items-center px-3 py-1 text-sm rounded-md transition-colors bg-base-300 text-content-200 hover:bg-brand-primary hover:text-white"
          >
            {copied ? <CheckIcon className="w-4 h-4 mr-1" /> : <CopyIcon className="w-4 h-4 mr-1" />}
            {copied ? '已复制!' : '复制'}
          </button>
        )}
      </div>
      <div className="flex-grow p-4 rounded-md bg-base-100 min-h-[200px] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <LoaderIcon className="h-10 text-brand-primary mb-4" />
            <p className="text-content-200 px-4">{loadingStatus || loadingMessage}</p>
          </div>
        ) : hasResult ? (
          <div>
            {detectedLanguage && (
                <div className="flex items-center gap-2 mb-4 p-2 text-sm rounded-md bg-base-200 text-content-200 border border-base-300">
                    <LanguageIcon className="w-5 h-5 text-brand-primary" />
                    <span>识别语言: <strong>{detectedLanguage}</strong></span>
                </div>
            )}
            <p className="text-content-100 whitespace-pre-wrap">{transcription}</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-content-200">识别结果将显示在这里。</p>
          </div>
        )}
      </div>
    </div>
  );
};
