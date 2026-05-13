<template>
  <div class="message-input">
    <!-- 已选择的文件列表 -->
    <div v-if="selectedFiles.length > 0" class="file-list">
      <div v-for="(file, index) in selectedFiles" :key="index" class="file-tag">
        <el-icon class="file-icon"><Document /></el-icon>
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size" v-if="file.size">({{ formatFileSize(file.size) }})</span>
        <el-button
          type="info"
          :icon="Close"
          circle
          size="small"
          text
          @click="removeFile(index)"
          class="remove-file-btn"
        />
      </div>
    </div>

    <div class="input-area">
      <!-- 文件选择按钮 -->
      <el-dropdown trigger="click" @command="handleFileAction">
        <el-button
          :icon="Paperclip"
          circle
          :disabled="disabled"
          class="attach-button"
          size="large"
          text
        />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="local">
              <el-icon><FolderOpened /></el-icon>
              <span>从电脑选择</span>
            </el-dropdown-item>
            <el-dropdown-item command="manifest">
              <el-icon><Collection /></el-icon>
              <span>从文件列表</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInputRef"
        type="file"
        multiple
        style="display: none"
        @change="handleFileSelected"
        accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.py,.js,.html,.css,.vue,.ts"
      />

      <!-- 输入框 -->
      <div class="input-wrapper">
        <el-input
          v-model="inputText"
          :placeholder="placeholder"
          :disabled="disabled"
          type="textarea"
          resize="none"
          :rows="1"
          autosize
          @keydown.enter.prevent="handleEnter"
          ref="inputRef"
          class="chat-input"
        />
      </div>

      <!-- 发送按钮 -->
      <el-button
        type="primary"
        :loading="disabled"
        :disabled="!canSend"
        @click="handleSend"
        class="send-button"
        size="large"
        :circle="!inputText.trim()"
      >
        <el-icon v-if="!disabled"><Position /></el-icon>
        <span v-else>发送</span>
      </el-button>
    </div>

    <div class="input-hint">
      <span>按 Enter 发送，Shift + Enter 换行</span>
    </div>

    <!-- 文件选择弹窗 -->
    <el-dialog
      v-model="fileListDialogVisible"
      title="选择文件"
      width="560px"
      class="file-list-dialog"
    >
      <p class="dialog-hint">从文本整编管理的文件列表中选择要使用的文件</p>
      <el-table
        ref="fileListTableRef"
        v-loading="fileListLoading"
        :data="fileListFromManifest"
        max-height="320"
        @selection-change="onFileSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="文件名" width="160" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="path" label="路径" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="fileListDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="selectedRows.length === 0" @click="confirmSelectFiles">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElInput, ElButton, ElIcon, ElMessage, ElDropdown } from 'element-plus';
import { Position, Paperclip, Document, Close, FolderOpened, Collection } from '@element-plus/icons-vue';

interface FileListItem {
  name: string;
  category: string;
  path: string;
}

const props = defineProps<{
  disabled: boolean;
}>();

const emit = defineEmits<{
  (e: 'send', data: { text: string; files: File[] }): void;
}>();

const inputText = ref('');
const inputRef = ref<InstanceType<typeof ElInput> | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);

const fileListDialogVisible = ref(false);
const fileListFromManifest = ref<FileListItem[]>([]);
const fileListLoading = ref(false);
const fileListTableRef = ref<any>(null);
const selectedRows = ref<FileListItem[]>([]);

const placeholder = computed(() => {
  return props.disabled ? '等待响应中...' : '输入问题或上传文件...';
});

const canSend = computed(() => {
  return (inputText.value.trim() || selectedFiles.value.length > 0) && !props.disabled;
});

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 处理文件操作选择
const handleFileAction = (command: string) => {
  if (command === 'local') {
    // 打开本地文件选择
    fileInputRef.value?.click();
  } else if (command === 'manifest') {
    // 打开文件列表弹窗
    fileListDialogVisible.value = true;
  }
};

// 处理本地文件选择
const handleFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const files = Array.from(input.files);
    selectedFiles.value.push(...files);
    ElMessage.success(`已选择 ${files.length} 个文件`);
  }
  // 清空 input 值，允许重复选择相同文件
  input.value = '';
};

const loadFileListManifest = () => {
  fileListLoading.value = true;
  fetch('/file_list/manifest.json')
    .then(r => r.json())
    .then((data: { files?: FileListItem[] }) => {
      fileListFromManifest.value = data.files || [];
    })
    .catch(() => {
      fileListFromManifest.value = [];
      ElMessage.warning('未找到文件列表');
    })
    .finally(() => {
      fileListLoading.value = false;
    });
};

const onFileSelectionChange = (rows: FileListItem[]) => {
  selectedRows.value = rows;
};

const confirmSelectFiles = async () => {
  if (selectedRows.value.length === 0) return;
  const files: File[] = [];
  for (const row of selectedRows.value) {
    try {
      const res = await fetch('/' + row.path);
      const text = await res.text();
      files.push(new File([text], row.name, { type: 'text/plain' }));
    } catch {
      ElMessage.error('读取文件失败: ' + row.name);
    }
  }
  selectedFiles.value.push(...files);
  fileListDialogVisible.value = false;
  nextTick(() => fileListTableRef.value?.clearSelection());
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};

const handleEnter = (e: Event) => {
  const ev = e as KeyboardEvent;
  if (!ev.shiftKey && canSend.value) {
    handleSend();
  }
};

const handleSend = () => {
  if (canSend.value) {
    emit('send', {
      text: inputText.value.trim(),
      files: [...selectedFiles.value]
    });
    inputText.value = '';
    selectedFiles.value = [];

    // Focus the input after sending
    setTimeout(() => {
      if (inputRef.value && inputRef.value.$el) {
        const textarea = inputRef.value.$el.querySelector('textarea');
        if (textarea) textarea.focus();
      }
    }, 10);
  }
};

onMounted(() => {
  if (inputRef.value && inputRef.value.$el) {
    const textarea = inputRef.value.$el.querySelector('textarea');
    if (textarea) textarea.focus();
  }
});

/** 供父组件调用：将提示词填入输入框 */
function setPrompt(text: string) {
  inputText.value = text;
  // Focus input after setting prompt
  setTimeout(() => {
    if (inputRef.value && inputRef.value.$el) {
      const textarea = inputRef.value.$el.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }
  }, 10);
}

defineExpose({
  setPrompt
});
</script>

<style scoped>
.message-input {
  width: 100%;
}

/* 文件标签列表 */
.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0 0.5rem;
}

.file-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--primary-bg);
  border: 1px solid var(--primary-light);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
}

.file-icon {
  color: var(--primary-color);
  font-size: 0.875rem;
}

.file-name {
  color: var(--neutral-700);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: var(--neutral-500);
  font-size: 0.75rem;
}

.remove-file-btn {
  margin-left: 0.25rem;
}

/* 输入区域 */
.input-area {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--neutral-200);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.input-area:focus-within {
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

/* 附件按钮 */
.attach-button {
  color: var(--neutral-400);
  flex-shrink: 0;
}

.attach-button:hover {
  color: var(--primary-color);
  background: var(--primary-bg);
}

/* 输入框包装 */
.input-wrapper {
  flex: 1;
  min-width: 0;
}

/* 输入框 */
.chat-input :deep(.el-textarea__inner) {
  resize: none;
  border: none;
  padding: 0.625rem 0;
  min-height: 24px !important;
  max-height: 200px !important;
  line-height: 1.6;
  font-size: 1rem;
  color: var(--neutral-800);
  background: transparent;
  box-shadow: none;
}

.chat-input :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.chat-input :deep(.el-textarea__inner::placeholder) {
  color: var(--neutral-400);
}

/* 发送按钮 */
.send-button {
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transition: all 0.2s ease;
}

.send-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
}

.send-button:disabled {
  background: var(--neutral-300);
  box-shadow: none;
}

.send-button .el-icon {
  font-size: 1.125rem;
}

/* 输入提示 */
.input-hint {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--neutral-400);
}

/* 文件选择弹窗 */
.file-list-dialog .dialog-hint {
  color: var(--neutral-600);
  font-size: 0.875rem;
  margin: 0 0 0.75rem 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .input-area {
    padding: 0.375rem;
  }

  .file-name {
    max-width: 120px;
  }
}
</style>
