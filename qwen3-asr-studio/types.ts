export enum Language {
    AUTO = 'auto',
    ZH = 'zh',
    EN = 'en',
    JA = 'ja',
    KO = 'ko',
    DE = 'de',
    FR = 'fr',
    ES = 'es',
    IT = 'it',
    RU = 'ru',
}

export enum InputMode {
    UPLOAD = 'upload',
    RECORD = 'record',
}

export interface AppState {
    inputMode: InputMode;
    audioFile: File | null;
    context: string;
    language: Language;
    enableITN: boolean;
    isLoading: boolean;
    statusMessage: string;
    transcription: string | null;
    detectedLanguage: string | null;
    error: string | null;
}

export interface TranscriptionResult {
    transcription: string;
    detectedLanguage: string | null;
}

// Types for Gradio SSE stream
export interface GradioMessage {
    msg: 'process_starts' | 'process_generating' | 'process_completed' | 'progress' | 'log' | 'heartbeat' | 'unexpected_error';
    output?: {
        data: [string, string | null];
        is_generating: boolean;
        duration: number;
    };
    progress_data?: {
        progress: number | null;
        desc?: string;
    }[];
    success?: boolean;
    log?: string;
    level?: 'info' | 'warning' | 'error';
}
