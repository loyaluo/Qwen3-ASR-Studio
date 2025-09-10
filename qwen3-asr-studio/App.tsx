import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { AudioUploader, type AudioUploaderHandle } from './components/AudioUploader';
import { OptionsPanel } from './components/OptionsPanel';
import { ResultDisplay } from './components/ResultDisplay';
import { ExampleButtons } from './components/ExampleButtons';
import { transcribeAudio, loadExample } from './services/gradioService';
import { Language } from './types';
import { Toast } from './components/Toast';
import { LoaderIcon } from './components/icons/LoaderIcon';

export default function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [context, setContext] = useState<string>('');
  const [language, setLanguage] = useState<Language>(Language.AUTO);
  const [enableItn, setEnableItn] = useState<boolean>(true);
  const [transcription, setTranscription] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcribeAfterRecording, setTranscribeAfterRecording] = useState<boolean>(false);
  const audioUploaderRef = useRef<AudioUploaderHandle>(null);

  const handleFileChange = (file: File | null) => {
    setAudioFile(file);
    setTranscription('');
    setDetectedLanguage('');
    setError(null);
  };

  const transcribeNow = useCallback(async (file: File) => {
    if (!file) {
      setError('没有提供音频文件。');
      return;
    }
    setIsLoading(true);
    setError(null);
    setTranscription('');
    setDetectedLanguage('');

    try {
      const result = await transcribeAudio(file, context, language, enableItn);
      setTranscription(result.transcription);
      setDetectedLanguage(result.detectedLanguage);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : '转录过程中发生未知错误。');
    } finally {
      setIsLoading(false);
    }
  }, [context, language, enableItn]);

  const handleTranscribe = useCallback(async () => {
    if (isRecording && audioUploaderRef.current) {
      setTranscribeAfterRecording(true);
      audioUploaderRef.current.stopRecording();
      return;
    }

    if (!audioFile) {
      setError('请先上传或录制一段音频。');
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
    setError(null);
    setAudioFile(null);
    setTranscription('');
    setDetectedLanguage('');

    try {
      const { file, context: exampleContext } = await loadExample(exampleId);
      setAudioFile(file);
      setContext(exampleContext);
    } catch (err) {
      console.error('Example loading error:', err);
      setError(err instanceof Error ? err.message : '加载示例音频失败。');
    } finally {
      setIsLoading(false);
    }
  }, []);


  return (
    <div className="min-h-screen bg-base-100 text-content-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <main className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <AudioUploader 
                ref={audioUploaderRef}
                file={audioFile} 
                onFileChange={handleFileChange}
                onRecordingChange={setIsRecording}
                disabled={isLoading}
                onRecordingError={setError}
              />
              <ExampleButtons onLoadExample={handleLoadExample} disabled={isLoading} />
              <OptionsPanel
                context={context}
                setContext={setContext}
                language={language}
                setLanguage={setLanguage}
                enableItn={enableItn}
                setEnableItn={setEnableItn}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col">
               <ResultDisplay
                transcription={transcription}
                detectedLanguage={detectedLanguage}
                isLoading={isLoading}
              />
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
            <button
              onClick={handleTranscribe}
              disabled={(!audioFile && !isRecording) || isLoading}
              className="flex items-center justify-center w-full max-w-xs px-6 py-3 text-lg font-semibold text-white transition-all duration-300 rounded-lg shadow-lg bg-brand-primary hover:bg-brand-secondary disabled:bg-base-300 disabled:cursor-not-allowed disabled:text-content-200 focus:outline-none focus:ring-4 focus:ring-brand-primary focus:ring-opacity-50"
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
        </main>
      </div>
      {error && <Toast message={error} onClose={() => setError(null)} />}
    </div>
  );
}