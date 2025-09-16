# Qwen3-ASR-Studio

一个功能丰富的网页应用，旨在为阿里云通义千问（Qwen）ASR 模型提供一个强大、高效且用户友好的操作界面。无论您是需要转录会议记录、整理语音笔记，还是进行任何形式的语音转文本工作，本工具都能为您提供流畅的体验。

**[➡️ 访问在线应用](https://qwen3-asr-studio.pages.dev/)**

---

## 📸 应用截图

<img width="1277" height="1252" alt="image" src="https://github.com/user-attachments/assets/cb26576a-2761-41a1-88dd-417213ac8964" />




<img width="1277" height="1252" alt="image" src="https://github.com/user-attachments/assets/4d7452cd-8631-4f07-81f4-e86b7ad5bf15" />




## ✨ 主要功能

- **多种音频输入方式**:
    - **文件上传**: 支持拖拽或点击选择多种常见音频格式（WAV, MP3, FLAC, M4A 等）。
    - **实时录音**: 直接从麦克风录制音频，并带有实时音波可视化效果。

- **高效的转录核心**:
    - **Qwen ASR 驱动**: 利用阿里巴巴通义千问 ASR 模型的强大能力，提供快速、准确的语音识别服务。
    - **上下文提示**: 可通过提供特定术语、人名或专业词汇作为上下文，显著提升识别的准确率。
    - **多语言支持**: 支持中文、英语、日语等多种语言的识别，并能自动检测语种。
    - **反向文本标准化 (ITN)**: 可选功能，能将“一月五号”这样的口语化表达转换为“1月5日”等书面形式。

- **优化的用户体验**:
    - **一键录音 (按住说话)**: 在非输入状态下，按住`空格键`即可开始录音，松开后自动停止并开始识别，操作如对讲机般便捷。
    - **音频压缩**: 在上传前对音频文件进行客户端压缩，可选择不同压缩等级，大幅减少上传等待时间，特别适合网络不佳的环境。
    - **画中画模式 (输入法模式)**: 独创的画中画（Picture-in-Picture）功能，可将录音和识别窗口悬浮在任何应用之上，让您能直接将识别结果“说”进任何文本框，实现真正的“语音输入法”。

- **强大的工作流与生产力工具**:
    - **双模式编辑**:
        - **单次模式**: 适用于处理单个音频文件，界面简洁。
        - **笔记模式**: 允许多次识别结果追加到同一个可编辑的文本区域，方便整理长篇语音记录。
    - **历史记录**: 自动保存每一次的转录结果（包括音频文件），方便随时回顾、恢复或复制。
    - **笔记管理**: 可以将重要的转录内容保存为笔记，独立于历史记录进行管理。
    - **智能缓存**: 所有转录结果、历史记录、笔记和设置均存储在用户本地浏览器（IndexedDB）中，保护隐私的同时，也避免了对同一文件的重复识别，节约时间。
    - **自动复制**: 可开启“自动复制”功能，在识别完成后立即将结果复制到剪贴板。

- **个性化设置**:
    - **浅色/深色主题**: 支持明暗两种主题，适应不同光线环境和个人偏好。
    - **设置持久化**: 所有个性化配置（如主题、自动复制、上下文等）都会被自动保存在本地。

## 🛠️ 技术栈

- **前端框架**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **UI 样式**: [Tailwind CSS](https://tailwindcss.com/)
- **ASR 后端**: [阿里云通义千问 ASR 模型](https://modelscope.cn/models/Qwen/Qwen-Audio-Chat/summary) (通过 [Gradio](https://www.gradio.app/) Space 部署)
- **客户端技术**:
    - **Web Audio API**: 用于音频录制、处理和可视化。
    - **IndexedDB**: 用于在浏览器端持久化存储历史记录、笔记、缓存和用户设置。

## 🚀 本地开发

如果您希望在本地运行或参与开发，请遵循以下步骤：

**环境要求**:
- [Node.js](https://nodejs.org/) (建议使用 v18 或更高版本)
- [pnpm](https://pnpm.io/) (推荐) 或 npm/yarn

**步骤**:

1.  **克隆仓库**
    ```bash
    git clone https://github.com/yeahhe365/Qwen3-ASR-Studio.git
    cd Qwen3-ASR-Studio
    ```

2.  **安装依赖**
    ```bash
    pnpm install
    # 或者使用 npm
    # npm install
    ```

3.  **启动开发服务器**
    ```bash
    pnpm dev
    # 或者使用 npm
    # npm run dev
    ```

4.  在浏览器中打开 `http://localhost:5173` (或命令行提示的地址)。

## 📁 项目结构

```
.
├── public/                # 静态资源
├── src/
│   ├── components/        # 可复用的 React 组件
│   │   ├── icons/         # SVG 图标组件
│   │   └── ...
│   ├── services/          # 业务逻辑服务
│   │   ├── audioService.ts # 音频处理（压缩等）
│   │   ├── cacheService.ts # IndexedDB 缓存管理
│   │   └── gradioService.ts# 与 Gradio API 的交互
│   ├── types/             # TypeScript 类型定义
│   ├── App.tsx            # 主应用组件
│   ├── index.css          # 全局样式
│   └── index.tsx          # React 应用入口
├── index.html             # HTML 主页面
├── package.json           # 项目依赖与脚本配置
└── README.md              # 就是您正在阅读的这个文件
```
修订解决
1、增加了用本地IP进行打开访问  "http://本机IP:5173"
2、修订解决在本地网络的任一手机、电脑访问http://服务器IP:5173时，浏览器弹出无法启动录音功能，提示：浏览器不支持录音功能


## 🤝 如何贡献

我们非常欢迎各种形式的贡献！如果您有任何建议、发现 Bug 或希望添加新功能，请：

1.  **Fork** 本仓库。
2.  创建一个新的分支 (`git checkout -b feature/YourAmazingFeature`)。
3.  提交您的更改 (`git commit -m 'Add some AmazingFeature'`)。
4.  将您的分支推送到远程仓库 (`git push origin feature/YourAmazingFeature`)。
5.  提交一个 **Pull Request**。

## 📜 开源许可

本项目采用 [MIT License](./LICENSE) 开源许可。

## 🙏 致谢

- 感谢**阿里云通义千问团队**提供了如此出色的 ASR 模型。
- 感谢 **Gradio 和 Hugging Face** 社区让 AI 应用的部署和分享变得简单。
- 感谢 **React 和所有开源社区**的贡献者。
