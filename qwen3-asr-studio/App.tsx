import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { AudioRecorder } from './components/AudioRecorder';
import { FileUpload } from './components/FileUpload';
import { ResultDisplay } from './components/ResultDisplay';
import { Loader } from './components/Loader';
import { transcribeAudio } from './services/gradioService';
import { Language, AppState, InputMode } from './types';
import { LANGUAGES } from './constants';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { UploadIcon } from './components/icons/UploadIcon';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    inputMode: InputMode.UPLOAD,
    audioFile: null,
    context: '',
    language: Language.AUTO,
    enableITN: true,
    isLoading: false,
    statusMessage: '',
    transcription: null,
    detectedLanguage: null,
    error: null,
  });

  const handleTranscribe = useCallback(async () => {
    if (!appState.audioFile) {
      setAppState(prev => ({ ...prev, error: '请提供一个音频文件。' }));
      return;
    }

    setAppState(prev => ({
      ...prev,
      isLoading: true,
      statusMessage: '准备音频中...',
      error: null,
      transcription: null,
      detectedLanguage: null,
    }));

    try {
      const result = await transcribeAudio(
        appState.audioFile,
        appState.context,
        appState.language,
        appState.enableITN,
        (status) => setAppState(prev => ({ ...prev, statusMessage: status }))
      );
      setAppState(prev => ({
        ...prev,
        isLoading: false,
        transcription: result.transcription,
        detectedLanguage: result.detectedLanguage,
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
      setAppState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  }, [appState.audioFile, appState.context, appState.language, appState.enableITN]);

  const setAudioFile = (file: File | null) => {
    setAppState(prev => ({ ...prev, audioFile: file, error: null }));
  };

  const renderInputPanel = () => {
    switch (appState.inputMode) {
      case InputMode.RECORD:
        return <AudioRecorder setAudioFile={setAudioFile} />;
      case InputMode.UPLOAD:
      default:
        return <FileUpload audioFile={appState.audioFile} setAudioFile={setAudioFile} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="flex flex-col space-y-6">
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setAppState(prev => ({ ...prev, inputMode: InputMode.UPLOAD, audioFile: null }))}
                className={`w-1/2 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${appState.inputMode === InputMode.UPLOAD ? 'bg-sky-500 text-white' : 'hover:bg-gray-300 text-gray-600'}`}
              >
                <UploadIcon className="w-5 h-5" />
                上传音频
              </button>
              <button
                onClick={() => setAppState(prev => ({ ...prev, inputMode: InputMode.RECORD, audioFile: null }))}
                className={`w-1/2 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${appState.inputMode === InputMode.RECORD ? 'bg-sky-500 text-white' : 'hover:bg-gray-300 text-gray-600'}`}
              >
                <MicrophoneIcon className="w-5 h-5" />
                录制音频
              </button>
            </div>

            {renderInputPanel()}

            <div>
              <label htmlFor="context" className="block text-sm font-medium text-gray-600 mb-2">上下文（可选）</label>
              <textarea
                id="context"
                rows={3}
                value={appState.context}
                onChange={(e) => setAppState(prev => ({ ...prev, context: e.target.value }))}
                placeholder="提供上下文以提高转录准确性，例如：人名、特定术语。"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-600 mb-2">语言</label>
                <select
                  id="language"
                  value={appState.language}
                  onChange={(e) => setAppState(prev => ({ ...prev, language: e.target.value as Language }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                >
                  {LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-1">
                 <div className="flex items-center space-x-3">
                  <input
                    id="itn"
                    type="checkbox"
                    checked={appState.enableITN}
                    onChange={(e) => setAppState(prev => ({ ...prev, enableITN: e.target.checked }))}
                    className="h-5 w-5 rounded bg-gray-200 border-gray-300 text-sky-500 focus:ring-sky-500"
                  />
                  <label htmlFor="itn" className="font-medium text-gray-700">启用逆文本标准化 (ITN)</label>
                </div>
              </div>
            </div>

            <button
              onClick={handleTranscribe}
              disabled={!appState.audioFile || appState.isLoading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 disabled:scale-100"
            >
              {appState.isLoading ? '处理中...' : '开始转录'}
            </button>
            
            {appState.error && <div className="text-red-600 bg-red-100 p-3 rounded-lg text-center">{appState.error}</div>}
          </div>

          {/* Output Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center justify-center min-h-[300px] lg:min-h-full">
            {appState.isLoading ? (
              <Loader message={appState.statusMessage} />
            ) : (
              <ResultDisplay
                transcription={appState.transcription}
                detectedLanguage={appState.detectedLanguage}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;