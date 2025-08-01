import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useTonicStore = defineStore('tonic', () => {
  const cards = ref([])
  const completedCards = ref([])

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

  // Автоматически сохраняем при изменении completedCards
  watch(completedCards, saveCompletedCardsToLS, { deep: true })

  // Загружаем данные при создании store
  loadCompletedCardsFromLS()

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

  // Новые методы для работы с завершенными карточками
  const moveCardToCompleted = (card) => {
    // Удаляем из основных карточек
    cards.value = cards.value.filter((c) => c.__id !== card.__id)

    // Добавляем в завершенные
    completedCards.value.push({ ...card })

    console.log(`✅ Карточка "${card.adTitle}" перемещена в завершенные`)
    // saveCompletedCardsToLS() вызовется автоматически через watch
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
    loadCompletedCardsFromLS,
    saveCompletedCardsToLS,
  }
})
