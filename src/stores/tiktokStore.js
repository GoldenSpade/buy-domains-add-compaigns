import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { toast } from 'vue3-toastify'

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

  // Ad Group management state
  const adGroups = ref([])
  const adGroupStats = ref({
    active: 0,
    totalSpend: '0.00',
    impressions: 0,
    clicks: 0
  })
  const adGroupLoading = ref(false)
  const selectedCampaignId = ref('')
  
  // Ad Group metadata state
  const adGroupMetadata = ref({
    placements: [],
    locations: [],
    interests: []
  })
  const adGroupMetadataLoading = ref(false)

  // Ads management state
  const ads = ref([])
  const adsLoading = ref(false)

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

  // Обработка API ответов с тостами
  const handleApiResponse = (response, successMessage = '', context = '') => {
    console.log('handleApiResponse:', { response, successMessage, context })

    // Успех: response.success === true И (нет data.code ИЛИ data.code === 0)
    if (response.success && (!response.data?.code || response.data.code === 0)) {
      if (successMessage) {
        toast.success(successMessage, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        })
      }
      return { isSuccess: true, isError: false }
    }

    // TikTok API ошибка: response.success === true НО data.code !== 0
    if (response.success && response.data?.code && response.data.code !== 0) {
      const errorMsg = response.data.message || `TikTok API Error (${response.data.code})`
      const fullError = context ? `${context}: ${errorMsg}` : errorMsg
      
      toast.error(fullError, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: false, // Ошибки не скрываются автоматически
      })
      
      error.value = errorMsg
      return { isSuccess: false, isError: true, message: errorMsg }
    }

    // Общие ошибки: response.success === false
    if (response.success === false) {
      const errorMsg = response.error || 'Operation failed'
      const fullError = context ? `${context}: ${errorMsg}` : errorMsg
      
      toast.error(fullError, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: false,
      })
      
      error.value = errorMsg
      return { isSuccess: false, isError: true, message: errorMsg }
    }

    return { isSuccess: false, isError: false }
  }

  // Функция автовыбора активного аккаунта
  function autoSelectActiveAccount() {
    if (!advertisers.value?.data?.list) return false
    
    let accountToSelect = null
    
    // Если есть сохраненный selectedAdvertiserId, проверяем его статус
    if (selectedAdvertiserId.value) {
      const currentAccount = advertisers.value.data.list.find(acc => acc.advertiser_id === selectedAdvertiserId.value)
      // Если текущий аккаунт активный, оставляем его
      if (currentAccount && currentAccount.status === 'STATUS_ENABLE') {
        accountToSelect = currentAccount
        console.log('Current advertiser is active, keeping it:', selectedAdvertiserId.value)
      } else {
        console.log('Current advertiser is not active or not found, selecting new active account')
      }
    }
    
    // Если нет активного выбранного аккаунта, ищем первый активный
    if (!accountToSelect) {
      const activeAccount = advertisers.value.data.list.find(acc => acc.status === 'STATUS_ENABLE')
      accountToSelect = activeAccount || advertisers.value.data.list[0] // Fallback к первому
    }
    
    // Применяем выбранный аккаунт
    if (accountToSelect && accountToSelect.advertiser_id !== selectedAdvertiserId.value) {
      selectedAdvertiserId.value = accountToSelect.advertiser_id
      saveToLocalStorage('tiktok_selected_advertiser_id', selectedAdvertiserId.value)
      console.log('Automatically selected active advertiser:', selectedAdvertiserId.value, '(Status:', accountToSelect.status, ')')
      return true
    }
    
    return false
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
          console.log('Automatically selected first advertiser:', selectedAdvertiserId.value)
        }
        
        // Примусове збереження в localStorage
        saveToLocalStorage('tiktok_access_token', accessToken.value)
        saveToLocalStorage('tiktok_advertiser_ids', advertiserIds.value)
        saveToLocalStorage('tiktok_scope', scope.value)
        saveToLocalStorage('tiktok_selected_advertiser_id', selectedAdvertiserId.value)
        saveToLocalStorage('tiktok_is_authenticated', true)
        
        // Автоматически загружаем информацию об аккаунтах и кампаниях
        if (selectedAdvertiserId.value) {
          await getAdvertiserInfo()
          await loadCampaignData()
          console.log('Auto-loaded campaigns after token exchange')
        }
        
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
        
        // Автоматически выбираем активный аккаунт
        autoSelectActiveAccount()
        
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
      
      // Автоматически выбираем активный аккаунт
      autoSelectActiveAccount()
      
      // Если у нас есть выбранный advertiser, автоматически загружаем кампании
      if (selectedAdvertiserId.value) {
        console.log('Auto-loading campaigns for selected advertiser:', selectedAdvertiserId.value)
        await loadCampaignData()
      }
      
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
  const setSelectedAdvertiserId = async (advertiserId) => {
    // Проверяем что ID есть в списке
    if (advertiserIds.value.includes(advertiserId)) {
      selectedAdvertiserId.value = advertiserId
      saveToLocalStorage('tiktok_selected_advertiser_id', advertiserId)
      
      // Автоматически загружаем кампании для нового advertiser
      console.log('Loading campaigns for advertiser:', advertiserId)
      await loadCampaignData()
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
        
        console.log('Campaigns loaded:', campaigns.value.length)
        console.log('Campaign statuses:', campaigns.value.map(c => ({ name: c.campaign_name, status: c.operation_status })))
        console.log('Active Campaigns count:', activeCampaigns)
        
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
      
      const result = handleApiResponse(data, `Campaign "${campaignData.campaign_name}" created successfully!`, 'Campaign Creation')
      
      if (result.isSuccess) {
        // Перезагружаем список кампаний
        await getCampaigns()
        loading.value = false
        return true
      } else {
        loading.value = false
        return false
      }
    } catch (err) {
      error.value = err.message
      toast.error(`Campaign Creation: ${err.message}`, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: false,
      })
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
      
      const operationText = operation === 'ENABLE' ? 'started' : operation === 'DISABLE' ? 'paused' : 'deleted'
      const result = handleApiResponse(data, `Campaign ${operationText} successfully!`, 'Campaign Status Update')
      
      if (result.isSuccess) {
        // Перезагружаем список кампаний
        await getCampaigns()
        return true
      } else {
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

  // ============ AD GROUP MANAGEMENT FUNCTIONS ============

  // Установка выбранной кампании для работы с Ad Groups
  const setSelectedCampaignId = (campaignId) => {
    selectedCampaignId.value = campaignId
    // Сбрасываем список Ad Groups при смене кампании
    adGroups.value = []
  }

  // Получение метаданных для создания Ad Groups
  const getAdGroupMetadata = async (campaignId = null) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      error.value = 'Access token and selected advertiser ID are required'
      return false
    }

    adGroupMetadataLoading.value = true
    error.value = ''

    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/tiktok/adgroup-metadata?access_token=${encodeURIComponent(accessToken.value)}&advertiser_id=${encodeURIComponent(selectedAdvertiserId.value)}`
      
      // Add campaign_id if provided to get proper objective_type
      const targetCampaignId = campaignId || selectedCampaignId.value
      if (targetCampaignId) {
        url += `&campaign_id=${encodeURIComponent(targetCampaignId)}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        adGroupMetadata.value = data.data
        adGroupMetadataLoading.value = false
        return true
      } else {
        error.value = data.error || 'Failed to get ad group metadata'
        adGroupMetadataLoading.value = false
        return false
      }
    } catch (err) {
      error.value = err.message
      adGroupMetadataLoading.value = false
      return false
    }
  }

  // Получение списка Ad Groups для кампании
  const getAdGroups = async (campaignId = null) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      error.value = 'Access token and selected advertiser ID are required'
      return false
    }

    const targetCampaignId = campaignId || selectedCampaignId.value
    console.log(`getAdGroups: Loading ad groups for campaign ${targetCampaignId} (advertiser: ${selectedAdvertiserId.value})`)
    
    adGroupLoading.value = true
    error.value = ''

    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/tiktok/adgroups?access_token=${encodeURIComponent(accessToken.value)}&advertiser_id=${encodeURIComponent(selectedAdvertiserId.value)}`
      
      if (targetCampaignId) {
        url += `&campaign_id=${encodeURIComponent(targetCampaignId)}`
      }
      
      // Добавляем timestamp для предотвращения кеширования
      url += `&_t=${Date.now()}`

      console.log(`getAdGroups: Making API request to: ${url}`)
      const response = await fetch(url)
      const data = await response.json()
      
      console.log(`getAdGroups: API response for campaign ${targetCampaignId}:`, data)
      
      if (data.success) {
        adGroups.value = data.data.data?.list || []
        
        // Обновляем статистику активных Ad Groups
        const activeAdGroups = adGroups.value.filter(ag => ag.operation_status === 'ENABLE').length
        adGroupStats.value.active = activeAdGroups
        
        console.log(`getAdGroups: Successfully loaded ${adGroups.value.length} ad groups for campaign ${targetCampaignId}:`, adGroups.value.map(ag => ({ id: ag.adgroup_id, name: ag.adgroup_name })))
        console.log('Ad Groups statuses:', adGroups.value.map(ag => ({ name: ag.adgroup_name, status: ag.operation_status })))
        console.log('Active Ad Groups count:', activeAdGroups)
        
        adGroupLoading.value = false
        return true
      } else {
        // Проверяем на ошибку истекшего токена
        if (data.data?.code === 40001 || data.error?.includes('token') || data.error?.includes('auth')) {
          console.warn('Token expired, clearing authentication')
          clearFromLocalStorage()
          resetStore()
          error.value = 'Session expired. Please re-authenticate.'
        } else {
          error.value = data.error || 'Failed to get ad groups'
        }
        
        adGroupLoading.value = false
        return false
      }
    } catch (err) {
      error.value = err.message
      adGroupLoading.value = false
      return false
    }
  }

  // Получение статистики Ad Groups
  const getAdGroupStats = async (campaignId = null, startDate = null, endDate = null) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      return false
    }

    const targetCampaignId = campaignId || selectedCampaignId.value

    // Если нет Ad Groups, устанавливаем нулевую статистику
    if (adGroups.value.length === 0) {
      adGroupStats.value = {
        active: 0,
        totalSpend: '0.00',
        impressions: 0,
        clicks: 0
      }
      return true
    }

    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/tiktok/adgroup-stats?access_token=${encodeURIComponent(accessToken.value)}&advertiser_id=${encodeURIComponent(selectedAdvertiserId.value)}`
      
      if (targetCampaignId) {
        url += `&campaign_id=${encodeURIComponent(targetCampaignId)}`
      }
      if (startDate) {
        url += `&start_date=${encodeURIComponent(startDate)}`
      }
      if (endDate) {
        url += `&end_date=${encodeURIComponent(endDate)}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success && data.data.data?.list?.length > 0) {
        // Суммируем статистику по всем Ad Groups
        let totalSpend = 0, totalImpressions = 0, totalClicks = 0
        
        data.data.data.list.forEach(item => {
          const stats = item.metrics
          totalSpend += parseFloat(stats.spend || 0)
          totalImpressions += parseInt(stats.impressions || 0)
          totalClicks += parseInt(stats.clicks || 0)
        })
        
        adGroupStats.value = {
          active: adGroups.value.filter(ag => ag.operation_status === 'ENABLE').length,
          totalSpend: totalSpend.toFixed(2),
          impressions: totalImpressions,
          clicks: totalClicks
        }
        
        return true
      } else {
        // Если нет данных, устанавливаем нулевую статистику
        adGroupStats.value = {
          active: adGroups.value.filter(ag => ag.operation_status === 'ENABLE').length,
          totalSpend: '0.00',
          impressions: 0,
          clicks: 0
        }
        return false
      }
    } catch (err) {
      console.warn('Failed to get ad group stats:', err)
      adGroupStats.value = {
        active: adGroups.value.filter(ag => ag.operation_status === 'ENABLE').length,
        totalSpend: '0.00',
        impressions: 0,
        clicks: 0
      }
      return false
    }
  }

  // Создание новой Ad Group
  const createAdGroup = async (adGroupData) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      error.value = 'Access token and selected advertiser ID are required'
      return false
    }

    loading.value = true
    error.value = ''

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tiktok/adgroups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken.value,
          advertiser_id: selectedAdvertiserId.value,
          adgroup_data: adGroupData
        }),
      })
      
      const data = await response.json()
      
      const result = handleApiResponse(data, `Ad Group "${adGroupData.adgroup_name}" created successfully!`, 'Ad Group Creation')
      
      if (result.isSuccess) {
        // Перезагружаем список Ad Groups для текущей кампании
        await getAdGroups(adGroupData.campaign_id || selectedCampaignId.value)
        loading.value = false
        return true
      } else {
        loading.value = false
        return false
      }
    } catch (err) {
      error.value = err.message
      toast.error(`Ad Group Creation: ${err.message}`, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: false,
      })
      loading.value = false
      return false
    }
  }

  // Обновление статуса Ad Group
  const updateAdGroupStatus = async (adGroupId, operation, campaignId = null) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      error.value = 'Access token and selected advertiser ID are required'
      return false
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tiktok/adgroups/${adGroupId}/status`, {
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
      
      const operationText = operation === 'ENABLE' ? 'started' : operation === 'DISABLE' ? 'paused' : 'deleted'
      const result = handleApiResponse(data, `Ad Group ${operationText} successfully!`, 'Ad Group Status Update')
      
      if (result.isSuccess) {
        // Перезагружаем список Ad Groups для указанной кампании
        const targetCampaignId = campaignId || selectedCampaignId.value
        await getAdGroups(targetCampaignId)
        return true
      } else {
        return false
      }
    } catch (err) {
      error.value = err.message
      return false
    }
  }

  // Загрузка полных данных Ad Groups (список + статистика)
  const loadAdGroupData = async (campaignId = null, startDate = null, endDate = null) => {
    const targetCampaignId = campaignId || selectedCampaignId.value
    if (!targetCampaignId) return false
    
    const adGroupsLoaded = await getAdGroups(targetCampaignId)
    if (adGroupsLoaded) {
      await getAdGroupStats(targetCampaignId, startDate, endDate)
    }
    return adGroupsLoaded
  }

  // ============ IDENTITY MANAGEMENT FUNCTIONS ============

  const getIdentities = async () => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      showError('Access token and selected advertiser ID are required')
      return null
    }

    try {
      const response = await apiRequest('/tiktok/identity/get/', 'POST', {
        access_token: accessToken.value,
        advertiser_id: selectedAdvertiserId.value
      })

      if (response.success) {
        return response.data.data || response.data
      } else {
        showError('Failed to load identities')
        return null
      }
    } catch (error) {
      console.error('Get identities error:', error)
      showError(`Failed to load identities: ${error.message}`)
      return null
    }
  }

  // ============ CREATIVE MANAGEMENT FUNCTIONS ============

  const uploadCreative = async (creativeData, type = 'image') => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      showError('Access token and selected advertiser ID are required')
      return false
    }

    const endpoint = type === 'image' ? '/tiktok/creative/image/upload' : '/tiktok/creative/video/upload'
    
    try {
      const response = await apiRequest(endpoint, 'POST', {
        access_token: accessToken.value,
        advertiser_id: selectedAdvertiserId.value,
        ...creativeData
      })

      if (response.success && response.data?.code === 0) {
        showSuccess(`${type === 'image' ? 'Image' : 'Video'} uploaded successfully!`)
        return response.data.data
      } else {
        showError(`Failed to upload ${type}: ${response.data?.message || 'Unknown error'}`)
        return false
      }
    } catch (error) {
      console.error(`${type} upload error:`, error)
      showError(`Failed to upload ${type}: ${error.message}`)
      return false
    }
  }

  const getMediaLibrary = async (mediaType = '') => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      showError('Access token and selected advertiser ID are required')
      return null
    }

    try {
      const params = {
        access_token: accessToken.value,
        advertiser_id: selectedAdvertiserId.value
      }
      
      if (mediaType) {
        params.media_type = mediaType
      }

      const response = await apiRequest('/tiktok/creative/media/list', 'GET', params)

      if (response.success) {
        return response.data.data || response.data
      } else {
        showError('Failed to load media library')
        return null
      }
    } catch (error) {
      console.error('Media library error:', error)
      showError(`Failed to load media library: ${error.message}`)
      return null
    }
  }

  // ============ AD MANAGEMENT FUNCTIONS ============

  const getAds = async (campaignId = '', adGroupId = '') => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      showError('Access token and selected advertiser ID are required')
      return false
    }

    adsLoading.value = true
    
    try {
      const params = {
        access_token: accessToken.value,
        advertiser_id: selectedAdvertiserId.value
      }

      if (campaignId) params.campaign_id = campaignId
      if (adGroupId) params.adgroup_id = adGroupId

      const response = await apiRequest('/tiktok/ads/list', 'GET', params)

      if (response.success) {
        ads.value = response.data.data?.list || []
        return true
      } else {
        showError('Failed to load ads')
        return false
      }
    } catch (error) {
      console.error('Get ads error:', error)
      showError(`Failed to load ads: ${error.message}`)
      return false
    } finally {
      adsLoading.value = false
    }
  }

  const createAd = async (adData) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      showError('Access token and selected advertiser ID are required')
      return false
    }

    try {
      const response = await apiRequest('/tiktok/ads/create', 'POST', {
        access_token: accessToken.value,
        advertiser_id: selectedAdvertiserId.value,
        ad_data: adData
      })

      const result = handleApiResponse(response, `Ad "${adData.ad_name}" created successfully!`, 'Ad Creation')
      
      if (result.isSuccess) {
        // Refresh ads list
        await getAds()
        return response.data.data
      } else {
        return false
      }
    } catch (error) {
      console.error('Create ad error:', error)
      showError(`Failed to create ad: ${error.message}`)
      return false
    }
  }

  const updateAdStatus = async (adId, operation) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      showError('Access token and selected advertiser ID are required')
      return false
    }

    try {
      const response = await apiRequest(`/tiktok/ads/${adId}/status`, 'PUT', {
        access_token: accessToken.value,
        advertiser_id: selectedAdvertiserId.value,
        operation: operation
      })

      const result = handleApiResponse(response, `Ad ${operation.toLowerCase()}d successfully!`, 'Ad Status Update')
      
      if (result.isSuccess) {
        // Refresh ads list
        await getAds()
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Update ad status error:', error)
      showError(`Failed to update ad status: ${error.message}`)
      return false
    }
  }

  // ============ CAMPAIGN FINALIZATION FUNCTIONS ============

  const finalizeCampaign = async (campaignId) => {
    if (!accessToken.value || !selectedAdvertiserId.value) {
      showError('Access token and selected advertiser ID are required')
      return false
    }

    try {
      const response = await apiRequest('/tiktok/campaign/finalize', 'POST', {
        access_token: accessToken.value,
        advertiser_id: selectedAdvertiserId.value,
        campaign_id: campaignId
      })

      if (response.success) {
        const summary = response.data.summary
        showSuccess(`Campaign finalized! ${summary.activated_components} components activated.`)
        
        // Refresh all data
        await getCampaigns()
        await getAdGroups(campaignId)
        await getAds(campaignId)
        
        return response.data
      } else {
        showError(`Failed to finalize campaign: ${response.error}`)
        return false
      }
    } catch (error) {
      console.error('Campaign finalization error:', error)
      showError(`Failed to finalize campaign: ${error.message}`)
      return false
    }
  }

  // ============ UTILITY FUNCTIONS ============

  const apiRequest = async (url, method = 'GET', data = null) => {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    if (method === 'GET' && data) {
      const params = new URLSearchParams()
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          params.append(key, data[key])
        }
      })
      url = `${import.meta.env.VITE_API_BASE_URL}${url}?${params.toString()}`
    } else if (method !== 'GET' && data) {
      config.body = JSON.stringify(data)
      url = `${import.meta.env.VITE_API_BASE_URL}${url}`
    }

    if (method === 'GET' && !data) {
      url = `${import.meta.env.VITE_API_BASE_URL}${url}`
    }

    const response = await fetch(url, config)
    return await response.json()
  }

  const showSuccess = (message) => {
    toast.success(message, {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000,
    })
  }

  const showError = (message) => {
    toast.error(message, {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 5000,
    })
  }

  // Computed properties
  const currentAdvertiser = computed(() => {
    if (!advertisers.value?.data?.list || !selectedAdvertiserId.value) return null
    return advertisers.value.data.list.find(adv => adv.advertiser_id === selectedAdvertiserId.value)
  })

  const currentIdentityId = computed(() => {
    return currentAdvertiser.value?.owner_bc_id || selectedAdvertiserId.value
  })

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
    // Ad Group management
    adGroups,
    adGroupStats,
    adGroupLoading,
    selectedCampaignId,
    setSelectedCampaignId,
    getAdGroups,
    getAdGroupStats,
    createAdGroup,
    updateAdGroupStatus,
    loadAdGroupData,
    // Ad Group metadata
    adGroupMetadata,
    adGroupMetadataLoading,
    getAdGroupMetadata,
    // Identity management
    getIdentities,
    // Creative management
    uploadCreative,
    getMediaLibrary,
    // Ad management 
    ads,
    adsLoading,
    getAds,
    createAd,
    updateAdStatus,
    // Campaign finalization
    finalizeCampaign,
    // Utility functions
    apiRequest,
    showSuccess,
    showError,
    // Computed properties
    currentAdvertiser,
    currentIdentityId
  }
})