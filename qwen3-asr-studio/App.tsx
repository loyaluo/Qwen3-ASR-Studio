
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Header } from './components/Header';
import { AudioUploader, type AudioUploaderHandle } from './components/AudioUploader';
import { ResultDisplay, type ResultDisplayHandle } from './components/ResultDisplay';
import { ExampleButtons } from './components/ExampleButtons';
import { transcribeAudio, loadExample } from './services/gradioService';
import { Language, CompressionLevel, HistoryItem, NoteItem } from './types';
import { Toast } from './components/Toast';
import { LoaderIcon } from './components/icons/LoaderIcon';
import { SettingsPanel } from './components/SettingsPanel';
import { compressAudio } from './services/audioService';
import { getFileHash, getCachedTranscription, setCachedTranscription, getCachedRecording, clearCachedRecording, addHistoryItem, getHistory, deleteHistoryItem, clearHistory, addNoteItem, getNotes, deleteNoteItem } from './services/cacheService';
import { AudioPreview } from './components/AudioPreview';
import { HistoryPanel } from './components/HistoryPanel';
import { NotesPanel } from './components/NotesPanel';
import { RetryIcon } from './components/icons/RetryIcon';
import { PipView } from './components/PipView';
import { StopIcon } from './components/icons/StopIcon';
import { CopyIcon } from './components/icons/CopyIcon';
import { CheckIcon } from './components/icons/CheckIcon';

type Notification = {
  message: string;
  type: 'error' | 'success';
}

type TranscriptionMode = 'single' | 'notes';

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
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>('single');
  const resultDisplayRef = useRef<ResultDisplayHandle>(null);

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
    return 'light'; // Default to light
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
        const noteItems = await getNotes();
        setNotes(noteItems);
      } catch (error) {
        console.error("Failed to load history or notes:", error);
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

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleTranscriptionResultFromPip = useCallback(async (result: {
    transcription: string;
    detectedLanguage: string;
    audioFile: File;
  }) => {
    // Sync state with main page
    setAudioFile(result.audioFile);
    
    if (transcriptionMode === 'single') {
      setTranscription(result.transcription);
      setDetectedLanguage(result.detectedLanguage);
    } else {
      const prefix = transcription.length > 0 && !/[\s\n]$/.test(transcription) ? ' ' : '';
      resultDisplayRef.current?.insertText(prefix + result.transcription);
      setDetectedLanguage('');
    }

    // Show notification based on copy success
    if (result.transcription) {
      try {
        await navigator.clipboard.writeText(result.transcription);
        setNotification({ message: '输入法模式识别结果已复制', type: 'success' });
      } catch (copyError) {
        console.error('Failed to copy text from main window:', copyError);
        setNotification({ message: '识别成功，但自动复制失败', type: 'error' });
      }
    }

    // Add to history
    if (result.transcription) {
      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        fileName: result.audioFile.name,
        transcription: result.transcription,
        detectedLanguage: result.detectedLanguage,
        context,
        timestamp: Date.now(),
        audioFile: result.audioFile,
      };

      const saveHistory = async () => {
        try {
          await addHistoryItem(newHistoryItem);
          setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
        } catch (historyError) {
          console.error("Failed to save history item from PiP:", historyError);
        }
      };
      saveHistory();
    }
  }, [context, transcriptionMode, transcription]);

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
    if (transcriptionMode === 'single') {
        setTranscription('');
        setDetectedLanguage('');
    }
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
    
    if (transcriptionMode === 'single') {
        setTranscription('');
        setDetectedLanguage('');
    }
    
    const onProgress = (message: string) => {
      setLoadingMessage(message);
    };

    try {
      const hash = await getFileHash(file);
      const cachedResult = bypassCache ? null : await getCachedTranscription(hash);
      
      let finalTranscription: string;
      let finalLanguage: string;

      if (cachedResult) {
        finalTranscription = cachedResult.transcription;
        finalLanguage = cachedResult.detectedLanguage;

        if (autoCopy && cachedResult.transcription) {
          try {
            await navigator.clipboard.writeText(cachedResult.transcription);
            setNotification({ message: '识别结果已从缓存加载并复制', type: 'success' });
          } catch (copyError) {
            console.error('Failed to auto-copy cached result:', copyError);
            handleError('从缓存加载成功，但自动复制失败');
          }
        } else {
          setNotification({ message: '识别结果已从缓存加载', type: 'success' });
        }
      } else {
          onProgress('正在压缩音频（如果需要）...');
          const fileToTranscribe = await compressAudio(file, compressionLevel);
          const result = await transcribeAudio(fileToTranscribe, context, language, enableItn, onProgress, controller.signal);
          finalTranscription = result.transcription;
          finalLanguage = result.detectedLanguage;

          if (result.transcription) {
            await setCachedTranscription(hash, {
              transcription: result.transcription,
              detectedLanguage: result.detectedLanguage,
            });
          }

          if (autoCopy && result.transcription) {
            try {
              await navigator.clipboard.writeText(result.transcription);
              setNotification({ message: '识别结果已复制到剪贴板', type: 'success' });
            } catch (copyError) {
              console.error('Failed to auto-copy new result:', copyError);
              handleError('识别成功，但自动复制失败');
            }
          }
      }
      
      if (transcriptionMode === 'single') {
        setTranscription(finalTranscription);
        setDetectedLanguage(finalLanguage);
      } else {
        const prefix = transcription.length > 0 && !/[\s\n]$/.test(transcription) ? ' ' : '';
        resultDisplayRef.current?.insertText(prefix + finalTranscription);
        setDetectedLanguage('');
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
  }, [context, language, enableItn, autoCopy, compressionLevel, handleError, transcriptionMode, transcription]);

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

  const handleCopy = useCallback(async () => {
    if (transcription) {
      try {
        await navigator.clipboard.writeText(transcription);
        setCopied(true);
        setNotification({ message: '识别结果已复制到剪贴板', type: 'success' });
      } catch (err) {
        console.error('Failed to copy text:', err);
        handleError('复制失败，请检查浏览器权限。');
      }
    }
  }, [transcription, handleError]);

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
      setTranscriptionMode('single'); // Always restore to single mode for clarity
      setNotification({ message: '已从历史记录恢复', type: 'success' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleError('无法恢复音频文件，可能已丢失。');
    }
  };

  const handleModeChange = (newMode: TranscriptionMode) => {
    if (newMode !== transcriptionMode) {
        setTranscription('');
        setDetectedLanguage('');
        setTranscriptionMode(newMode);
    }
  };

  const handleSaveNote = async () => {
    const content = transcription.trim();
    if (!content) {
        setNotification({ message: '笔记内容不能为空', type: 'error' });
        return;
    }
    const newNote: NoteItem = {
        id: Date.now(),
        content: content,
        timestamp: Date.now(),
    };
    try {
        await addNoteItem(newNote);
        setNotes(prev => [newNote, ...prev]);
        setTranscription(''); // Clear the editor after saving
        setNotification({ message: '笔记已保存', type: 'success' });
    } catch (err) {
        handleError('保存笔记失败。');
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await deleteNoteItem(id);
      setNotes(prev => prev.filter(item => item.id !== id));
      setNotification({ message: '已删除笔记', type: 'success' });
    } catch(err) {
      handleError('删除笔记失败。');
    }
  };

  const handleRestoreNote = (item: NoteItem) => {
    setTranscriptionMode('notes');
    const prefix = transcription.length > 0 && !/[\s\n]$/.test(transcription) ? '\n\n' : '';
    setTranscription(prev => prev + prefix + item.content);
    setNotification({ message: '已从笔记恢复内容', type: 'success' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-base-100 text-content-100 font-sans p-3 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header onSettingsClick={() => setIsSettingsOpen(true)} onPipClick={togglePip} />
        <main className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            <div className="md:col-start-1 md:row-start-1">
              <AudioPreview
                file={audioFile}
                onClear={() => handleFileChange(null)}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex flex-col md:col-start-2 md:row-start-1 md:row-span-2">
               <ResultDisplay
                ref={resultDisplayRef}
                transcription={transcription}
                setTranscription={setTranscription}
                detectedLanguage={detectedLanguage}
                isLoading={isLoading}
                loadingStatus={loadingMessage}
                transcriptionMode={transcriptionMode}
                onModeChange={handleModeChange}
                onSaveNote={handleSaveNote}
              />
               <div className="pt-6">
                 <div className="flex items-stretch gap-3">
                  <button
                    onClick={handleTranscribe}
                    disabled={(!audioFile && !isRecording) || isLoading}
                    className="flex-grow flex items-center justify-center px-4 sm:px-6 py-3 text-base sm:text-lg font-semibold text-white transition-all duration-300 rounded-lg shadow-lg bg-brand-primary hover:bg-brand-secondary disabled:bg-base-300 disabled:cursor-not-allowed disabled:text-content-200 focus:outline-none focus:ring-4 focus:ring-brand-primary focus:ring-opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <LoaderIcon color="white" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
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
                      <>
                        <button
                          onClick={handleCopy}
                          title={copied ? "已复制!" : "复制"}
                          aria-label="复制识别结果"
                          className="flex-shrink-0 p-3 text-content-100 transition-colors duration-300 rounded-lg shadow-lg bg-base-200 border border-base-300 hover:bg-base-300 focus:outline-none focus:ring-4 focus:ring-brand-primary focus:ring-opacity-50"
                        >
                          {copied ? <CheckIcon className="w-6 h-6 text-brand-primary" /> : <CopyIcon className="w-6 h-6" />}
                        </button>
                        <button
                          onClick={handleRetry}
                          title="重试"
                          aria-label="重试识别"
                          className="flex-shrink-0 p-3 text-content-100 transition-colors duration-300 rounded-lg shadow-lg bg-base-200 border border-base-300 hover:bg-base-300 focus:outline-none focus:ring-4 focus:ring-brand-primary focus:ring-opacity-50"
                        >
                          <RetryIcon className="w-6 h-6" />
                        </button>
                      </>
                    )
                  )}
                 </div>
              </div>
            </div>

            <div className="md:col-start-1 md:row-start-2">
              <AudioUploader 
                ref={audioUploaderRef}
                onFileChange={handleFileChange}
                onRecordingChange={setIsRecording}
                disabled={isLoading}
                onRecordingError={handleError}
                theme={theme}
              />
            </div>

            <div className="md:col-start-2 md:row-start-3">
              <HistoryPanel
                items={history}
                onDelete={handleDeleteHistory}
                onRestore={handleRestoreHistory}
                onError={handleError}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-start-1 md:row-start-3">
               <NotesPanel
                items={notes}
                onDelete={handleDeleteNote}
                onRestore={handleRestoreNote}
                onError={handleError}
                disabled={isLoading}
              />
            </div>
            
            <div className="md:col-span-2">
              <ExampleButtons onLoadExample={handleLoadExample} disabled={isLoading} />
            </div>
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
          onTranscriptionResult={handleTranscriptionResultFromPip}
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
