import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Message, WorkflowFile } from '../types';
import { v4 as uuidv4 } from 'uuid';

// 导入实际的 chatApi 对象
import { chatApi } from '../api';

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

  // 动作
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
      files: []
    };
    
    messages.value.push(assistantMessage);
    
    try {
      isLoading.value = true;
      streamingMessageId.value = assistantMessageId;
      
      // 有提示词或文件时统一走工作流（提示词、文件均为可选）
      let uploadedFiles: WorkflowFile[] = [];
      if (files.length > 0) {
        console.log('📤 开始上传文件...');
        for (const file of files) {
          const uploadResult = await chatApi.uploadFile(file);
          if (uploadResult.success && uploadResult.data) {
            uploadedFiles.push({
              dify_model_identity: '__dify__file__',
              upload_file_id: uploadResult.data.id,
              type: 'document',
              transfer_method: 'local_file'
            });
            console.log(`✅ 文件 ${file.name} 上传成功，ID: ${uploadResult.data.id}`);
          } else {
            throw new Error(`文件 ${file.name} 上传失败: ${uploadResult.error || '未知错误'}`);
          }
        }
      }
      
      // 构建工作流输入参数：只传有值的项（可仅提示词、仅文件、或两者都有）
      const workflowInputs: Record<string, any> = {};
      if (uploadedFiles.length > 0) workflowInputs.Input_files = uploadedFiles;
      if (content.trim()) workflowInputs.personalized_prompts = content.trim();
      
      console.log('🚀 调用工作流...', workflowInputs);
      const workflowResult = await chatApi.runWorkflow(workflowInputs, 300);
      
      if (workflowResult.success && workflowResult.data) {
        const result = workflowResult.data;
        const answer = result?.data?.outputs?.text || result?.answer || JSON.stringify(result, null, 2);
        const index = messages.value.findIndex(m => m.id === assistantMessageId);
        if (index !== -1) {
          messages.value[index].content = answer;
        }
        console.log('✅ 工作流执行成功！', answer);
      } else {
        throw new Error(workflowResult.error || '工作流执行失败');
      }
      
    } catch (e) {
      error.value = e instanceof Error ? e.message : '发送消息失败';
      console.error('Error sending message:', e);
      
      // 更新助手消息显示错误
      const index = messages.value.findIndex(m => m.id === assistantMessageId);
      if (index !== -1) {
        messages.value[index].content = `❌ 错误: ${error.value}`;
      }
    } finally {
      isLoading.value = false;
      streamingMessageId.value = null;
    }
  };

  const clearMessages = () => {
    messages.value = [];
    error.value = null;
  };

  const removeMessage = (id: string) => {
    messages.value = messages.value.filter(m => m.id !== id);
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
    removeMessage
  };
}); 