import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/pages/Home.vue'
import PageDomainsSedoAFD from '@/pages/PageDomainsSedoAFD.vue'
import PageTonicClickflare from '@/pages/PageTonicClickflare.vue'

const routes = [
  {
    path: '/',
    component: Home,
    name: 'home',
    meta: { title: 'Панель управління | Ласкаво просимо! Оберіть розділ щоб розпочати роботу.' },
  },
  {
    path: '/domains-sedo-afd',
    component: PageDomainsSedoAFD,
    name: 'PageDomainsSedoAFD',
    meta: { title: 'Створення кампаній Sedo AFD' },
  },
  {
    path: '/tonic-offers',
    component: PageTonicClickflare,
    name: 'PageTonicClickflare',
    meta: { title: 'Створення кампаній Tonic AFD' },
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
