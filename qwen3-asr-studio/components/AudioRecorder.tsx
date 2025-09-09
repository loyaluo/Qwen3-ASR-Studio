import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';

interface AudioRecorderProps {
  setAudioFile: (file: File | null) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ setAudioFile }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setAudioFile(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioFile = new File([audioBlob], "录音.wav", { type: "audio/wav" });
          setAudioFile(audioFile);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setElapsedTime(0);
        timerRef.current = window.setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

      } catch (err) {
        console.error("Error accessing microphone:", err);
        setError("麦克风访问被拒绝。请在浏览器设置中允许访问麦克风。");
      }
    } else {
      setError("您的浏览器不支持录音功能。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg h-48 bg-gray-50">
      {isRecording ? (
        <div className="flex flex-col items-center gap-4">
            <div className="text-2xl font-mono text-sky-500">{formatTime(elapsedTime)}</div>
            <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-full transition-colors"
            >
                <StopIcon className="w-5 h-5"/>
                停止录制
            </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <button
            onClick={startRecording}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            <MicrophoneIcon className="w-5 h-5"/>
            开始录制
          </button>
          <p className="text-sm text-gray-500">点击开始录制音频。</p>
        </div>
      )}
      {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
    </div>
  );
};