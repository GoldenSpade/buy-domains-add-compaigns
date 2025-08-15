import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

// TikTok API настройки из переменных окружения
const TIKTOK_APP_ID = process.env.TIKTOK_MANAGER_APP_ID
const TIKTOK_SECRET = process.env.TIKTOK_MANAGER_SECRET
const TIKTOK_API_BASE = process.env.TIKTOK_MANAGER_API_BASE

// Получение Authorization URL
router.get('/auth-url', (req, res) => {
  const { redirect_base_url } = req.query
  
  if (!redirect_base_url) {
    return res.status(400).json({
      success: false,
      error: 'redirect_base_url is required',
    })
  }

  const redirectUri = `${redirect_base_url}/tiktok-callback`
  const authUrl = `https://business-api.tiktok.com/portal/auth?app_id=${TIKTOK_APP_ID}&state=your_custom_params&redirect_uri=${encodeURIComponent(redirectUri)}`

  res.json({
    success: true,
    authUrl: authUrl,
    redirectUri: redirectUri,
  })
})

// Обмен кода на токен
router.post('/exchange-token', async (req, res) => {
  const { auth_code } = req.body

  try {
    const response = await axios.post(`${TIKTOK_API_BASE}/oauth2/access_token/`, {
      app_id: TIKTOK_APP_ID,
      secret: TIKTOK_SECRET,
      auth_code: auth_code,
    })

    res.json({
      success: true,
      data: response.data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    })
  }
})

// Тестовый запрос для получения рекламодателей
router.get('/advertisers', async (req, res) => {
  const { access_token } = req.query

  if (!access_token) {
    return res.status(400).json({
      success: false,
      error: 'Access token is required',
    })
  }

  try {
    const response = await axios.get(`${TIKTOK_API_BASE}/oauth2/advertiser/get/`, {
      headers: {
        'Access-Token': access_token,
      },
      params: {
        app_id: TIKTOK_APP_ID,
        secret: TIKTOK_SECRET,
      },
    })

    res.json({
      success: true,
      data: response.data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    })
  }
})

export default router
