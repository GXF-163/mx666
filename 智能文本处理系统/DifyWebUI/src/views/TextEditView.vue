<template>
  <div class="text-edit-page">
    <div class="page-header">
      <h1>文本整编管理</h1>
      <p class="page-desc">
        批量管理文本文件，按文件夹分类查看与预览。文件保存在
        <code>public/file_list</code> 下，并由本地服务自动维护
        <code>public/file_list/manifest.json</code>。
      </p>
    </div>

    <!-- 操作区：按文件夹筛选 + 新增分类 + 上传 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-label">文件夹筛选：</span>
        <el-select
          v-model="selectedFolder"
          class="folder-select"
          size="default"
          placeholder="选择文件夹"
        >
          <el-option label="全部" value="__all__" />
          <el-option
            v-for="folder in folders"
            :key="folder"
            :label="folder"
            :value="folder"
          />
        </el-select>
      </div>

      <div class="toolbar-right">
        <div class="toolbar-group">
          <el-button type="primary" @click="openCreateFolderDialog">新增分类</el-button>
        </div>

        <div class="toolbar-group toolbar-group-upload">
          <span class="toolbar-label">上传文件到：</span>
          <el-select
            v-model="uploadFolder"
            class="folder-select"
            size="default"
            placeholder="选择目标文件夹"
          >
            <el-option
              v-for="folder in folders"
              :key="folder"
              :label="folder"
              :value="folder"
            />
          </el-select>
          <el-upload
            class="upload-btn"
            :show-file-list="false"
            :http-request="handleUpload"
            :disabled="!uploadFolder || uploading"
          >
            <el-button type="primary" :loading="uploading">
              选择文件上传
            </el-button>
          </el-upload>
        </div>
      </div>
    </div>

    <!-- 新增分类弹窗 -->
    <el-dialog v-model="createFolderVisible" title="新增分类" width="480px">
      <el-input
        v-model="newFolderName"
        placeholder="请输入新分类名称（仅支持字母/数字/空格/._-）"
        :disabled="creatingFolder"
        clearable
        @keyup.enter="createFolder"
      />
      <template #footer>
        <el-button @click="createFolderVisible = false" :disabled="creatingFolder">取消</el-button>
        <el-button
          type="primary"
          :loading="creatingFolder"
          :disabled="!newFolderName.trim() || creatingFolder"
          @click="createFolder"
        >
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <div class="table-wrap">
      <el-table v-loading="loading" :data="filteredList" stripe border style="width: 100%">
        <el-table-column prop="name" label="文件名字" width="180" />
        <el-table-column prop="category" label="文件分类" width="120" />
        <el-table-column prop="path" label="文件存储位置" min-width="280" show-overflow-tooltip />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="previewFile(row)">
              <el-icon><View /></el-icon>
              预览
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 文件预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      width="640px"
      class="preview-dialog"
    >
      <div v-if="previewLoading" class="preview-loading">加载中...</div>
      <pre v-else class="preview-content">{{ previewContent }}</pre>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { UploadRequestOptions } from 'element-plus';
import { View } from '@element-plus/icons-vue';

interface FileItem {
  name: string;
  category: string;
  path: string;
}

const fileList = ref<FileItem[]>([]);
const loading = ref(true);
const previewVisible = ref(false);
const previewTitle = ref('');
const previewContent = ref('');
const previewLoading = ref(false);

const folders = ref<string[]>([]);
const selectedFolder = ref<string | '__all__'>('__all__');
const uploadFolder = ref<string>('');
const uploading = ref(false);
const newFolderName = ref<string>('');
const creatingFolder = ref(false);
const createFolderVisible = ref(false);

const filteredList = computed(() => {
  if (selectedFolder.value === '__all__') {
    return fileList.value;
  }
  return fileList.value.filter(item => item.category === selectedFolder.value);
});

const FILE_LIST_SERVER_BASE = 'http://localhost:5174';

function isValidFolderName(name: string) {
  const s = String(name || '').trim();
  if (!s) return false;
  if (s.length > 120) return false;
  if (s.includes('..')) return false;
  if (s.includes('/') || s.includes('\\')) return false;
  if (/[\u0000-\u001f]/.test(s)) return false;
  if (/[\\/:*?"<>|]/.test(s)) return false;
  return true;
}

function openCreateFolderDialog() {
  newFolderName.value = '';
  createFolderVisible.value = true;
}

function loadManifest() {
  loading.value = true;
  fetch(`${FILE_LIST_SERVER_BASE}/local-api/file-list`)
    .then(r => r.json())
    .then((data: { files?: FileItem[]; folders?: string[] }) => {
      fileList.value = data.files || [];
      folders.value = data.folders || [];
      if (!folders.value.includes(uploadFolder.value)) {
        uploadFolder.value = '';
      }
    })
    .catch(() => {
      fileList.value = [];
      folders.value = [];
      ElMessage.error('获取文件列表失败，请确认本地文件服务已启动');
    })
    .finally(() => {
      loading.value = false;
    });
}

function createFolder() {
  const name = newFolderName.value.trim();
  if (!name) return;

  if (!isValidFolderName(name)) {
    ElMessage.warning('分类名称不合法：不能包含 / \\ : * ? " < > | 或 ..，长度需在 120 以内');
    return;
  }

  if (folders.value.includes(name)) {
    ElMessage.warning('该分类已存在');
    return;
  }

  creatingFolder.value = true;
  fetch(`${FILE_LIST_SERVER_BASE}/local-api/folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
    .then(async r => {
      if (r.status === 409) {
        throw new Error('exists');
      }
      if (!r.ok) {
        const msg = await r.text().catch(() => '');
        throw new Error(msg || 'create failed');
      }
      return r.json();
    })
    .then(() => {
      ElMessage.success('分类创建成功');
      newFolderName.value = '';
      createFolderVisible.value = false;
      loadManifest();
    })
    .catch((e: any) => {
      if (String(e?.message || '').includes('exists')) {
        ElMessage.warning('该分类已存在');
      } else {
        // eslint-disable-next-line no-console
        console.error(e);
        const msg = String(e?.message || '').trim();
        ElMessage.error(msg ? `创建分类失败：${msg}` : '创建分类失败');
      }
    })
    .finally(() => {
      creatingFolder.value = false;
    });
}

function handleUpload(options: UploadRequestOptions) {
  const { file, onError, onSuccess } = options;

  if (!uploadFolder.value) {
    ElMessage.warning('请先选择要上传到的目标文件夹');
    onError?.(new Error('missing folder'));
    return;
  }

  const rawFile = file as File;
  const formData = new FormData();
  formData.append('folder', uploadFolder.value);
  formData.append('file', rawFile);

  uploading.value = true;

  fetch(`${FILE_LIST_SERVER_BASE}/local-api/upload`, {
    method: 'POST',
    body: formData,
  })
    .then(async r => {
      if (!r.ok) {
        const msg = await r.text().catch(() => '');
        throw new Error(msg || 'upload failed');
      }
      return r.json();
    })
    .then(() => {
      ElMessage.success('上传成功，列表已更新');
      loadManifest();
      onSuccess?.({}, rawFile as any);
    })
    .catch((e: any) => {
      // eslint-disable-next-line no-console
      console.error(e);
      ElMessage.error('上传失败，请稍后重试');
      onError?.(e);
    })
    .finally(() => {
      uploading.value = false;
    });
}

function previewFile(row: FileItem) {
  previewVisible.value = true;
  previewTitle.value = row.name;
  previewContent.value = '';
  previewLoading.value = true;
  const url = '/' + row.path;
  fetch(url)
    .then(r => r.text())
    .then(text => {
      previewContent.value = text || '(空文件)';
    })
    .catch(() => {
      previewContent.value = '无法加载文件内容';
      ElMessage.error('预览失败');
    })
    .finally(() => {
      previewLoading.value = false;
    });
}

onMounted(() => {
  loadManifest();
});
</script>

<style scoped>
.text-edit-page {
  --page-bg: #f6f7fb;
  --card-bg: #ffffff;
  --card-border: rgba(15, 23, 42, 0.08);
  --shadow: 0 10px 25px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.05);
  --text-strong: #0f172a;
  --text: #334155;
  --text-muted: #64748b;

  padding: 2rem;
  max-width: 1040px;
  margin: 0 auto;
}

.page-header {
  padding: 1.25rem 1.25rem 1rem 1.25rem;
  background: linear-gradient(180deg, rgba(79, 70, 229, 0.08), rgba(79, 70, 229, 0));
  border: 1px solid var(--card-border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  margin-bottom: 1rem;
}

.page-header h1 {
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: var(--text-strong);
  margin: 0 0 0.35rem 0;
}

.page-desc {
  font-size: 1.05rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.65;
}

.page-desc code {
  font-size: 0.9em;
  padding: 0.12em 0.35em;
  border-radius: 6px;
  border: 1px solid var(--card-border);
  background: rgba(15, 23, 42, 0.04);
}

.toolbar {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  padding: 1rem 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.toolbar-right {
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: 0.75rem;
}

.toolbar-group {
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
}

.toolbar-group-upload .toolbar-label {
  min-width: 96px; /* “上传文件到：”更宽，避免挤到下一行 */
}

.toolbar-label {
  font-size: 1.05rem;
  color: var(--text);
  font-weight: 600;
  white-space: nowrap;
}

.folder-select {
  min-width: 220px;
}

.upload-btn {
  margin-left: 0.5rem;
}

.table-wrap {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 0.8rem;
  box-shadow: var(--shadow);
}

.preview-dialog :deep(.el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
}

.preview-loading {
  color: var(--neutral-500);
  padding: 2rem;
  text-align: center;
}

.preview-content {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-strong);
  margin: 0;
  font-family: inherit;
}

/* Element Plus 细节微调（按钮/输入/表格字体与间距） */
.toolbar :deep(.el-select__wrapper) {
  border-radius: 10px;
}

.toolbar :deep(.el-input__wrapper) {
  border-radius: 10px;
}

.toolbar :deep(.el-button) {
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.toolbar :deep(.el-button--primary) {
  --el-button-bg-color: #1677ff;
  --el-button-border-color: #1677ff;
  --el-button-hover-bg-color: #0958d9;
  --el-button-hover-border-color: #0958d9;
  --el-button-active-bg-color: #003eb3;
  --el-button-active-border-color: #003eb3;
}

.table-wrap :deep(.el-table) {
  font-size: 14.5px;
}

.table-wrap :deep(.el-table__header-wrapper th) {
  font-weight: 700;
  color: var(--text-strong);
}

/* 弹窗字号与按钮尺寸同步提升 */
.text-edit-page :deep(.el-dialog__title) {
  font-size: 1.1rem;
  font-weight: 700;
}

.text-edit-page :deep(.el-dialog__body) {
  font-size: 1rem;
}

.text-edit-page :deep(.el-button) {
  font-size: 14px;
}
</style>
