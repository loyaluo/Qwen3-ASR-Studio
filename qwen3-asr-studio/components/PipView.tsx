
import React, { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../services/gradioService';
import { Language } from '../types';

interface PipViewProps {
  onTranscriptionResult: (result: { text: string; copied: boolean; error?: string }) => void;
  theme: 'light' | 'dark';
  context: string;
  language: Language;
  enableItn: boolean;
}

export const PipView: React.FC<PipViewProps> = ({ onTranscriptionResult, theme, context, language, enableItn }) => {
    type Status = 'idle' | 'recording' | 'processing' | 'success' | 'error';
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState<string>('点击开始录音');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleTranscription = useCallback(async (audioFile: File) => {
        setStatus('processing');
        setMessage('正在识别...');
        try {
            // Signal isn't used here as there's no cancel button, but the service expects it.
            const controller = new AbortController();
            const result = await transcribeAudio(audioFile, context, language, enableItn, () => {}, controller.signal);
            if (result.transcription) {
                setMessage(result.transcription);
                try {
                    await navigator.clipboard.writeText(result.transcription);
                    onTranscriptionResult({ text: result.transcription, copied: true });
                } catch (copyError) {
                    console.error('Failed to copy text from PiP:', copyError);
                    onTranscriptionResult({ text: result.transcription, copied: false, error: '复制失败' });
                }
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
                const audioFile = new File([audioBlob], `recording.${mimeType.split('/')[1]}`, { type: mimeType });
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

    const getStatusDotClass = () => {
        const base = "w-3 h-3 rounded-full flex-shrink-0";
        switch (status) {
            case 'recording':
                return `${base} bg-red-500 animate-pulsing-dot`;
            case 'processing':
                 return `${base} bg-blue-500 animate-pulsing-dot`;
            case 'error':
                return `${base} bg-red-500`;
            case 'success':
                return `${base} bg-brand-primary`;
            case 'idle':
            default:
                return `${base} bg-brand-primary`;
        }
    };

    return (
        <div 
            className="flex items-center h-screen w-full bg-base-100 font-sans text-content-100 select-none cursor-pointer px-4"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={message}
        >
            <div className={getStatusDotClass()}></div>
            <p className="ml-3 text-lg font-medium break-all truncate">
                {message}
            </p>
        </div>
    );
};
