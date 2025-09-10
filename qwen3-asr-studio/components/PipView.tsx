import React, { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../services/gradioService';
import { Language } from '../types';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CloseIcon } from './icons/CloseIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { StopIcon } from './icons/StopIcon';
import { CopyIcon } from './icons/CopyIcon';

interface PipViewProps {
  onTranscriptionResult: (result: {
    transcription: string;
    detectedLanguage: string;
    audioFile: File;
  }) => void;
  theme: 'light' | 'dark';
  context: string;
  language: Language;
  enableItn: boolean;
}

export const PipView: React.FC<PipViewProps> = ({ onTranscriptionResult, theme, context, language, enableItn }) => {
    type Status = 'idle' | 'recording' | 'processing' | 'success' | 'copied' | 'error';
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState<string>('点击开始录音');
    const transcriptionResultRef = useRef<string>('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleTranscription = useCallback(async (audioFile: File) => {
        setStatus('processing');
        setMessage('正在识别...');
        try {
            const controller = new AbortController();
            const result = await transcribeAudio(audioFile, context, language, enableItn, () => {}, controller.signal);

            onTranscriptionResult({
                transcription: result.transcription,
                detectedLanguage: result.detectedLanguage,
                audioFile,
            });

            if (result.transcription) {
                transcriptionResultRef.current = result.transcription;
                setMessage(result.transcription);
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
    }, [context, language, enableItn, onTranscriptionResult]);
    
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const startRecording = async () => {
        setMessage('正在聆听...');
        setStatus('recording');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                }
            });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

                const now = new Date();
                const year = now.getFullYear();
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const day = now.getDate().toString().padStart(2, '0');
                const hours = now.getHours().toString().padStart(2, '0');
                const minutes = now.getMinutes().toString().padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}_${hours}-${minutes}`;
                const fileExtension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
                const audioFile = new File([audioBlob], `pip-recording-${formattedDate}.${fileExtension}`, { type: mimeType });

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
        } else if (status === 'idle' || status === 'error') {
            startRecording();
        } else if (status === 'success') {
            navigator.clipboard.writeText(transcriptionResultRef.current).then(() => {
                setStatus('copied');
                setMessage('已复制到剪贴板!');
                setTimeout(() => {
                    setStatus('idle');
                    setMessage('点击开始录音');
                    transcriptionResultRef.current = '';
                }, 2000);
            }).catch(err => {
                console.error("Copy failed in PiP:", err);
                setMessage('复制失败，请重试');
                setStatus('error');
            });
        }
        // Do nothing if processing or copied
    };

    const getIcon = () => {
        const iconClass = "w-7 h-7 text-white";
        switch (status) {
            case 'idle':
                return <MicrophoneIcon className={iconClass} />;
            case 'recording':
                return <StopIcon className={iconClass} />;
            case 'processing':
                return <LoaderIcon className="text-white w-7 h-7" />;
            case 'success':
                 return <CopyIcon className={iconClass} />;
            case 'copied':
                 return <CheckIcon className={iconClass} />;
            case 'error':
                 return <CloseIcon className={iconClass} />;
            default:
                return <MicrophoneIcon className={iconClass} />;
        }
    };

    const getIconContainerClass = () => {
        const base = "p-2 rounded-md transition-colors duration-300 flex-shrink-0";
        switch (status) {
            case 'recording': return `${base} bg-red-600 animate-pulse-custom`;
            case 'error': return `${base} bg-red-600`;
            case 'success': return `${base} bg-blue-600`;
            case 'copied': return `${base} bg-green-600`;
            default: return `${base} bg-brand-primary`;
        }
    };

    return (
        <div 
            className="flex items-center h-screen w-full bg-base-100 font-sans text-content-100 select-none cursor-pointer p-4"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={message}
        >
            <style>{`
                @keyframes pulse-custom { 50% { opacity: .6; } }
                .animate-pulse-custom { animation: pulse-custom 2s cubic-bezier(0.4, 0.6, 1) infinite; }
            `}</style>
            <div className={getIconContainerClass()}>
                {getIcon()}
            </div>
            <p className={`ml-4 text-2xl font-semibold break-all truncate ${status === 'idle' || status === 'recording' || status === 'processing' ? 'text-content-200' : 'text-content-100'}`}>
                {message}
            </p>
        </div>
    );
};