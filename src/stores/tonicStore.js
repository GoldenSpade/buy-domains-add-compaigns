import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'tonic_cards'

export const useTonicStore = defineStore('tonic', () => {
  const cards = ref(loadFromLocalStorage())

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      console.warn('⚠️ Не вдалося прочитати localStorage:', e)
      return []
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

  return {
    cards,
    addCard,
    clearCards,
    removeCard,
  }
})
