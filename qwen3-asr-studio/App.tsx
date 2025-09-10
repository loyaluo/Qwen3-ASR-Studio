
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Header } from './components/Header';
import { AudioUploader, type AudioUploaderHandle } from './components/AudioUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { ExampleButtons } from './components/ExampleButtons';
import { transcribeAudio, loadExample } from './services/gradioService';
import { Language, CompressionLevel, HistoryItem } from './types';
import { Toast } from './components/Toast';
import { LoaderIcon } from './components/icons/LoaderIcon';
import { SettingsPanel } from './components/SettingsPanel';
import { compressAudio } from './services/audioService';
import { getFileHash, getCachedTranscription, setCachedTranscription, getCachedRecording, clearCachedRecording, addHistoryItem, getHistory, deleteHistoryItem, clearHistory } from './services/cacheService';
import { AudioPreview } from './components/AudioPreview';
import { HistoryPanel } from './components/HistoryPanel';
import { RetryIcon } from './components/icons/RetryIcon';
import { PipView } from './components/PipView';
import { StopIcon } from './components/icons/StopIcon';

type Notification = {
  message: string;
  type: 'error' | 'success';
}

declare global {
    interface Window {
        documentPictureInPicture?: {
            requestWindow(options?: { width: number, height: number }): Promise<Window>;
            readonly window?: Window;
        };
    }
}

export default function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [context, setContext] = useState<string>(() => localStorage.getItem('context') || '转录中文时，请用简体。');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language | null) || Language.AUTO);
  const [enableItn, setEnableItn] = useState<boolean>(() => localStorage.getItem('enableItn') === 'true');
  const [transcription, setTranscription] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcribeAfterRecording, setTranscribeAfterRecording] = useState<boolean>(false);
  const audioUploaderRef = useRef<AudioUploaderHandle>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSpaceDown = useRef(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoCopy, setAutoCopy] = useState(() => {
    // Default to true if no setting is found in localStorage
    return localStorage.getItem('autoCopy') !== 'false';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'dark'; // Default to dark as per original UI
  });
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>(() => {
    const savedLevel = localStorage.getItem('compressionLevel') as CompressionLevel;
    return savedLevel && Object.values(CompressionLevel).includes(savedLevel)
      ? savedLevel
      : CompressionLevel.ORIGINAL; // Default to original
  });

  // PiP State
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);
  const isPipActive = !!pipWindow;

  const handleError = useCallback((message: string) => {
      setNotification({ message, type: 'error' });
  }, []);

  const handleLoadExample = useCallback(async (exampleId: number) => {
    setIsLoading(true);
    setNotification(null);
    setAudioFile(null);
    setTranscription('');
    setDetectedLanguage('');
    
    const onProgress = (message: string) => {
      setLoadingMessage(message);
    };

    try {
      const { file } = await loadExample(exampleId, onProgress);
      setAudioFile(file);
    } catch (err) {
      console.error('Example loading error:', err);
      const errorMessage = err instanceof Error ? err.message : '加载示例音频失败。';
      handleError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [handleError]);

  // Load cached recording and history on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const cachedRecording = await getCachedRecording();
        if (cachedRecording) {
          setAudioFile(cachedRecording);
        }
      } catch (error) {
        console.error("Failed to load cached recording:", error);
      }

      try {
        const historyItems = await getHistory();
        setHistory(historyItems);
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    };
    loadInitialData();
  }, []);

  // Effect to manage theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Effects to manage settings persistence
  useEffect(() => {
    localStorage.setItem('autoCopy', String(autoCopy));
  }, [autoCopy]);

  useEffect(() => {
    localStorage.setItem('compressionLevel', compressionLevel);
  }, [compressionLevel]);

  useEffect(() => {
    localStorage.setItem('context', context);
  }, [context]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('enableItn', String(enableItn));
  }, [enableItn]);

  const handleTranscriptionCompleteFromPip = useCallback((text: string) => {
    if (text) {
        navigator.clipboard.writeText(text)
          .then(() => {
            setNotification({ message: '输入法模式识别结果已复制', type: 'success' });
          })
          .catch(err => {
            console.error('Failed to copy text from PiP:', err);
            setNotification({ message: '从输入法模式复制失败', type: 'error' });
          });
    }
  }, []);

  const closePip = useCallback(() => {
    if (pipWindow) {
      pipWindow.close();
      // The 'pagehide' listener will handle state cleanup
    }
  }, [pipWindow]);

  const openPip = useCallback(async () => {
    if (!('documentPictureInPicture' in window)) {
      handleError('您的浏览器不支持此功能。请使用最新版本的 Chrome 或 Edge 浏览器。');
      return;
    }
    if (isPipActive) return;

    try {
      const pipWin = await window.documentPictureInPicture!.requestWindow({
        width: 480,
        height: 70,
      });

      // Copy all styles from the main document to the PiP window.
      Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach(node => {
        pipWin.document.head.appendChild(node.cloneNode(true));
      });
      // Copy all scripts from the main document's head to ensure JS/Tailwind works.
      Array.from(document.head.querySelectorAll('script')).forEach(script => {
        const newScript = pipWin.document.createElement('script');
        if (script.src) newScript.src = script.src;
        newScript.textContent = script.textContent;
        pipWin.document.head.appendChild(newScript);
      });

      pipWin.document.title = "输入法模式 - Qwen3-ASR";
      pipWin.document.documentElement.className = document.documentElement.className; // Copy theme class
      pipWin.document.body.style.margin = '0';
      pipWin.document.body.style.overflow = 'hidden';

      const container = pipWin.document.createElement('div');
      container.id = 'pip-root';
      container.style.height = '100vh';
      pipWin.document.body.appendChild(container);

      pipWin.addEventListener('pagehide', () => {
        setPipWindow(null);
        setPipContainer(null);
      }, { once: true });

      setPipWindow(pipWin);
      setPipContainer(container);

    } catch (error) {
      console.error('Failed to open document PiP window:', error);
      handleError('打开画中画窗口失败。用户可能已拒绝请求。');
    }
  }, [isPipActive, handleError]);

  const togglePip = useCallback(() => {
    if (isPipActive) {
      closePip();
    } else {
      openPip();
    }
  }, [isPipActive, closePip, openPip]);

  const handleFileChange = (file: File | null) => {
    setAudioFile(file);
    setTranscription('');
    setDetectedLanguage('');
    setNotification(null);
    if (file === null) {
      clearCachedRecording().catch(console.error);
      audioUploaderRef.current?.clearInput();
    }
  };

  const transcribeNow = useCallback(async (file: File, bypassCache = false) => {
    if (!file) {
      handleError('没有提供音频文件。');
      return;
    }
    
    abortControllerRef.current?.abort(); // Abort previous request if any
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsLoading(true);
    setNotification(null);
    setTranscription('');
    setDetectedLanguage('');
    
    const onProgress = (message: string) => {
      setLoadingMessage(message);
    };

    try {
      const hash = await getFileHash(file);
      const cachedResult = bypassCache ? null : await getCachedTranscription(hash);
      
      let finalTranscription: string;
      let finalLanguage: string;

      if (cachedResult) {
        setTranscription(cachedResult.transcription);
        setDetectedLanguage(cachedResult.detectedLanguage);
        finalTranscription = cachedResult.transcription;
        finalLanguage = cachedResult.detectedLanguage;

        if (autoCopy && cachedResult.transcription) {
          navigator.clipboard.writeText(cachedResult.transcription);
          setNotification({ message: '识别结果已从缓存加载并复制', type: 'success' });
        } else {
          setNotification({ message: '识别结果已从缓存加载', type: 'success' });
        }
      } else {
          onProgress('正在压缩音频（如果需要）...');
          const fileToTranscribe = await compressAudio(file, compressionLevel);
          const result = await transcribeAudio(fileToTranscribe, context, language, enableItn, onProgress, controller.signal);
          setTranscription(result.transcription);
          setDetectedLanguage(result.detectedLanguage);
          finalTranscription = result.transcription;
          finalLanguage = result.detectedLanguage;

          if (result.transcription) {
            await setCachedTranscription(hash, {
              transcription: result.transcription,
              detectedLanguage: result.detectedLanguage,
            });
          }

          if (autoCopy && result.transcription) {
            navigator.clipboard.writeText(result.transcription);
            setNotification({ message: '识别结果已复制到剪贴板', type: 'success' });
          }
      }

      if (finalTranscription) {
        const newHistoryItem: HistoryItem = {
          id: Date.now(),
          fileName: file.name,
          transcription: finalTranscription,
          detectedLanguage: finalLanguage,
          context,
          timestamp: Date.now(),
          audioFile: file,
        };
        try {
          await addHistoryItem(newHistoryItem);
          setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
        } catch (historyError) {
          console.error("Failed to save history item:", historyError);
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setNotification({ message: '识别已取消', type: 'success' });
      } else {
        console.error('Transcription error:', err);
        const errorMessage = err instanceof Error ? err.message : '转录过程中发生未知错误。';
        handleError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [context, language, enableItn, autoCopy, compressionLevel, handleError]);

  const handleTranscribe = useCallback(async () => {
    if (isRecording && audioUploaderRef.current) {
      setTranscribeAfterRecording(true);
      audioUploaderRef.current.stopRecording();
      return;
    }

    if (!audioFile) {
      handleError('请先上传或录制一段音频。');
      return;
    }
    
    transcribeNow(audioFile, false);

  }, [audioFile, isRecording, transcribeNow, handleError]);
  
  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleRetry = useCallback(() => {
    if (audioFile) {
      transcribeNow(audioFile, true);
    }
  }, [audioFile, transcribeNow]);
  
  useEffect(() => {
    if (transcribeAfterRecording && audioFile && !isRecording) {
      setTranscribeAfterRecording(false);
      transcribeNow(audioFile);
    }
  }, [transcribeAfterRecording, audioFile, isRecording, transcribeNow]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || isSpaceDown.current || isSettingsOpen) {
        return;
      }

      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName) || target.isContentEditable) {
        return;
      }
      
      event.preventDefault();

      if (!isRecording && !isLoading) {
        isSpaceDown.current = true;
        audioUploaderRef.current?.startRecording();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !isSpaceDown.current) {
        return;
      }
      
      event.preventDefault();
      isSpaceDown.current = false;

      if (isRecording) {
        handleTranscribe();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isLoading, handleTranscribe, isSettingsOpen]);


  const handleDeleteHistory = async (id: number) => {
    try {
      await deleteHistoryItem(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      setNotification({ message: '已删除历史记录', type: 'success' });
    } catch(err) {
      handleError('删除历史记录失败。');
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      setHistory([]);
      setNotification({ message: '所有历史记录已清除', type: 'success' });
      setIsSettingsOpen(false); // Close panel after clearing
    } catch(err) {
      handleError('清除历史记录失败。');
    }
  };

  const handleRestoreHistory = (item: HistoryItem) => {
    if (item.audioFile) {
      setAudioFile(item.audioFile);
      setTranscription(item.transcription);
      setDetectedLanguage(item.detectedLanguage);
      setContext(item.context);
      setNotification({ message: '已从历史记录恢复', type: 'success' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleError('无法恢复音频文件，可能已丢失。');
    }
  };


  return (
    <div className="min-h-screen bg-base-100 text-content-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header onSettingsClick={() => setIsSettingsOpen(true)} onPipClick={togglePip} />
        <main className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <AudioPreview
                file={audioFile}
                onClear={() => handleFileChange(null)}
                disabled={isLoading}
              />
              <AudioUploader 
                ref={audioUploaderRef}
                onFileChange={handleFileChange}
                onRecordingChange={setIsRecording}
                disabled={isLoading}
                onRecordingError={handleError}
                theme={theme}
              />
              <div className="hidden md:block">
                <ExampleButtons onLoadExample={handleLoadExample} disabled={isLoading} />
              </div>
            </div>
            <div className="flex flex-col">
               <ResultDisplay
                transcription={transcription}
                detectedLanguage={detectedLanguage}
                isLoading={isLoading}
                loadingStatus={loadingMessage}
              />
               <div className="pt-6">
                 <div className="flex items-stretch gap-3">
                  <button
                    onClick={handleTranscribe}
                    disabled={(!audioFile && !isRecording) || isLoading}
                    className="flex-grow flex items-center justify-center px-6 py-3 text-lg font-semibold text-white transition-all duration-300 rounded-lg shadow-lg bg-brand-primary hover:bg-brand-secondary disabled:bg-base-300 disabled:cursor-not-allowed disabled:text-content-200 focus:outline-none focus:ring-4 focus:ring-brand-primary focus:ring-opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <LoaderIcon className="w-6 h-6 mr-3" />
                        正在识别...
                      </>
                    ) : isRecording ? (
                        '停止并识别'
                    ) : (
                      '开始识别'
                    )}
                  </button>
                  {isLoading ? (
                    <button
                      onClick={handleCancel}
                      title="取消"
                      aria-label="取消识别"
                      className="flex-shrink-0 p-3 text-white transition-colors duration-300 bg-red-600 rounded-lg shadow-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50"
                    >
                      <StopIcon className="w-6 h-6" />
                    </button>
                  ) : (
                    transcription && audioFile && (
                      <button
                        onClick={handleRetry}
                        title="重试"
                        aria-label="重试识别"
                        className="flex-shrink-0 p-3 text-content-100 transition-colors duration-300 rounded-lg shadow-lg bg-base-200 border border-base-300 hover:bg-base-300 focus:outline-none focus:ring-4 focus:ring-brand-primary focus:ring-opacity-50"
                      >
                        <RetryIcon className="w-6 h-6" />
                      </button>
                    )
                  )}
                 </div>
              </div>
              <HistoryPanel
                items={history}
                onDelete={handleDeleteHistory}
                onRestore={handleRestoreHistory}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="md:hidden mt-6">
            <ExampleButtons onLoadExample={handleLoadExample} disabled={isLoading} />
          </div>
        </main>
      </div>
      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        autoCopy={autoCopy}
        setAutoCopy={setAutoCopy}
        context={context}
        setContext={setContext}
        language={language}
        setLanguage={setLanguage}
        enableItn={enableItn}
        setEnableItn={setEnableItn}
        compressionLevel={compressionLevel}
        setCompressionLevel={setCompressionLevel}
        onClearHistory={handleClearHistory}
        disabled={isLoading}
      />
       {isPipActive && pipContainer && createPortal(
        <PipView
          onTranscriptionComplete={handleTranscriptionCompleteFromPip}
          theme={theme}
          context={context}
          language={language}
          enableItn={enableItn}
        />,
        pipContainer
      )}
    </div>
  );
}
