import React from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { PipIcon } from './icons/PipIcon';

export const Header: React.FC = () => {
  const handlePipClick = () => {
    window.open(
        '/pip.html', 
        'Qwen3-ASR-Studio-Input-Mode', 
        'width=380,height=520,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=no'
    );
  };

  return (
    <header className="flex items-center justify-between">
      <div className="w-16"></div>
      <div className="flex items-center justify-center gap-4">
        <LogoIcon className="w-12 h-12 text-brand-primary" />
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-content-100">
          Qwen3-ASR-Studio
        </h1>
      </div>
      <div className="w-16 flex justify-end">
        <button
          onClick={handlePipClick}
          title="输入法模式 (画中画)"
          aria-label="打开输入法模式"
          className="p-2 rounded-full text-content-200 hover:bg-base-200 hover:text-content-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          <PipIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};