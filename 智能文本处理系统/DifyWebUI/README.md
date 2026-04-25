# Dify Chat - 豆包AI风格界面

- 如果你也对Dify、Rag flow、Coze、RPA、墨刀、workflow等技术感兴趣，欢迎一起交流学习，开发该项目。
- 基于 Vue 3、TypeScript 和 Element Plus 构建的现代化 Dify AI 聊天界面。
- 采用豆包AI风格设计，简洁现代的交互体验。
- 作者: [liheng-Henrylee](https://github.com/airleeq)
- 联系微信: Airlee1025
- 如果你有开发基础和新的想法，加我给你仓库权限上传代码，一起持续改进这个项目
- 该项目支持界面自适应web端和手机端，并且支持实时流式聊天响应、Markdown支持（包含代码高亮）。

## 界面特性

### 豆包AI风格设计
- 简洁现代的欢迎页，中央大标题 + 快捷功能卡片
- 圆润的消息气泡设计，渐变色的用户消息
- 流畅的动画效果和交互反馈
- 简洁的侧边栏导航

### 主要功能
- 实时流式聊天响应
- 文档上传和处理
- 文字转语音(TTS)
- Markdown 支持（包含代码高亮）
- 响应式设计，支持 Web 端和移动端
- 快捷提示词选择

## 开始使用

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/LeeAirQ/Dify-Web.git
cd dify-chat
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

根据你的需求修改配置：

```env
# Dify API 配置（默认）
VITE_DIFY_API_BASE_URL=http://localhost
VITE_DIFY_API_TOKEN=your-dify-api-token

# Ollama 本地模型配置（可选）
VITE_USE_OLLAMA=false
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=qwen2.5:1.8b
```

4. 启动开发服务器

```bash
npm run dev
```

### 使用 Ollama 本地模型

1. 安装 Ollama
   - 访问 [Ollama官网](https://ollama.com) 下载安装

2. 下载模型

```bash
ollama pull qwen2.5:1.8b
```

3. 启用 Ollama 模式
   - 修改 `.env` 文件：`VITE_USE_OLLAMA=true`
   - 或在界面设置中配置

4. 重启应用即可使用本地模型

### 生产环境构建

```bash
npm run build
```

如果你想要部署上线，把.env环境变量中加入你自己的dify服务器地址以及api即可完成快速的vercel自动化部署。

## 项目结构

- `src/api` - API 服务和接口（支持 Dify 和 Ollama）
- `src/components` - 可复用的 Vue 组件
  - `MessageItem.vue` - 消息气泡组件
  - `MessageInput.vue` - 输入框组件
- `src/stores` - Pinia 状态管理
- `src/views` - 主应用视图
  - `ChatView.vue` - 聊天界面（豆包风格）
  - `MainLayout.vue` - 主布局（简洁侧边栏）
- `src/style.css` - 全局样式和主题色

## 技术栈

- Vue 3 (使用 Composition API)
- TypeScript
- Pinia 状态管理
- Element Plus UI 组件库
- Marked (用于 Markdown 渲染)

## 界面预览

### 桌面端
- 左侧简洁导航栏
- 中央聊天区域
- 豆包风格欢迎页，包含快捷功能卡片

### 移动端
- 自适应布局
- 底部输入栏
- 沉浸式聊天体验

## 自定义主题

主题色定义在 `src/style.css` 中：

```css
:root {
  --primary-color: #4F46E5;    /* 主色调 */
  --primary-light: #6366F1;    /* 浅色 */
  --primary-dark: #4338CA;     /* 深色 */
  /* ... */
}
```

## 注意事项

1. 如果使用 Ollama，请确保服务已启动且模型已下载
2. 如果使用 Dify，请确保 API Token 正确配置
3. 支持同时配置多个后端，可在设置中切换

## 许可证

MIT License
