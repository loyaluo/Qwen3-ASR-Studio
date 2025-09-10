
import React, { useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-5 right-5 w-full max-w-sm p-4 text-white bg-red-600 rounded-lg shadow-lg flex items-start justify-between animate-fade-in-up">
      <p className="flex-grow pr-4">{message}</p>
      <button onClick={onClose} className="p-1 -m-1 rounded-full hover:bg-red-700">
        <CloseIcon className="w-5 h-5" />
      </button>
      <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
