import React, { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../services/gradioService';
import { Language } from '../types';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CloseIcon } from './icons/CloseIcon';

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

export const PipView: React.FC<PipViewProps> = ({ transcribeAudio, onTranscriptionComplete }) => {
    type Status = 'idle' | 'recording' | 'processing' | 'success' | 'error';
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState<string>('点击按钮录音');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleTranscription = async (audioFile: File) => {
        setStatus('processing');
        setMessage('正在识别...');
        try {
            const result = await transcribeAudio(audioFile, '', Language.AUTO, true, () => {});
            if (result.transcription) {
                setMessage(result.transcription);
                onTranscriptionComplete(result.transcription);
                setStatus('success');
            } else {
                setMessage('未能识别到任何内容');
                setStatus('error');
            }
        } catch (err) {
            console.error('Transcription error:', err);
            const msg = err instanceof Error ? err.message : '转录过程中发生未知错误';
            setMessage(msg);
            setStatus('error');
        }
    };
    
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const startRecording = async () => {
        setMessage('正在聆听...');
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
                const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
                const audioFile = new File([audioBlob], `recording.${extension}`, { type: mimeType });
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());
                handleTranscription(audioFile);
            };

            recorder.start();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setMessage("麦克风访问被拒绝");
            setStatus('error');
        }
    };
    
    const handleClick = () => {
        if (status === 'recording') {
            stopRecording();
        } else if (status === 'idle' || status === 'success' || status === 'error') {
            startRecording();
        }
        // Do nothing if processing
    };

    const getIcon = () => {
        const iconClass = "w-7 h-7 text-white";
        switch (status) {
            case 'recording':
            case 'idle':
                return <MicrophoneIcon className={iconClass} />;
            case 'processing':
                return (
                    <div className="w-7 h-7">
                        <svg className="animate-spin h-full w-full text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                );
            case 'success':
                 return <CheckIcon className={iconClass} />;
            case 'error':
                 return <CloseIcon className={iconClass} />;
            default:
                return <MicrophoneIcon className={iconClass} />;
        }
    };

    const getButtonClass = () => {
        const base = "flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50";
        switch (status) {
            case 'recording': return `${base} bg-blue-600 focus:ring-blue-400 animate-pulse-custom`;
            case 'processing': return `${base} bg-gray-500 cursor-not-allowed`;
            case 'error': return `${base} bg-red-600 focus:ring-red-400`;
            case 'success': return `${base} bg-green-600 focus:ring-green-400`;
            default: return `${base} bg-blue-600 hover:bg-blue-700 focus:ring-blue-400`;
        }
    };
    
    const getMessageClass = () => {
        const base = "text-xl font-medium break-all truncate";
        switch (status) {
            case 'error': return `${base} text-red-400`;
            case 'success': return `${base} text-white`;
            default: return `${base} text-gray-300`;
        }
    };

    return (
        <div 
            className="flex items-center h-screen w-full bg-[#1e1e1e] font-sans select-none p-2 gap-3"
        >
            <style>{`
                body { margin: 0; overflow: hidden; }
                @keyframes pulse-custom { 50% { opacity: .6; } }
                .animate-pulse-custom { animation: pulse-custom 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
            <button
              onClick={handleClick}
              disabled={status === 'processing'}
              aria-label="录音按钮"
              className={getButtonClass()}
            >
                {getIcon()}
            </button>
            <p className={getMessageClass()}>
                {message}
            </p>
        </div>
    );
};
