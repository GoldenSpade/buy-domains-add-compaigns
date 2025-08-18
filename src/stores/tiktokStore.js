import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useTikTokStore = defineStore('tiktok', () => {
  const loading = ref(false)
  const authUrl = ref('')
  const authCode = ref('')
  const accessToken = ref(loadFromLocalStorage('tiktok_access_token') || '')
  const advertiserIds = ref(loadFromLocalStorage('tiktok_advertiser_ids') || [])
  const scope = ref(loadFromLocalStorage('tiktok_scope') || [])
  const selectedAdvertiserId = ref(loadFromLocalStorage('tiktok_selected_advertiser_id') || '')
  const advertisers = ref(null)
  const error = ref('')
  const isAuthenticated = ref(false)

  // Campaign management state
  const campaigns = ref([])
  const campaignStats = ref({
    active: 0,
    totalSpend: '0.00',
    impressions: 0,
    clicks: 0
  })
  const campaignLoading = ref(false)
  const lastStatsUpdate = ref(null)
  
  // Campaign metadata state
  const campaignMetadata = ref({
    objectives: [],
    bidTypes: [],
    campaignTypes: []
  })
  const metadataLoading = ref(false)

  // Завантаження з localStorage
  function loadFromLocalStorage(key) {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (e) {
      console.warn(`Failed to load ${key} from localStorage:`, e)
      return null
    }
  }

  // Збереження в localStorage
  function saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn(`Failed to save ${key} to localStorage:`, e)
    }
  }

  // Очищення localStorage
  function clearFromLocalStorage() {
    try {
      localStorage.removeItem('tiktok_access_token')
      localStorage.removeItem('tiktok_advertiser_ids')
      localStorage.removeItem('tiktok_scope')
      localStorage.removeItem('tiktok_selected_advertiser_id')
      localStorage.removeItem('tiktok_is_authenticated')
    } catch (e) {
      console.warn('Failed to clear tokens from localStorage:', e)
    }
  }

  // Відстеження змін для збереження в localStorage
  watch(accessToken, (newToken) => {
    if (newToken) {
      saveToLocalStorage('tiktok_access_token', newToken)
    }
  })

  watch(advertiserIds, (newIds) => {
    if (newIds && newIds.length > 0) {
      saveToLocalStorage('tiktok_advertiser_ids', newIds)
    }
  }, { deep: true })

  watch(scope, (newScope) => {
    if (newScope && newScope.length > 0) {
      saveToLocalStorage('tiktok_scope', newScope)
    }
  }, { deep: true })

  watch(selectedAdvertiserId, (newId) => {
    if (newId) {
      saveToLocalStorage('tiktok_selected_advertiser_id', newId)
    }
  })

  const getAuthUrl = async () => {
    loading.value = true
    error.value = ''

    try {
      const redirectBaseUrl = import.meta.env.VITE_REDIRECT_BASE_URL
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tiktok/auth-url?redirect_base_url=${encodeURIComponent(redirectBaseUrl)}`)
      const data = await response.json()
      
      if (data.success) {
        authUrl.value = data.authUrl
      } else {
        error.value = data.error || 'Failed to get authorization URL'
      }
    } catch (err) {
      error.value = err.message
    }

    loading.value = false
  }

  const exchangeToken = async () => {
    if (!authCode.value) {
      error.value = 'Authorization code is required'
      return
    }

    loading.value = true
    error.value = ''

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tiktok/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_code: authCode.value,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        accessToken.value = data.data.data.access_token
        advertiserIds.value = data.data.data.advertiser_ids || []
        scope.value = data.data.data.scope || []
        isAuthenticated.value = true
        
        // Автоматически выбираем первый advertiser_id если не выбран
        if (advertiserIds.value.length > 0 && !selectedAdvertiserId.value) {
          selectedAdvertiserId.value = advertiserIds.value[0]
        }
        
        // Примусове збереження в localStorage
        saveToLocalStorage('tiktok_access_token', accessToken.value)
        saveToLocalStorage('tiktok_advertiser_ids', advertiserIds.value)
        saveToLocalStorage('tiktok_scope', scope.value)
        saveToLocalStorage('tiktok_selected_advertiser_id', selectedAdvertiserId.value)
        saveToLocalStorage('tiktok_is_authenticated', true)
        
        loading.value = false
        return true
      } else {
        error.value = data.error || 'Failed to exchange token'
        loading.value = false
        return false
      }
    } catch (err) {
      error.value = err.message
      loading.value = false
      return false
    }
  }

  const testApi = async () => {
    if (!accessToken.value) {
      error.value = 'Access token is required'
      return false
    }

    loading.value = true
    error.value = ''

    try {
      // Сначала пробуем получить детальную информацию об аккаунтах
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tiktok/advertiser-info?access_token=${encodeURIComponent(accessToken.value)}&advertiser_ids=${encodeURIComponent(advertiserIds.value.join(','))}`
      )
      const data = await response.json()
      
      if (data.success) {
        advertisers.value = data.data
        loading.value = false
        return true
      } else {
        // Проверяем на ошибку истекшего токена
        if (data.data?.code === 40001 || data.error?.includes('token') || data.error?.includes('auth')) {
          console.warn('Token expired during API test')
          error.value = 'Session expired. Please re-authenticate.'
        } else {
          error.value = data.error || 'Failed to validate token'
        }
        loading.value = false
        return false
      }
    } catch (err) {
      error.value = err.message
      loading.value = false
      return false
    }
  }

  // Получение детальной информации об advertiser аккаунтах
  const getAdvertiserInfo = async () => {
    if (!accessToken.value || !advertiserIds.value.length) {
      error.value = 'Access token and advertiser IDs are required'
      return false
    }

    loading.value = true
    error.value = ''

    try {
      const idsParam = advertiserIds.value.join(',')
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tiktok/advertiser-info?access_token=${encodeURIComponent(accessToken.value)}&advertiser_ids=${encodeURIComponent(idsParam)}`
      )
      const data = await response.json()
      
      if (data.success) {
        // Обновляем advertisers с детальной информацией
        advertisers.value = data.data
        loading.value = false
        return true
      } else {
        error.value = data.error || 'Failed to get advertiser info'
        loading.value = false
        return false
      }
    } catch (err) {
      error.value = err.message
      loading.value = false
      return false
    }
  }

  const clearError = () => {
    error.value = ''
  }


  // Автоматична ініціалізація токенів
  const initializeAuth = async () => {
    console.log('Initializing TikTok auth...')
    
    // Перевіряємо чи є збережений токен
    if (!accessToken.value) {
      console.log('No access token found, need manual authentication')
      isAuthenticated.value = false
      return false
    }

    // Перевіряємо роботоспроможність токена через тестовый API виклик
    console.log('Checking token validity...')
    const isValid = await testApi()
    if (isValid) {
      console.log('TikTok authentication successful')
      isAuthenticated.value = true
      
      // После успешной проверки токена, загружаем детальную информацию об аккаунтах
      await getAdvertiserInfo()
      
      return true
    } else {
      console.log('Token invalid, need manual authentication')
      clearFromLocalStorage()
      resetStore()
      return false
    }
  }

  const resetStore = () => {
    loading.value = false
    authUrl.value = ''
    authCode.value = ''
    accessToken.value = ''
    advertiserIds.value = []
    scope.value = []
    selectedAdvertiserId.value = ''
    advertisers.value = null
    error.value = ''
    isAuthenticated.value = false
    clearFromLocalStorage()
  }

  // Перевірка на існування збережених токенів при ініціалізації
  if (accessToken.value) {
    isAuthenticated.value = loadFromLocalStorage('tiktok_is_authenticated') || false
  }

  // Автоматична обробка callback з auth_code
  const handleAuthCallback = async (authCodeFromUrl) => {
    if (!authCodeFromUrl) {
      error.value = 'Authorization code not found in URL'
      return false
    }

    authCode.value = authCodeFromUrl
    const success = await exchangeToken()
    
    if (success) {
      // Очищаємо authCode після успішного обміну
      authCode.value = ''
      return true
    }
    
    return false
  }

  // Функция для изменения выбранного advertiser ID
  const setSelectedAdvertiserId = (advertiserId) => {
    // Проверяем что ID есть в списке
    if (advertiserIds.value.includes(advertiserId)) {
      selectedAdvertiserId.value = advertiserId
      saveToLocalStorage('tiktok_selected_advertiser_id', advertiserId)
    }
  }

  // Получение информации о доступных scope (расшифровка)
  const getScopeInfo = () => {
    const scopeNames = {
      1: 'Ad Account Management',
      2: 'Ads Management', 
      3: 'Audience Management',
      4: 'Reporting',
      5: 'Measurement',
      6: 'Creative Management',
      7: 'App Management',
      8: 'Pixel Management',
      9: 'DPA Catalog Management'
    }
    
    return scope.value.map(id => ({
      id,
      name: scopeNames[id] || `Unknown scope (${id})`
    }))
  }

  // ============ CAMPAIGN METADATA FUNCTIONS ============

  // Получение метаданных для создания кампаний
  const getCampaignMetadata = async () => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      error.value = 'Access token and selected advertiser ID are required'
      return false
    }

    metadataLoading.value = true
    error.value = ''

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tiktok/campaign-metadata?access_token=${encodeURIComponent(accessToken.value)}&advertiser_id=${encodeURIComponent(selectedAdvertiserId.value)}`
      )
      const data = await response.json()
      
      if (data.success) {
        campaignMetadata.value = data.data
        metadataLoading.value = false
        return true
      } else {
        error.value = data.error || 'Failed to get campaign metadata'
        metadataLoading.value = false
        return false
      }
    } catch (err) {
      error.value = err.message
      metadataLoading.value = false
      return false
    }
  }

  // ============ CAMPAIGN MANAGEMENT FUNCTIONS ============

  // Получение списка кампаний
  const getCampaigns = async () => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      error.value = 'Access token and selected advertiser ID are required'
      return false
    }

    campaignLoading.value = true
    error.value = ''

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tiktok/campaigns?access_token=${encodeURIComponent(accessToken.value)}&advertiser_id=${encodeURIComponent(selectedAdvertiserId.value)}`
      )
      const data = await response.json()
      
      if (data.success) {
        campaigns.value = data.data.data?.list || []
        
        // Обновляем статистику активных кампаний
        const activeCampaigns = campaigns.value.filter(c => c.operation_status === 'ENABLE').length
        campaignStats.value.active = activeCampaigns
        
        campaignLoading.value = false
        return true
      } else {
        // Проверяем на ошибку истекшего токена
        if (data.data?.code === 40001 || data.error?.includes('token') || data.error?.includes('auth')) {
          console.warn('Token expired, clearing authentication')
          clearFromLocalStorage()
          resetStore()
          error.value = 'Session expired. Please re-authenticate.'
        } else {
          error.value = data.error || 'Failed to get campaigns'
        }
        
        campaignLoading.value = false
        return false
      }
    } catch (err) {
      error.value = err.message
      campaignLoading.value = false
      return false
    }
  }

  // Получение статистики кампаний с поддержкой дат
  const getCampaignStats = async (startDate = null, endDate = null) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      return false
    }

    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/tiktok/campaign-stats?access_token=${encodeURIComponent(accessToken.value)}&advertiser_id=${encodeURIComponent(selectedAdvertiserId.value)}`
      
      if (startDate) {
        url += `&start_date=${encodeURIComponent(startDate)}`
      }
      if (endDate) {
        url += `&end_date=${encodeURIComponent(endDate)}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success && data.data.data?.list?.length > 0) {
        const stats = data.data.data.list[0].metrics
        
        campaignStats.value = {
          active: campaigns.value.filter(c => c.operation_status === 'ENABLE').length,
          totalSpend: parseFloat(stats.spend || 0).toFixed(2),
          impressions: parseInt(stats.impressions || 0),
          clicks: parseInt(stats.clicks || 0)
        }
        
        lastStatsUpdate.value = new Date().toISOString()
        return true
      } else {
        // Если нет данных, устанавливаем нулевую статистику
        campaignStats.value = {
          active: campaigns.value.filter(c => c.operation_status === 'ENABLE').length,
          totalSpend: '0.00',
          impressions: 0,
          clicks: 0
        }
        lastStatsUpdate.value = new Date().toISOString()
        return false
      }
    } catch (err) {
      console.warn('Failed to get campaign stats:', err)
      campaignStats.value = {
        active: campaigns.value.filter(c => c.operation_status === 'ENABLE').length,
        totalSpend: '0.00',
        impressions: 0,
        clicks: 0
      }
      return false
    }
  }

  // Создание новой кампании
  const createCampaign = async (campaignData) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      error.value = 'Access token and selected advertiser ID are required'
      return false
    }

    loading.value = true
    error.value = ''

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tiktok/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken.value,
          advertiser_id: selectedAdvertiserId.value,
          campaign_data: campaignData
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Перезагружаем список кампаний
        await getCampaigns()
        loading.value = false
        return true
      } else {
        error.value = data.error || 'Failed to create campaign'
        loading.value = false
        return false
      }
    } catch (err) {
      error.value = err.message
      loading.value = false
      return false
    }
  }

  // Обновление статуса кампании
  const updateCampaignStatus = async (campaignId, operation) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      error.value = 'Access token and selected advertiser ID are required'
      return false
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tiktok/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken.value,
          advertiser_id: selectedAdvertiserId.value,
          operation: operation // "ENABLE", "DISABLE", "DELETE"
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Перезагружаем список кампаний
        await getCampaigns()
        return true
      } else {
        error.value = data.error || 'Failed to update campaign status'
        return false
      }
    } catch (err) {
      error.value = err.message
      return false
    }
  }

  // Загрузка полных данных (кампании + статистика) с поддержкой дат
  const loadCampaignData = async (startDate = null, endDate = null) => {
    if (!selectedAdvertiserId.value) return false
    
    const campaignsLoaded = await getCampaigns()
    if (campaignsLoaded) {
      await getCampaignStats(startDate, endDate)
    }
    return campaignsLoaded
  }

  return {
    loading,
    authUrl,
    authCode,
    accessToken,
    advertiserIds,
    scope,
    selectedAdvertiserId,
    advertisers,
    error,
    isAuthenticated,
    initializeAuth,
    getAuthUrl,
    exchangeToken,
    testApi,
    getAdvertiserInfo,
    handleAuthCallback,
    clearError,
    resetStore,
    setSelectedAdvertiserId,
    getScopeInfo,
    // Campaign management
    campaigns,
    campaignStats,
    campaignLoading,
    lastStatsUpdate,
    getCampaigns,
    getCampaignStats,
    createCampaign,
    updateCampaignStatus,
    loadCampaignData,
    // Campaign metadata
    campaignMetadata,
    metadataLoading,
    getCampaignMetadata,
  }
})