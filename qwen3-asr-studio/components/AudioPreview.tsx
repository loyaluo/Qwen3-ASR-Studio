import React, { useState, useEffect } from 'react';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { CloseIcon } from './icons/CloseIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface AudioPreviewProps {
  file: File | null;
  onClear: () => void;
  disabled?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const AudioPreview: React.FC<AudioPreviewProps> = ({ file, onClear, disabled }) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);

      return () => URL.revokeObjectURL(url);
    } else {
      setAudioSrc(null);
    }
  }, [file]);

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClear();
  };

  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!file || !audioSrc) return;

    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="p-4 rounded-lg bg-base-200 border border-base-300 min-h-[108px] flex flex-col justify-center">
      {file && audioSrc ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <SoundWaveIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
              <div className="flex items-baseline gap-2 min-w-0">
                <p className="text-sm font-medium text-content-100 truncate" title={file.name}>{file.name}</p>
                <span className="text-xs text-content-200 flex-shrink-0">{formatFileSize(file.size)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleDownload} 
                disabled={disabled} 
                className="p-1 rounded-full text-content-200 hover:bg-base-300 hover:text-content-100 disabled:opacity-50"
                title="下载音频"
                aria-label="下载音频"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={handleClear} 
                disabled={disabled} 
                className="p-1 rounded-full text-content-200 hover:bg-base-300 hover:text-content-100 disabled:opacity-50"
                title="清除音频"
                aria-label="清除音频"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <audio controls src={audioSrc} className="w-full h-10" />
        </div>
      ) : (
        <div className="text-center text-content-200">
            <p>音频预览</p>
            <p className="text-sm">上传或录制后将在此处显示</p>
        </div>
      )}
    </div>
  );
};
