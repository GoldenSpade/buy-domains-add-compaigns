import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/pages/Home.vue'
import PageDomainsSedoAFD from '@/pages/PageDomainsSedoAFD.vue'
import PageTonicClickflare from '@/pages/PageTonicClickflare.vue'
import PagePromptsManager from '@/pages/PagePromptsManager.vue'
import PageGoogleKeywordsPlanner from '@/pages/PageGoogleKeywordsPlanner.vue'
import SingleOfferEditing from '@/pages/PageSingleOfferEditing.vue'

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
  {
    path: '/prompts-manager',
    component: PagePromptsManager,
    name: 'PromptsManager',
    meta: { title: 'Prompts Manager' },
  },
  {
    path: '/google-keywords-planner',
    component: PageGoogleKeywordsPlanner,
    name: 'PageGoogleKeywordsPlanner',
    meta: { title: 'Google Keywords Planner' },
  },
  {
    path: '/single-offer-editing',
    component: SingleOfferEditing,
    name: 'SingleOfferEditing',
    meta: { title: 'Single Offer Editing' },
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
