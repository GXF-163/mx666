import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '../views/MainLayout.vue';
import ChatView from '../views/ChatView.vue';
import PromptManageView from '../views/PromptManageView.vue';
import TextEditView from '../views/TextEditView.vue';

// 简单历史记录页面组件
const HistoryView = {
  template: `
    <div class="history-view">
      <h2>历史记录</h2>
      <el-empty description="历史记录功能开发中..." />
    </div>
  `
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'home', component: ChatView },
      { path: 'prompts', name: 'prompts', component: PromptManageView },
      { path: 'text-edit', name: 'text-edit', component: TextEditView },
      { path: 'history', name: 'history', component: HistoryView }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
