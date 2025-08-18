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

// ============ CAMPAIGN METADATA ENDPOINTS ============

// Получение метаданных для создания кампаний
router.get('/campaign-metadata', async (req, res) => {
  const { access_token, advertiser_id } = req.query

  if (!access_token || !advertiser_id) {
    return res.status(400).json({
      success: false,
      error: 'Access token and advertiser ID are required',
    })
  }

  try {
    console.log('Fetching campaign metadata for advertiser:', advertiser_id)
    console.log('Using API base:', TIKTOK_API_BASE)
    
    // Получаем доступные цели кампаний
    const objectivesUrl = `${TIKTOK_API_BASE}/tool/campaign_creation/`
    console.log('Requesting objectives from:', objectivesUrl)
    
    const objectivesResponse = await axios.get(objectivesUrl, {
      headers: {
        'Access-Token': access_token,
      },
      params: {
        advertiser_id: advertiser_id,
        tool_type: 'CAMPAIGN_OBJECTIVE'
      },
    })

    // Получаем доступные типы ставок
    const bidTypesResponse = await axios.get(`${TIKTOK_API_BASE}/tool/campaign_creation/`, {
      headers: {
        'Access-Token': access_token,
      },
      params: {
        advertiser_id: advertiser_id,
        tool_type: 'BID_TYPE'
      },
    })

    // Получаем доступные типы кампаний
    const campaignTypesResponse = await axios.get(`${TIKTOK_API_BASE}/tool/campaign_creation/`, {
      headers: {
        'Access-Token': access_token,
      },
      params: {
        advertiser_id: advertiser_id,
        tool_type: 'RF_CAMPAIGN_TYPE'
      },
    })

    const metadata = {
      objectives: objectivesResponse.data.data?.list || [],
      bidTypes: bidTypesResponse.data.data?.list || [],
      campaignTypes: campaignTypesResponse.data.data?.list || [],
    }

    res.json({
      success: true,
      data: metadata,
    })
  } catch (error) {
    console.log('Campaign metadata API endpoint not available, using fallback data')
    console.log('API Error:', error.response?.status || error.message)
    
    // Если API endpoint не работает, возвращаем fallback данные
    const fallbackData = {
      objectives: [
        { value: 'REACH', name: 'Reach - Brand Awareness' },
        { value: 'TRAFFIC', name: 'Traffic - Website visits' },
        { value: 'APP_PROMOTION', name: 'App Promotion' },
        { value: 'WEB_CONVERSIONS', name: 'Conversions' },
        { value: 'LEAD_GENERATION', name: 'Lead Generation' },
        { value: 'ENGAGEMENT', name: 'Engagement' },
        { value: 'VIDEO_VIEW', name: 'Video Views' },
        { value: 'CATALOG_SALES', name: 'Catalog Sales' }
      ],
      bidTypes: [
        { value: 'BID_TYPE_NO_BID', name: 'Automatic Bidding' },
        { value: 'BID_TYPE_MAX_CONVERSION', name: 'Maximum Conversions' },
        { value: 'BID_TYPE_CUSTOM', name: 'Custom Bid' }
      ],
      campaignTypes: [
        { value: 'STANDARD', name: 'Standard Campaign' },
        { value: 'MISSION', name: 'Mission Campaign' }
      ]
    }

    res.json({
      success: true,
      data: fallbackData,
      fallback: true,
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
      operation_status: operation // "ENABLE", "DISABLE", "DELETE"
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

// ============ AD GROUP MANAGEMENT ENDPOINTS ============

// Получение метаданных для создания Ad Groups
router.get('/adgroup-metadata', async (req, res) => {
  const { access_token, advertiser_id, campaign_id } = req.query

  if (!access_token || !advertiser_id) {
    return res.status(400).json({
      success: false,
      error: 'Access token and advertiser ID are required',
    })
  }

  try {
    console.log('Fetching ad group metadata for advertiser:', advertiser_id)
    
    // Get campaign info to extract objective_type if campaign_id provided
    let objectiveType = 'TRAFFIC' // Default fallback
    if (campaign_id) {
      try {
        console.log('Getting campaign info for campaign_id:', campaign_id)
        const campaignResponse = await axios.get(`${TIKTOK_API_BASE}/campaign/get/`, {
          headers: {
            'Access-Token': access_token,
          },
          params: {
            advertiser_id: advertiser_id,
            campaign_ids: JSON.stringify([campaign_id]),
            fields: JSON.stringify(['campaign_id', 'objective_type'])
          },
        })
        
        const campaign = campaignResponse.data.data?.list?.[0]
        if (campaign?.objective_type) {
          objectiveType = campaign.objective_type
          console.log('Found campaign objective_type:', objectiveType)
        }
      } catch (campaignError) {
        console.log('Failed to get campaign objective, using fallback:', campaignError.message)
      }
    }
    
    // Parallel requests для лучшей производительности
    const [locationsResponse, interestsResponse, languagesResponse] = await Promise.allSettled([
      // Получаем доступные локации
      axios.get(`${TIKTOK_API_BASE}/tool/region/`, {
        headers: {
          'Access-Token': access_token,
        },
        params: {
          advertiser_id: advertiser_id,
          placements: JSON.stringify(['PLACEMENT_TIKTOK']),
          objective_type: objectiveType, // Required parameter!
          location_types: JSON.stringify(['COUNTRY']),
          level: '1'
        },
      }),

      // Получаем доступные интересы
      axios.get(`${TIKTOK_API_BASE}/tool/interest_category/`, {
        headers: {
          'Access-Token': access_token,
        },
        params: {
          advertiser_id: advertiser_id,
          placements: JSON.stringify(['PLACEMENT_TIKTOK']),
          special_industries: JSON.stringify([])
        },
      }),

      // Получаем доступные языки
      axios.get(`${TIKTOK_API_BASE}/tool/language/`, {
        headers: {
          'Access-Token': access_token,
        },
        params: {
          advertiser_id: advertiser_id,
          placements: JSON.stringify(['PLACEMENT_TIKTOK'])
        },
      })
    ])

    console.log('API responses status:', {
      locations: locationsResponse.status,
      interests: interestsResponse.status,
      languages: languagesResponse.status
    })

    // Process API responses
    let apiLocations = []
    let apiInterests = []
    let apiLanguages = []

    if (locationsResponse.status === 'fulfilled') {
      apiLocations = locationsResponse.value.data.data?.list || []
      console.log('Locations from API:', apiLocations.length)
      if (apiLocations.length === 0) {
        console.log('Locations API response:', JSON.stringify(locationsResponse.value.data, null, 2))
      }
    } else {
      console.log('Locations API failed:', locationsResponse.reason?.response?.data || locationsResponse.reason?.message)
      console.log('Locations API error status:', locationsResponse.reason?.response?.status)
    }

    if (interestsResponse.status === 'fulfilled') {
      apiInterests = interestsResponse.value.data.data?.list || []
      console.log('Interests from API:', apiInterests.length)
    } else {
      console.log('Interests API failed:', interestsResponse.reason?.message)
    }

    if (languagesResponse.status === 'fulfilled') {
      apiLanguages = languagesResponse.value.data.data?.list || []
      console.log('Languages from API:', apiLanguages.length)
    } else {
      console.log('Languages API failed:', languagesResponse.reason?.message)
    }

    const metadata = {
      placements: [
        { value: 'PLACEMENT_TIKTOK', name: 'TikTok' },
        { value: 'PLACEMENT_PANGLE', name: 'Pangle' }
      ],
      locations: apiLocations.length > 0 ? apiLocations.slice(0, 50) : [],
      interests: apiInterests.length > 0 ? apiInterests.slice(0, 30) : [],
      languages: apiLanguages.length > 0 ? apiLanguages.slice(0, 20) : [],
      // Additional required fields for Ad Group creation
      optimization_goals: [
        { value: 'CLICK', name: 'Clicks' },
        { value: 'REACH', name: 'Reach' },
        { value: 'IMPRESSION', name: 'Impressions' },
        { value: 'CONVERSION', name: 'Conversions' }
      ],
      billing_events: [
        { value: 'CPC', name: 'Cost Per Click' },
        { value: 'CPM', name: 'Cost Per Mille' },
        { value: 'OCPC', name: 'Optimized CPC' }
      ],
      promotion_types: [
        { value: 'WEBSITE', name: 'Website' },
        { value: 'APP', name: 'App' },
        { value: 'ECOMMERCE', name: 'E-commerce' }
      ]
    }

    // Add fallback data only if API returned empty results
    if (metadata.locations.length === 0) {
      console.log('Using fallback locations (API returned empty)')
      // Note: These are common global location IDs, but may not work for all advertiser accounts
      metadata.locations = [
        { location_id: '6252001', name: 'United States', location_type: 'COUNTRY' },
        { location_id: '6251999', name: 'Canada', location_type: 'COUNTRY' },
        { location_id: '2635167', name: 'United Kingdom', location_type: 'COUNTRY' },
        { location_id: '2921044', name: 'Germany', location_type: 'COUNTRY' },
        { location_id: '3017382', name: 'France', location_type: 'COUNTRY' },
        { location_id: '1861060', name: 'Japan', location_type: 'COUNTRY' },
        { location_id: '2077456', name: 'Australia', location_type: 'COUNTRY' }
      ]
      console.log('WARNING: Using fallback location IDs. These may not be valid for this advertiser account.')
    }

    if (metadata.interests.length === 0) {
      console.log('Using fallback interests')
      metadata.interests = [
        { interest_category_id: '6311', interest_category_name: 'Technology', parent_category_id: '0' },
        { interest_category_id: '6312', interest_category_name: 'Sports', parent_category_id: '0' },
        { interest_category_id: '6313', interest_category_name: 'Fashion', parent_category_id: '0' },
        { interest_category_id: '6314', interest_category_name: 'Food & Dining', parent_category_id: '0' },
        { interest_category_id: '6315', interest_category_name: 'Travel', parent_category_id: '0' },
        { interest_category_id: '6316', interest_category_name: 'Entertainment', parent_category_id: '0' },
        { interest_category_id: '6317', interest_category_name: 'Beauty', parent_category_id: '0' },
        { interest_category_id: '6318', interest_category_name: 'Health & Fitness', parent_category_id: '0' },
        { interest_category_id: '6319', interest_category_name: 'Business', parent_category_id: '0' },
        { interest_category_id: '6320', interest_category_name: 'Education', parent_category_id: '0' },
        { interest_category_id: '6321', interest_category_name: 'Automotive', parent_category_id: '0' },
        { interest_category_id: '6322', interest_category_name: 'Finance', parent_category_id: '0' },
        { interest_category_id: '6323', interest_category_name: 'Real Estate', parent_category_id: '0' },
        { interest_category_id: '6324', interest_category_name: 'Home & Garden', parent_category_id: '0' },
        { interest_category_id: '6325', interest_category_name: 'Pets', parent_category_id: '0' }
      ]
    }

    if (metadata.languages.length === 0) {
      console.log('Using fallback languages')
      metadata.languages = [
        { language_code: 'en', language: 'English' },
        { language_code: 'es', language: 'Spanish' },
        { language_code: 'fr', language: 'French' },
        { language_code: 'de', language: 'German' },
        { language_code: 'ja', language: 'Japanese' },
        { language_code: 'zh', language: 'Chinese' },
        { language_code: 'pt', language: 'Portuguese' },
        { language_code: 'it', language: 'Italian' },
        { language_code: 'ru', language: 'Russian' },
        { language_code: 'ar', language: 'Arabic' }
      ]
    }

    console.log('Final metadata counts:', {
      locations: metadata.locations.length,
      interests: metadata.interests.length,
      languages: metadata.languages.length
    })
    
    // Log first few locations for debugging
    if (metadata.locations.length > 0) {
      console.log('First 3 locations:', metadata.locations.slice(0, 3).map(loc => ({
        id: loc.location_id,
        name: loc.name,
        type: loc.location_type
      })))
    }

    res.json({
      success: true,
      data: metadata,
    })
  } catch (error) {
    console.error('Error fetching adgroup metadata:', error.response?.data || error.message)
    
    // Fallback данные если API endpoint не работает
    const fallbackData = {
      placements: [
        { value: 'PLACEMENT_TIKTOK', name: 'TikTok' },
        { value: 'PLACEMENT_PANGLE', name: 'Pangle' }
      ],
      locations: [
        { location_id: '6252001', name: 'United States', location_type: 'COUNTRY' },
        { location_id: '6251999', name: 'Canada', location_type: 'COUNTRY' },
        { location_id: '2635167', name: 'United Kingdom', location_type: 'COUNTRY' },
        { location_id: '2921044', name: 'Germany', location_type: 'COUNTRY' },
        { location_id: '3017382', name: 'France', location_type: 'COUNTRY' },
        { location_id: '1861060', name: 'Japan', location_type: 'COUNTRY' },
        { location_id: '2077456', name: 'Australia', location_type: 'COUNTRY' }
      ],
      interests: [
        { interest_category_id: '6311', interest_category_name: 'Technology', parent_category_id: '0' },
        { interest_category_id: '6312', interest_category_name: 'Sports', parent_category_id: '0' },
        { interest_category_id: '6313', interest_category_name: 'Fashion', parent_category_id: '0' },
        { interest_category_id: '6314', interest_category_name: 'Food & Dining', parent_category_id: '0' },
        { interest_category_id: '6315', interest_category_name: 'Travel', parent_category_id: '0' },
        { interest_category_id: '6316', interest_category_name: 'Entertainment', parent_category_id: '0' },
        { interest_category_id: '6317', interest_category_name: 'Beauty', parent_category_id: '0' },
        { interest_category_id: '6318', interest_category_name: 'Health & Fitness', parent_category_id: '0' }
      ],
      languages: [
        { language_code: 'en', language: 'English' },
        { language_code: 'es', language: 'Spanish' },
        { language_code: 'fr', language: 'French' },
        { language_code: 'de', language: 'German' },
        { language_code: 'ja', language: 'Japanese' }
      ],
      // Additional required fields for Ad Group creation
      optimization_goals: [
        { value: 'CLICK', name: 'Clicks' },
        { value: 'REACH', name: 'Reach' },
        { value: 'IMPRESSION', name: 'Impressions' },
        { value: 'CONVERSION', name: 'Conversions' }
      ],
      billing_events: [
        { value: 'CPC', name: 'Cost Per Click' },
        { value: 'CPM', name: 'Cost Per Mille' },
        { value: 'OCPC', name: 'Optimized CPC' }
      ],
      promotion_types: [
        { value: 'WEBSITE', name: 'Website' },
        { value: 'APP', name: 'App' },
        { value: 'ECOMMERCE', name: 'E-commerce' }
      ]
    }

    res.json({
      success: true,
      data: fallbackData,
      fallback: true,
    })
  }
})

// Получение списка Ad Groups для кампании
router.get('/adgroups', async (req, res) => {
  const { access_token, advertiser_id, campaign_id } = req.query

  console.log(`[BACKEND] GET /adgroups called with:`, {
    advertiser_id,
    campaign_id: campaign_id || 'ALL_CAMPAIGNS',
    has_access_token: !!access_token
  })

  if (!access_token || !advertiser_id) {
    return res.status(400).json({
      success: false,
      error: 'Access token and advertiser ID are required',
    })
  }

  try {
    const params = {
      advertiser_id: advertiser_id,
      fields: JSON.stringify([
        'adgroup_id',
        'adgroup_name',
        'campaign_id',
        'operation_status',
        'budget_mode',
        'budget',
        'bid_type',
        'optimization_goal',
        'create_time'
      ])
    }

    // Если указан campaign_id, фильтруем по нему
    if (campaign_id) {
      params.campaign_ids = JSON.stringify([campaign_id])
      console.log(`[BACKEND] Filtering by campaign_id: ${campaign_id}`)
    } else {
      console.log(`[BACKEND] No campaign_id specified - fetching ALL ad groups`)
    }

    console.log(`[BACKEND] Sending request to TikTok API with params:`, params)

    const response = await axios.get(`${TIKTOK_API_BASE}/adgroup/get/`, {
      headers: {
        'Access-Token': access_token,
      },
      params: params,
    })

    let adGroups = response.data.data?.list || []
    console.log(`[BACKEND] TikTok API returned ${adGroups.length} ad groups (before filtering):`, 
      adGroups.map(ag => ({ 
        id: ag.adgroup_id, 
        name: ag.adgroup_name, 
        campaign_id: ag.campaign_id 
      }))
    )

    // ВАЖНО: TikTok API игнорирует campaign_ids параметр и возвращает ВСЕ группы объявлений!
    // Поэтому фильтруем клиентски
    if (campaign_id) {
      const originalCount = adGroups.length
      adGroups = adGroups.filter(ag => ag.campaign_id === campaign_id)
      console.log(`[BACKEND] Filtered ad groups from ${originalCount} to ${adGroups.length} for campaign ${campaign_id}`)
      console.log(`[BACKEND] Final filtered ad groups:`, 
        adGroups.map(ag => ({ 
          id: ag.adgroup_id, 
          name: ag.adgroup_name, 
          campaign_id: ag.campaign_id 
        }))
      )
    }

    // Создаем новый response объект с отфильтрованными данными
    const filteredResponse = {
      ...response.data,
      data: {
        ...response.data.data,
        list: adGroups,
        page_info: {
          ...response.data.data.page_info,
          total_number: adGroups.length,
          total_page: adGroups.length > 0 ? 1 : 0
        }
      }
    }

    res.json({
      success: true,
      data: filteredResponse,
    })
  } catch (error) {
    console.error(`[BACKEND] Error fetching ad groups:`, error.response?.data || error.message)
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    })
  }
})

// Создание новой Ad Group
router.post('/adgroups', async (req, res) => {
  const { access_token, advertiser_id, adgroup_data } = req.body

  if (!access_token || !advertiser_id || !adgroup_data) {
    return res.status(400).json({
      success: false,
      error: 'Access token, advertiser ID and adgroup data are required',
    })
  }

  try {
    const response = await axios.post(`${TIKTOK_API_BASE}/adgroup/create/`, {
      advertiser_id: advertiser_id,
      ...adgroup_data
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

// Обновление статуса Ad Group
router.put('/adgroups/:adgroup_id/status', async (req, res) => {
  const { adgroup_id } = req.params
  const { access_token, advertiser_id, operation } = req.body

  if (!access_token || !advertiser_id || !operation) {
    return res.status(400).json({
      success: false,
      error: 'Access token, advertiser ID and operation are required',
    })
  }

  try {
    const response = await axios.post(`${TIKTOK_API_BASE}/adgroup/status/update/`, {
      advertiser_id: advertiser_id,
      adgroup_ids: JSON.stringify([adgroup_id]),
      operation_status: operation // "ENABLE", "DISABLE", "DELETE"
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

// Получение статистики Ad Groups
router.get('/adgroup-stats', async (req, res) => {
  const { access_token, advertiser_id, campaign_id, start_date, end_date } = req.query

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
    const params = {
      advertiser_id: advertiser_id,
      report_type: 'BASIC',
      dimensions: JSON.stringify(['adgroup_id']),
      metrics: JSON.stringify([
        'spend',
        'impressions', 
        'clicks',
        'ctr',
        'cpc'
      ]),
      start_date: startDate,
      end_date: endDate,
      data_level: 'AUCTION_ADGROUP'
    }

    // Если указан campaign_id, добавляем фильтр в правильном формате
    if (campaign_id) {
      params.filtering = JSON.stringify([
        {
          field_name: 'campaign_ids',
          filter_type: 'IN',
          filter_value: JSON.stringify([campaign_id])
        }
      ])
    }

    console.log('Ad group stats request params:', {
      ...params,
      filtering: params.filtering ? JSON.parse(params.filtering) : 'none'
    })

    const response = await axios.get(`${TIKTOK_API_BASE}/report/integrated/get/`, {
      headers: {
        'Access-Token': access_token,
      },
      params: params,
    })

    res.json({
      success: true,
      data: response.data,
    })
  } catch (error) {
    console.error('Error fetching ad group stats:', error.response?.data || error.message)
    
    // Если ошибка связана с отсутствием данных, возвращаем пустую статистику
    if (error.response?.data?.code === 40002) {
      res.json({
        success: true,
        data: {
          code: 0,
          message: 'No data available',
          data: {
            list: []
          }
        }
      })
    } else {
      res.status(500).json({
        success: false,
        error: error.response?.data || error.message,
      })
    }
  }
})


export default router
