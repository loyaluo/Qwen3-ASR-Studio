import React from 'react';

interface ExampleButtonsProps {
  onLoadExample: (id: number) => void;
  disabled?: boolean;
}

export const ExampleButtons: React.FC<ExampleButtonsProps> = ({ onLoadExample, disabled }) => {
  const commonButtonClasses = "w-full px-4 py-2 text-sm font-medium text-center transition-colors border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed";
  const activeClasses = "bg-base-200 border-base-300 text-content-100 hover:bg-base-300 hover:border-brand-primary focus:ring-brand-primary";
  
  return (
    <div className="p-4 rounded-lg bg-base-200 border border-base-300">
      <h3 className="mb-2 text-sm font-medium text-content-200">或试试示例音频：</h3>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => onLoadExample(0)} disabled={disabled} className={`${commonButtonClasses} ${activeClasses}`}>
          示例 1
        </button>
        <button onClick={() => onLoadExample(1)} disabled={disabled} className={`${commonButtonClasses} ${activeClasses}`}>
          示例 2
        </button>
        <button onClick={() => onLoadExample(2)} disabled={disabled} className={`${commonButtonClasses} ${activeClasses}`}>
          示例 3
        </button>
      </div>
    </div>
  );
};