import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { LanguageIcon } from './icons/LanguageIcon';
import { LoaderIcon } from './icons/LoaderIcon';

interface ResultDisplayProps {
  transcription: string;
  setTranscription: (value: string | ((prev: string) => string)) => void;
  detectedLanguage: string;
  isLoading: boolean;
  loadingStatus?: string;
  transcriptionMode: 'single' | 'notes';
  onModeChange: (mode: 'single' | 'notes') => void;
  onSaveNote: () => void;
}

export interface ResultDisplayHandle {
  insertText: (text: string) => void;
}

const loadingMessages = [
  "正在初始化模型...",
  "正在处理您的音频...",
  "执行神经网络分析...",
  "正在识别语音内容...",
  "生成最终转录文本...",
  "快好了...",
];

export const ResultDisplay = forwardRef<ResultDisplayHandle, ResultDisplayProps>(
  ({ transcription, setTranscription, detectedLanguage, isLoading, loadingStatus, transcriptionMode, onModeChange, onSaveNote }, ref) => {
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      insertText: (textToInsert) => {
        const textarea = textareaRef.current;
        
        // This function is intended for notes mode.
        if (transcriptionMode === 'notes' && textarea) {
          // If the textarea is available, we insert at the cursor.
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const currentText = textarea.value;

          const newText = currentText.slice(0, start) + textToInsert + currentText.slice(end);
          setTranscription(newText);
          
          // Defer setting selection to after the component re-renders
          setTimeout(() => {
            if (textareaRef.current) {
              const newCursorPosition = start + textToInsert.length;
              textareaRef.current.selectionStart = newCursorPosition;
              textareaRef.current.selectionEnd = newCursorPosition;
              textareaRef.current.focus();
            }
          }, 0);
        } else if (transcriptionMode === 'notes') {
          // Fallback for notes mode when the textarea isn't rendered yet. Append to the end to prevent data loss.
          setTranscription(prev => prev + textToInsert);
        } else {
          // This path should not be hit based on App.tsx logic, but as a safeguard, we honor single-mode behavior.
          setTranscription(textToInsert);
        }
      },
    }));

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

    const hasResult = transcription || (detectedLanguage && transcriptionMode === 'single');

    return (
      <div className="flex flex-col rounded-lg bg-base-200 border border-base-300 flex-grow">
        <div className="flex items-center justify-between p-2 border-b border-base-300">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-base-300">
            <button
              onClick={() => onModeChange('single')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                transcriptionMode === 'single' ? 'bg-brand-primary text-white' : 'hover:bg-base-200'
              }`}
            >
              单次模式
            </button>
            <button
              onClick={() => onModeChange('notes')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                transcriptionMode === 'notes' ? 'bg-brand-primary text-white' : 'hover:bg-base-200'
              }`}
            >
              笔记模式
            </button>
          </div>
          {transcriptionMode === 'single' && detectedLanguage && !isLoading && (
            <div className="flex items-center gap-2 px-2 text-sm text-content-200">
                <LanguageIcon className="w-5 h-5 text-brand-primary" />
                <span>识别语言: <strong>{detectedLanguage}</strong></span>
            </div>
          )}
          {transcriptionMode === 'notes' && !isLoading && (
            <button
              onClick={onSaveNote}
              disabled={!transcription.trim()}
              title="保存笔记"
              className="px-3 py-1 text-sm font-medium rounded-md transition-colors bg-base-100 border border-base-300 text-content-100 hover:bg-brand-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          )}
        </div>
        <div className="relative p-4 rounded-b-lg bg-base-100 flex-grow overflow-y-auto h-32 md:h-auto">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center h-full text-center bg-base-100 bg-opacity-90 z-10">
              <LoaderIcon className="h-10 text-brand-primary" />
            </div>
          )}

          {transcriptionMode === 'notes' ? (
            <textarea
              ref={textareaRef}
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="识别结果将显示并可在此处编辑..."
              className="w-full h-full bg-transparent resize-none focus:outline-none text-content-100"
              aria-label="识别结果笔记"
              disabled={isLoading}
            />
          ) : (
            !isLoading && (
              hasResult ? (
                <div>
                  <p className="text-content-100 whitespace-pre-wrap">{transcription}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-content-200">识别结果将显示在这里。</p>
                </div>
              )
            )
          )}
        </div>
      </div>
    );
  }
);