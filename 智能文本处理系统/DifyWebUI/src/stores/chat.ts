import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { chatApi } from '../api';
import { ElMessage } from 'element-plus';

// 文件内容缓存
const fileContentCache = new Map<string, string>();

// 读取文件内容
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 检查是否是文本文件
    const isTextFile = file.type.startsWith('text/') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.js') ||
      file.name.endsWith('.ts') ||
      file.name.endsWith('.py') ||
      file.name.endsWith('.html') ||
      file.name.endsWith('.css') ||
      file.name.endsWith('.vue') ||
      file.name.endsWith('.csv');

    if (!isTextFile) {
      resolve(`[文件: ${file.name}, 类型: ${file.type || '未知'}, 大小: ${(file.size / 1024).toFixed(2)} KB]`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = (e) => {
      reject(new Error('读取文件失败'));
    };
    reader.readAsText(file);
  });
};

export const useChatStore = defineStore('chat', () => {
  // 状态
  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const streamingMessageId = ref<string | null>(null);

  // 计算属性
  const lastMessage = computed(() => {
    return messages.value.length > 0
      ? messages.value[messages.value.length - 1]
      : null;
  });

  // 发送消息（支持流式响应）
  const sendMessage = async (content: string, files: File[] = []) => {
    // 如果没有内容和文件，直接返回
    if (!content.trim() && files.length === 0) return;

    // 清除错误
    error.value = null;

    // 构建用户消息内容
    let userContent = content.trim();
    if (files.length > 0) {
      const fileNames = files.map(f => f.name).join(', ');
      userContent = userContent
        ? `${userContent}\n[已上传文件: ${fileNames}]`
        : `[已上传文件: ${fileNames}]`;
    }

    // 创建并添加用户消息
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: userContent,
      timestamp: new Date().toISOString()
    };

    messages.value.push(userMessage);

    // 创建并添加助手空消息
    const assistantMessageId = uuidv4();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      thoughts: [],
      files: [],
      isStreaming: true
    };

    messages.value.push(assistantMessage);

    try {
      isLoading.value = true;
      streamingMessageId.value = assistantMessageId;

      // 读取所有文件内容
      let filesContent = '';
      if (files.length > 0) {
        console.log('📁 读取文件内容...');
        for (const file of files) {
          try {
            const content = await readFileContent(file);
            filesContent += `\n\n=== 文件: ${file.name} ===\n${content}`;
          } catch (e) {
            console.error(`读取文件 ${file.name} 失败:`, e);
          }
        }
      }

      // 构建完整提示词
      let fullPrompt = content.trim();
      if (filesContent) {
        fullPrompt += `\n\n${filesContent}`;
      }

      console.log('🚀 发送消息到 Ollama...');

      // 调用 Ollama 流式 API
      await chatApi.sendOllamaStreamMessage(
        fullPrompt,
        {
          onMessage: (text: string) => {
            // 更新助手消息内容
            const index = messages.value.findIndex(m => m.id === assistantMessageId);
            if (index !== -1) {
              messages.value[index].content = text;
            }
          },
          onComplete: () => {
            console.log('✅ 流式响应完成');
            const index = messages.value.findIndex(m => m.id === assistantMessageId);
            if (index !== -1) {
              messages.value[index].isStreaming = false;
            }
          },
          onError: (err: string) => {
            console.error('❌ 流式响应错误:', err);
            error.value = err;
            const index = messages.value.findIndex(m => m.id === assistantMessageId);
            if (index !== -1) {
              messages.value[index].content = `❌ 错误: ${err}`;
              messages.value[index].isStreaming = false;
            }
          }
        }
      );

    } catch (e) {
      error.value = e instanceof Error ? e.message : '发送消息失败';
      console.error('Error sending message:', e);

      // 更新助手消息显示错误
      const index = messages.value.findIndex(m => m.id === assistantMessageId);
      if (index !== -1) {
        messages.value[index].content = `❌ 错误: ${error.value}`;
        messages.value[index].isStreaming = false;
      }
    } finally {
      isLoading.value = false;
      streamingMessageId.value = null;
    }
  };

  const clearMessages = () => {
    messages.value = [];
    error.value = null;
    ElMessage.success('已开启新对话');
  };

  const removeMessage = (id: string) => {
    messages.value = messages.value.filter(m => m.id !== id);
  };

  const retryLastMessage = async () => {
    if (messages.value.length < 2) return;

    // 找到最后一条用户消息
    let lastUserMessageIndex = -1;
    for (let i = messages.value.length - 1; i >= 0; i--) {
      if (messages.value[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages.value[lastUserMessageIndex];

    // 删除助手回复（如果有）
    messages.value = messages.value.slice(0, lastUserMessageIndex + 1);

    // 重新发送
    await sendMessage(lastUserMessage.content, []);
  };

  return {
    // 状态
    messages,
    isLoading,
    error,
    streamingMessageId,

    // 计算属性
    lastMessage,

    // 动作
    sendMessage,
    clearMessages,
    removeMessage,
    retryLastMessage
  };
});
