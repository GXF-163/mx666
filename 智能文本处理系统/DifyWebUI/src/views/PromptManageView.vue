<template>
  <div class="prompt-manage">
    <div class="page-header">
      <h1>提示词管理</h1>
      <p class="page-desc">按任务分类管理提示词，支持从下方表格复制到主页使用；可自行添加分类与提示词（仅保存在本机）。</p>
    </div>

    <div class="toolbar">
      <el-button type="primary" @click="showAddCategory = true">
        <el-icon><FolderAdd /></el-icon>
        添加分类
      </el-button>
      <el-button @click="showAddPrompt = true">
        <el-icon><Plus /></el-icon>
        添加提示词
      </el-button>
      <el-button
        type="danger"
        plain
        :disabled="userAdditions.categories.length === 0"
        @click="showDeleteCategory = true"
      >
        <el-icon><FolderRemove /></el-icon>
        删除分类
      </el-button>
      <el-button
        type="danger"
        plain
        :disabled="deletableRows.length === 0"
        @click="showDeletePrompt = true"
      >
        <el-icon><Delete /></el-icon>
        删除提示词
      </el-button>
    </div>

    <div class="table-wrap">
      <el-table :data="tableData" stripe border style="width: 100%">
        <el-table-column prop="category" label="分类" width="140" />
        <el-table-column prop="text" label="提示词" min-width="320" show-overflow-tooltip />
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="copyPrompt(row.text)">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
            <el-button
              v-if="row.deletable"
              type="danger"
              link
              size="small"
              @click="deletePromptRow(row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加分类 -->
    <el-dialog v-model="showAddCategory" title="添加分类" width="400px">
      <el-form :model="newCategory" label-width="80">
        <el-form-item label="分类名称">
          <el-input v-model="newCategory.name" placeholder="如：文档总结" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddCategory = false">取消</el-button>
        <el-button type="primary" @click="addCategory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加提示词 -->
    <el-dialog v-model="showAddPrompt" title="添加提示词" width="500px">
      <el-form :model="newPrompt" label-width="80">
        <el-form-item label="所属分类">
          <el-select v-model="newPrompt.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option
              v-for="c in mergedCategories"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="提示词内容">
          <el-input v-model="newPrompt.text" type="textarea" :rows="3" placeholder="输入提示词" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddPrompt = false">取消</el-button>
        <el-button type="primary" @click="addPrompt">确定</el-button>
      </template>
    </el-dialog>

    <!-- 删除分类（仅可删除本机添加的分类） -->
    <el-dialog v-model="showDeleteCategory" title="删除分类" width="400px">
      <p class="dialog-hint">仅可删除您添加的分类，无法删除来自文件的分类。</p>
      <el-select v-model="deleteCategoryId" placeholder="选择要删除的分类" style="width: 100%">
        <el-option
          v-for="c in userAdditions.categories"
          :key="c.id"
          :label="c.name"
          :value="c.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="showDeleteCategory = false">取消</el-button>
        <el-button type="danger" :disabled="!deleteCategoryId" @click="confirmDeleteCategory">删除</el-button>
      </template>
    </el-dialog>

    <!-- 删除提示词（选择某一条后删除） -->
    <el-dialog v-model="showDeletePrompt" title="删除提示词" width="560px">
      <p class="dialog-hint">仅可删除您添加的提示词；来自文件的提示词请直接编辑 public/prompt_list/prompts.json。</p>
      <el-table :data="deletableRows" max-height="320" highlight-current-row @current-change="onSelectDeleteRow">
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="text" label="提示词" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="showDeletePrompt = false">取消</el-button>
        <el-button type="danger" :disabled="!selectedDeleteRow" @click="confirmDeletePrompt">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { FolderAdd, FolderRemove, Plus, CopyDocument, Delete } from '@element-plus/icons-vue';

const PROMPT_LIST_STORAGE_KEY = 'prompt_list_additions';

interface CategoryItem {
  id: string;
  name: string;
  prompts: string[];
}

interface TableRow {
  category: string;
  text: string;
  deletable: boolean;
  categoryId: string;
  source: 'file' | 'file_user' | 'user_cat';
  indexInSource: number;
}

const fileCategories = ref<CategoryItem[]>([]);
const userAdditions = ref<{
  categories: CategoryItem[];
  promptsByCategoryId: Record<string, string[]>;
}>({ categories: [], promptsByCategoryId: {} });

const mergedCategories = computed(() => {
  return [...fileCategories.value, ...userAdditions.value.categories];
});

const tableData = computed<TableRow[]>(() => {
  const rows: TableRow[] = [];
  for (const cat of fileCategories.value) {
    cat.prompts.forEach((text, i) => {
      rows.push({
        category: cat.name,
        text,
        deletable: false,
        categoryId: cat.id,
        source: 'file',
        indexInSource: i
      });
    });
    (userAdditions.value.promptsByCategoryId[cat.id] || []).forEach((text, i) => {
      rows.push({
        category: cat.name,
        text,
        deletable: true,
        categoryId: cat.id,
        source: 'file_user',
        indexInSource: i
      });
    });
  }
  for (const cat of userAdditions.value.categories) {
    cat.prompts.forEach((text, i) => {
      rows.push({
        category: cat.name,
        text,
        deletable: true,
        categoryId: cat.id,
        source: 'user_cat',
        indexInSource: i
      });
    });
  }
  return rows;
});

const deletableRows = computed(() => tableData.value.filter(r => r.deletable));

const showAddCategory = ref(false);
const showAddPrompt = ref(false);
const showDeleteCategory = ref(false);
const showDeletePrompt = ref(false);
const newCategory = ref({ name: '' });
const newPrompt = ref({ categoryId: '', text: '' });
const deleteCategoryId = ref('');
const selectedDeleteRow = ref<TableRow | null>(null);

function loadFromFile() {
  fetch('/prompt_list/prompts.json')
    .then(r => r.json())
    .then((data: { categories: CategoryItem[] }) => {
      fileCategories.value = data.categories || [];
    })
    .catch(() => {
      fileCategories.value = [];
      ElMessage.warning('未找到提示词列表文件，请确保 public/prompt_list/prompts.json 存在');
    });
}

function loadUserAdditions() {
  try {
    const raw = localStorage.getItem(PROMPT_LIST_STORAGE_KEY);
    if (raw) userAdditions.value = JSON.parse(raw);
    if (!userAdditions.value.promptsByCategoryId) userAdditions.value.promptsByCategoryId = {};
  } catch {
    userAdditions.value = { categories: [], promptsByCategoryId: {} };
  }
}

function saveUserAdditions() {
  localStorage.setItem(PROMPT_LIST_STORAGE_KEY, JSON.stringify(userAdditions.value));
}

function addCategory() {
  const name = newCategory.value.name?.trim();
  if (!name) {
    ElMessage.warning('请输入分类名称');
    return;
  }
  const id = 'user_' + Date.now();
  userAdditions.value.categories.push({
    id,
    name,
    prompts: []
  });
  saveUserAdditions();
  newCategory.value.name = '';
  showAddCategory.value = false;
  ElMessage.success('分类已添加（仅保存在本机）');
}

function addPrompt() {
  const categoryId = newPrompt.value.categoryId;
  const text = newPrompt.value.text?.trim();
  if (!categoryId || !text) {
    ElMessage.warning('请选择分类并输入提示词');
    return;
  }
  const userCat = userAdditions.value.categories.find(c => c.id === categoryId);
  if (userCat) {
    userCat.prompts.push(text);
  } else {
    if (!userAdditions.value.promptsByCategoryId[categoryId]) {
      userAdditions.value.promptsByCategoryId[categoryId] = [];
    }
    userAdditions.value.promptsByCategoryId[categoryId].push(text);
  }
  saveUserAdditions();
  newPrompt.value = { categoryId: '', text: '' };
  showAddPrompt.value = false;
  ElMessage.success('提示词已添加（仅保存在本机）');
}

function copyPrompt(text: string) {
  navigator.clipboard.writeText(text).then(
    () => ElMessage.success('已复制到剪贴板'),
    () => ElMessage.error('复制失败')
  );
}

function deletePromptRow(row: TableRow) {
  if (!row.deletable) return;
  ElMessageBox.confirm('确定删除该条提示词？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    doDeletePrompt(row);
  }).catch(() => {});
}

function doDeletePrompt(row: TableRow) {
  if (row.source === 'file_user') {
    const arr = userAdditions.value.promptsByCategoryId[row.categoryId];
    if (arr) arr.splice(row.indexInSource, 1);
  } else if (row.source === 'user_cat') {
    const cat = userAdditions.value.categories.find(c => c.id === row.categoryId);
    if (cat) cat.prompts.splice(row.indexInSource, 1);
  }
  saveUserAdditions();
  ElMessage.success('已删除');
}

function confirmDeletePrompt() {
  if (!selectedDeleteRow.value) return;
  ElMessageBox.confirm('确定删除该条提示词？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    doDeletePrompt(selectedDeleteRow.value!);
    selectedDeleteRow.value = null;
    showDeletePrompt.value = false;
  }).catch(() => {});
}

function onSelectDeleteRow(row: TableRow | null) {
  selectedDeleteRow.value = row;
}

function confirmDeleteCategory() {
  if (!deleteCategoryId.value) return;
  ElMessageBox.confirm('删除分类会同时删除该分类下所有提示词，确定继续？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userAdditions.value.categories = userAdditions.value.categories.filter(c => c.id !== deleteCategoryId.value);
    saveUserAdditions();
    deleteCategoryId.value = '';
    showDeleteCategory.value = false;
    ElMessage.success('分类已删除');
  }).catch(() => {});
}

onMounted(() => {
  loadFromFile();
  loadUserAdditions();
});
</script>

<style scoped>
.prompt-manage {
  padding: 1.5rem;
  max-width: 960px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  color: var(--neutral-800);
  margin: 0 0 0.5rem 0;
}

.page-desc {
  font-size: 0.9rem;
  color: var(--neutral-600);
  margin: 0;
  line-height: 1.5;
}

.toolbar {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.75rem;
}

.table-wrap {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.dialog-hint {
  color: var(--neutral-600);
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}
</style>
