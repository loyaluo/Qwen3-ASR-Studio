import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-4 mb-2">
        <LogoIcon className="w-12 h-12 text-brand-primary" />
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-content-100">
          Qwen3-ASR-Studio
        </h1>
      </div>
    </header>
  );
};
