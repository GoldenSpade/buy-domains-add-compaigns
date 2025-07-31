import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTonicStore = defineStore('tonic', () => {
  const cards = ref([])
  const activeCards = ref([]) // Картки з отриманим статусом

  // Завантаження з localStorage при ініціалізації
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('tonic-active-cards')
      if (stored) {
        activeCards.value = JSON.parse(stored)
        console.log('📥 Завантажено з localStorage:', activeCards.value.length, 'активних карток')
      }
    } catch (error) {
      console.error('❌ Помилка завантаження з localStorage:', error)
      activeCards.value = []
    }
  }

  // Збереження в localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('tonic-active-cards', JSON.stringify(activeCards.value))
      console.log('💾 Збережено в localStorage:', activeCards.value.length, 'активних карток')
    } catch (error) {
      console.error('❌ Помилка збереження в localStorage:', error)
    }
  }

  const addCard = (card) => {
    cards.value.push(card)
  }

  const clearCards = () => {
    cards.value = []
  }

  const removeCard = (cardToRemove) => {
    cards.value = cards.value.filter(
      (card) =>
        !(
          card.offer === cardToRemove.offer &&
          card.country === cardToRemove.country &&
          card.buyer === cardToRemove.buyer &&
          card.trafficSource === cardToRemove.trafficSource
        )
    )
  }

  // Переміщення картки з лівої колонки в праву (активні)
  const moveToActive = (card) => {
    // Видаляємо з основного списку
    removeCard(card)

    // Перевіряємо чи вже існує в активних
    const exists = activeCards.value.find(
      (activeCard) =>
        activeCard.offer === card.offer &&
        activeCard.country === card.country &&
        activeCard.buyer === card.buyer &&
        activeCard.trafficSource === card.trafficSource
    )

    if (!exists) {
      // Додаємо до активних з поточним часом
      const activeCard = {
        ...card,
        movedToActiveAt: Date.now(),
        lastStatusCheck: Date.now(),
      }

      activeCards.value.push(activeCard)
      saveToStorage()

      console.log('➡️ Картку переміщено в активні:', {
        offer: card.offer,
        country: card.country,
        buyer: card.buyer,
      })
    }
  }

  // Оновлення статусу активної картки
  const updateActiveCardStatus = (cardKey, statusData) => {
    const index = activeCards.value.findIndex((card) => {
      const key = `${card.offer}-${card.country}-${card.buyer}-${card.trafficSource}`
      return key === cardKey
    })

    if (index !== -1) {
      activeCards.value[index] = {
        ...activeCards.value[index],
        ...statusData,
        lastStatusCheck: Date.now(),
      }
      saveToStorage()
    }
  }

  // Видалення з активних карток
  const removeActiveCard = (cardToRemove) => {
    activeCards.value = activeCards.value.filter(
      (card) =>
        !(
          card.offer === cardToRemove.offer &&
          card.country === cardToRemove.country &&
          card.buyer === cardToRemove.buyer &&
          card.trafficSource === cardToRemove.trafficSource
        )
    )
    saveToStorage()
  }

  // Очищення активних карток
  const clearActiveCards = () => {
    activeCards.value = []
    localStorage.removeItem('tonic-active-cards')
  }

  // Ініціалізація store
  loadFromStorage()

  return {
    cards,
    activeCards,
    addCard,
    clearCards,
    removeCard,
    moveToActive,
    updateActiveCardStatus,
    removeActiveCard,
    clearActiveCards,
    loadFromStorage,
  }
})
