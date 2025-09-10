
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { FileUpload, type FileUploadHandle } from './FileUpload';
import { AudioRecorder, type AudioRecorderHandle } from './AudioRecorder';

interface AudioUploaderProps {
  onFileChange: (file: File | null) => void;
  onRecordingChange: (isRecording: boolean) => void;
  disabled?: boolean;
  onRecordingError: (message: string) => void;
  theme: 'light' | 'dark';
}

export interface AudioUploaderHandle {
  stopRecording: () => void;
  startRecording: () => void;
  clearInput: () => void;
}

export const AudioUploader = forwardRef<AudioUploaderHandle, AudioUploaderProps>(({ onFileChange, onRecordingChange, disabled, onRecordingError, theme }, ref) => {
  const recorderRef = useRef<AudioRecorderHandle>(null);
  const uploaderRef = useRef<FileUploadHandle>(null);

  useImperativeHandle(ref, () => ({
    stopRecording: () => {
      recorderRef.current?.stopRecording();
    },
    startRecording: () => {
      recorderRef.current?.startRecording();
    },
    clearInput: () => {
      uploaderRef.current?.clear();
    }
  }));

  const handleFileSelect = (selectedFile: File) => {
    onFileChange(selectedFile);
  };
  
  return (
    <div className="p-4 rounded-lg bg-base-200 border border-base-300 space-y-4">
        <FileUpload 
          ref={uploaderRef}
          onFileSelect={handleFileSelect} 
          disabled={disabled} 
        />
        <div className="relative flex items-center">
            <div className="flex-grow border-t border-base-300"></div>
            <span className="flex-shrink mx-4 text-content-200">或</span>
            <div className="flex-grow border-t border-base-300"></div>
        </div>
        <div className="relative flex flex-col items-center justify-center w-full p-6 text-center transition-all duration-300 border-2 border-dashed rounded-lg border-base-300">
          <AudioRecorder 
            ref={recorderRef}
            onFileChange={onFileChange}
            onRecordingChange={onRecordingChange}
            disabled={disabled}
            onRecordingError={onRecordingError}
            theme={theme}
          />
        </div>
    </div>
  );
});
