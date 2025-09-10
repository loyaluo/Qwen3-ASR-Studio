import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { AudioWaveIcon } from './icons/AudioWaveIcon';
import { CloseIcon } from './icons/CloseIcon';
import { FileUpload, type FileUploadHandle } from './FileUpload';
import { AudioRecorder, type AudioRecorderHandle } from './AudioRecorder';

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

export const AudioUploader = forwardRef<AudioUploaderHandle, AudioUploaderProps>(({ file, onFileChange, onRecordingChange, disabled, onRecordingError }, ref) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const recorderRef = useRef<AudioRecorderHandle>(null);
  const uploaderRef = useRef<FileUploadHandle>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      
      if (file.name.startsWith('recording-')) {
          setActiveTab('record');
      } else {
          setActiveTab('upload');
      }

      return () => URL.revokeObjectURL(url);
    } else {
      setAudioSrc(null);
    }
  }, [file]);

  useImperativeHandle(ref, () => ({
    stopRecording: () => {
      recorderRef.current?.stopRecording();
    },
  }));

  const handleFileSelect = (selectedFile: File) => {
    onFileChange(selectedFile);
  };

  const onClearFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onFileChange(null);
    uploaderRef.current?.clear();
  };
  
  const activeTabClass = "flex-1 px-4 py-3 text-sm font-semibold text-center border-b-2 sm:text-base text-brand-primary border-brand-primary focus:outline-none";
  const inactiveTabClass = "flex-1 px-4 py-3 text-sm font-semibold text-center text-content-200 border-b-2 border-transparent sm:text-base hover:bg-base-300 hover:text-content-100 focus:outline-none rounded-t-md";

  return (
    <div className="p-4 rounded-lg bg-base-200 border border-base-300">
      {file && audioSrc ? (
        <div className="space-y-3">
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
      ) : (
        <div>
          <div className="flex mb-4 border-b border-base-300">
            <button onClick={() => setActiveTab('upload')} disabled={disabled} className={activeTab === 'upload' ? activeTabClass : inactiveTabClass}>
              上传文件
            </button>
            <button onClick={() => setActiveTab('record')} disabled={disabled} className={activeTab === 'record' ? activeTabClass : inactiveTabClass}>
              录制音频
            </button>
          </div>
          <div className="min-h-[220px] flex flex-col justify-center">
            {activeTab === 'upload' && (
              <FileUpload 
                ref={uploaderRef}
                onFileSelect={handleFileSelect} 
                disabled={disabled} 
              />
            )}
            {activeTab === 'record' && (
              <AudioRecorder 
                ref={recorderRef}
                onFileChange={onFileChange}
                onRecordingChange={onRecordingChange}
                disabled={disabled}
                onRecordingError={onRecordingError}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
});
