import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { AudioFileIcon } from './icons/AudioFileIcon';

interface FileUploadProps {
  audioFile: File | null;
  setAudioFile: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ audioFile, setAudioFile }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      setAudioFile(files[0]);
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
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
    handleFileChange(e.dataTransfer.files);
  }, []);

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg h-48 transition-colors ${isDragging ? 'border-sky-500 bg-sky-50' : 'border-gray-300 bg-gray-50'}`}
    >
      <input
        id="file-upload"
        type="file"
        accept="audio/*"
        onChange={(e) => handleFileChange(e.target.files)}
        className="hidden"
      />
      {audioFile ? (
        <div className="text-center">
            <AudioFileIcon className="w-12 h-12 mx-auto text-sky-500 mb-2"/>
            <p className="font-semibold text-gray-800">{audioFile.name}</p>
            <p className="text-sm text-gray-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <button onClick={() => setAudioFile(null)} className="mt-3 text-sm text-red-600 hover:underline">
                移除文件
            </button>
        </div>
      ) : (
        <label htmlFor="file-upload" className="cursor-pointer text-center">
          <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-2"/>
          <p className="font-semibold text-gray-700">
            <span className="text-sky-500">点击上传</span> 或拖拽文件到此
          </p>
          <p className="text-xs text-gray-400">支持 WAV, MP3, FLAC 等格式</p>
        </label>
      )}
    </div>
  );
};