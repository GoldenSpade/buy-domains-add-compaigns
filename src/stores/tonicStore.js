import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useTonicStore = defineStore('tonic', () => {
  const cards = ref([])

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
