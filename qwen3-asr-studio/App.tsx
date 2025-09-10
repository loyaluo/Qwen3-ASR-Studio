import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { AudioUploader, type AudioUploaderHandle } from './components/AudioUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { ExampleButtons } from './components/ExampleButtons';
import { transcribeAudio, loadExample } from './services/gradioService';
import { Language, CompressionLevel } from './types';
import { Toast } from './components/Toast';
import { LoaderIcon } from './components/icons/LoaderIcon';
import { SettingsPanel } from './components/SettingsPanel';
import { compressAudio } from './services/audioService';
import { getFileHash, getCachedTranscription, setCachedTranscription, getCachedRecording, clearCachedRecording } from './services/cacheService';

type Notification = {
  message: string;
  type: 'error' | 'success';
}

export default function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [context, setContext] = useState<string>(() => localStorage.getItem('context') || '');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language | null) || Language.AUTO);
  const [enableItn, setEnableItn] = useState<boolean>(() => localStorage.getItem('enableItn') !== 'false');
  const [transcription, setTranscription] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean