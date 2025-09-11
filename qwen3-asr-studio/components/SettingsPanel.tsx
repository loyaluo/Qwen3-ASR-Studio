
import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { Language, CompressionLevel } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  autoCopy: boolean;
  setAutoCopy: (autoCopy: boolean) => void;
  context: string;
  setContext: (context: string) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  enableItn: boolean;
  setEnableItn: (enable: boolean) => void;
  compressionLevel: CompressionLevel;
  setCompressionLevel: (level: CompressionLevel) => void;
  onClearHistory: () => void;
  disabled?: boolean;
  canInstall: boolean;
  onInstallApp: () => void;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean; id: string; }> = ({ enabled, onChange, disabled, id }) => {
  return (
    <button
      type="button"
      id={id}
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-primary ${
        enabled ? 'bg-brand-primary' : 'bg-base-300'
      } disabled:opacity-60`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

const languageDisplayNames: Record<Language, string> = {
  [Language.AUTO]: "自动检测",
  [Language.ENGLISH]: "英语 (en)",
  [Language.CHINESE]: "中文 (zh)",
  [Language.JAPANESE]: "日语 (ja)",
  [Language.KOREAN]: "韩语 (ko)",
  [Language.FRENCH]: "法语 (fr)",
  [Language.GERMAN]: "德语 (de)",
  [Language.SPANISH]: "西班牙语 (es)",
};

const compressionLevelDisplayNames: Record<CompressionLevel, string> = {
  [CompressionLevel.ORIGINAL]: "原始",
  [CompressionLevel.MEDIUM]: "中等",
  [CompressionLevel.MINIMUM]: "最小",
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  autoCopy,
  setAutoCopy,
  context,
  setContext,
  language,
  setLanguage,
  enableItn,
  setEnableItn,
  compressionLevel,
  setCompressionLevel,
  onClearHistory,
  disabled,
  canInstall,
  onInstallApp,
}) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (!isOpen) return null;

  const handleClearHistory = () => {
    setIsConfirmingClear(true);
  }

  const confirmClearHistory = () => {
    onClearHistory();
    setIsConfirmingClear(false);
  }

  return (
    <div className="fixed inset-0 z-50" aria-labelledby="settings-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" aria-hidden="true" onClick={onClose}></div>

      {/* Modal panel wrapper for centering */}
      <div className="flex items-center justify-center min-h-full p-4">
        <div className="relative w-full max-w-md bg-base-200 text-content-100 rounded-lg shadow-xl border border-base-300 transform transition-all max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-3 border-b bg-base-200 border-base-300">
            <h2 id="settings-title" className="text-xl font-bold">设置</h2>
            <button
              onClick={onClose}
              aria-label="关闭设置"
              className="p-1 rounded-full text-content-200 hover:bg-base-300 hover:text-content-100 transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Theme setting */}
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-base font-medium">
                主题
              </label>
              <div className="flex items-center gap-2 p-1 rounded-lg bg-base-100 border border-base-300">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${theme === 'light' ? 'bg-brand-primary text-white' : 'hover:bg-base-300'}`}
                >
                  浅色
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${theme === 'dark' ? 'bg-brand-primary text-white' : 'hover:bg-base-300'}`}
                >
                  深色
                </button>
              </div>
            </div>
            
            {/* Auto-copy setting */}
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label htmlFor="auto-copy" className="text-base font-medium flex-1">
                自动复制结果
                <p className="text-sm text-content-200 font-normal">识别完成后自动将结果复制到剪贴板。</p>
              </label>
              <ToggleSwitch
                id="auto-copy"
                enabled={autoCopy}
                onChange={setAutoCopy}
              />
            </div>
            
            {/* PWA Install setting */}
            {canInstall && (
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-base font-medium">
                  安装应用
                  <p className="text-sm text-content-200 font-normal">将应用安装到设备，以便离线访问。</p>
                </label>
                <button
                  onClick={onInstallApp}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-white bg-brand-primary hover:bg-brand-secondary"
                >
                  安装
                </button>
              </div>
            )}

            {/* History setting */}
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-base font-medium">
                清除历史记录
                <p className="text-sm text-content-200 font-normal">删除所有已保存的识别结果。</p>
              </label>
              <button
                onClick={handleClearHistory}
                disabled={disabled}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                立即清除
              </button>
            </div>

            <div className="border-t border-base-300"></div>
            
            <div>
              <h3 className="text-lg font-semibold text-content-100 mb-4">转录选项</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="context-setting" className="text-base font-medium">
                    上下文 (可选)
                    <p className="text-sm text-content-200 font-normal">提供上下文以提高准确性，例如：人名、术语。</p>
                  </label>
                  <textarea
                    id="context-setting"
                    rows={3}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    disabled={disabled}
                    placeholder="人名、术语等..."
                    className="mt-2 w-full px-3 py-2 text-sm rounded-md shadow-sm bg-base-100 border border-base-300 text-content-100 placeholder-content-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-60"
                  />
                </div>

                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label htmlFor="language-setting" className="text-base font-medium">
                    语言
                  </label>
                  <select
                    id="language-setting"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    disabled={disabled}
                    className="w-full sm:w-48 px-3 py-2 text-sm rounded-md shadow-sm bg-base-100 border border-base-300 text-content-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-60"
                  >
                    {Object.values(Language).map((langValue) => (
                      <option key={langValue} value={langValue}>
                        {languageDisplayNames[langValue]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label htmlFor="itn-setting" className="text-base font-medium flex-1">
                    启用反向文本标准化 (ITN)
                  </label>
                  <ToggleSwitch
                    id="itn-setting"
                    enabled={enableItn}
                    onChange={setEnableItn}
                    disabled={disabled}
                  />
                </div>

                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-base font-medium">
                    音频压缩
                    <p className="text-sm text-content-200 font-normal">减小文件大小以加快上传速度。</p>
                  </label>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-base-100 border border-base-300">
                      {Object.values(CompressionLevel).map((level) => (
                        <button
                          key={level}
                          onClick={() => setCompressionLevel(level)}
                          disabled={disabled}
                          className={`px-2 py-1 text-sm font-medium rounded-md transition-colors ${
                            compressionLevel === level
                              ? 'bg-brand-primary text-white'
                              : 'hover:bg-base-300'
                          }`}
                        >
                          {compressionLevelDisplayNames[level]}
                        </button>
                      ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="border-t border-base-300"></div>

            <div>
              <h3 className="text-lg font-semibold text-content-100">关于</h3>
              <p className="text-sm text-content-200 mt-2">
                您可以在 GitHub 上找到此项目的源代码。
              </p>
              <a
                href="https://github.com/yeahhe365/Qwen3-ASR-Studio"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-brand-primary hover:underline block truncate"
              >
                https://github.com/yeahhe365/Qwen3-ASR-Studio
              </a>
              <p className="text-sm text-content-200 mt-4">
                您可以在此处找到该项目的 API 文档。
              </p>
              <a
                href="https://c0rpr74ughd0-deploy.space.z.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-brand-primary hover:underline block truncate"
              >
                https://c0rpr74ughd0-deploy.space.z.ai/
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* Clear History Confirmation Modal */}
      {isConfirmingClear && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" aria-hidden="true" onClick={() => setIsConfirmingClear(false)}></div>
            <div className="relative w-full max-w-sm p-6 bg-base-200 text-content-100 rounded-lg shadow-xl border border-base-300">
                <h3 className="text-lg font-bold">确认清除历史记录</h3>
                <p className="mt-2 text-sm text-content-200">
                    您确定要清除所有识别历史记录吗？此操作无法撤销。
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={() => setIsConfirmingClear(false)}
                        className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-base-300 text-content-100 hover:bg-base-300/80"
                    >
                        取消
                    </button>
                    <button
                        onClick={confirmClearHistory}
                        className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-white bg-red-600 hover:bg-red-700"
                    >
                        确认清除
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};