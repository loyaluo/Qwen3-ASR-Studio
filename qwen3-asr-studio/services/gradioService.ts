
import { API_ENDPOINT } from '../constants';
import { Language, TranscriptionResult, GradioMessage } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const transcribeAudio = (
  file: File,
  context: string,
  language: Language,
  enableITN: boolean,
  onStatusUpdate: (status: string) => void
): Promise<TranscriptionResult> => {
  return new Promise(async (resolve, reject) => {
    try {
      onStatusUpdate('正在转换音频格式...');
      const base64Audio = await fileToBase64(file);

      const payload = {
        data: [
          {
            name: file.name,
            data: base64Audio,
          },
          context,
          language,
          enableITN,
        ],
      };

      onStatusUpdate('正在提交转录任务...');
      const postResponse = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!postResponse.ok) {
        throw new Error(`API 提交失败，状态码: ${postResponse.status}`);
      }

      const { event_id } = await postResponse.json();
      if (!event_id) {
        throw new Error('无法从 API 获取事件 ID。');
      }

      const eventSource = new EventSource(`${API_ENDPOINT}/${event_id}`);

      eventSource.onmessage = (event) => {
        try {
          const messageData: GradioMessage = JSON.parse(event.data);
          
          switch (messageData.msg) {
            case 'process_starts':
              onStatusUpdate('转录过程已开始...');
              break;
            case 'progress':
              const progress = messageData.progress_data?.[0];
              if (progress?.desc) {
                onStatusUpdate(progress.desc);
              } else {
                 onStatusUpdate('处理中...');
              }
              break;
            case 'process_completed':
              eventSource.close();
              if (messageData.success && messageData.output?.data) {
                const [transcription, detectedLanguage] = messageData.output.data;
                resolve({ transcription, detectedLanguage });
              } else {
                reject(new Error('转录失败。API 未返回成功结果。'));
              }
              break;
             case 'unexpected_error':
                eventSource.close();
                reject(new Error(`发生意外错误: ${messageData.log || '未知 API 错误'}`));
                break;
          }
        } catch (e) {
            // Ignore parsing errors for non-JSON messages like heartbeats
        }
      };
      
      eventSource.onerror = (err) => {
        eventSource.close();
        console.error('EventSource failed:', err);
        reject(new Error('与转录服务的连接已断开。'));
      };

    } catch (error) {
      reject(error);
    }
  });
};
