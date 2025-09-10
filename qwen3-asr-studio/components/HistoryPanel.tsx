import React from 'react';
import type { HistoryItem } from '../types';
import { RestoreIcon } from './icons/RestoreIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { LanguageIcon } from './icons/LanguageIcon';

interface HistoryPanelProps {
  items: HistoryItem[];
  onRestore: (id: number) => void;
  onDelete: (id: number) => void;
  disabled?: boolean;
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ items, onRestore, onDelete, disabled }) => {
  return (
    <div className="mt-6 p-4 rounded-lg bg-base-200 border border-base-300">
      <h3 className="text-lg font-semibold text-content-100 mb-4">识别历史</h3>
      {items.length === 0 ? (
        <p className="text-center text-content-200">历史记录为空。</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {items.map((item) => (
            <div key={item.id} className="p-3 rounded-md bg-base-100 border border-base-300">
              <p className="text-sm text-content-100 break-words mb-2">
                {item.transcription.length > 80 ? `${item.transcription.substring(0, 80)}...` : item.transcription || '（无识别结果）'}
              </p>
              <div className="flex items-center justify-between text-xs text-content-200">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="truncate" title={item.fileName}>{item.fileName}</span>
                  <div className="flex items-center gap-2">
                     {item.detectedLanguage && (
                        <span className="flex items-center gap-1">
                            <LanguageIcon className="w-3 h-3" /> {item.detectedLanguage}
                        </span>
                     )}
                     <span>{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => onRestore(item.id)}
                    disabled={disabled}
                    title="恢复"
                    className="p-1 rounded-full hover:bg-base-300 disabled:opacity-50"
                  >
                    <RestoreIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    disabled={disabled}
                    title="删除"
                    className="p-1 rounded-full text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <DeleteIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
