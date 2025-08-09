import { defineStore } from 'pinia'
import { ref, reactive, watch } from 'vue'
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

  // Состояние для уведомлений
  const updateMessage = ref('')
  const updateMessageType = ref('') // 'success' или 'error'

  // Состояние для ClickFlare
  const clickflareMessage = ref('')
  const clickflareMessageType = ref('') // 'success' или 'error'
  const isCreatingOffer = ref(false)

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

      // Восстанавливаем selectedCampaign после загрузки campaigns
      // Ищем по сохраненному ID или временному ID
      const savedData = JSON.parse(localStorage.getItem('singleOfferStore') || '{}')
      const savedCampaignId = savedData.selectedCampaign?.id || window._tempSavedCampaignId

      if (savedCampaignId && campaigns.value.length > 0) {
        const foundCampaign = campaigns.value.find((c) => c.id === savedCampaignId)
        if (foundCampaign) {
          selectedCampaign.value = foundCampaign
          console.log('📂 Восстановлена выбранная кампания:', foundCampaign.name)
        }
        // Очищаем временное хранилище
        delete window._tempSavedCampaignId
      }
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

      // Получаем полное название страны через API
      let countryName = null
      try {
        const countryResp = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/tonic/countries/allowed?offer=${encodeURIComponent(
            selectedCampaign.value.offer
          )}&trafficSource=${source}`
        )
        const countryData = await countryResp.json()

        if (countryResp.ok && Array.isArray(countryData.allowedCountries)) {
          const countryObj = countryData.allowedCountries.find(
            (c) => c.code === selectedCampaign.value.country
          )
          countryName = countryObj?.name || selectedCampaign.value.country
        }
      } catch (err) {
        console.warn('⚠️ Не удалось получить название страны:', err)
        countryName = selectedCampaign.value.country
      }

      const requestBody = {
        url: urlInput.value.trim(), // или inputWords для второй функции
        country: countryName, // Теперь передаем название страны
        trafficSource: source,
        promptSettings: chatGptStore.prompts.url, // или keywords
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

      // Получаем полное название страны через API
      let countryName = null
      try {
        const countryResp = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/tonic/countries/allowed?offer=${encodeURIComponent(
            selectedCampaign.value.offer
          )}&trafficSource=${source}`
        )
        const countryData = await countryResp.json()

        if (countryResp.ok && Array.isArray(countryData.allowedCountries)) {
          const countryObj = countryData.allowedCountries.find(
            (c) => c.code === selectedCampaign.value.country
          )
          countryName = countryObj?.name || selectedCampaign.value.country
        }
      } catch (err) {
        console.warn('⚠️ Не удалось получить название страны:', err)
        countryName = selectedCampaign.value.country
      }

      const requestBody = {
        inputWords: keywordInput.value.trim(), // Правильное поле для keywords
        country: countryName,
        trafficSource: source,
        promptSettings: chatGptStore.prompts.keywords, // Правильные промпты
      }

      console.log(`🔤 Вызываем API для генерации по словам:`, requestBody)

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

  // Функции для добавления location codes
  const addLocationCode = (keywordIndex, codeType) => {
    const codes = {
      city: '{City}',
      region: '{State}',
      country: '{Country}',
    }

    const code = codes[codeType]
    if (code && keywords[keywordIndex]) {
      // Добавляем код в конец текущего значения
      keywords[keywordIndex] = keywords[keywordIndex].trim() + ' ' + code
      console.log(`Добавлен код ${code} к ${keywordIndex}:`, keywords[keywordIndex])
    }
  }

  // Функция для очистки отдельного keyword поля
  const clearKeyword = (keywordIndex) => {
    if (keywords[keywordIndex] !== undefined) {
      keywords[keywordIndex] = ''
      console.log(`Очищен ${keywordIndex}`)
    }
  }

  // Функция обновления ключевых слов в Tonic
  const updateKeywords = async () => {
    if (!selectedCampaign.value || !selectedCampaign.value.id) {
      console.warn('⚠️ Кампания не выбрана')
      return
    }

    // Собираем все непустые ключевые слова
    const keywordsList = Object.values(keywords)
      .filter((keyword) => keyword && keyword.trim() !== '')
      .map((keyword) => keyword.trim())

    if (keywordsList.length === 0) {
      console.warn('⚠️ Нет ключевых слов для обновления')
      return
    }

    try {
      console.log(`🔄 Обновляем ключевые слова для кампании ${selectedCampaign.value.id}`)
      console.log(`   Ключевые слова:`, keywordsList)

      const requestBody = {
        campaignId: selectedCampaign.value.id,
        keywords: keywordsList,
        keywordAmount: keywordsList.length,
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tonic/add-keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log(`✅ Ключевые слова успешно обновлены:`, result.data)
        console.log(`   KeywordSetId: ${result.data.keywordSetId}`)
        console.log(`   Keywords: ${result.data.keywords}`)

        updateMessage.value = `✅ Keywords updated successfully! (${keywordsList.length} keywords)`
        updateMessageType.value = 'success'

        // Автоматически скрываем сообщение через 3 секунды
        setTimeout(() => {
          updateMessage.value = ''
          updateMessageType.value = ''
        }, 3000)
      } else {
        throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`❌ Ошибка обновления ключевых слов:`, error)

      updateMessage.value = `❌ Error updating keywords: ${error.message}`
      updateMessageType.value = 'error'

      // Автоматически скрываем сообщение через 5 секунд
      setTimeout(() => {
        updateMessage.value = ''
        updateMessageType.value = ''
      }, 5000)
    }
  }

  // Функция создания оффера в ClickFlare
  const createClickflareOffer = async () => {
    if (!selectedCampaign.value || !selectedCampaign.value.id) {
      clickflareMessage.value = '⚠️ Campaign not selected'
      clickflareMessageType.value = 'error'
      setTimeout(() => {
        clickflareMessage.value = ''
        clickflareMessageType.value = ''
      }, 3000)
      return
    }

    isCreatingOffer.value = true
    clickflareMessage.value = ''
    clickflareMessageType.value = ''

    try {
      console.log(`🚀 Создаем ClickFlare оффер для кампании: ${selectedCampaign.value.name}`)

      const source = selectedTrafficSource.value === 'Meta' ? 'Facebook' : 'TikTok'

      // Формируем имена для ClickFlare
      const campaignName = selectedCampaign.value.name

      // Получаем workspace_id на основе buyer из имени кампании
      const workspaceMap = {
        Alex: import.meta.env.VITE_WORKSPACE_ALEX,
        Davyd: import.meta.env.VITE_WORKSPACE_DAVYD,
      }

      // Пытаемся определить buyer из имени кампании или используем Alex по умолчанию
      const buyer = campaignName.includes('Davyd') ? 'Davyd' : 'Alex'
      const workspace_id = workspaceMap[buyer]

      // Генерируем URL в зависимости от traffic source
      const generateOfferUrl = () => {
        // Базовый URL - используем заглушку, так как у нас нет resUrl из Tonic
        const baseUrl = 'https://placeholder-domain.com'
        const isFacebook = source === 'Facebook'
        const adTitleEncoded = encodeURIComponent(campaignName)

        const facebookTemplate = `network=facebook&site=direct&subid1={trackingField6}&subid2={trackingField5}&subid3={trackingField3}|{trackingField2}|{trackingField1}&subid4={cf_click_id}&click_id={external_id}&adtitle=${adTitleEncoded}`
        const tiktokTemplate = `network=tiktok&site=direct&subid1={trackingField3}&subid2={trackingField5}&subid3={trackingField8}|{trackingField6}|{trackingField4}&subid4={cf_click_id}&click_id={external_id}&adtitle=${adTitleEncoded}`

        const selectedQuery = isFacebook ? facebookTemplate : tiktokTemplate
        return `${baseUrl}?${selectedQuery}`
      }

      const offerUrl = generateOfferUrl()

      // Формируем правильное имя оффера: ID_название (убираем приставку если есть)
      let cleanCampaignName = campaignName

      // Убираем приставку вида "resId_[Account name] | " или "[Account name] | "
      if (cleanCampaignName.includes(' | ')) {
        // Находим позицию " | " и берем все что после нее
        const pipeIndex = cleanCampaignName.indexOf(' | ')
        cleanCampaignName = cleanCampaignName.substring(pipeIndex + 3) // +3 чтобы убрать " | "
      }

      const offerName = `${selectedCampaign.value.id}_${cleanCampaignName}`

      console.log(`📝 Формирование имени оффера:`)
      console.log(`   Original name: "${campaignName}"`)
      console.log(`   Clean name: "${cleanCampaignName}"`)
      console.log(`   Final offer name: "${offerName}"`)

      const payload = {
        offerName: offerName, // Новый формат имени
        offerUrl: offerUrl,
        workspace_id: workspace_id,
        affiliateNetworkID: import.meta.env.VITE_AFFILIATE_NETWORK_TONIC_ID,
      }

      console.log('📤 ClickFlare single offer payload:', payload)

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/clickflare/create-single-offer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const result = await response.json()

      if (result?.success) {
        if (result.alreadyExisted) {
          clickflareMessage.value = `ℹ️ Offer already exists in ClickFlare`
          clickflareMessageType.value = 'error'
          console.log(`ℹ️ ClickFlare оффер уже существует:`, {
            offerId: result.offer.id,
            message: result.message,
          })
        } else {
          clickflareMessage.value = `✅ ClickFlare offer created successfully!`
          clickflareMessageType.value = 'success'
          console.log(`✅ ClickFlare оффер создан:`, {
            offerId: result.offer.id,
            message: result.message,
          })
        }

        setTimeout(() => {
          clickflareMessage.value = ''
          clickflareMessageType.value = ''
        }, 5000)
      } else {
        throw new Error(result?.error || 'Unknown ClickFlare API error')
      }
    } catch (error) {
      console.error(`❌ Ошибка создания ClickFlare оффера:`, error)

      clickflareMessage.value = `❌ Error creating ClickFlare offer: ${error.message}`
      clickflareMessageType.value = 'error'

      setTimeout(() => {
        clickflareMessage.value = ''
        clickflareMessageType.value = ''
      }, 5000)
    } finally {
      isCreatingOffer.value = false
    }
  }

  // Функции для работы с localStorage
  const loadFromLS = () => {
    try {
      const saved = localStorage.getItem('singleOfferStore')
      if (saved) {
        const parsed = JSON.parse(saved)

        // Восстанавливаем только основные данные
        if (parsed.selectedTrafficSource) {
          selectedTrafficSource.value = parsed.selectedTrafficSource
        }
        // selectedCampaign восстановим после загрузки campaigns
        // Сохраняем ID для последующего поиска
        const savedCampaignId = parsed.selectedCampaign?.id
        if (savedCampaignId) {
          // Временно сохраняем ID
          window._tempSavedCampaignId = savedCampaignId
        }
        if (parsed.showKeywords !== undefined) {
          showKeywords.value = parsed.showKeywords
        }
        if (parsed.keywords) {
          Object.assign(keywords, parsed.keywords)
        }
        if (parsed.urlInput) {
          urlInput.value = parsed.urlInput
        }
        if (parsed.keywordInput) {
          keywordInput.value = parsed.keywordInput
        }

        console.log('📂 SingleOffer данные загружены из localStorage')
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки SingleOffer из localStorage:', error)
    }
  }

  const saveToLS = () => {
    try {
      const dataToSave = {
        selectedTrafficSource: selectedTrafficSource.value,
        selectedCampaign: selectedCampaign.value,
        showKeywords: showKeywords.value,
        keywords: { ...keywords },
        urlInput: urlInput.value,
        keywordInput: keywordInput.value,
        timestamp: Date.now(),
      }

      localStorage.setItem('singleOfferStore', JSON.stringify(dataToSave))
      console.log('💾 SingleOffer данные сохранены в localStorage')
    } catch (error) {
      console.warn('⚠️ Ошибка сохранения SingleOffer в localStorage:', error)
    }
  }

  const clearLS = () => {
    try {
      localStorage.removeItem('singleOfferStore')
      console.log('🗑️ SingleOffer localStorage очищен')
    } catch (error) {
      console.warn('⚠️ Ошибка очистки SingleOffer localStorage:', error)
    }
  }

  // Функция полной очистки всех данных
  const clearAll = () => {
    // Очищаем localStorage
    clearLS()

    // Сбрасываем все состояния к дефолтным значениям
    selectedTrafficSource.value = 'TikTok'
    selectedCampaign.value = ''
    campaigns.value = []
    showKeywords.value = false
    resetKeywords()
    urlInput.value = ''
    keywordInput.value = ''

    // Очищаем сообщения
    updateMessage.value = ''
    updateMessageType.value = ''
    clickflareMessage.value = ''
    clickflareMessageType.value = ''

    console.log('🗑️ Все данные SingleOffer очищены')
  }

  watch(
    [selectedTrafficSource, selectedCampaign, showKeywords, keywords, urlInput, keywordInput],
    () => {
      saveToLS()
    },
    { deep: true }
  )

  // Загружаем данные при создании store
  loadFromLS()

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
    updateMessage,
    updateMessageType,
    clickflareMessage,
    clickflareMessageType,
    isCreatingOffer,

    // Actions
    toggleKeywords,
    resetKeywords,
    clearAllInputs,
    fetchCampaigns,
    fetchCampaignKeywords,
    generateKeywordsFromUrl,
    generateKeywordsFromWords,
    addLocationCode,
    clearKeyword,
    updateKeywords,
    createClickflareOffer,
    loadFromLS,
    saveToLS,
    clearLS,
    clearAll,
  }
})
