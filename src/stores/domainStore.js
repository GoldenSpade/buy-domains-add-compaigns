import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDomainStore = defineStore('domain', () => {
  const domain = ref('')

  return { domain }
})
