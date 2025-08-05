import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

export const useChatGptStore = defineStore('chatGptStore', () => {
  // Дефолтные значения
  const defaultPrompts = {
    adTitle: {
      systemPrompt:
        'You are a expert marketing copywriter. Generate compelling, short ad titles that grab attention and drive clicks. Always respond with just the title, no quotes or additional text.',
      userPromptTemplate:
        'Generate a headline / ad title for social media ad on [topic] for [country] audience on [traffic source] platform. Maximum 50 characters. Return only the title without quotes or extra text.',
      settings: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 100,
      },
      // UI состояния для тестирования
      testAnswer: '',
      testError: '',
      isLoading: false,
      testDetails: null,
    },
  }

  // Функция загрузки из localStorage
  const loadPromptsFromLS = () => {
    try {
      const saved = localStorage.getItem('chatGptPrompts')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Объединяем сохраненные данные с дефолтными (на случай добавления новых полей)
        return {
          ...defaultPrompts,
          ...parsed,
          adTitle: {
            ...defaultPrompts.adTitle,
            ...parsed.adTitle,
          },
        }
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки промптов из localStorage:', error)
    }
    return defaultPrompts
  }

  // Функция сохранения в localStorage
  const savePromptsToLS = () => {
    try {
      localStorage.setItem('chatGptPrompts', JSON.stringify(prompts))
      console.log('💾 ChatGPT промпты сохранены в localStorage')
    } catch (error) {
      console.warn('⚠️ Ошибка сохранения промптов в localStorage:', error)
    }
  }

  // Инициализируем prompts с данными из localStorage или дефолтными
  const prompts = reactive(loadPromptsFromLS())

  // Автоматически сохраняем при изменении prompts
  watch(prompts, savePromptsToLS, { deep: true })

  // Функция сброса к дефолтным значениям
  const resetToDefaults = () => {
    Object.assign(prompts, defaultPrompts)
    console.log('🔄 Промпты сброшены к дефолтным значениям')
  }

  // Функция очистки localStorage (для отладки)
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem('chatGptPrompts')
      Object.assign(prompts, defaultPrompts)
      console.log('🗑️ localStorage для ChatGPT промптов очищен')
    } catch (error) {
      console.warn('⚠️ Ошибка очистки localStorage:', error)
    }
  }

  // Функция сброса AdTitle полей к дефолтным значениям
  const resetAdTitleFields = () => {
    prompts.adTitle.systemPrompt = ''
    prompts.adTitle.userPromptTemplate = ''
    prompts.adTitle.testAnswer = ''


    
    prompts.adTitle.testDetails = null
    console.log('🔄 AdTitle поля сброшены к дефолтным значениям')
  }

  return {
    prompts,
    resetToDefaults,
    clearLocalStorage,
    savePromptsToLS,
    loadPromptsFromLS,
    resetAdTitleFields,
  }
})
