import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { setCachedRecording } from '../services/cacheService';

interface AudioRecorderProps {
  onFileChange: (file: File | null) => void;
  onRecordingChange: (isRecording: boolean) => void;
  disabled?: boolean;
  onRecordingError: (message: string) => void;
}

export interface AudioRecorderHandle {
  stopRecording: () => void;
}

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioRecorder = forwardRef<AudioRecorderHandle, AudioRecorderProps>(({ onFileChange, onRecordingChange, disabled, onRecordingError }, ref) => {
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);


  useEffect(() => {
    onRecordingChange(recordingStatus === 'recording');
  }, [recordingStatus, onRecordingChange]);
  
  useEffect(() => {
    if (recordingStatus === 'recording' && canvasRef.current) {
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    }
  }, [recordingStatus]);

  const cleanupAudio = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    audioContextRef.current = null;
    
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  useEffect(() => {
    if (recordingStatus !== 'recording') {
        return;
    }

    const animationLoop = () => {
        if (!analyserRef.current || !canvasRef.current || !dataArrayRef.current) {
            return;
        }
        const analyser = analyserRef.current;
        const canvas = canvasRef.current;
        const dataArray = dataArrayRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        analyser.getByteTimeDomainData(dataArray);

        context.fillStyle = '#1f2937'; // bg-base-100
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.lineWidth = 2;
        context.strokeStyle = '#10b981'; // brand-primary
        context.beginPath();
        const sliceWidth = (canvas.width * 1.0) / analyser.fftSize;
        let x = 0;
        for (let i = 0; i < analyser.fftSize; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;
            if (i === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
            x += sliceWidth;
        }
        context.lineTo(canvas.width, canvas.height / 2);
        context.stroke();

        animationFrameIdRef.current = requestAnimationFrame(animationLoop);
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animationLoop);

    return () => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
    };
}, [recordingStatus]);

  const startTimer = () => {
    stopTimer();
    setRecordingTime(0);
    timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
    }, 1000);
  }

  const stopTimer = () => {
    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }
  }

  const handleStopRecording = useCallback(() => {
    if (recordingStatus !== 'recording' || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecordingStatus('idle');
    stopTimer();
    cleanupAudio();
  }, [recordingStatus, cleanupAudio]);

  useImperativeHandle(ref, () => ({
    stopRecording: handleStopRecording,
  }));

  const handleStartRecording = async () => {
    if (recordingStatus === 'recording' || !navigator.mediaDevices) {
        onRecordingError("您的浏览器不支持录音功能。");
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup Web Audio API for visualization
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;
        
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        source.connect(analyser);

        setRecordingStatus('recording');
        startTimer();
        
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        
        recorder.onstop = () => {
            const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            const fileExtension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
            const audioFile = new File([audioBlob], `recording-${new Date().toISOString()}.${fileExtension}`, { type: mimeType });
            
            // Cache the recording, but proceed with UI update regardless of cache success
            setCachedRecording(audioFile).catch(err => {
              console.error("Failed to cache recording:", err);
            });

            onFileChange(audioFile); // Update UI immediately

            audioChunksRef.current = [];
            stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();
    } catch (err) {
        console.error("Error accessing microphone:", err);
        setRecordingStatus('idle');
        onRecordingError("麦克风访问被拒绝或不可用。");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        onClick={recordingStatus === 'idle' ? handleStartRecording : handleStopRecording}
        disabled={disabled}
        className={`flex items-center justify-center w-36 h-14 px-4 py-2 font-semibold text-white transition-colors duration-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 ${
          recordingStatus === 'idle' 
            ? 'bg-brand-primary hover:bg-brand-secondary focus:ring-brand-primary' 
            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {recordingStatus === 'idle' ? (
          <MicrophoneIcon className="w-6 h-6 mr-2" />
        ) : (
          <StopIcon className="w-6 h-6 mr-2" />
        )}
        {recordingStatus === 'idle' ? '开始录音' : '停止录音'}
      </button>
      <p className="mt-4 text-2xl font-mono text-content-100 tracking-wider">
        {formatTime(recordingTime)}
      </p>
      {recordingStatus === 'recording' && (
        <div className="w-full mt-2 h-16 bg-base-100 rounded-md">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      )}
      {recordingStatus === 'recording' && <p className="text-sm text-brand-primary animate-pulse mt-1">正在录音...</p>}
    </div>
  );
});
