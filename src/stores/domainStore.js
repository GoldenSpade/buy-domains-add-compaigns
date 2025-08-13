import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useDomainStore = defineStore('domain', () => {
  const domains = ref(loadDomainsFromLocalStorage())

  const selectedSedoAccount = ref('TT1')
  // Додати домен
  function addDomain(name) {
    if (!domains.value.find((d) => d.name === name)) {
      domains.value.push({ name, status: 'pending', message: '' })
    }
  }

  // Видалити домен
  function removeDomain(name) {
    domains.value = domains.value.filter((d) => d.name !== name)
  }

  // Очистити все
  function clearDomains() {
    domains.value = []
  }

  // Завантаження з localStorage
  function loadDomainsFromLocalStorage() {
    try {
      const saved = localStorage.getItem('domains')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('⚠️ Помилка при завантаженні з localStorage:', e)
      return []
    }
  }

  // Зберігаємо в localStorage при кожній зміні
  watch(
    domains,
    (newVal) => {
      localStorage.setItem('domains', JSON.stringify(newVal))
    },
    { deep: true }
  )

  return { domains, addDomain, removeDomain, clearDomains, selectedSedoAccount }
})
