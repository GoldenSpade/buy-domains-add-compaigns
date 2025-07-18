import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/pages/Home.vue'
import domainsSedoAFD from '@/pages/domainsSedoAFD.vue'
import createTonicCampaign from '@/pages/createTonicCampaign.vue'

const routes = [
  {
    path: '/',
    component: Home,
    name: 'home',
    meta: { title: 'Панель управління | Ласкаво просимо! Оберіть розділ щоб розпочати роботу.' },
  },
  {
    path: '/domains-sedo-afd',
    component: domainsSedoAFD,
    name: 'domainsSedoAFD',
    meta: { title: 'Створення кампаній Sedo AFD' },
  },
  {
    path: '/tonic-campaign', // 🆕
    component: createTonicCampaign,
    name: 'createTonicCampaign',
    meta: { title: 'Створення кампаній Tonic' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  const defaultTitle = 'Vue App title'
  document.title = to.meta.title || defaultTitle
})

export default router
