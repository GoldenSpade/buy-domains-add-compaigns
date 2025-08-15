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


// Получение детальной информации об advertiser аккаунтах
router.get('/advertiser-info', async (req, res) => {
  const { access_token, advertiser_ids } = req.query

  if (!access_token) {
    return res.status(400).json({
      success: false,
      error: 'Access token is required',
    })
  }

  if (!advertiser_ids) {
    return res.status(400).json({
      success: false,
      error: 'Advertiser IDs are required',
    })
  }

  try {
    // Разбираем advertiser_ids (может быть строкой или массивом)
    const idsArray = Array.isArray(advertiser_ids) ? advertiser_ids : advertiser_ids.split(',')
    
    const response = await axios.get(`${TIKTOK_API_BASE}/advertiser/info/`, {
      headers: {
        'Access-Token': access_token,
      },
      params: {
        advertiser_ids: JSON.stringify(idsArray),
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

// ============ CAMPAIGN MANAGEMENT ENDPOINTS ============

// Получение списка кампаний
router.get('/campaigns', async (req, res) => {
  const { access_token, advertiser_id } = req.query

  if (!access_token || !advertiser_id) {
    return res.status(400).json({
      success: false,
      error: 'Access token and advertiser ID are required',
    })
  }

  try {
    const response = await axios.get(`${TIKTOK_API_BASE}/campaign/get/`, {
      headers: {
        'Access-Token': access_token,
      },
      params: {
        advertiser_id: advertiser_id,
        fields: JSON.stringify([
          'campaign_id',
          'campaign_name', 
          'operation_status',
          'objective_type',
          'budget',
          'create_time'
        ])
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

// Создание новой кампании
router.post('/campaigns', async (req, res) => {
  const { access_token, advertiser_id, campaign_data } = req.body

  if (!access_token || !advertiser_id || !campaign_data) {
    return res.status(400).json({
      success: false,
      error: 'Access token, advertiser ID and campaign data are required',
    })
  }

  try {
    const response = await axios.post(`${TIKTOK_API_BASE}/campaign/create/`, {
      advertiser_id: advertiser_id,
      ...campaign_data
    }, {
      headers: {
        'Access-Token': access_token,
        'Content-Type': 'application/json'
      }
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

// Обновление статуса кампании
router.put('/campaigns/:campaign_id/status', async (req, res) => {
  const { campaign_id } = req.params
  const { access_token, advertiser_id, operation } = req.body

  if (!access_token || !advertiser_id || !operation) {
    return res.status(400).json({
      success: false,
      error: 'Access token, advertiser ID and operation are required',
    })
  }

  try {
    const response = await axios.post(`${TIKTOK_API_BASE}/campaign/status/update/`, {
      advertiser_id: advertiser_id,
      campaign_ids: JSON.stringify([campaign_id]),
      operation: operation // "ENABLE", "DISABLE", "DELETE"
    }, {
      headers: {
        'Access-Token': access_token,
        'Content-Type': 'application/json'
      }
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

// Получение статистики кампаний
router.get('/campaign-stats', async (req, res) => {
  const { access_token, advertiser_id, start_date, end_date } = req.query

  if (!access_token || !advertiser_id) {
    return res.status(400).json({
      success: false,
      error: 'Access token and advertiser ID are required',
    })
  }

  // Устанавливаем даты по умолчанию (последние 7 дней)
  const endDate = end_date || new Date().toISOString().split('T')[0]
  const startDate = start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    const response = await axios.get(`${TIKTOK_API_BASE}/report/integrated/get/`, {
      headers: {
        'Access-Token': access_token,
      },
      params: {
        advertiser_id: advertiser_id,
        report_type: 'BASIC',
        dimensions: JSON.stringify(['advertiser_id']),
        metrics: JSON.stringify([
          'spend',
          'impressions', 
          'clicks',
          'ctr',
          'cpc',
          'conversion'
        ]),
        start_date: startDate,
        end_date: endDate,
        data_level: 'AUCTION_ADVERTISER'
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
