import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

// 🔐 JWT-кеш
const tonicTokenCache = {
  tiktok: { token: '', expiresAt: 0 },
  facebook: { token: '', expiresAt: 0 },
}

// 🔐 Получить JWT токен
async function getTonicJwtToken(trafficSource) {
  const source = trafficSource.toLowerCase()

  const cached = tonicTokenCache[source]
  if (cached?.token && Date.now() < cached.expiresAt) {
    return cached.token
  }

  let key, secret
  if (source === 'tiktok') {
    key = process.env.TONIC_ARTEM_TT_CONSUMER_KEY
    secret = process.env.TONIC_ARTEM_TT_CONSUMER_SECRET
  } else if (source === 'facebook') {
    key = process.env.TONIC_MAX_FB_CONSUMER_KEY
    secret = process.env.TONIC_MAX_FB_CONSUMER_SECRET
  } else {
    throw new Error(`🔒 Невідомий trafficSource: ${trafficSource}`)
  }

  const response = await axios.post(
    'https://api.publisher.tonic.com/jwt/authenticate',
    {
      consumer_key: key,
      consumer_secret: secret,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const token = response.data.token
  tonicTokenCache[source] = {
    token,
    expiresAt: Date.now() + 90 * 60 * 1000 - 60 * 1000, // 90 мин - 1 мин запас
  }

  return token
}

// 📦 Получить список офферов
router.get('/tonic/offers', async (req, res) => {
  const rawSource = req.query.trafficSource
  const trafficSource = rawSource?.trim?.()

  if (!trafficSource) {
    return res.status(400).json({ error: 'Missing trafficSource' })
  }

  let key, secret
  if (trafficSource === 'TikTok') {
    key = process.env.TONIC_ARTEM_TT_CONSUMER_KEY
    secret = process.env.TONIC_ARTEM_TT_CONSUMER_SECRET
  } else if (trafficSource === 'Facebook') {
    key = process.env.TONIC_MAX_FB_CONSUMER_KEY
    secret = process.env.TONIC_MAX_FB_CONSUMER_SECRET
  } else {
    return res.status(400).json({ error: 'Invalid trafficSource' })
  }

  try {
    const jwtResp = await axios.post(
      'https://api.publisher.tonic.com/jwt/authenticate',
      {
        consumer_key: key,
        consumer_secret: secret,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const jwtToken = jwtResp.data.token

    const offersResp = await axios.get(
      'https://api.publisher.tonic.com/privileged/v3/offers/list?output=json',
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    res.json({ offers: offersResp.data })
  } catch (err) {
    console.error('❌ Ошибка при загрузке офферов:', err?.response?.data || err.message)
    res.status(500).json({ error: err?.response?.data || err.message })
  }
})

// 🌍 Получить список разрешённых стран
router.get('/tonic/countries/allowed', async (req, res) => {
  const { offer, trafficSource } = req.query

  if (!offer || !trafficSource) {
    return res.status(400).json({ error: 'Missing offer or trafficSource' })
  }

  try {
    const token = await getTonicJwtToken(trafficSource.toLowerCase())

    const response = await axios.get(
      `https://api.publisher.tonic.com/privileged/v3/countries/combination?offer=${encodeURIComponent(
        offer
      )}&output=json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    res.json({ allowedCountries: response.data })
  } catch (err) {
    console.error('❌ Помилка при перевірці дозволених країн:', err?.response?.data || err.message)
    res.status(500).json({ error: err?.response?.data || err.message })
  }
})

// 🎯 Создание новой кампании
router.post('/tonic/create-campaign', async (req, res) => {
  const { name, offer, country, trafficSource } = req.body
  // Извлекаем чистое имя без приставки для отправки в Tonic
  const cleanName = name.includes(' | ') ? name.split(' | ').slice(1).join(' | ') : name

  if (!name || !offer || !country || !trafficSource) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const token = await getTonicJwtToken(trafficSource.toLowerCase())

    const queryParams = new URLSearchParams({
      name: cleanName, // Отправляем без приставки
      offer,
      country,
      return_type: 'id',
      imprint: 'yes',
      headline_id: '1',
    }).toString()

    const response = await axios.post(
      `https://api.publisher.tonic.com/privileged/v3/campaign/create?${queryParams}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.success === false || response.data.error) {
      return res.status(400).json({ error: response.data.error || 'Tonic API error' })
    }

    res.json({ success: true, data: response.data })
  } catch (err) {
    const status = err?.response?.status || 500
    const errorData = err?.response?.data || err.message
    console.error(`❌ Ошибка создания кампании (status ${status}):`, errorData)

    res.status(status).json({ error: errorData })
  }
})

// 🔍 Поиск кампании по имени
router.get('/tonic/find-campaign', async (req, res) => {
  const { name, trafficSource } = req.query
  if (!name || !trafficSource) return res.status(400).json({ error: 'Missing params' })

  try {
    const token = await getTonicJwtToken(trafficSource.toLowerCase())

    console.log(`🔍 Пошук кампанії:`)
    console.log(`   Отримана назва: "${name}"`)
    console.log(`   Traffic Source: "${trafficSource}"`)

    let searchName = name

    // Сначала убираем приставку, если есть
    if (name.includes(' | ')) {
      searchName = name.split(' | ').slice(1).join(' | ')
    }

    const resIdMatch = searchName.match(/^(\d+)_(.+)$/)
    if (resIdMatch) {
      searchName = resIdMatch[2] // Беремо частину після resId_
      console.log(`   Пошук за очищеною назвою: "${searchName}"`)
    }

    const resp = await axios.get(
      'https://api.publisher.tonic.com/privileged/v3/campaign/list?output=json',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Шукаємо кампанію за очищеною назвою
    const found = resp.data.find((c) => c.name === searchName)

    if (found) {
      console.log(`✅ Кампанію знайдено:`, {
        id: found.id,
        name: found.name,
        link: found.link || found.target,
      })

      return res.json({
        success: true,
        id: found.id,
        link: found.link || found.target,
      })
    } else {
      console.log(`❌ Кампанію не знайдено серед ${resp.data.length} кампаній`)
      return res.status(404).json({ error: 'Campaign not found' })
    }
  } catch (err) {
    console.error('❌ Помилка пошуку кампанії:', err?.message || err)
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

// Отримання статусу
router.get('/tonic/campaign-status', async (req, res) => {
  const { name, trafficSource } = req.query

  if (!name || !trafficSource) {
    return res.status(400).json({ error: 'Missing name or trafficSource' })
  }

  try {
    const token = await getTonicJwtToken(trafficSource.toLowerCase())

    console.log(`🔍 Запит статусу кампанії:`)
    console.log(`   Отримана назва: "${name}"`)
    console.log(`   Traffic Source: "${trafficSource}"`)

    let cleanName = name

    // Сначала убираем приставку, если есть
    if (name.includes(' | ')) {
      cleanName = name.split(' | ').slice(1).join(' | ')
    }

    // Перевіряємо чи назва починається з цифр + підкреслення (resId_)
    const resIdMatch = cleanName.match(/^(\d+)_(.+)$/)
    if (resIdMatch) {
      cleanName = resIdMatch[2] // Беремо частину після resId_
      console.log(`   Очищена назва (без resId): "${cleanName}"`)
    }

    const response = await axios.get(
      `https://api.publisher.tonic.com/privileged/v3/campaign/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: { name: cleanName }, // Використовуємо очищену назву
      }
    )

    const data = response.data

    console.log(`📊 Відповідь Tonic API:`, data)

    return res.json({
      success: true,
      status: data?.status || 'unknown',
      link: data?.link || '',
    })
  } catch (err) {
    const code = err?.response?.status || 500

    if (code === 404) {
      console.log(`ℹ️ Кампанія не знайдена (404) - повертаємо status: inactive`)
      return res.status(200).json({ success: true, status: 'inactive' })
    }

    console.error('❌ Статус кампанії (помилка):', err?.message || err)
    return res.status(500).json({ error: 'Не вдалося отримати статус кампанії' })
  }
})

// 🏷️ Добавление ключевых слов к кампании
router.post('/tonic/add-keywords', async (req, res) => {
  const { campaignId, keywords, keywordAmount = 6 } = req.body

  if (!campaignId) {
    return res.status(400).json({ error: 'Campaign ID is required' })
  }

  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({ error: 'Keywords array is required and must not be empty' })
  }

  if (keywordAmount < 3 || keywordAmount > 10) {
    return res.status(400).json({ error: 'keyword_amount must be between 3 and 10' })
  }

  try {
    console.log('🏷️ Добавление ключевых слов к кампании:', {
      campaignId,
      keywords,
      keywordAmount,
    })

    // Получаем токен (используем TikTok по умолчанию, можно добавить trafficSource параметр)
    const token = await getTonicJwtToken('tiktok')

    const requestData = {
      campaign_id: parseInt(campaignId),
      keywords: keywords,
      keyword_amount: parseInt(keywordAmount),
    }

    console.log('📤 Отправка данных в Tonic API:', requestData)

    const response = await axios.post(
      'https://api.publisher.tonic.com/privileged/v3/campaign/keywords',
      requestData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
        validateStatus: function (status) {
          return status < 500 // Принимаем все статусы меньше 500
        },
      }
    )

    console.log('📥 Ответ от Tonic API:', {
      status: response.status,
      data: response.data,
    })

    if (response.status === 200) {
      const keywordSetId = response.data.KeywordSetId
      const resultKeywords = response.data.Keywords

      console.log('✅ Ключевые слова успешно добавлены:', {
        keywordSetId,
        resultKeywords,
      })

      return res.json({
        success: true,
        data: {
          keywordSetId: keywordSetId,
          keywords: resultKeywords,
        },
      })
    } else {
      console.warn('⚠️ Неуспешный статус от Tonic API:', response.status)
      return res.status(response.status).json({
        success: false,
        error: response.data,
      })
    }
  } catch (error) {
    console.error('❌ Ошибка добавления ключевых слов:', error?.response?.data || error.message)

    const status = error?.response?.status || 500
    const errorData = error?.response?.data || error.message

    res.status(status).json({
      success: false,
      error: errorData,
    })
  }
})

// 📋 Получить список кампаний
router.get('/tonic/campaigns', async (req, res) => {
  const rawSource = req.query.trafficSource
  const trafficSource = rawSource?.trim?.()

  if (!trafficSource) {
    return res.status(400).json({ error: 'Missing trafficSource' })
  }

  try {
    const token = await getTonicJwtToken(trafficSource.toLowerCase())

    const response = await axios.get(
      'https://api.publisher.tonic.com/privileged/v3/campaign/list?state=active&output=json',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (Array.isArray(response.data)) {
      const campaigns = response.data.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        country: campaign.country,
        offer: campaign.offer,
        vertical: campaign.vertical,
        link: campaign.link,
        target: campaign.target,
        direct_link: campaign.direct_link,
      }))

      res.json({ campaigns })
    } else {
      res.status(500).json({ error: 'Invalid response format' })
    }
  } catch (err) {
    console.error('❌ Ошибка при загрузке кампаний:', err?.response?.data || err.message)
    res.status(500).json({ error: err?.response?.data || err.message })
  }
})

// 📋 Получить ключевые слова кампании
router.get('/tonic/campaign-keywords', async (req, res) => {
  const { campaignId, trafficSource } = req.query

  if (!campaignId || !trafficSource) {
    return res.status(400).json({ error: 'Missing campaignId or trafficSource' })
  }

  try {
    const token = await getTonicJwtToken(trafficSource.toLowerCase())

    const response = await axios.get(
      `https://api.publisher.tonic.com/privileged/v3/campaign/keywords?campaign_id=${campaignId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const keywords = response.data.Keywords || []
    const keywordAmount = response.data.KwAmount || 0

    res.json({
      success: true,
      keywords,
      keywordAmount,
    })
  } catch (err) {
    console.error('❌ Ошибка при загрузке ключевых слов:', err?.response?.data || err.message)
    res.status(500).json({ error: err?.response?.data || err.message })
  }
})

export default router
