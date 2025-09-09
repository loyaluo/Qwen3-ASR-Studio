
import React from 'react';
import { ASRIcon } from './icons/ASRIcon';

export const Header: React.FC = () => {
  return (
    <header className="py-6 border-b border-gray-200">
      <div className="container mx-auto text-center flex flex-col items-center">
        <div className="flex items-center gap-4 mb-2">
            <ASRIcon className="w-12 h-12 text-sky-400" />
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-cyan-400">
                Qwen3-ASR Studio
            </h1>
        </div>
        <p className="text-md text-gray-500">
            Leveraging the Qwen3-ASR model, upload or record audio to get fast and accurate transcriptions.
        </p>
      </div>
    </header>
  );
};