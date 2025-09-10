
import React, { useState, useEffect } from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CloseIcon } from './icons/CloseIcon';
import { LoaderIcon } from './icons/LoaderIcon';

type PipStatus = 'idle' | 'recording' | 'processing' | 'success' | 'error';

interface PipState {
  status: PipStatus;
  message: string;
}

export const PipView: React.FC = () => {
    const [state, setState] = useState<PipState>({ status: 'idle', message: '点击开始录音' });

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window.opener) return;
            const data = event.data;
            if (data && data.type === 'APP_STATE_UPDATE') {
                setState(data.payload);
            }
        };

        window.addEventListener('message', handleMessage);
        
        // Notify opener that PiP is ready
        window.opener?.postMessage({ type: 'PIP_READY' }, '*');

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const handleClick = () => {
        if (state.status === 'processing') return;
        window.opener?.postMessage({ type: 'PIP_ACTION', payload: 'toggle_recording' }, '*');
    };

    const getIcon = () => {
        const iconClass = "w-7 h-7 text-white"; // Text inside colored box should be white for contrast
        switch (state.status) {
            case 'idle':
            case 'recording':
                return <MicrophoneIcon className={iconClass} />;
            case 'processing':
                return <LoaderIcon className="text-white w-7 h-7" />;
            case 'success':
                 return <CheckIcon className={iconClass} />;
            case 'error':
                 return <CloseIcon className={iconClass} />;
            default:
                return <MicrophoneIcon className={iconClass} />;
        }
    };

    const getIconContainerClass = () => {
        const base = "p-2 rounded-md transition-colors duration-300 flex-shrink-0";
        switch (state.status) {
            case 'recording': return `${base} bg-brand-primary animate-pulse-custom`;
            case 'error': return `${base} bg-red-600`;
            case 'success': return `${base} bg-green-600`;
            default: return `${base} bg-brand-primary`;
        }
    };

    return (
        <div 
            className="flex items-center h-screen w-full bg-base-100 font-sans text-content-100 select-none cursor-pointer p-4"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={state.message}
        >
            <style>{`
                @keyframes pulse-custom { 50% { opacity: .6; } }
                .animate-pulse-custom { animation: pulse-custom 2s cubic-bezier(0.4, 0.6, 1) infinite; }
            `}</style>
            <div className={getIconContainerClass()}>
                {getIcon()}
            </div>
            <p className={`ml-4 text-2xl font-semibold break-all truncate ${state.status === 'success' || state.status === 'error' ? 'text-content-100' : 'text-content-200'}`}>
                {state.message}
            </p>
        </div>
    );
};
