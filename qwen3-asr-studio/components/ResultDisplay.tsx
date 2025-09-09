import React, { useState, useEffect } from 'react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface ResultDisplayProps {
  transcription: string | null;
  detectedLanguage: string | null;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ transcription, detectedLanguage }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    if (transcription) {
      navigator.clipboard.writeText(transcription);
      setCopied(true);
    }
  };
  
  if (!transcription) {
    return (
      <div className="text-center text-gray-500">
        <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-400"/>
        <h3 className="text-lg font-semibold text-gray-700">您的转录结果将显示在这里</h3>
        <p className="text-sm">请提供一个音频文件并点击“开始转录”按钮。</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold uppercase text-gray-500">转录结果</h3>
            {detectedLanguage && (
                 <span className="text-xs bg-sky-100 text-sky-800 font-medium px-2 py-1 rounded-full">
                    识别语言: {detectedLanguage.toUpperCase()}
                 </span>
            )}
        </div>
        <div className="relative bg-gray-100 p-4 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto border border-gray-200">
          <p className="text-gray-800 whitespace-pre-wrap">{transcription}</p>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
            title="复制到剪贴板"
          >
            {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};