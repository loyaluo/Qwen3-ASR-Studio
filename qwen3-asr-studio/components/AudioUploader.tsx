import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { AudioWaveIcon } from './icons/AudioWaveIcon';
import { CloseIcon } from './icons/CloseIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';

interface AudioUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onRecordingChange: (isRecording: boolean) => void;
  disabled?: boolean;
  onRecordingError: (message: string) => void;
}

export interface AudioUploaderHandle {
  stopRecording: () => void;
}

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const TabButton: React.FC<{ title: string; active: boolean; onClick: () => void; disabled?: boolean }> = ({ title, active, onClick, disabled }) => {
    const baseClasses = "px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none";
    const activeClasses = "text-brand-primary border-b-2 border-brand-primary";
    const inactiveClasses = "text-content-200 hover:text-content-100 border-b-2 border-transparent";
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${active ? activeClasses : inactiveClasses} disabled:opacity-50 disabled:cursor-not-allowed`}>
            {title}
        </button>
    )
}

export const AudioUploader = forwardRef<AudioUploaderHandle, AudioUploaderProps>(({ file, onFileChange, onRecordingChange, disabled, onRecordingError }, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
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
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioSrc(null);
    }
  }, [file]);

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
        const sliceWidth = (canvas.width * 1.0) / analyser.frequencyBinCount;
        let x = 0;
        for (let i = 0; i < analyser.frequencyBinCount; i++) {
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
        analyser.fftSize = 256;
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
            const audioFile = new File([audioBlob], `recording.${mimeType.split('/')[1]}`, { type: mimeType });
            onFileChange(audioFile);
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

  const handleFileSelect = useCallback((selectedFile: File | undefined) => {
    if (selectedFile && selectedFile.type.startsWith('audio/')) {
      onFileChange(selectedFile);
    }
  }, [onFileChange]);

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const droppedFile = e.dataTransfer.files?.[0];
    handleFileSelect(droppedFile);
  }, [disabled, handleFileSelect]);

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const onClearFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onFileChange(null);
    if(inputRef.current) {
        inputRef.current.value = "";
    }
    if(mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        handleStopRecording();
    }
    setRecordingTime(0);
  };

  const baseClasses = "relative flex flex-col items-center justify-center w-full p-6 transition-all duration-300 border-2 border-dashed rounded-lg cursor-pointer min-h-[190px]";
  const disabledClasses = "bg-base-300 opacity-60 cursor-not-allowed";
  const idleClasses = "border-base-300 hover:border-brand-primary hover:bg-base-200";
  const draggingClasses = "border-brand-primary bg-base-200 ring-4 ring-brand-primary ring-opacity-30";
  
  if (file && audioSrc) {
    return (
      <div className="p-4 space-y-3 rounded-lg bg-base-200 border border-base-300">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
                <AudioWaveIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
                <p className="text-sm font-medium text-content-100 truncate" title={file.name}>{file.name}</p>
            </div>
            <button onClick={onClearFile} disabled={disabled} className="p-1 rounded-full text-content-200 hover:bg-base-300 hover:text-content-100 disabled:opacity-50">
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>
        <audio controls src={audioSrc} className="w-full h-10" />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-base-200 border border-base-300">
        <div className="flex border-b border-base-300 px-2">
            <TabButton title="上传文件" active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} disabled={disabled} />
            <TabButton title="录制音频" active={activeTab === 'record'} onClick={() => setActiveTab('record')} disabled={disabled} />
        </div>
        <div className="p-4">
            {activeTab === 'upload' && (
                 <div
                    className={`${baseClasses} ${disabled ? disabledClasses : isDragging ? draggingClasses : idleClasses}`}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onClick={onButtonClick}
                    >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0])}
                        disabled={disabled}
                    />
                    <div className="flex flex-col items-center justify-center text-center">
                        <UploadIcon className="w-12 h-12 mb-3 text-content-200" />
                        <p className="font-semibold text-content-100">
                        点击上传或拖拽文件
                        </p>
                        <p className="text-sm text-content-200">支持 WAV, MP3, FLAC 等格式</p>
                    </div>
                </div>
            )}
            {activeTab === 'record' && (
                <div className="flex flex-col items-center justify-center min-h-[190px]">
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
            )}
        </div>
    </div>
  );
});