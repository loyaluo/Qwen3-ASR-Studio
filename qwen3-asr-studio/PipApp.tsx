import React, { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudio } from './services/gradioService';
import { Language } from './types';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { StopIcon } from './components/icons/StopIcon';
import { LoaderIcon } from './components/icons/LoaderIcon';

const channel = new BroadcastChannel('qwen3-asr-pip');

export const PipApp: React.FC = () => {
    type Status = 'idle' | 'recording' | 'processing' | 'error';
    const [status, setStatus] = useState<Status>('idle');
    const [transcription, setTranscription] = useState<string>('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleTranscription = async (audioFile: File) => {
        setStatus('processing');
        try {
            const result = await transcribeAudio(audioFile, '', Language.AUTO, true, () => {});
            if (result.transcription) {
                setTranscription(result.transcription);
                channel.postMessage({ type: 'copy', text: result.transcription });
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
    }, []);

    const startRecording = async () => {
        setTranscription('');
        setStatus('recording'); // Optimistically set to recording
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

    // Auto-reset from error state after a delay
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
        const base = "flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-wait";
        switch (status) {
            case 'recording': return `${base} bg-red-600 hover:bg-red-700 focus:ring-red-500`;
            case 'processing': return `${base} bg-base-300`;
            case 'error': return `${base} bg-red-600 focus:ring-red-500`;
            default: return `${base} bg-brand-primary hover:bg-brand-secondary focus:ring-brand-primary`;
        }
    };

    const getResultClasses = () => {
        const base = "flex-grow h-full flex items-center p-4 rounded-lg bg-base-200 border";
        switch (status) {
            case 'error': return `${base} border-red-500 text-red-400`;
            default: return `${base} border-base-300 text-content-100`;
        }
    };

    const getResultContent = () => {
        if (status === 'processing') {
            return "正在识别...";
        }
        if (transcription) {
            return transcription;
        }
        return "点击左侧按钮开始录音";
    };

    return (
        <div className="flex h-screen w-full items-center p-3 gap-3 bg-base-100 font-sans select-none">
            <button
                onClick={handleRecordClick}
                disabled={status === 'processing'}
                className={getButtonClasses()}
                aria-label={status === 'recording' ? '停止录音' : '开始录音'}
            >
                {getButtonContent()}
            </button>
            <div className={getResultClasses()}>
                <p className="text-lg w-full overflow-hidden whitespace-nowrap text-ellipsis" title={transcription}>
                   {getResultContent()}
                </p>
            </div>
        </div>
    );
};
