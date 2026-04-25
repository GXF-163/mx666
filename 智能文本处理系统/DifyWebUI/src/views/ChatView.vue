<template>
  <div class="chat-container">
    <div ref="chatContainerRef" class="messages-container">
      <!-- 空状态 - 豆包风格欢迎页 -->
      <div v-if="!hasMessages" class="empty-state">
        <div class="welcome-content">
          <div class="welcome-header">
            <div class="welcome-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#gradient)"/>
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" fill="white" fill-opacity="0.3"/>
                <defs>
                  <linearGradient id="gradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#4F46E5"/>
                    <stop offset="1" stop-color="#06B6D4"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="welcome-title">
              我是你的
              <span class="gradient-text">智能助手</span>
            </h1>
            <p class="welcome-subtitle">
              上传文档或直接输入问题，我会帮你总结、分析和提取关键信息
            </p>
          </div>

          <!-- 快捷功能卡片 -->
          <div class="feature-cards">
            <div
              v-for="(feature, index) in features"
              :key="index"
              class="feature-card"
              @click="quickStart(feature.prompt)"
            >
              <div class="feature-icon" :style="{ background: feature.gradient }">
                <el-icon :size="24" color="white">
                  <component :is="feature.icon" />
                </el-icon>
              </div>
              <div class="feature-content">
                <div class="feature-title">{{ feature.title }}</div>
                <div class="feature-desc">{{ feature.desc }}</div>
              </div>
            </div>
          </div>

          <!-- 示例提示词 -->
          <div class="example-section">
            <div class="example-title">试试这些示例：</div>
            <div class="example-chips">
              <div
                v-for="(example, idx) in examples"
                :key="idx"
                class="example-chip"
                @click="quickStart(example)"
              >
                {{ example }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天消息列表 -->
      <template v-else>
        <!-- 清除按钮 -->
        <div class="chat-header">
          <el-button
            class="clear-button"
            @click="handleClearChat"
            size="small"
            text
          >
            <el-icon><Delete /></el-icon>
            <span>新对话</span>
          </el-button>
        </div>

        <!-- 消息列表 -->
        <div class="messages-list">
          <MessageItem
            v-for="(message, index) in chatMessages"
            :key="index"
            :message="message"
          />
        </div>

        <!-- 加载指示器 -->
        <div v-if="isLoading && hasUserInput" class="loading-container">
          <div class="loading-indicator">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="loading-text">正在思考...</span>
          </div>
        </div>

        <!-- 错误消息 -->
        <div v-if="error" class="error-container">
          <el-alert
            :title="error"
            type="error"
            show-icon
            :closable="false"
            class="error-alert"
          >
            <template #default>
              <div class="error-actions">
                <el-button size="small" @click="retryLastMessage">重试</el-button>
              </div>
            </template>
          </el-alert>
        </div>
      </template>
    </div>

    <!-- 输入区域 -->
    <div class="input-wrapper">
      <div class="input-container">
        <MessageInput
          ref="messageInputRef"
          :disabled="isLoading"
          @send="handleSendMessage"
        />
      </div>
      <div class="input-footer">
        <span class="footer-hint">AI 生成内容仅供参考</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useChatStore } from '../stores/chat';
import MessageInput from '../components/MessageInput.vue';
import MessageItem from '../components/MessageItem.vue';
import {
  Delete,
  Document,
  EditPen,
  Search,
  MagicStick,
  ChatDotRound
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const chatStore = useChatStore();
const chatMessages = computed(() => chatStore.messages);
const isLoading = computed(() => chatStore.isLoading);
const error = computed(() => chatStore.error);
const chatContainerRef = ref<HTMLElement | null>(null);
const messageInputRef = ref<InstanceType<typeof MessageInput> | null>(null);

// 功能特性
const features = [
  {
    title: '文档总结',
    desc: '上传文档，快速生成摘要',
    icon: Document,
    prompt: '请总结以下文档的主要内容',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
  },
  {
    title: '智能分析',
    desc: '深度分析文本结构和逻辑',
    icon: Search,
    prompt: '请分析这段文本的逻辑结构',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)'
  },
  {
    title: '内容改写',
    desc: '调整语气风格，优化表达',
    icon: EditPen,
    prompt: '请用更专业的语言改写以下内容',
    gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)'
  },
  {
    title: '创意生成',
    desc: '激发灵感，辅助创作',
    icon: MagicStick,
    prompt: '请基于以下内容提供创意建议',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'
  }
];

// 示例提示词
const examples = [
  '总结这份合同的关键条款',
  '提取这段文字的核心观点',
  '将这段内容改写成正式报告',
  '分析这份数据表格的趋势',
  '为这篇文章生成标题',
  '翻译这段英文并总结要点'
];

const hasMessages = computed(() => chatMessages.value.length > 0);
const hasUserInput = computed(() => chatMessages.value.some(m => m.role === 'user'));

// 快速开始
const quickStart = (prompt: string) => {
  messageInputRef.value?.setPrompt(prompt);
};

// 重试上一条消息
const retryLastMessage = () => {
  chatStore.retryLastMessage();
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (chatContainerRef.value) {
    const container = chatContainerRef.value;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }
};

// 发送消息
const handleSendMessage = async (data: { text: string; files: File[] }) => {
  if (!data.text.trim() && data.files.length === 0) {
    ElMessage.warning('请输入内容或上传文件');
    return;
  }

  try {
    await chatStore.sendMessage(data.text, data.files);
    await scrollToBottom();
  } catch (err) {
    console.error('发送消息失败:', err);
  }
};

// 清除聊天
const handleClearChat = () => {
  chatStore.clearMessages();
  ElMessage.success('已开启新对话');
};

onMounted(() => {
  scrollToBottom();
});

// 监听消息变化
watch(
  chatMessages,
  () => {
    scrollToBottom();
  },
  { deep: true }
);
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  background-color: var(--neutral-50);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

/* 豆包风格空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem 1rem;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 640px;
  width: 100%;
}

.welcome-header {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 1.5rem;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--neutral-800);
  margin-bottom: 0.75rem;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: 1rem;
  color: var(--neutral-500);
  line-height: 1.6;
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 功能卡片 */
.feature-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
  margin-bottom: 2rem;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--neutral-100);
  cursor: pointer;
  transition: all 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-content {
  flex: 1;
  min-width: 0;
}

.feature-title {
  font-weight: 600;
  color: var(--neutral-800);
  margin-bottom: 0.25rem;
}

.feature-desc {
  font-size: 0.8rem;
  color: var(--neutral-500);
}

/* 示例区域 */
.example-section {
  width: 100%;
  text-align: center;
}

.example-title {
  font-size: 0.875rem;
  color: var(--neutral-500);
  margin-bottom: 1rem;
}

.example-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.example-chip {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  color: var(--neutral-600);
  cursor: pointer;
  transition: all 0.2s ease;
}

.example-chip:hover {
  background: var(--primary-bg);
  border-color: var(--primary-light);
  color: var(--primary-color);
}

/* 聊天头部 */
.chat-header {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
}

.clear-button {
  color: var(--neutral-500);
  background: transparent;
  border: none;
}

.clear-button:hover {
  color: var(--primary-color);
  background: var(--primary-bg);
}

/* 消息列表 */
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 加载指示器 */
.loading-container {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.loading-text {
  font-size: 0.875rem;
  color: var(--neutral-600);
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 错误提示 */
.error-container {
  margin: 1rem 0;
}

.error-alert {
  border-radius: var(--radius-lg);
}

.error-actions {
  margin-top: 0.75rem;
}

/* 输入区域 */
.input-wrapper {
  padding: 1rem 1.5rem 1.5rem;
  background: white;
  border-top: 1px solid var(--neutral-100);
}

.input-container {
  background: var(--neutral-50);
  border-radius: var(--radius-xl);
  padding: 0.5rem;
}

.input-footer {
  text-align: center;
  margin-top: 0.75rem;
}

.footer-hint {
  font-size: 0.75rem;
  color: var(--neutral-400);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .messages-container {
    padding: 1rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .feature-cards {
    grid-template-columns: 1fr;
  }

  .input-wrapper {
    padding: 0.75rem;
  }
}
</style>
