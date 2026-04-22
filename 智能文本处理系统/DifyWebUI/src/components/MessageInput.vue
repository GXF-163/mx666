<template>
  <div class="message-input">
    <!-- 已选择的文件列表 -->
    <div v-if="selectedFiles.length > 0" class="file-list">
      <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
        <el-icon class="file-icon"><Document /></el-icon>
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size">({{ formatFileSize(file.size) }})</span>
        <el-button
          type="danger"
          :icon="Close"
          circle
          size="small"
          @click="removeFile(index)"
          class="remove-file-btn"
        />
      </div>
    </div>
    
    <div class="input-wrapper">
      <!-- 选择文件（从文本整编列表） -->
      <el-button
        :icon="Paperclip"
        circle
        @click="openFileListDialog"
        :disabled="disabled"
        class="file-button"
        size="large"
      />
      
      <!-- 输入框 -->
      <el-input
        v-model="inputText"
        :placeholder="placeholder"
        :disabled="disabled"
        clearable
        type="textarea"
        resize="none"
        :rows="1"
        autosize
        @keydown.enter.prevent="handleEnter"
        ref="inputRef"
        class="custom-input"
      />
      
      <!-- 发送按钮 -->
      <el-button
        type="primary"
        :loading="disabled"
        :disabled="!canSend"
        @click="handleSend"
        class="send-button"
        size="large"
      >
        <el-icon><Position /></el-icon>
        <span>发送</span>
      </el-button>
      
    </div>
    <div class="input-hint">
      按回车键发送，按Shift+回车键换行
    </div>

    <!-- 从文本整编管理选择文件 -->
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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { ElInput, ElButton, ElIcon, ElMessage } from 'element-plus';
import { Position, Paperclip, Document, Close } from '@element-plus/icons-vue';

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
const selectedFiles = ref<File[]>([]);

const fileListDialogVisible = ref(false);
const fileListFromManifest = ref<FileListItem[]>([]);
const fileListLoading = ref(false);
const fileListTableRef = ref<any>(null);
const selectedRows = ref<FileListItem[]>([]);

const placeholder = computed(() => {
  return props.disabled ? '等待响应中...' : '输入您的问题或提示词...';
});

const canSend = computed(() => {
  return (inputText.value.trim() || selectedFiles.value.length > 0) && !props.disabled;
});

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

watch(fileListDialogVisible, (visible) => {
  if (visible) {
    loadFileListManifest();
    selectedRows.value = [];
  }
});

function loadFileListManifest() {
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
}

function onFileSelectionChange(rows: FileListItem[]) {
  selectedRows.value = rows;
}

function openFileListDialog() {
  fileListDialogVisible.value = true;
}

async function confirmSelectFiles() {
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
}

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
}

defineExpose({
  setPrompt
});
</script>

<style scoped>
.message-input {
  width: 100%;
  position: relative;
}

.custom-input {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

:deep(.el-input__wrapper) {
  border-radius: var(--radius-lg);
  padding-right: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--neutral-200);
  transition: border-color 0.2s, box-shadow 0.2s;
  background-color: white;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper:focus-within) {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

:deep(.el-textarea__inner) {
  resize: none;
  padding: 12px 16px;
  min-height: 24px !important;
  max-height: 150px !important;
  line-height: 1.5;
  font-size: 1rem;
  color: var(--neutral-800);
}


.input-hint {
  color: var(--neutral-500);
  font-size: 0.7rem;
  margin-top: 6px;
  text-align: right;
  padding-right: 8px;
}

.send-button {
  border: none;
  background-color: var(--primary-color);
  color: white;
  height: auto;
  padding: 0 16px;
  font-size: 0.9rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 4px;
}

.send-button:hover {
  background-color: var(--primary-dark);
  color: white;
}

.send-button:disabled {
  background-color: var(--primary-light);
  color: white;
}

.send-button .el-icon {
  font-size: 1rem;
}

.file-list-dialog .dialog-hint {
  color: var(--neutral-600);
  font-size: 0.875rem;
  margin: 0 0 0.75rem 0;
}

.file-list {
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.file-icon {
  color: var(--primary-color);
  font-size: 1rem;
}

.file-name {
  flex: 1;
  color: var(--neutral-700);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: var(--neutral-500);
  font-size: 0.8rem;
}

.remove-file-btn {
  margin-left: auto;
}

/* 使用 grid 固定三列：左按钮 | 输入框 | 发送按钮，保证发送按钮始终可见 */
.input-wrapper {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: flex-end;
  gap: 8px;
  min-height: 48px;
  width: 100%;
  box-sizing: border-box;
}

.file-button {
  grid-column: 1;
  color: var(--neutral-600);
  border-color: var(--neutral-300);
}

.file-button:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.custom-input {
  grid-column: 2;
  min-width: 0;
  width: 100%;
}

:deep(.custom-input .el-textarea__wrapper),
:deep(.custom-input .el-input__wrapper) {
  min-width: 0;
}

.send-button {
  grid-column: 3;
  height: auto;
  padding: 12px 20px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style> 
