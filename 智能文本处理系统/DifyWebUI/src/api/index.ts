import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type { ChatRequest, ApiResponse, ChatResponse } from '../types';

// 类型定义
interface TextToAudioRequest {
  message_id?: string;
  text?: string;
  user: string;
}

interface TextToAudioResponse {
  audio: Blob;
}

interface StreamEventHandlers {
  onMessage?: (text: string) => void;
  onThought?: (thought: any) => void;
  onFile?: (file: any) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

// 配置常量
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_DIFY_API_BASE_URL || 'http://localhost',
  TOKEN: import.meta.env.VITE_DIFY_API_TOKEN || 'app-v2ZsPiQjtVqNbtaPBoHvBYvt',
  USER: import.meta.env.VITE_DIFY_API_USER || 'Descartes',
  HEADERS: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_DIFY_API_TOKEN || 'app-v2ZsPiQjtVqNbtaPBoHvBYvt'}`
  },
  // 离线模式配置
  OFFLINE_MODE: import.meta.env.VITE_OFFLINE_MODE === 'true' || true, // 默认启用离线模式，需要在线模式时修改.env文件
  OFFLINE_RESPONSES: {
    '你试试': '我正在离线模式下运行。这是一个模拟的响应。\n\n在离线模式下，我可以：\n1. 模拟基本的对话回复\n2. 显示文件上传成功的消息\n3. 提供示例响应\n\n要启用在线模式，请修改.env文件中的VITE_OFFLINE_MODE=false。',
    '你好': '你好！我是智能文本处理系统。我现在处于离线模式，正在为你提供模拟响应。',
    '文件上传': '文件上传成功！在离线模式下，我会模拟文件处理过程。',
    '总结': '这是一个模拟的文档总结。在离线模式下，我会提供示例总结内容。'
  }
} as const;

// 显示当前配置
console.log('=== API 配置 ===');
console.log('离线模式:', API_CONFIG.OFFLINE_MODE ? '是' : '否');
console.log('API 地址:', API_CONFIG.BASE_URL);
console.log('API Token:', API_CONFIG.TOKEN.substring(0, 10) + '...');
console.log('================');

// 错误处理工具
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API客户端类
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      headers: API_CONFIG.HEADERS
    });

    // 添加响应拦截器
    this.client.interceptors.response.use(
      response => response,
      this.handleError
    );
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const responseData = error.response.data as { message?: string; code?: string };
      throw new ApiError(
        responseData.message || '请求失败',
        error.response.status,
        responseData.code,
        error.response.data
      );
    }
    throw new ApiError(error.message || '网络错误');
  }

  // 发送常规消息
  async sendMessage(params: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    try {
      const response = await this.client.post('/v1/chat-messages', {
        inputs: {},
        query: params.query,
        user: params.user_id,
        conversation_id: params.conversation_id,
        response_mode: 'blocking'
      });
      
      return {
        success: true,
        data: {
          message_id: response.data.id,
          conversation_id: response.data.conversation_id,
          content: response.data.answer
        }
      };
    } catch (error) {
      console.error('发送消息失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 发送流式消息
  sendStreamMessage(query: string, handlers: StreamEventHandlers): void {
    const { onMessage, onThought, onFile, onComplete, onError } = handlers;
    
    const params = {
      inputs: {},
      query,
      user: 'user-' + Date.now(),
      response_mode: 'streaming'
    };
    
     // 使用完整的API URL
    const apiUrl = `${API_CONFIG.BASE_URL}/v1/chat-messages`;
    
    
    console.log('发送流式请求:', apiUrl, params);
    
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
        'Accept': 'text/event-stream'
      },
      mode: 'cors',
      credentials: 'include',
      body: JSON.stringify(params)
    })
      .then(this.handleStreamResponse(onMessage, onThought, onFile, onComplete, onError))
      .catch(error => {
        console.error('流式请求失败:', error);
        onError?.(error.message);
      });
  }

  private handleStreamResponse(
    onMessage?: (text: string) => void,
    onThought?: (thought: any) => void,
    onFile?: (file: any) => void,
    onComplete?: () => void,
    onError?: (error: string) => void
  ) {
    return async (response: Response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processChunk = async () => {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('流式响应完成');
            onComplete?.();
            return;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              await this.processStreamLine(line, onMessage, onThought, onFile, onError);
            }
          }
          
          await processChunk();
        } catch (error) {
          console.error('处理流数据失败:', error);
          onError?.(error instanceof Error ? error.message : '处理流数据失败');
        }
      };

      await processChunk();
    };
  }

  private async processStreamLine(
    line: string,
    onMessage?: (text: string) => void,
    onThought?: (thought: any) => void,
    onFile?: (file: any) => void,
    onError?: (error: string) => void
  ) {
    try {
      const jsonStr = line.substring(5).trim();
      if (!jsonStr) return;
      
      const eventData = JSON.parse(jsonStr);
      
      switch (eventData.event) {
        case 'message':
        case 'agent_message':
          if (eventData.answer !== undefined) {
            onMessage?.(eventData.answer);
          }
          break;
          
        case 'agent_thought':
          onThought?.(eventData);
          break;
          
        case 'message_file':
          onFile?.(eventData);
          break;
          
        case 'message_end':
        case 'tts_message_end':
          console.log('接收到消息结束事件');
          break;
          
        case 'error':
          console.error('流中的错误:', eventData);
          onError?.(eventData.error || '流处理错误');
          break;
          
        default:
          console.log('未处理的事件类型:', eventData.event);
      }
    } catch (error) {
      console.error('处理流数据行失败:', error);
      onError?.(error instanceof Error ? error.message : '处理流数据行失败');
    }
  }

  // 文字转语音
  async textToAudio(params: TextToAudioRequest): Promise<ApiResponse<TextToAudioResponse>> {
    try {
      const requestBody = {
        text: params.text,
        message_id: params.message_id,
        user: params.user
      };

      console.log('发送文字转语音请求:', {
        url: `${API_CONFIG.BASE_URL}/text-to-audio`,
        body: requestBody
      });

      const response = await axios.post(`${API_CONFIG.BASE_URL}/v1/text-to-audio`, requestBody, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: {
          audio: response.data
        }
      };
    } catch (error) {
      console.error('文字转语音失败:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('错误详情:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 上传文件
  async uploadFile(file: File): Promise<ApiResponse<{ id: string }>> {
    // 检查是否启用离线模式
    if (API_CONFIG.OFFLINE_MODE) {
      console.log('🌐 离线模式：模拟文件上传');
      
      // 模拟文件上传延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成模拟的文件ID
      const mockFileId = `offline-file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('✅ 离线模式：文件上传成功', {
        fileName: file.name,
        fileType: file.type || 'application/txt',
        fileSize: file.size,
        mockFileId: mockFileId
      });
      
      return {
        success: true,
        data: {
          id: mockFileId
        }
      };
    }
    
    // 在线模式：正常上传文件
    try {
      const url = `${API_CONFIG.BASE_URL}/v1/files/upload`;
      const formData = new FormData();
      
      // 根据文件类型设置 MIME 类型
      const fileType = file.type || 'application/txt';
      formData.append('file', file, file.name);
      formData.append('user', API_CONFIG.USER);

      console.log('上传文件:', {
        url,
        fileName: file.name,
        fileType,
        fileSize: file.size
      });

      const response = await axios.post(url, formData, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.TOKEN}`
          // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
        }
      });

      if (response.status === 201) {
        console.log('文件上传成功:', response.data);
        return {
          success: true,
          data: {
            id: response.data.id
          }
        };
      } else {
        throw new Error(`文件上传失败，状态码: ${response.status}`);
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('错误详情:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : '文件上传失败'
      };
    }
  }

  // 执行工作流
  async runWorkflow(
    workflowInputs: Record<string, any>,
    timeout: number = 300
  ): Promise<ApiResponse<any>> {
    // 检查是否启用离线模式
    if (API_CONFIG.OFFLINE_MODE) {
      console.log('🌐 离线模式：模拟工作流执行');
      
      // 模拟文件上传成功
      if (workflowInputs.Input_files && workflowInputs.Input_files.length > 0) {
        console.log('📁 离线模式：模拟文件处理');
      }
      
      // 模拟提示词处理
      if (workflowInputs.personalized_prompts) {
        console.log('💬 离线模式：模拟提示词处理');
        
        // 查找匹配的离线响应
        let responseText = '我正在离线模式下运行。这是一个模拟的响应。\n\n在离线模式下，我可以：\n1. 模拟基本的对话回复\n2. 显示文件上传成功的消息\n3. 提供示例响应\n\n要启用在线模式，请启动Dify服务。';
        
        // 检查是否有匹配的预定义响应
        for (const [key, value] of Object.entries(API_CONFIG.OFFLINE_RESPONSES)) {
          if (workflowInputs.personalized_prompts.includes(key)) {
            responseText = value;
            break;
          }
        }
        
        // 模拟文件上传的额外信息
        if (workflowInputs.Input_files && workflowInputs.Input_files.length > 0) {
          responseText += '\n\n📁 已模拟处理文件：' + workflowInputs.Input_files.length + ' 个文件';
        }
        
        // 模拟延迟，让用户看到加载状态
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          data: {
            data: {
              outputs: {
                text: responseText
              }
            }
          }
        };
      }
      
      // 只有文件的情况
      if (workflowInputs.Input_files && workflowInputs.Input_files.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          success: true,
          data: {
            data: {
              outputs: {
                text: '文件上传成功！在离线模式下，我已模拟处理了 ' + workflowInputs.Input_files.length + ' 个文件。\n\n要启用在线模式，请启动Dify服务。'
              }
            }
          }
        };
      }
      
      // 既没有提示词也没有文件的情况
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        data: {
          data: {
            outputs: {
              text: '我正在离线模式下运行。请输入提示词或上传文件以获取响应。\n\n要启用在线模式，请启动Dify服务。'
            }
          }
        }
      };
    }
    
    // 在线模式：正常调用API
    try {
      const url = `${API_CONFIG.BASE_URL}/v1/workflows/run`;
      
      const data = {
        inputs: workflowInputs,
        response_mode: 'blocking',
        user: API_CONFIG.USER
      };

      console.log('🔄 调用工作流...', {
        url,
        inputs: JSON.stringify(data.inputs, null, 2)
      });

      const response = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: timeout * 1000 // 转换为毫秒
      });

      if (response.status === 200) {
        console.log('✅ 工作流执行成功！', response.data);
        // 根据 Python 代码，结果在 result['data']['outputs']['text']
        const result = response.data;
        return {
          success: true,
          data: result
        };
      } else {
        throw new Error(`工作流执行失败: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 工作流执行失败:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return {
            success: false,
            error: '请求超时'
          };
        }
        if (error.response) {
          console.error('错误详情:', {
            status: error.response.status,
            data: error.response.data
          });
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : '工作流执行失败'
      };
    }
  }
}

// 创建API客户端实例
const apiClient = new ApiClient();

// 导出API函数
export const chatApi = {
  sendMessage: apiClient.sendMessage.bind(apiClient),
  sendStreamMessage: apiClient.sendStreamMessage.bind(apiClient),
  textToAudio: apiClient.textToAudio.bind(apiClient),
  uploadFile: apiClient.uploadFile.bind(apiClient),
  runWorkflow: apiClient.runWorkflow.bind(apiClient)
};

// 为了向后兼容，也导出单独的函数
export const { sendMessage, sendStreamMessage, textToAudio, uploadFile, runWorkflow } = chatApi; 
