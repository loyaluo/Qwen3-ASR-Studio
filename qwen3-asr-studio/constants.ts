
import { Language } from './types';

export const API_BASE_URL = 'https://qwen-qwen3-asr-demo.ms.show/gradio_api';
export const API_ENDPOINT = `${API_BASE_URL}/call/asr_inference`;

export const LANGUAGES = [
    { value: Language.AUTO, label: '自动检测' },
    { value: Language.ZH, label: '中文' },
    { value: Language.EN, label: '英语' },
    { value: Language.JA, label: '日语' },
    { value: Language.KO, label: '韩语' },
    { value: Language.DE, label: '德语' },
    { value: Language.FR, label: '法语' },
    { value: Language.ES, label: '西班牙语' },
    { value: Language.IT, label: '意大利语' },
    { value: Language.RU, label: '俄语' },
];
