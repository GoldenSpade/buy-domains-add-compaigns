import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useTikTokStore = defineStore('tiktok', () => {
  const loading = ref(false)
  const authUrl = ref('')
  const authCode = ref('')
  const accessToken = ref(loadFromLocalStorage('tiktok_access_token') || '')
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
      localStorage.removeItem('tiktok_is_authenticated')
    } catch (e) {
      console.warn('Failed to clear tokens from localStorage:', e)
    }
  }

  // Відстеження змін токена для збереження
  watch(accessToken, (newToken) => {
    if (newToken) {
      saveToLocalStorage('tiktok_access_token', newToken)
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
        isAuthenticated.value = true
        
        // Примусове збереження в localStorage
        saveToLocalStorage('tiktok_access_token', accessToken.value)
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

    // Перевіряємо роботоспроможність токена через тестовий API виклик
    console.log('Checking token validity...')
    const isValid = await testApi()
    if (isValid) {
      console.log('TikTok authentication successful')
      isAuthenticated.value = true
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

  return {
    loading,
    authUrl,
    authCode,
    accessToken,
    advertisers,
    error,
    isAuthenticated,
    initializeAuth,
    getAuthUrl,
    exchangeToken,
    testApi,
    handleAuthCallback,
    clearError,
    resetStore,
  }
})