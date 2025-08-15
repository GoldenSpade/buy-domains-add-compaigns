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
        
        // Автоматически выбираем первый advertiser_id если не выбран (исключаем скрытый)
        if (advertiserIds.value.length > 0 && !selectedAdvertiserId.value) {
          const visibleAdvertiserIds = advertiserIds.value.filter(id => id !== '7524260058755170320')
          selectedAdvertiserId.value = visibleAdvertiserIds[0] || advertiserIds.value[0]
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tiktok/advertisers?access_token=${encodeURIComponent(accessToken.value)}`)
      const data = await response.json()
      
      if (data.success) {
        advertisers.value = data.data
        loading.value = false
        return true
      } else {
        error.value = data.error || 'Failed to get advertisers'
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
    // Проверяем что ID есть в списке и не является скрытым
    if (advertiserIds.value.includes(advertiserId) && advertiserId !== '7524260058755170320') {
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
  }
})