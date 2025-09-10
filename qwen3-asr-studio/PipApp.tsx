import React, { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from './services/gradioService';
import { Language } from './types';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { StopIcon } from './components/icons/StopIcon';
import { LoaderIcon } from './components/icons/LoaderIcon';
import { CheckIcon } from './components/icons/CheckIcon';

type Status = 'idle' | 'recording' | 'processing' | 'error' | 'copied';

export const PipApp: React.FC = () => {
    const [status, setStatus] = useState<Status>('idle');
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState('');
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleTranscription = async (audioFile: File) => {
        setStatus('processing');
        setTranscription('');
        setError('');
        try {
            const result = await transcribeAudio(audioFile, '', Language.AUTO, true);
            if (result.transcription) {
                setTranscription(result.transcription);
                await navigator.clipboard.writeText(result.transcription);
                setStatus('copied');
                setTimeout(() => setStatus('idle'), 2000);
            } else {
                setTranscription('');
                setError('未能识别到任何内容。');
                setStatus('error');
            }
        } catch (err) {
            console.error('Transcription error:', err);
            const errorMessage = err instanceof Error ? err.message : '转录过程中发生未知错误。';
            setError(errorMessage);
            setStatus('error');
        }
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const startRecording = async () => {
        if (status === 'recording') return;
        setError('');
        setTranscription('');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setStatus('recording');
            
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
            setError("麦克风访问被拒绝或不可用。");
            setStatus('error');
        }
    };

    const getStatusMessage = () => {
        switch (status) {
            case 'recording': return <p className="text-center text-brand-primary animate-pulse">正在录音...</p>;
            case 'processing': return <p className="text-center text-content-200">正在识别...</p>;
            case 'copied': return (
                <div className="flex items-center justify-center text-brand-primary">
                    <CheckIcon className="w-5 h-5 mr-1" />
                    <span>已复制</span>
                </div>
            );
            case 'error': return <p className="text-center text-red-500 truncate" title={error}>{error}</p>;
            case 'idle':
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-base-100 text-content-100 font-sans p-4">
            <header className="flex items-center justify-between mb-2 h-6">
                <h1 className="text-lg font-bold">输入法模式</h1>
                <div className="text-sm">{getStatusMessage()}</div>
            </header>

            <div className="flex-grow p-3 rounded-lg bg-base-200 border border-base-300 overflow-y-auto">
                {transcription || status === 'processing' ? (
                    status === 'processing' ? (
                        <div className="flex flex-col items-center justify-center h-full text-content-200">
                            <LoaderIcon className="w-10 h-10 text-brand-primary mb-3" />
                            <p>正在处理音频...</p>
                        </div>
                    ) : (
                        <p className="text-content-100 whitespace-pre-wrap">{transcription}</p>
                    )
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-content-200">点击下方按钮开始录音</p>
                    </div>
                )}
            </div>

            <div className="flex justify-center items-center pt-6 pb-2">
                <button
                    onClick={status === 'recording' ? stopRecording : startRecording}
                    disabled={status === 'processing' || status === 'copied'}
                    aria-label={status === 'recording' ? '停止录音' : '开始录音'}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg text-white focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed
                        ${status === 'recording' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-brand-primary hover:bg-brand-secondary focus:ring-brand-primary'}
                    `}
                >
                    {status === 'processing' ? 
                        <LoaderIcon className="w-10 h-10" /> :
                        status === 'recording' ? 
                        <StopIcon className="w-8 h-8" /> :
                        <MicrophoneIcon className="w-8 h-8" />
                    }
                </button>
            </div>
        </div>
    );
};