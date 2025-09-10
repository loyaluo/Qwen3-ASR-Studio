import React, { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudio } from './services/gradioService';
import { Language } from './types';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { StopIcon } from './components/icons/StopIcon';
import { LoaderIcon } from './components/icons/LoaderIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { CameraIcon } from './components/icons/CameraIcon';

type RecordingStatus = 'idle' | 'recording' | 'processing' | 'copied' | 'error';
type ScreenshotStatus = 'idle' | 'capturing' | 'copied' | 'error';

export const PipApp: React.FC = () => {
    const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
    const [screenshotStatus, setScreenshotStatus] = useState<ScreenshotStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleTranscription = async (audioFile: File) => {
        setRecordingStatus('processing');
        try {
            const result = await transcribeAudio(audioFile, '', Language.AUTO, true);
            if (result.transcription) {
                await navigator.clipboard.writeText(result.transcription);
                setRecordingStatus('copied');
            } else {
                setErrorMessage('未能识别到任何内容。');
                setRecordingStatus('error');
            }
        } catch (err) {
            console.error('Transcription error:', err);
            const msg = err instanceof Error ? err.message : '转录过程中发生未知错误。';
            setErrorMessage(msg);
            setRecordingStatus('error');
        }
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const startRecording = async () => {
        setErrorMessage('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setRecordingStatus('recording');
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
            setErrorMessage("麦克风访问被拒绝或不可用。");
            setRecordingStatus('error');
        }
    };
    
    const handleRecordClick = () => {
        if (recordingStatus === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    };
    
    const handleScreenshot = async () => {
        setScreenshotStatus('capturing');
        setErrorMessage('');
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const videoTrack = stream.getVideoTracks()[0];
            const video = document.createElement('video');

            await new Promise<void>((resolve, reject) => {
                video.onloadedmetadata = () => {
                    video.play().then(() => resolve()).catch(reject);
                };
                video.srcObject = stream;
            });

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            videoTrack.stop();
            
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (blob) {
                await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
                setScreenshotStatus('copied');
            } else {
                throw new Error('Canvas toBlob failed');
            }
        } catch (err) {
            console.error("Screenshot error:", err);
            if (err.name !== 'NotAllowedError') {
                setErrorMessage("截图失败。");
                setScreenshotStatus('error');
            } else {
                setScreenshotStatus('idle');
            }
        }
    };

    useEffect(() => {
        if (recordingStatus === 'copied' || recordingStatus === 'error') {
            const timer = window.setTimeout(() => {
                setRecordingStatus('idle');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [recordingStatus]);

    useEffect(() => {
        if (screenshotStatus === 'copied' || screenshotStatus === 'error') {
            const timer = window.setTimeout(() => {
                setScreenshotStatus('idle');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [screenshotStatus]);
    
    useEffect(() => {
        if (recordingStatus === 'idle' && screenshotStatus === 'idle') {
            setErrorMessage('');
        }
    }, [recordingStatus, screenshotStatus]);

    const getRecordingContent = () => {
        switch (recordingStatus) {
            case 'idle': return <><MicrophoneIcon className="w-12 h-12" /><span className="mt-2 text-lg">录音</span></>;
            case 'recording': return <><StopIcon className="w-12 h-12" /><span className="mt-2 text-lg animate-pulse">停止</span></>;
            case 'processing': return <><LoaderIcon className="w-12 h-12" /><span className="mt-2 text-lg">识别中</span></>;
            case 'copied': return <><CheckIcon className="w-12 h-12 text-brand-primary" /><span className="mt-2 text-lg text-brand-primary">已复制</span></>;
            case 'error': return <><MicrophoneIcon className="w-12 h-12 text-red-500" /><span className="mt-2 text-lg text-red-500">错误</span></>;
        }
    };
    
    const getScreenshotContent = () => {
        switch (screenshotStatus) {
            case 'idle': return <><CameraIcon className="w-12 h-12" /><span className="mt-2 text-lg">截图</span></>;
            case 'capturing': return <><LoaderIcon className="w-12 h-12" /><span className="mt-2 text-lg">截图中</span></>;
            case 'copied': return <><CheckIcon className="w-12 h-12 text-brand-primary" /><span className="mt-2 text-lg text-brand-primary">已复制</span></>;
            case 'error': return <><CameraIcon className="w-12 h-12 text-red-500" /><span className="mt-2 text-lg text-red-500">错误</span></>;
        }
    };
    
    const canClickRecord = screenshotStatus === 'idle';
    const canClickScreenshot = recordingStatus === 'idle';

    return (
        <div className="flex flex-col h-screen bg-base-100 text-content-100 font-sans p-2 select-none">
            <div 
                onClick={canClickRecord ? handleRecordClick : undefined}
                className={`flex-1 flex flex-col items-center justify-center m-1 rounded-lg transition-all duration-200 border
                    ${recordingStatus === 'recording' ? 'bg-red-600/20 border-red-500' : 'bg-base-200 border-base-300'}
                    ${!canClickRecord ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-base-300'}
                `}
                aria-disabled={!canClickRecord}
            >
                {getRecordingContent()}
            </div>
            <div 
                onClick={canClickScreenshot ? handleScreenshot : undefined}
                className={`flex-1 flex flex-col items-center justify-center m-1 rounded-lg transition-all duration-200 border bg-base-200 border-base-300
                    ${!canClickScreenshot ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-base-300'}
                `}
                 aria-disabled={!canClickScreenshot}
            >
                {getScreenshotContent()}
            </div>
             <div className="h-6 text-center text-sm p-1 text-red-500 truncate" title={errorMessage}>
                {(recordingStatus === 'error' || screenshotStatus === 'error') && errorMessage}
            </div>
        </div>
    );
};
