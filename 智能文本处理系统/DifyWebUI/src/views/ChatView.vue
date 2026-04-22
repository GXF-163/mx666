<template>
  <div class="chat-container">
    <div ref="chatContainerRef" class="messages-container">
      <div v-if="hasMessages" class="clear-bar">
        <el-button class="clear-button" @click="handleClearChat" size="small">
          <el-icon><Delete /></el-icon>
          <span>清除对话</span>
        </el-button>
      </div>
      <!-- Empty state -->
      <div v-if="!hasMessages" class="empty-state">
        <div class="welcome-message">
          <h2>欢迎使用智能文本处理系统</h2>
          <p>上传文件并输入提示词，即可对文档进行总结、分析等智能处理；也可直接输入问题与系统对话。</p>
        </div>
        
        <div class="examples-container">
          <h3>选择任务类型：</h3>
          <div class="example-prompts">
            <div 
              v-for="(task, index) in taskList" 
              :key="index" 
              class="example-prompt"
              @click="openTaskDialog(task)"
            >
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ task.label }}</span>
            </div>
          </div>
        </div>

        <!-- 候选提示词弹窗 -->
        <el-dialog
          v-model="promptDialogVisible"
          :title="currentTask ? currentTask.label : '选择提示词'"
          width="500px"
          class="prompt-dialog"
          @closed="currentTask = null"
        >
          <p class="prompt-dialog-hint">点击一条提示词，将自动填入下方输入框</p>
          <div class="candidate-prompts">
            <div
              v-for="(prompt, idx) in currentTask?.prompts ?? []"
              :key="idx"
              class="candidate-item"
              @click="applyPromptAndClose(prompt)"
            >
              {{ prompt }}
            </div>
          </div>
        </el-dialog>
      </div>

      <!-- Chat messages -->
      <template v-else>
        <MessageItem 
          v-for="(message, index) in chatMessages" 
          :key="index" 
          :message="message" 
        />
      </template>

      <!-- Loading indicator -->
      <div v-if="isLoading && hasUserInput" class="loading-container">
        <div class="loading-indicator">
          <span>正在处理您的请求...</span>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="error" class="error-message">
        <el-alert
          title="出错了"
          type="error"
          :description="error"
          show-icon
          :closable="false"
        />
      </div>
    </div>

    <div class="input-container">
      <MessageInput 
        ref="messageInputRef"
        :disabled="isLoading" 
        @send="handleSendMessage" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useChatStore } from '../stores/chat';
import MessageInput from '../components/MessageInput.vue';
import MessageItem from '../components/MessageItem.vue';
import { Delete, ChatDotRound } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const chatStore = useChatStore();
const chatMessages = computed(() => chatStore.messages);
const isLoading = computed(() => chatStore.isLoading);
const error = computed(() => chatStore.error);
const chatContainerRef = ref<HTMLElement | null>(null);
const messageInputRef = ref<InstanceType<typeof MessageInput> | null>(null);

/** 四个任务，每个任务对应多条候选提示词 */
interface TaskItem {
  label: string;
  prompts: string[];
}
const taskList = ref<TaskItem[]>([
  {
    label: '文档总结',
    prompts: [
      '请你用严肃的语言总结这些文件的主要内容。',
      '请用简洁的 bullet 要点总结上述文档。',
      '请概括每段的核心观点，并给出整体结论。'
    ]
  },
  {
    label: '内容分析',
    prompts: [
      '请分析这些文本的逻辑结构和论证方式。',
      '请指出文中的关键论据与可能的疏漏。',
      '请从多角度分析这些材料的异同。'
    ]
  },
  {
    label: '问答与提取',
    prompts: [
      '请根据文档回答：文中提到的主要人物/事件有哪些？',
      '请提取文中的数字、日期、专有名词等关键信息。',
      '请列出文档中所有重要结论或建议。'
    ]
  },
  {
    label: '创意与改写',
    prompts: [
      '请用更通俗的语言重写以下内容，便于大众理解。',
      '请将上述内容改写成一份简短的汇报摘要。',
      '请用更正式/学术的语言重新表述这些要点。'
    ]
  }
]);

const promptDialogVisible = ref(false);
const currentTask = ref<TaskItem | null>(null);

const hasMessages = computed(() => chatMessages.value.length > 0);
const hasUserInput = computed(() => chatMessages.value.some(m => m.role === 'user'));

function openTaskDialog(task: TaskItem) {
  currentTask.value = task;
  promptDialogVisible.value = true;
}

function applyPromptAndClose(prompt: string) {
  messageInputRef.value?.setPrompt(prompt);
  promptDialogVisible.value = false;
}

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainerRef.value) {
    const container = chatContainerRef.value;
    container.scrollTop = container.scrollHeight;
  }
};

const handleSendMessage = async (data: { text: string; files: File[] }) => {
  if (!data.text.trim() && data.files.length === 0) {
    ElMessage.warning('提示词为空！！');
    return;
  }
  
  try {
    await chatStore.sendMessage(data.text, data.files);
    await scrollToBottom();
  } catch (err) {
    console.error('发送消息失败:', err);
  }
};

const handleClearChat = () => {
  chatStore.clearMessages();
};


onMounted(() => {
  // 加载页面时滚动到底部
  scrollToBottom();
});

// 监听消息列表变化，自动滚动到底部
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
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  background-color: var(--neutral-50);
}

.clear-bar {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 0;
  margin-bottom: -0.5rem;
}

.clear-button {
  color: var(--neutral-600);
  background-color: transparent;
  border: 1px solid var(--neutral-300);
  display: flex;
  align-items: center;
  gap: 4px;
}

.clear-button:hover {
  color: var(--error-color);
  border-color: var(--error-color);
  background-color: #FEF2F2;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 0 1rem;
  margin-top: -4rem;
}

.welcome-message {
  margin-bottom: 2.5rem;
  max-width: 600px;
}

.welcome-message h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.75rem;
}

.welcome-message p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--neutral-600);
}

.examples-container {
  width: 100%;
  max-width: 700px;
}

.examples-container h3 {
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--neutral-700);
  font-size: 1.1rem;
}

.example-prompts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.example-prompt {
  padding: 1rem;
  background-color: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.5;
  color: var(--neutral-700);
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  box-shadow: var(--shadow-sm);
}

.example-prompt .el-icon {
  color: var(--primary-color);
  margin-top: 0.125rem;
}

.example-prompt:hover {
  background-color: var(--primary-bg);
  border-color: var(--primary-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.loading-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.loading-indicator {
  padding: 0.5rem 1rem;
  background-color: white;
  border-radius: 2rem;
  color: var(--primary-color);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: var(--shadow-sm);
}

.error-message {
  margin: 1rem 0;
}

.input-container {
  padding: 1rem;
  background-color: white;
  border-top: 1px solid var(--neutral-200);
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.prompt-dialog-hint {
  color: var(--neutral-600);
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.candidate-prompts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 360px;
  overflow-y: auto;
}

.candidate-item {
  padding: 0.75rem 1rem;
  background-color: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--neutral-800);
}

.candidate-item:hover {
  background-color: var(--primary-bg);
  border-color: var(--primary-light);
}

/* 媒体查询适配不同屏幕尺寸 */
@media (max-width: 768px) {
  .chat-container {
    padding: 0;
  }
  
  .example-prompts {
    grid-template-columns: 1fr;
  }
  
  .messages-container {
    padding: 1rem 0.75rem;
  }
}
</style> 
