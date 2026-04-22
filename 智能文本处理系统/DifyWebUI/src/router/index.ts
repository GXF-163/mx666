import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '../views/MainLayout.vue';
import ChatView from '../views/ChatView.vue';
import PromptManageView from '../views/PromptManageView.vue';
import TextEditView from '../views/TextEditView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'home', component: ChatView },
      { path: 'prompts', name: 'prompts', component: PromptManageView },
      { path: 'text-edit', name: 'text-edit', component: TextEditView }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
