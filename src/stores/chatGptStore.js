import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

export const useChatGptStore = defineStore('chatGptStore', () => {
  // Дефолтные значения
  const defaultPrompts = {
    adTitle: {
      systemPrompt:
        'You are a expert marketing copywriter. Generate compelling, short ad titles that grab attention and drive clicks. Always respond with just the title, no quotes or additional text.',
      userPromptTemplate:
        'Generate a headline / ad title for social media ad on topic "{offer}" for {country} audience on {trafficSource} platform. Maximum 50 characters. Return only the title without quotes or extra text.',
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
    keywords: {
      systemPrompt:
        'You are an expert SEO and PPC specialist. Generate high-value, expensive keywords that would have high cost-per-click in Google Ads. Focus on commercial intent keywords. Always respond with just the keywords separated by commas, no additional text.',
      userPromptTemplate:
        'Give me 6 most expensive keywords from Google Keywords Planner related to: "{inputWords}". Target country: {country}. Traffic source: {trafficSource}. Return only the keywords separated by commas, without any additional text or explanations. Do NOT analyze URLs or websites. Focus only on the topic keywords provided. IMPORTANT: Replace the country name with the code {Country} in ALL keywords. For example, if the country is Algeria, write "nurse jobs {Country}" instead of "nurse jobs Algeria". Also use these location codes: {City}, {in City}, {Country}, {in Country}, {State}, {in State}.',
      settings: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 150,
      },
      // UI состояния для тестирования
      testAnswer: '',
      testError: '',
      isLoading: false,
      testDetails: null,
    },
    url: {
      systemPrompt:
        'You are an expert SEO and PPC specialist. Generate high-value, expensive keywords based on website URLs and content. Focus on commercial intent keywords that would have high cost-per-click in Google Ads. Always respond with just the keywords separated by commas, no additional text.',
      userPromptTemplate:
        'Analyze the content and topic of this URL: "{url}" and give me 6 most expensive keywords from Google Keywords Planner based on the website\'s content and niche. {country ? `Target country: {country}. ` : ""}{trafficSource ? `Traffic source: {trafficSource}. ` : ""}Focus on high commercial intent keywords that would be expensive in Google Ads for this type of website. Return only the keywords separated by commas, without any additional text or explanations. IMPORTANT: Replace the country name "{country}" with the code {Country} in ALL keywords. For example, if the country is Algeria, write "nurse jobs {Country}" instead of "nurse jobs Algeria". Also use these location codes: {City}, {in City}, {Country}, {in Country}, {State}, {in State}.',
      settings: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 150,
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
          keywords: {
            ...defaultPrompts.keywords,
            ...parsed.keywords,
          },
          url: {
            ...defaultPrompts.url,
            ...parsed.url,
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
    prompts.adTitle.testError = ''
    prompts.adTitle.testDetails = null
    console.log('🔄 AdTitle поля сброшены к дефолтным значениям')
  }

  // Функция сброса Keywords полей к дефолтным значениям
  const resetKeywordsFields = () => {
    prompts.keywords.systemPrompt = ''
    prompts.keywords.userPromptTemplate = ''
    prompts.keywords.testAnswer = ''
    prompts.keywords.testError = ''
    prompts.keywords.testDetails = null
    console.log('🔄 Keywords поля сброшены к дефолтным значениям')
  }

  // Функция сброса URL полей к дефолтным значениям
  const resetUrlFields = () => {
    prompts.url.systemPrompt = ''
    prompts.url.userPromptTemplate = ''
    prompts.url.testAnswer = ''
    prompts.url.testError = ''
    prompts.url.testDetails = null
    console.log('🔄 URL поля сброшены к дефолтным значениям')
  }

  return {
    prompts,
    resetToDefaults,
    clearLocalStorage,
    savePromptsToLS,
    loadPromptsFromLS,
    resetAdTitleFields,
    resetKeywordsFields,
    resetUrlFields,
  }
})
