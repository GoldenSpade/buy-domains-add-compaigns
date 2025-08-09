import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { useChatGptStore } from './chatGptStore'

export const useSingleOfferStore = defineStore('singleOffer', () => {
  // Основные состояния
  const selectedTrafficSource = ref('TikTok')
  const selectedCampaign = ref('')
  const campaigns = ref([])
  const isLoadingCampaigns = ref(false)

  // Keywords состояние
  const showKeywords = ref(false)
  const keywords = reactive({
    keyword1: '',
    keyword2: '',
    keyword3: '',
    keyword4: '',
    keyword5: '',
    keyword6: '',
  })

  // URL и keyword inputs
  const urlInput = ref('')
  const keywordInput = ref('')

  // Функции
  const toggleKeywords = () => {
    showKeywords.value = !showKeywords.value
  }

  const resetKeywords = () => {
    Object.keys(keywords).forEach((key) => {
      keywords[key] = ''
    })
  }

  const clearAllInputs = () => {
    urlInput.value = ''
    keywordInput.value = ''
    resetKeywords()
  }

  // Функция загрузки кампаний
  const fetchCampaigns = async () => {
    const source = selectedTrafficSource.value === 'Meta' ? 'Facebook' : 'TikTok'
    if (!source) return

    isLoadingCampaigns.value = true
    campaigns.value = []
    selectedCampaign.value = ''

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tonic/campaigns?trafficSource=${source}`
      )
      const data = await resp.json()

      if (resp.ok && Array.isArray(data.campaigns)) {
        campaigns.value = data.campaigns
        console.log(`Загружено ${campaigns.value.length} кампаний для ${source}`)
      } else {
        console.error('❌ Error loading campaigns:', data)
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки кампаний:', err)
    } finally {
      isLoadingCampaigns.value = false
    }
  }

  // Функция загрузки ключевых слов кампании
  const fetchCampaignKeywords = async (campaignId) => {
    if (!campaignId || !selectedTrafficSource.value) return

    try {
      const source = selectedTrafficSource.value === 'Meta' ? 'Facebook' : 'TikTok'

      const resp = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/tonic/campaign-keywords?campaignId=${campaignId}&trafficSource=${source}`
      )
      const data = await resp.json()

      if (resp.ok && data.success) {
        // Очищаем все ключевые слова
        resetKeywords()

        // Заполняем ключевыми словами из API
        data.keywords.forEach((keyword, index) => {
          if (index < 6) {
            // Максимум 6 ключевых слов
            keywords[`keyword${index + 1}`] = keyword
          }
        })

        console.log(`Загружено ${data.keywords.length} ключевых слов для кампании ${campaignId}`)
      } else {
        console.error('❌ Error loading campaign keywords:', data)
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки ключевых слов кампании:', err)
    }
  }

  // Генерация ключевых слов по URL
  const generateKeywordsFromUrl = async () => {
    if (!urlInput.value.trim()) {
      console.warn('⚠️ URL не введен')
      return
    }

    if (!selectedCampaign.value) {
      console.warn('⚠️ Кампания не выбрана')
      return
    }

    try {
      const chatGptStore = useChatGptStore()
      const source = selectedTrafficSource.value === 'Meta' ? 'Facebook' : 'TikTok'

      console.log(`🌐 Генеруємо ключові слова для URL: "${urlInput.value}"`)

      const requestBody = {
        url: urlInput.value.trim(),
        country: selectedCampaign.value.country,
        trafficSource: source,
        promptSettings: chatGptStore.prompts.url,
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/chatgpt/generate-keywords-from-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      const result = await response.json()

      if (response.ok && result.success && result.data) {
        const keywordsList = result.data.keywords.split(',').map((kw) => kw.trim())

        // Очищаем и заполняем keywords
        resetKeywords()
        keywordsList.forEach((keyword, index) => {
          if (index < 6) {
            keywords[`keyword${index + 1}`] = keyword
          }
        })

        // Показываем секцию keywords если скрыта
        if (!showKeywords.value) {
          showKeywords.value = true
        }

        console.log(`✅ Ключові слова по URL згенеровано: "${result.data.keywords}"`)
      } else {
        throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`❌ Помилка генерації ключових слів по URL:`, error)
    }
  }

  // Генерация ключевых слов по введенным словам
  const generateKeywordsFromWords = async () => {
    if (!keywordInput.value.trim()) {
      console.warn('⚠️ Ключевое слово не введено')
      return
    }

    if (!selectedCampaign.value) {
      console.warn('⚠️ Кампания не выбрана')
      return
    }

    try {
      const chatGptStore = useChatGptStore()
      const source = selectedTrafficSource.value === 'Meta' ? 'Facebook' : 'TikTok'

      console.log(`🔤 Генеруємо ключові слова для: "${keywordInput.value}"`)

      const requestBody = {
        inputWords: keywordInput.value.trim(),
        country: selectedCampaign.value.country,
        trafficSource: source,
        promptSettings: chatGptStore.prompts.keywords,
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/chatgpt/generate-keywords-from-words`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      const result = await response.json()

      if (response.ok && result.success && result.data) {
        const keywordsList = result.data.keywords.split(',').map((kw) => kw.trim())

        // Очищаем и заполняем keywords
        resetKeywords()
        keywordsList.forEach((keyword, index) => {
          if (index < 6) {
            keywords[`keyword${index + 1}`] = keyword
          }
        })

        // Показываем секцию keywords если скрыта
        if (!showKeywords.value) {
          showKeywords.value = true
        }

        console.log(`✅ Ключові слова згенеровано: "${result.data.keywords}"`)
      } else {
        throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`❌ Помилка генерації ключових слів:`, error)
    }
  }

  return {
    // State
    selectedTrafficSource,
    selectedCampaign,
    campaigns,
    isLoadingCampaigns,
    showKeywords,
    keywords,
    urlInput,
    keywordInput,

    // Actions
    toggleKeywords,
    resetKeywords,
    clearAllInputs,
    fetchCampaigns,
    fetchCampaignKeywords,
    generateKeywordsFromUrl,
    generateKeywordsFromWords,
  }
})
