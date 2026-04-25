<template>
  <div class="main-layout">
    <!-- 简洁侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon :size="28" color="#4F46E5"><ChatDotRound /></el-icon>
        </div>
        <span class="sidebar-title">智能助手</span>
      </div>

      <nav class="sidebar-nav">
        <!-- 主导航 -->
        <div class="nav-section">
          <div
            v-for="item in mainNavItems"
            :key="item.path"
            class="nav-item"
            :class="{ active: route.path === item.path }"
            @click="navigateTo(item.path)"
          >
            <el-icon :size="20">
              <component :is="item.icon" />
            </el-icon>
            <span class="nav-label">{{ item.label }}</span>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="nav-divider"></div>

        <!-- 辅助导航 -->
        <div class="nav-section">
          <div
            v-for="item in secondaryNavItems"
            :key="item.path"
            class="nav-item"
            :class="{ active: route.path === item.path }"
            @click="navigateTo(item.path)"
          >
            <el-icon :size="18">
              <component :is="item.icon" />
            </el-icon>
            <span class="nav-label">{{ item.label }}</span>
          </div>
        </div>
      </nav>

      <!-- 底部设置 -->
      <div class="sidebar-footer">
        <div class="nav-item" @click="showSettings = true">
          <el-icon :size="18"><Setting /></el-icon>
          <span class="nav-label">设置</span>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 设置弹窗 -->
    <el-dialog
      v-model="showSettings"
      title="系统设置"
      width="500px"
      class="settings-dialog"
    >
      <div class="settings-content">
        <div class="setting-item">
          <div class="setting-label">模型配置</div>
          <div class="setting-desc">配置本地 Ollama 模型连接</div>
          <el-input
            v-model="settings.ollamaUrl"
            placeholder="http://localhost:11434"
            class="setting-input"
          >
            <template #prepend>Ollama地址</template>
          </el-input>
        </div>

        <div class="setting-item">
          <div class="setting-label">默认模型</div>
          <div class="setting-desc">选择默认使用的本地模型</div>
          <el-select v-model="settings.defaultModel" class="setting-input" style="width: 100%">
            <el-option
              v-for="model in availableModels"
              :key="model.value"
              :label="model.label"
              :value="model.value"
            />
          </el-select>
        </div>

        <div class="setting-item">
          <div class="setting-label">API 配置</div>
          <div class="setting-desc">Dify API 连接设置</div>
          <el-input
            v-model="settings.apiUrl"
            placeholder="http://localhost/v1"
            class="setting-input"
          >
            <template #prepend>API地址</template>
          </el-input>
          <el-input
            v-model="settings.apiKey"
            placeholder="app-xxxxxxxxxxxxxxxxxxx"
            class="setting-input"
            style="margin-top: 8px"
          >
            <template #prepend>API密钥</template>
          </el-input>
        </div>
      </div>

      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  ChatDotRound,
  EditPen,
  Document,
  Setting,
  Collection,
  Histogram
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const showSettings = ref(false);

// 主导航项
const mainNavItems = [
  { path: '/', label: '对话', icon: ChatDotRound },
  { path: '/text-edit', label: '文本整编', icon: EditPen },
  { path: '/prompts', label: '提示词库', icon: Collection },
];

// 辅助导航项
const secondaryNavItems = [
  { path: '/history', label: '历史记录', icon: Histogram },
];

// 设置
const settings = reactive({
  ollamaUrl: 'http://localhost:11434',
  defaultModel: 'qwen2.5:1.8b',
  apiUrl: 'http://localhost/v1',
  apiKey: '',
});

// 可用模型列表
const availableModels = [
  { label: 'Qwen 2.5 1.8B', value: 'qwen2.5:1.8b' },
  { label: 'Qwen 2.5 3B', value: 'qwen2.5:3b' },
  { label: 'Qwen 2.5 7B', value: 'qwen2.5:7b' },
  { label: 'Llama 3.2 1B', value: 'llama3.2:1b' },
  { label: 'Llama 3.2 3B', value: 'llama3.2:3b' },
  { label: 'Phi-4', value: 'phi4' },
  { label: 'DeepSeek R1 1.5B', value: 'deepseek-r1:1.5b' },
];

// 从本地存储加载设置
onMounted(() => {
  const saved = localStorage.getItem('app_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(settings, parsed);
    } catch (e) {
      console.error('加载设置失败:', e);
    }
  }
});

const navigateTo = (path: string) => {
  router.push(path);
};

const saveSettings = () => {
  localStorage.setItem('app_settings', JSON.stringify(settings));
  showSettings.value = false;
  ElMessage.success('设置已保存');
};
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: var(--neutral-50);
}

/* 简洁侧边栏 */
.sidebar {
  width: 200px;
  flex-shrink: 0;
  background-color: white;
  border-right: 1px solid var(--neutral-100);
  display: flex;
  flex-direction: column;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.02);
}

.sidebar-header {
  padding: 1.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--neutral-100);
}

.logo {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--neutral-800);
  letter-spacing: -0.02em;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.75rem;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-divider {
  height: 1px;
  background-color: var(--neutral-100);
  margin: 1rem 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--neutral-600);
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-item:hover {
  background-color: var(--neutral-50);
  color: var(--neutral-800);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--primary-bg) 0%, rgba(99, 102, 241, 0.08) 100%);
  color: var(--primary-color);
}

.nav-label {
  font-size: 0.9rem;
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--neutral-100);
}

.main-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.content-area > * {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 设置弹窗样式 */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  padding: 0.5rem 0;
}

.setting-label {
  font-weight: 600;
  color: var(--neutral-800);
  margin-bottom: 0.25rem;
}

.setting-desc {
  font-size: 0.8rem;
  color: var(--neutral-500);
  margin-bottom: 0.75rem;
}

.setting-input {
  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }

  .sidebar-header {
    justify-content: center;
    padding: 1rem 0.5rem;
  }

  .sidebar-title,
  .nav-label {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 0.75rem;
  }
}
</style>
