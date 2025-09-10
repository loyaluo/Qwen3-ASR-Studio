import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { AudioUploader, type AudioUploaderHandle } from './components/AudioUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { ExampleButtons } from './components/ExampleButtons';
import { transcribeAudio, loadExample } from './services/gradioService';
import { Language } from './types';
import { Toast } from './components/Toast';
import { LoaderIcon } from './components/icons/LoaderIcon';
import { SettingsPanel } from './components/SettingsPanel';

type Notification = {
  message: string;
  type: 'error' | 'success';
}

export default function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [context, setContext] = useState<string>('');
  const [language, setLanguage] = useState<Language>(Language.AUTO);
  const [enableItn, setEnableItn] = useState<boolean>(true);
  const [transcription, setTranscription] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcribeAfterRecording, setTranscribeAfterRecording] = useState<boolean>(false);
  const audioUploaderRef = useRef<AudioUploaderHandle>(null);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoCopy, setAutoCopy] = useState(() => {
    return localStorage.getItem('autoCopy') === 'true';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'dark'; // Default to dark as per original UI
  });

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

  // Effect to manage autoCopy persistence
  useEffect(() => {
    localStorage.setItem('autoCopy', String(autoCopy));
  }, [autoCopy]);


  const handleFileChange = (file: File | null) => {
    setAudioFile(file);
    setTranscription('');
    setDetectedLanguage('');
    setNotification(null);
  };
  
  const handleError = (message: string) => {
      setNotification({ message, type: 'error' });
  };

  const transcribeNow = useCallback(async (file: File) => {
    if (!file) {
      handleError('没有提供音频文件。');
      return;
    }
    setIsLoading(true);
    setNotification(null);
    setTranscription('');
    setDetectedLanguage('');

    try {
      const result = await transcribeAudio(file, context, language, enableItn);
      setTranscription(result.transcription);
      setDetectedLanguage(result.detectedLanguage);
      if (autoCopy && result.transcription) {
        navigator.clipboard.writeText(result.transcription);
        setNotification({ message: '识别结果已复制到剪贴板', type: 'success' });
      }
    } catch (err) {
      console.error('Transcription error:', err);
      const errorMessage = err instanceof Error ? err.message : '转录过程中发生未知错误。';
      handleError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [context, language, enableItn, autoCopy]);

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
    
    transcribeNow(audioFile);

  }, [audioFile, isRecording, transcribeNow]);
  
  useEffect(() => {
    if (transcribeAfterRecording && audioFile && !isRecording) {
      setTranscribeAfterRecording(false);
      transcribeNow(audioFile);
    }
  }, [transcribeAfterRecording, audioFile, isRecording, transcribeNow]);


  const handleLoadExample = useCallback(async (exampleId: number) => {
    setIsLoading(true);
    setNotification(null);
    setAudioFile(null);
    setTranscription('');
    setDetectedLanguage('');

    try {
      const { file, context: exampleContext } = await loadExample(exampleId);
      setAudioFile(file);
      setContext(exampleContext);
    } catch (err) {
      console.error('Example loading error:', err);
      const errorMessage = err instanceof Error ? err.message : '加载示例音频失败。';
      handleError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);


  return (
    <div className="min-h-screen bg-base-100 text-content-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header onSettingsClick={() => setIsSettingsOpen(true)} />
        <main className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <AudioUploader 
                ref={audioUploaderRef}
                file={audioFile} 
                onFileChange={handleFileChange}
                onRecordingChange={setIsRecording}
                disabled={isLoading}
                onRecordingError={handleError}
              />
              <ExampleButtons onLoadExample={handleLoadExample} disabled={isLoading} />
            </div>
            <div className="flex flex-col">
               <ResultDisplay
                transcription={transcription}
                detectedLanguage={detectedLanguage}
                isLoading={isLoading}
              />
               <div className="flex justify-end pt-6">
                <button
                  onClick={handleTranscribe}
                  disabled={(!audioFile && !isRecording) || isLoading}
                  className="flex items-center justify-center px-6 py-3 text-lg font-semibold text-white transition-all duration-300 rounded-lg shadow-lg bg-brand-primary hover:bg-brand-secondary disabled:bg-base-300 disabled:cursor-not-allowed disabled:text-content-200 focus:outline-none focus:ring-4 focus:ring-brand-primary focus:ring-opacity-50"
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
              </div>
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
        disabled={isLoading}
      />
    </div>
  );
}