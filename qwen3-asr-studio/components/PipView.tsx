
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudio } from '../services/gradioService';
import { Language } from '../types';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { LoaderIcon } from './icons/LoaderIcon';

interface PipViewProps {
  transcribeAudio: (
    audioFile: File,
    context: string,
    language: Language,
    enableItn: boolean,
    onProgress: (message: string) => void
  ) => Promise<{ transcription: string; detectedLanguage: string }>;
  onTranscriptionComplete: (text: string) => void;
  theme: 'light' | 'dark';
}

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const PipView: React.FC<PipViewProps> = ({ transcribeAudio, onTranscriptionComplete, theme }) => {
    type Status = 'idle' | 'recording' | 'processing' | 'error';
    const [status, setStatus] = useState<Status>('idle');
    const [transcription, setTranscription] = useState<string>('');
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<number | null>(null);

    // Apply theme from props
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const handleTranscription = async (audioFile: File) => {
        setStatus('processing');
        setTranscription('');
        try {
            const result = await transcribeAudio(audioFile, '', Language.AUTO, true, () => {});
            if (result.transcription) {
                setTranscription(result.transcription);
                onTranscriptionComplete(result.transcription);
                setStatus('idle');
            } else {
                setTranscription('未能识别到任何内容。');
                setStatus('error');
            }
        } catch (err) {
            console.error('Transcription error:', err);
            const msg = err instanceof Error ? err.message : '转录过程中发生未知错误。';
            setTranscription(msg);
            setStatus('error');
        }
    };
    
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setStatus('processing');
    }, []);

    const startRecording = async () => {
        setTranscription('');
        setStatus('recording');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const audioFile = new File([audioBlob], `recording.${mimeType.split('/')[1]}`, { type: mimeType });
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());
                handleTranscription(audioFile);
            };

            recorder.start();
            setRecordingTime(0);
            timerIntervalRef.current = window.setInterval(() => {
                setRecordingTime(prevTime => prevTime + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setTranscription("麦克风访问被拒绝或不可用。");
            setStatus('error');
        }
    };
    
    const handleRecordClick = () => {
        if (status === 'recording') {
            stopRecording();
        } else if (status === 'idle' || status === 'error') {
            startRecording();
        }
    };

    useEffect(() => {
        if (status === 'error') {
            const timer = window.setTimeout(() => {
                setStatus('idle');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const getButtonContent = () => {
        switch (status) {
            case 'recording': return <StopIcon className="w-8 h-8" />;
            case 'processing': return <LoaderIcon className="w-8 h-8" />;
            default: return <MicrophoneIcon className="w-8 h-8" />;
        }
    };

    const getButtonClasses = () => {
        const base = "w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-wait shadow-lg";
        switch (status) {
            case 'recording': return `${base} bg-red-600 hover:bg-red-700 focus:ring-red-500 animate-pulse-ring`;
            case 'processing': return `${base} bg-base-300 cursor-wait`;
            case 'error': return `${base} bg-red-600 focus:ring-red-500`;
            default: return `${base} bg-brand-primary hover:bg-brand-secondary focus:ring-brand-primary`;
        }
    };
    
    const getResultContent = () => {
        if (status === 'processing') return "正在识别...";
        if (transcription) return transcription;
        return "点击下方按钮开始录音";
    };

    return (
        <div className="flex flex-col h-screen w-full bg-base-100 font-sans text-content-100 select-none">
            <style>{`
                :root { --color-brand-primary: #10b981; --color-brand-secondary: #059669; --color-base-100: #ffffff; --color-base-200: #f9fafb; --color-base-300: #f3f4f6; --color-content-100: #111827; --color-content-200: #6b7280; }
                .dark { --color-brand-primary: #10b981; --color-brand-secondary: #059669; --color-base-100: #1f2937; --color-base-200: #374151; --color-base-300: #4b5563; --color-content-100: #f3f4f6; --color-content-200: #d1d5db; }
                @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                .animate-pulse-ring { animation: pulse-ring 2s infinite; }
                @keyframes pulse-dot { 0%, 100% { transform: scale(0.8); opacity: 0.7; } 50% { transform: scale(1.2); opacity: 1; } }
                .animate-pulsing-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
            `}</style>
            <div className="flex-grow p-4 flex items-center justify-center text-center overflow-y-auto">
                <p className={`text-2xl font-medium transition-colors ${status === 'error' ? 'text-red-400' : 'text-content-100'} ${!transcription && status !== 'processing' ? 'text-content-200' : ''}`}>
                   {getResultContent()}
                </p>
            </div>
            <div className="flex-shrink-0 p-4 bg-base-200/50 border-t border-base-300">
                 <div className="flex items-center justify-center relative h-20">
                     <div className="absolute left-4 text-xl font-mono text-content-200 w-20 text-center">
                        {status === 'recording' && formatTime(recordingTime)}
                     </div>
                    <button
                        onClick={handleRecordClick}
                        disabled={status === 'processing'}
                        className={getButtonClasses()}
                        aria-label={status === 'recording' ? '停止录音' : '开始录音'}
                    >
                        {getButtonContent()}
                    </button>
                </div>
            </div>
        </div>
    );
};
