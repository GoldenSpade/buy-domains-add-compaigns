import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useTonicStore = defineStore('tonic', () => {
  const cards = ref([])
  const completedCards = ref([])

  // Загружаем cards из localStorage при инициализации
  const loadCardsFromLS = () => {
    try {
      const saved = localStorage.getItem('tonicCards')
      if (saved) {
        const parsed = JSON.parse(saved)
        cards.value = Array.isArray(parsed) ? parsed : []
        console.log(`📂 Загружено ${cards.value.length} карточек из localStorage`)
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки cards из localStorage:', error)
      cards.value = []
    }
  }

  // Сохраняем cards в localStorage
  const saveCardsToLS = () => {
    try {
      localStorage.setItem('tonicCards', JSON.stringify(cards.value))
      console.log(`💾 Сохранено ${cards.value.length} карточек в localStorage`)
    } catch (error) {
      console.warn('⚠️ Ошибка сохранения cards в localStorage:', error)
    }
  }

  // Загружаем completedCards из localStorage при инициализации
  const loadCompletedCardsFromLS = () => {
    try {
      const saved = localStorage.getItem('tonicCompletedCards')
      if (saved) {
        const parsed = JSON.parse(saved)
        completedCards.value = Array.isArray(parsed) ? parsed : []
        console.log(
          `📂 Загружено ${completedCards.value.length} завершенных карточек из localStorage`
        )
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки completedCards из localStorage:', error)
      completedCards.value = []
    }
  }

  // Сохраняем completedCards в localStorage
  const saveCompletedCardsToLS = () => {
    try {
      localStorage.setItem('tonicCompletedCards', JSON.stringify(completedCards.value))
      console.log(`💾 Сохранено ${completedCards.value.length} завершенных карточек в localStorage`)
    } catch (error) {
      console.warn('⚠️ Ошибка сохранения completedCards в localStorage:', error)
    }
  }

  // Автоматически сохраняем при изменении cards
  watch(cards, saveCardsToLS, { deep: true })

  // Автоматически сохраняем при изменении completedCards
  watch(completedCards, saveCompletedCardsToLS, { deep: true })

  // Загружаем данные при создании store
  loadCardsFromLS()
  loadCompletedCardsFromLS()

  const addCard = (card) => {
    cards.value.push(card)
    // saveCardsToLS() вызовется автоматически через watch
  }

  const clearCards = () => {
    cards.value = []
    // saveCardsToLS() вызовется автоматически через watch
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
    // saveCardsToLS() вызовется автоматически через watch
  }

  // Новые методы для работы с завершенными карточками
  const moveCardToCompleted = (card) => {
    // Удаляем из основных карточек
    cards.value = cards.value.filter((c) => c.__id !== card.__id)

    // Добавляем в завершенные
    completedCards.value.push({ ...card })

    console.log(`✅ Карточка "${card.adTitle}" перемещена в завершенные`)
    // saveCardsToLS() и saveCompletedCardsToLS() вызовутся автоматически через watch
  }

  const removeCompletedCard = (cardToRemove) => {
    completedCards.value = completedCards.value.filter((c) => c.__id !== cardToRemove.__id)
    console.log(`🗑️ Завершенная карточка "${cardToRemove.adTitle}" удалена`)
    // saveCompletedCardsToLS() вызовется автоматически через watch
  }

  // Очистить все завершенные карточки
  const clearCompletedCards = () => {
    completedCards.value = []
    console.log('🗑️ Все завершенные карточки удалены')
    // saveCompletedCardsToLS() вызовется автоматически через watch
  }

  // Проверка готовности карточки для перемещения
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

  // Функция для ручной очистки localStorage (для отладки)
  const clearAllLocalStorage = () => {
    try {
      localStorage.removeItem('tonicCards')
      localStorage.removeItem('tonicCompletedCards')
      cards.value = []
      completedCards.value = []
      console.log('🗑️ Все данные из localStorage очищены')
    } catch (error) {
      console.warn('⚠️ Ошибка очистки localStorage:', error)
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
