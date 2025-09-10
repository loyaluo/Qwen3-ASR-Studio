import React, { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudio } from './services/gradioService';
import { Language } from './types';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { StopIcon } from './components/icons/StopIcon';
import { LoaderIcon } from './components/icons/LoaderIcon';

const channel = new BroadcastChannel('qwen3-asr-pip');

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const PipApp: React.FC = () => {
    type Status = 'idle' | 'recording' | 'processing' | 'error';
    const [status, setStatus] = useState<Status>('idle');
    const [transcription, setTranscription] = useState<string>('');
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<number | null>(null);

    const handleTranscription = async (audioFile: File) => {
        setStatus('processing');
        setTranscription('');
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
