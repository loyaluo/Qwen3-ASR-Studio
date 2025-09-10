
import { Client, predict } from "@gradio/client";
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

export const transcribeAudio = async (
  audioFile: File,
  context: string,
  language: Language,
  enableItn: boolean
): Promise<{ transcription: string; detectedLanguage: string }> => {
  const app = await getClient();
  const result: PredictReturn = await app.predict('/asr_inference', {
    audio_file: audioFile,
    context: context,
    language: language,
    enable_itn: enableItn,
  });

  if (result.data && Array.isArray(result.data) && result.data.length >= 2) {
    return {
      transcription: result.data[0] as string,
      detectedLanguage: result.data[1] as string,
    };
  } else {
    throw new Error('Invalid response format from API');
  }
};

interface GradioFile {
  url: string;
  orig_name: string;
  // Other properties might exist but are not needed for this app
}

export const loadExample = async (exampleId: number): Promise<{ file: File; context: string }> => {
  const app = await getClient();
  let endpoint = '/lambda';
  if (exampleId === 1) endpoint = '/lambda_1';
  if (exampleId === 2) endpoint = '/lambda_2';

  const result: PredictReturn = await app.predict(endpoint, {});

  if (result.data && Array.isArray(result.data) && result.data.length >= 2) {
    const fileData = result.data[0] as GradioFile;
    const context = result.data[1] as string;

    if (!fileData || !fileData.url) {
        throw new Error('Example file URL not found in API response.');
    }
    
    // Fetch the audio file from the URL provided by Gradio
    const response = await fetch(fileData.url);
    if (!response.ok) {
        throw new Error(`Failed to fetch example audio: ${response.statusText}`);
    }
    const blob = await response.blob();
    const file = new File([blob], fileData.orig_name || `example_${exampleId}.wav`, { type: blob.type });

    return { file, context };
  } else {
    throw new Error('Invalid response format from example API');
  }
};
