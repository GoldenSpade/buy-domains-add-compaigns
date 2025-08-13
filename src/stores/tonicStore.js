import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useTonicStore = defineStore('tonic', () => {
  const cards = ref([])
  const completedCards = ref([])

  // Завантажуємо cards з localStorage при ініціалізації
  const loadCardsFromLS = () => {
    try {
      const saved = localStorage.getItem('tonicCards')
      if (saved) {
        const parsed = JSON.parse(saved)
        cards.value = Array.isArray(parsed) ? parsed : []
        console.log(`📂 Завантажено ${cards.value.length} карточок з localStorage`)
      }
    } catch (error) {
      console.warn('⚠️ Помилка завантаження cards з localStorage:', error)
      cards.value = []
    }
  }

  // Зберігаємо cards в localStorage
  const saveCardsToLS = () => {
    try {
      localStorage.setItem('tonicCards', JSON.stringify(cards.value))
      console.log(`💾 Збережено ${cards.value.length} карточок у localStorage`)
    } catch (error) {
      console.warn('⚠️ Помилка збереження cards в localStorage:', error)
    }
  }

  // Завантажуємо completedCards з localStorage при ініціалізації
  const loadCompletedCardsFromLS = () => {
    try {
      const saved = localStorage.getItem('tonicCompletedCards')
      if (saved) {
        const parsed = JSON.parse(saved)
        completedCards.value = Array.isArray(parsed) ? parsed : []
        console.log(
          `📂 Завантажено ${completedCards.value.length} завершених карточок з localStorage`
        )
      }
    } catch (error) {
      console.warn('⚠️ Помилка завантаження completedCards з localStorage:', error)
      completedCards.value = []
    }
  }

  // Зберігаємо completedCards в localStorage
  const saveCompletedCardsToLS = () => {
    try {
      localStorage.setItem('tonicCompletedCards', JSON.stringify(completedCards.value))
      console.log(`💾 Збережено ${completedCards.value.length} завершених карточок у localStorage`)
    } catch (error) {
      console.warn('⚠️ Помилка збереження completedCards в localStorage:', error)
    }
  }

  // Автоматично зберігаємо при зміні cards
  watch(cards, saveCardsToLS, { deep: true })

  // Автоматично зберігаємо при зміні completedCards
  watch(completedCards, saveCompletedCardsToLS, { deep: true })

  // Завантажуємо дані при створенні store
  loadCardsFromLS()
  loadCompletedCardsFromLS()

  const addCard = (card) => {
    cards.value.push(card)
    // saveCardsToLS() викликається автоматично через watch
  }

  const clearCards = () => {
    cards.value = []
    // saveCardsToLS() викликається автоматично через watch
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
    // saveCardsToLS() викликається автоматично через watch
  }

  // Нові методи для роботи з завершеними карточками
  const moveCardToCompleted = (card) => {
    // Видаляємо з основних карточок
    cards.value = cards.value.filter((c) => c.__id !== card.__id)

    // Додаємо в завершені
    completedCards.value.push({ ...card })

    console.log(`✅ Карточка "${card.adTitle}" переміщена в завершені`)
    // saveCardsToLS() і saveCompletedCardsToLS() викликаються автоматично через watch
  }

  const removeCompletedCard = (cardToRemove) => {
    completedCards.value = completedCards.value.filter((c) => c.__id !== cardToRemove.__id)
    console.log(`🗑️ Завершена карточка "${cardToRemove.adTitle}" видалена`)
    // saveCompletedCardsToLS() викликається автоматично через watch
  }

  // Очистити всі завершені карточки
  const clearCompletedCards = () => {
    completedCards.value = []
    console.log('🗑️ Всі завершені карточки видалені')
    // saveCompletedCardsToLS() викликається автоматично через watch
  }

  // Перевірка готовності карточки для переміщення
  const isCardCompleted = (card) => {
    return !!(
      card.resId &&
      card.resUrl &&
      card.clickflareId &&
      card.clickflareCampaignId &&
      card.clickflareCampaignUrl &&
      !card.error &&
      !card.clickFlareError
    )
  }

  // Функція для ручного очищення localStorage (для відладки)
  const clearAllLocalStorage = () => {
    try {
      localStorage.removeItem('tonicCards')
      localStorage.removeItem('tonicCompletedCards')
      cards.value = []
      completedCards.value = []
      console.log('🗑️ Всі дані з localStorage очищені')
    } catch (error) {
      console.warn('⚠️ Помилка очищення localStorage:', error)
    }
  }

  return {
    cards,
    completedCards,
    addCard,
    clearCards,
    removeCard,
    moveCardToCompleted,
    removeCompletedCard,
    clearCompletedCards,
    isCardCompleted,
    loadCardsFromLS,
    saveCardsToLS,
    loadCompletedCardsFromLS,
    saveCompletedCardsToLS,
    clearAllLocalStorage,
  }
})
