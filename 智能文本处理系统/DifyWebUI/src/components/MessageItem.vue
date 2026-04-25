<template>
  <div class="message" :class="messageClass">
    <!-- AI头像 -->
    <div v-if="message.role === 'assistant'" class="message-avatar ai-avatar">
      <div class="avatar-gradient">
        <el-icon :size="20" color="white"><ChatRound /></el-icon>
      </div>
    </div>

    <div class="message-content">
      <!-- 思考过程面板 -->
      <div v-if="hasThoughts" class="thought-panel">
        <div class="thought-header" @click="toggleThoughts">
          <el-icon :class="{ 'is-rotate': showThoughts }"><ArrowRight /></el-icon>
          <span>思考过程</span>
        </div>

        <div v-show="showThoughts" class="thought-content-panel">
          <div v-if="message.thoughts && message.thoughts.length > 0" class="agent-thoughts">
            <div v-for="thought in sortedThoughts" :key="thought.id" class="thought-item">
              <div v-if="thought.tool" class="thought-tool">
                <div class="tool-name">
                  <el-icon><SetUp /></el-icon>
                  {{ thought.tool }}
                </div>
                <div v-if="thought.tool_input" class="tool-input">{{ formatToolInput(thought.tool_input) }}</div>
              </div>
              <div v-if="thought.thought" class="thought-content">
                <div class="thought-label">思考:</div>
                <div class="thought-text">{{ thought.thought }}</div>
              </div>
              <div v-if="thought.observation" class="thought-observation">
                <div class="observation-label">观察:</div>
                <div class="observation-text">{{ thought.observation }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文件内容显示 -->
      <div v-if="message.files && message.files.length > 0" class="message-files">
        <div v-for="file in message.files" :key="file.id" class="file-item">
          <img v-if="file.type === 'image'" :src="file.url" :alt="file.id" class="image-file" />
          <div v-else class="file-card">
            <el-icon :size="24"><Document /></el-icon>
            <span class="file-name">{{ file.name || file.id }}</span>
          </div>
        </div>
      </div>

      <!-- 消息气泡 -->
      <div class="message-bubble" :class="{ 'with-thoughts': hasThoughts }">
        <!-- 打字动画 -->
        <div v-if="message.isStreaming && !message.content" class="message-typing">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>

        <!-- 消息内容 -->
        <template v-else-if="message.content">
          <div class="message-text" v-html="safedContent"></div>

          <!-- 操作按钮 -->
          <div v-if="message.role === 'assistant'" class="message-actions">
            <el-tooltip content="复制内容" placement="top">
              <el-button
                type="info"
                :icon="CopyDocument"
                circle
                size="small"
                text
                @click="copyContent"
              />
            </el-tooltip>
            <el-tooltip content="语音播放" placement="top">
              <el-button
                type="info"
                :icon="isPlaying ? VideoPause : Headset"
                circle
                size="small"
                text
                :loading="isLoadingAudio"
                @click="toggleAudio"
              />
            </el-tooltip>
          </div>
        </template>

        <template v-else>
          <div class="message-text empty-content">空消息</div>
        </template>
      </div>

      <!-- 时间戳 -->
      <div class="message-meta">
        <span class="message-time">{{ formattedTime }}</span>
      </div>
    </div>

    <!-- 用户头像 -->
    <div v-if="message.role === 'user'" class="message-avatar user-avatar">
      <div class="avatar-plain">
        <el-icon :size="20" color="white"><UserFilled /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
import { ElAvatar, ElIcon, ElButton, ElMessage } from 'element-plus';
import {
  UserFilled,
  ChatRound,
  ArrowRight,
  SetUp,
  CopyDocument,
  Headset,
  VideoPause,
  Document
} from '@element-plus/icons-vue';
import { Message, AgentThought } from '../types';
import { marked } from 'marked';
import { chatApi } from '../api';

const props = defineProps<{
  message: Message
}>();

const showThoughts = ref(false);
const contentChanged = ref(false);
const isPlaying = ref(false);
const isLoadingAudio = ref(false);
const audioPlayer = ref<HTMLAudioElement | null>(null);

const toggleThoughts = () => {
  showThoughts.value = !showThoughts.value;
};

const hasThoughts = computed(() => {
  return props.message.thoughts && props.message.thoughts.length > 0;
});

const sortedThoughts = computed(() => {
  if (!props.message.thoughts) return [];
  return [...props.message.thoughts].sort((a, b) => a.position - b.position);
});

const formatToolInput = (input: string) => {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return input;
  }
};

const messageClass = computed(() => [
  `message-${props.message.role}`,
  { 'is-streaming': props.message.isStreaming },
  { 'content-changed': contentChanged.value }
]);

// 安全渲染内容
const safedContent = computed(() => {
  if (!props.message.content) return '';

  try {
    // 配置 marked 选项
    marked.setOptions({
      breaks: true,
      gfm: true
    });
    return marked(props.message.content);
  } catch (err) {
    console.error('Markdown解析错误:', err);
    return escapeHtml(props.message.content);
  }
});

function escapeHtml(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// 复制内容
const copyContent = async () => {
  if (!props.message.content) return;
  try {
    await navigator.clipboard.writeText(props.message.content);
    ElMessage.success('已复制到剪贴板');
  } catch (err) {
    ElMessage.error('复制失败');
  }
};

// 切换音频播放
const toggleAudio = async () => {
  if (isPlaying.value) {
    stopAudio();
  } else {
    await playAudio();
  }
};

const playAudio = async () => {
  if (!props.message.content) return;

  try {
    isLoadingAudio.value = true;
    const response = await chatApi.textToAudio({
      text: props.message.content,
      user: 'user-' + Date.now()
    });

    if (response.success && response.data.audio) {
      const audioUrl = URL.createObjectURL(response.data.audio);

      if (!audioPlayer.value) {
        audioPlayer.value = new Audio();
        audioPlayer.value.onended = () => {
          isPlaying.value = false;
        };
      }

      audioPlayer.value.src = audioUrl;
      await audioPlayer.value.play();
      isPlaying.value = true;
    } else {
      ElMessage.warning('语音功能暂未启用');
    }
  } catch (error) {
    console.error('播放音频时出错:', error);
    ElMessage.warning('语音功能暂未启用');
  } finally {
    isLoadingAudio.value = false;
  }
};

const stopAudio = () => {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.currentTime = 0;
    isPlaying.value = false;
  }
};

onUnmounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.src = '';
  }
});
</script>

<style scoped>
.message {
  display: flex;
  margin-bottom: 1.5rem;
  animation: message-slide-in 0.3s ease-out;
  position: relative;
  width: 100%;
}

@keyframes message-slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 头像样式 */
.message-avatar {
  flex-shrink: 0;
  margin-right: 0.75rem;
}

.avatar-gradient {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.avatar-plain {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--neutral-400);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 消息内容区 */
.message-content {
  flex: 1;
  max-width: calc(100% - 60px);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 思考过程面板 */
.thought-panel {
  margin-bottom: 0.5rem;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: white;
  box-shadow: var(--shadow-sm);
}

.thought-header {
  padding: 0.75rem 1rem;
  background: var(--neutral-50);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--neutral-600);
  font-size: 0.875rem;
  transition: background 0.2s;
}

.thought-header:hover {
  background: var(--neutral-100);
}

.thought-header .el-icon {
  transition: transform 0.3s;
}

.thought-header .is-rotate {
  transform: rotate(90deg);
}

.thought-content-panel {
  padding: 1rem;
  background: white;
}

.agent-thoughts {
  font-size: 0.875rem;
}

.thought-item {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed var(--neutral-200);
}

.thought-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.thought-tool {
  background: var(--primary-bg);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  border-left: 3px solid var(--primary-color);
}

.tool-name {
  font-weight: 600;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tool-input {
  font-family: var(--font-mono);
  white-space: pre-wrap;
  background: var(--neutral-100);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  margin-top: 0.5rem;
  overflow-x: auto;
}

.thought-content {
  background: var(--neutral-50);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
}

.thought-label, .observation-label {
  font-weight: 600;
  color: var(--neutral-600);
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
}

.thought-observation {
  background: var(--secondary-light);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  border-left: 3px solid var(--secondary-color);
}

/* 文件显示 */
.message-files {
  margin-bottom: 0.5rem;
}

.image-file {
  max-width: 100%;
  max-height: 300px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.file-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  color: var(--neutral-600);
}

.file-name {
  font-size: 0.875rem;
}

/* 消息气泡 */
.message-bubble {
  padding: 1rem 1.25rem;
  border-radius: var(--radius-xl);
  position: relative;
  word-break: break-word;
  box-shadow: var(--shadow-sm);
  background: white;
  border: 1px solid var(--neutral-100);
}

.message-bubble.with-thoughts {
  border-left: 3px solid var(--primary-color);
}

/* AI消息 - 左侧 */
.message-assistant .message-bubble {
  background: white;
  border-bottom-left-radius: var(--radius-sm);
}

/* 用户消息 - 右侧 */
.message-user .message-bubble {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  color: white;
  border: none;
  border-bottom-right-radius: var(--radius-sm);
}

.message-user .message-content {
  align-items: flex-end;
}

.message-user .message-avatar {
  margin-right: 0;
  margin-left: 0.75rem;
  order: 2;
}

.message-user {
  flex-direction: row-reverse;
}

/* 消息文本 */
.message-text {
  line-height: 1.7;
  font-size: 0.95rem;
}

.message-text :deep(p) {
  margin: 0 0 0.75rem;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(pre) {
  background: var(--neutral-900);
  border-radius: var(--radius-md);
  padding: 1rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.message-text :deep(code) {
  font-family: var(--font-mono);
  background: var(--neutral-100);
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  font-size: 0.9em;
}

.message-user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-text :deep(ul), .message-text :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.message-text :deep(li) {
  margin: 0.25rem 0;
}

.message-text :deep(blockquote) {
  border-left: 3px solid var(--primary-color);
  padding-left: 1rem;
  margin: 0.75rem 0;
  color: var(--neutral-600);
}

/* 操作按钮 */
.message-actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .message-actions {
  opacity: 1;
}

/* 元信息 */
.message-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.message-time {
  font-size: 0.75rem;
  color: var(--neutral-400);
}

.message-user .message-time {
  text-align: right;
}

/* 打字动画 */
.message-typing {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--primary-light);
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 内容更新高亮 */
.content-changed .message-bubble {
  animation: highlight-pulse 1s ease-in-out;
}

@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: var(--shadow-sm);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .message-content {
    max-width: calc(100% - 50px);
  }

  .message-bubble {
    padding: 0.875rem 1rem;
  }

  .message-actions {
    opacity: 1;
  }
}
</style>
