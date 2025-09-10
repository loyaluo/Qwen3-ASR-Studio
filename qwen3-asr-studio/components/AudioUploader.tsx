
import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { FileUpload, type FileUploadHandle } from './FileUpload';
import { AudioRecorder, type AudioRecorderHandle } from './AudioRecorder';
import { UploadIcon } from './icons/UploadIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('record');
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
    <div className="p-4 rounded-lg bg-base-200 border border-base-300">
      {/* Tab switcher for narrow screens */}
      <div className="md:hidden" role="tablist" aria-label="Audio input method">
        <div className="flex -mx-4 -mt-4 mb-4 border-b border-base-300">
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 text-center font-medium transition-colors ${activeTab === 'record' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-content-200 hover:bg-base-300/50'}`}
            aria-selected={activeTab === 'record'}
            role="tab"
          >
            <MicrophoneIcon className="w-5 h-5" />
            <span>录音</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 text-center font-medium transition-colors ${activeTab === 'upload' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-content-200 hover:bg-base-300/50'}`}
            aria-selected={activeTab === 'upload'}
            role="tab"
          >
            <UploadIcon className="w-5 h-5" />
            <span>文件上传</span>
          </button>
        </div>
      </div>
    
      <div className="space-y-4">
        <div className={activeTab === 'upload' ? 'block' : 'hidden md:block'} role="tabpanel">
          <FileUpload 
            ref={uploaderRef}
            onFileSelect={handleFileSelect} 
            disabled={disabled} 
          />
        </div>

        <div className="relative items-center hidden md:flex">
            <div className="flex-grow border-t border-base-300"></div>
            <span className="flex-shrink mx-4 text-content-200">或</span>
            <div className="flex-grow border-t border-base-300"></div>
        </div>
        
        <div className={activeTab === 'record' ? 'block' : 'hidden md:block'} role="tabpanel">
          <div className="relative flex flex-col items-center justify-center w-full text-center transition-all duration-300 md:p-6 md:border-2 md:border-dashed md:rounded-lg md:border-base-300">
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
      </div>
    </div>
  );
});
