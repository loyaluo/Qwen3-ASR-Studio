import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { Language, CompressionLevel, ApiProvider } from '../types';

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
  audioDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (deviceId: string) => void;
  apiProvider: ApiProvider;
  setApiProvider: (provider: ApiProvider) => void;
  modelScopeApiUrl: string;
  setModelScopeApiUrl: (url: string) => void;
  bailianApiKey: string;
  setBailianApiKey: (key: string) => void;
  onClearHistory: () => void;
  onRestoreDefaults: () => void;
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
  [Language.AUTO]: "🌐 自动识别 / Auto Detect",
  [Language.CHINESE]: "🇨🇳 中文 / Chinese",
  [Language.ENGLISH]: "🇺🇸 英文 / English",
  [Language.JAPANESE]: "🇯🇵 日文 / Japanese",
  [Language.KOREAN]: "🇰🇷 韩文 / Korean",
  [Language.SPANISH]: "🇪🇸 西班牙文 / Spanish",
  [Language.FRENCH]: "🇫🇷 法文 / French",
  [Language.GERMAN]: "🇩🇪 德文 / German",
  [Language.ARABIC]: "🇸🇦 阿拉伯文 / Arabic",
  [Language.ITALIAN]: "🇮🇹 意大利文 / Italian",
  [Language.RUSSIAN]: "🇷🇺 俄文 / Russian",
  [Language.PORTUGUESE]: "🇵🇹 葡萄牙文 / Portuguese",
};

const compressionLevelDisplayNames: Record<CompressionLevel, string> = {
  [CompressionLevel.ORIGINAL]: "原始",
  [CompressionLevel.MEDIUM]: "中等",
  [CompressionLevel.MINIMUM]: "最小",
};

type SettingTab = 'general' | 'transcription' | 'about';

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
  audioDevices,
  selectedDeviceId,
  setSelectedDeviceId,
  apiProvider,
  setApiProvider,
  modelScopeApiUrl,
  setModelScopeApiUrl,
  bailianApiKey,
  setBailianApiKey,
  onClearHistory,
  onRestoreDefaults,
  disabled,
  canInstall,
  onInstallApp,
}) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingTab>('general');

  if (!isOpen) return null;

  const handleClearHistory = () => setIsConfirmingClear(true);
  const confirmClearHistory = () => {
    onClearHistory();
    setIsConfirmingClear(false);
  }

  const handleRestoreDefaults = () => setIsConfirmingRestore(true);
  const confirmRestoreDefaults = () => {
    onRestoreDefaults();
    setIsConfirmingRestore(false);
  }

  const TabButton: React.FC<{ tabName: SettingTab; label: string }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
        activeTab === tabName
          ? 'border-brand-primary text-brand-primary'
          : 'border-transparent text-content-200 hover:border-base-300 hover:text-content-100'
      }`}
      role="tab"
      aria-selected={activeTab === tabName}
    >
      {label}
    </button>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-base font-medium">主题</label>
              <div className="flex items-center gap-2 p-1 rounded-lg bg-base-100 border border-base-300">
                <button onClick={() => setTheme('light')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${theme === 'light' ? 'bg-brand-primary text-white' : 'hover:bg-base-300'}`}>浅色</button>
                <button onClick={() => setTheme('dark')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${theme === 'dark' ? 'bg-brand-primary text-white' : 'hover:bg-base-300'}`}>深色</button>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label htmlFor="auto-copy" className="text-base font-medium flex-1">
                自动复制结果
                <p className="text-sm text-content-200 font-normal">识别完成后自动将结果复制到剪贴板。</p>
              </label>
              <ToggleSwitch id="auto-copy" enabled={autoCopy} onChange={setAutoCopy} />
            </div>
            {canInstall && (
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-base font-medium">
                  安装应用
                  <p className="text-sm text-content-200 font-normal">将应用安装到设备，以便离线访问。</p>
                </label>
                <button onClick={onInstallApp} className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-white bg-brand-primary hover:bg-brand-secondary">安装</button>
              </div>
            )}
            <hr className="border-base-300" />
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-base font-medium">
                恢复默认设置
                <p className="text-sm text-content-200 font-normal">将所有设置重置为初始状态。</p>
              </label>
              <button onClick={handleRestoreDefaults} disabled={disabled} className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-content-100 bg-base-300 hover:bg-base-300/80 disabled:opacity-60">恢复默认</button>
            </div>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-base font-medium">
                清除历史记录
                <p className="text-sm text-content-200 font-normal">删除所有已保存的识别结果。</p>
              </label>
              <button onClick={handleClearHistory} disabled={disabled} className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed">立即清除</button>
            </div>
          </div>
        );
      case 'transcription':
        return (
          <div className="space-y-6">
             <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-base font-medium">API 提供商</label>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-base-100 border border-base-300">
                <button onClick={() => setApiProvider(ApiProvider.MODELSCOPE)} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${apiProvider === ApiProvider.MODELSCOPE ? 'bg-brand-primary text-white' : 'hover:bg-base-300'}`}>ModelScope</button>
                <button onClick={() => setApiProvider(ApiProvider.BAILIAN)} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${apiProvider === ApiProvider.BAILIAN ? 'bg-brand-primary text-white' : 'hover:bg-base-300'}`}>阿里云百炼</button>
              </div>
            </div>
            {apiProvider === ApiProvider.BAILIAN && (
              <div>
                <label htmlFor="bailian-api-key-setting" className="text-base font-medium">
                  API Key
                  <p className="text-sm text-content-200 font-normal">从 <a href="https://bailian.console.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">阿里云百炼平台</a> 获取。</p>
                </label>
                <input id="bailian-api-key-setting" type="password" value={bailianApiKey} onChange={(e) => setBailianApiKey(e.target.value)} disabled={disabled} placeholder="sk-xxxxxxxxxxxxxxxx" className="mt-2 w-full px-3 py-2 text-sm rounded-md shadow-sm bg-base-100 border border-base-300 text-content-100 placeholder-content-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-60" />
              </div>
            )}
            {apiProvider === ApiProvider.MODELSCOPE && (
              <div>
                <label htmlFor="modelscope-api-url-setting" className="text-base font-medium">
                  API Base URL
                  <p className="text-sm text-content-200 font-normal">自定义 ModelScope API 端点 URL。</p>
                </label>
                <input id="modelscope-api-url-setting" type="text" value={modelScopeApiUrl} onChange={(e) => setModelScopeApiUrl(e.target.value)} disabled={disabled} placeholder="https://.../api/asr-inference" className="mt-2 w-full px-3 py-2 text-sm rounded-md shadow-sm bg-base-100 border border-base-300 text-content-100 placeholder-content-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-60" />
              </div>
            )}
            <hr className="border-base-300" />
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label htmlFor="language-setting" className="text-base font-medium">语言</label>
              <select id="language-setting" value={language} onChange={(e) => setLanguage(e.target.value as Language)} disabled={disabled} className="w-full sm:w-56 px-3 py-2 text-sm rounded-md shadow-sm bg-base-100 border border-base-300 text-content-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-60">
                {Object.values(Language).map((langValue) => (<option key={langValue} value={langValue}>{languageDisplayNames[langValue]}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="context-setting" className="text-base font-medium">
                上下文 (可选)
                <p className="text-sm text-content-200 font-normal">提供上下文以提高准确性，例如：人名、术语。</p>
              </label>
              <textarea id="context-setting" rows