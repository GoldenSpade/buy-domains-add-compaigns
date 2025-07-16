import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/pages/Home.vue'
import domainsSedoAFD from '@/pages/domainsSedoAFD.vue'

const routes = [
  {
    path: '/',
    component: Home,
    name: 'Home'
  },
  {
    path: '/domains-sedo-afd',
    component: domainsSedoAFD,
    name: 'domainsSedoAFDome'
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
