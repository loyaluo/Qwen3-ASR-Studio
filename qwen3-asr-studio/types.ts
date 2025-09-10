export enum Language {
  AUTO = "auto",
  ENGLISH = "en",
  CHINESE = "zh",
  JAPANESE = "ja",
  KOREAN = "ko",
  FRENCH = "fr",
  GERMAN = "de",
  SPANISH = "es",
}

export enum CompressionLevel {
  ORIGINAL = 'original',
  MEDIUM = 'medium',
  MINIMUM = 'minimum',
}

export interface HistoryItem {
  id: number;
  fileName: string;
  transcription: string;
  detectedLanguage: string;
  context: string;
  timestamp: number;
  audioFile: File;
}

export interface NoteItem {
  id: number;
  content: string;
  timestamp: number;
}
