<template>
  <div class="main-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">智能文本处理系统</span>
      </div>
      <nav class="sidebar-nav">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          @select="handleMenuSelect"
        >
          <!-- 任务管理 -->
          <el-sub-menu index="1">
            <template #title>
              <el-icon><FolderOpened /></el-icon>
              <span>任务管理</span>
            </template>
            <el-menu-item index="1-1" @click="navigateTo('/')">
              <el-icon><ChatDotRound /></el-icon>
              <span>对话交互</span>
            </el-menu-item>
            <el-menu-item index="1-2" @click="navigateTo('/text-edit')">
              <el-icon><EditPen /></el-icon>
              <span>文本整编</span>
            </el-menu-item>
            <el-menu-item index="1-3">
              <el-icon><Upload /></el-icon>
              <span>文件上传</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 模型管理 -->
          <el-sub-menu index="2">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>模型管理</span>
            </template>
            <el-menu-item index="2-1">
              <el-icon><Connection /></el-icon>
              <span>模型配置</span>
            </el-menu-item>
            <el-menu-item index="2-2">
              <el-icon><Monitor /></el-icon>
              <span>运行状态</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 其他管理 -->
          <el-sub-menu index="3">
            <template #title>
              <el-icon><Tools /></el-icon>
              <span>其他管理</span>
            </template>
            <el-menu-item index="3-1" @click="navigateTo('/prompts')">
              <el-icon><Document /></el-icon>
              <span>提示词库</span>
            </el-menu-item>
            <el-menu-item index="3-2">
              <el-icon><Clock /></el-icon>
              <span>历史记录</span>
            </el-menu-item>
            <el-menu-item index="3-3">
              <el-icon><InfoFilled /></el-icon>
              <span>系统设置</span>
            </el-menu-item>
            <el-menu-item index="3-4">
              <el-icon><QuestionFilled /></el-icon>
              <span>帮助中心</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </nav>
    </aside>
    <main class="main-content">
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  HomeFilled,
  Document,
  EditPen,
  FolderOpened,
  ChatDotRound,
  Upload,
  Setting,
  Connection,
  Monitor,
  Tools,
  Clock,
  InfoFilled,
  QuestionFilled
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

const activeMenu = computed(() => {
  if (route.path === '/') return '1-1';
  if (route.path === '/text-edit') return '1-2';
  if (route.path === '/prompts') return '3-1';
  return '1-1';
});

const handleMenuSelect = (index: string) => {
  console.log('Selected menu:', index);
};

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: var(--neutral-50);
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  background-color: #fff;
  border-right: 1px solid var(--neutral-200);
  display: flex;
  flex-direction: column;
  box-shadow: 1px 0 4px rgba(0,0,0,0.04);
}

.sidebar-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--neutral-100);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  letter-spacing: 0.5px;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.sidebar-menu {
  border-right: none;
}

:deep(.el-sub-menu__title) {
  padding-left: 1.25rem !important;
  height: 48px;
  line-height: 48px;
  font-weight: 500;
  color: var(--neutral-700);
}

:deep(.el-sub-menu__title:hover) {
  background-color: var(--primary-bg);
  color: var(--primary-color);
}

:deep(.el-menu-item) {
  padding-left: 3.5rem !important;
  height: 42px;
  line-height: 42px;
  font-size: 0.9rem;
  color: var(--neutral-600);
}

:deep(.el-menu-item:hover) {
  background-color: var(--primary-bg);
  color: var(--primary-color);
}

:deep(.el-menu-item.is-active) {
  background-color: var(--primary-bg);
  color: var(--primary-color);
  font-weight: 500;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

:deep(.el-sub-menu__title .el-icon) {
  margin-right: 0.75rem;
  font-size: 1.2rem;
}

:deep(.el-sub-menu .el-menu) {
  background-color: var(--neutral-50);
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
