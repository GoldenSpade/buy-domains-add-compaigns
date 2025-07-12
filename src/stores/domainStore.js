import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useDomainStore = defineStore('domain', () => {
  const domains = ref(loadDomainsFromLocalStorage())

  // Добавить домен
  function addDomain(name) {
    if (!domains.value.find((d) => d.name === name)) {
      domains.value.push({ name, status: 'pending', message: '' })
    }
  }

  // Удалить домен
  function removeDomain(name) {
    domains.value = domains.value.filter((d) => d.name !== name)
  }

  // Очистить все
  function clearDomains() {
    domains.value = []
  }

  // Загрузка из localStorage
  function loadDomainsFromLocalStorage() {
    try {
      const saved = localStorage.getItem('domains')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('⚠️ Ошибка при загрузке из localStorage:', e)
      return []
    }
  }

  // Сохраняем в localStorage при каждом изменении
  watch(
    domains,
    (newVal) => {
      localStorage.setItem('domains', JSON.stringify(newVal))
    },
    { deep: true }
  )

  return { domains, addDomain, removeDomain, clearDomains }
})
