import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/pages/Home.vue'
import domainsSedoAFD from '@/pages/DomainsSedoAFD.vue'

const routes = [
  {
    path: '/',
    component: Home,
    name: 'Home',
    meta: { title: 'Панель управління | Ласкаво просимо! Оберіть розділ щоб розпочати роботу.' },
  },
  {
    path: '/domains-sedo-afd',
    component: domainsSedoAFD,
    name: 'domainsSedoAFD',
    meta: { title: 'Створення кампаній Sedo AFD' },
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
