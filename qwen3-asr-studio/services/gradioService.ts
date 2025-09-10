
import { Client } from "@gradio/client";
import type { GradioClient, PredictReturn } from "@gradio/client";
import { Language } from "../types";

const SPACE_ID = "Qwen/Qwen3-ASR-Demo";
let client: Promise<GradioClient>;

async function getClient() {
  if (!client) {
    client = Client.connect(SPACE_ID);
  }
  return client;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000;
const API_URL = 'https://c0rpr74ughd0-deploy.space.z.ai/api/asr-inference';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove "data:*/*;base64," prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};


export const transcribeAudio = async (
  audioFile: File,
  context: string,
  language: Language,
  enableItn: boolean,
  onProgress: (message: string) => void,
  signal: AbortSignal
): Promise<{ transcription: string; detectedLanguage: string }> => {
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const attempt = i + 1;
      onProgress(attempt > 1 ? `正在进行第 ${attempt} 次尝试...` : '正在识别，请稍候...');
      
      onProgress('正在准备音频数据...');
      const base64Data = await fileToBase64(audioFile);

      onProgress('正在发送到 API...');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_file: {
            data: base64Data,
            name: audioFile.name,
            type: audioFile.type,
            size: audioFile.size
          },
          context: context,
          language: language,
          enable_itn: enableItn,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`API 请求失败，状态码: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data && Array.isArray(result.data) && result.data.length >= 2) {
        onProgress('识别成功！');
        const detectedLangStr = result.data[1] as string; // e.g., "检测到的语言：中文"
        const detectedLanguage = (detectedLangStr.split('：')[1] || detectedLangStr).trim();

        return {
          transcription: result.data[0] as string,
          detectedLanguage: detectedLanguage,
        };
      } else if (result.error) {
        throw new Error(result.details || result.error);
      } else {
        throw new Error('来自 API 的响应格式无效');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        onProgress('识别已取消。');
        throw error; // Re-throw to be caught by the caller and stop retries
      }
      if (i === MAX_RETRIES - 1) {
        console.error(`Transcription failed after ${MAX_RETRIES} attempts.`, error);
        onProgress('识别失败。');
        throw error;
      }
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, i);
      console.log(`Transcription attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`, error);
      onProgress(`识别出错，将在 ${delay / 1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  // This should not be reached.
  throw new Error('Transcription failed after all retries.');
};

interface GradioFile {
  url: string;
  orig_name: string;
  // Other properties might exist but are not needed for this app
}

export const loadExample = async (
  exampleId: number,
  onProgress: (message: string) => void
): Promise<{ file: File; context: string }> => {
  const app = await getClient();
  let endpoint = '/lambda';
  if (exampleId === 1) endpoint = '/lambda_1';
  if (exampleId === 2) endpoint = '/lambda_2';

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const attempt = i + 1;
      onProgress(attempt > 1 ? `正在进行第 ${attempt} 次尝试加载示例...` : '正在加载示例...');
      
      const result: PredictReturn = await app.predict(endpoint, {});

      if (result.data && Array.isArray(result.data) && result.data.length >= 2) {
        const fileData = result.data[0] as GradioFile;
        const context = result.data[1] as string;

        if (!fileData || !fileData.url) {
            throw new Error('Example file URL not found in API response.');
        }
        
        onProgress('正在下载示例文件...');
        // Fetch the audio file from the URL provided by Gradio
        const response = await fetch(fileData.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch example audio: ${response.statusText}`);
        }
        const blob = await response.blob();
        const file = new File([blob], fileData.orig_name || `example_${exampleId}.wav`, { type: blob.type });

        onProgress('示例加载成功！');
        return { file, context };
      } else {
        throw new Error('Invalid response format from example API');
      }
    } catch (error) {
      if (i === MAX_RETRIES - 1) {
        console.error(`Loading example failed after ${MAX_RETRIES} attempts.`, error);
        onProgress('加载示例失败。');
        throw error;
      }
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, i);
      console.log(`Loading example attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`, error);
      onProgress(`加载示例出错，将在 ${delay / 1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Loading example failed after all retries.');
};