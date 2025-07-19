import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import qs from 'qs'
import dotenv from 'dotenv'

// 📦 Загрузка .env переменных
dotenv.config()

const app = express()
const PORT = 3000

// 🛡️ Подключение middleware
app.use(cors())
app.use(express.json())

// 🔐 Настройки API Namecheap
const NAMECHEAP_API_USER = process.env.NAMECHEAP_API_USER
const NAMECHEAP_API_KEY = process.env.NAMECHEAP_API_KEY
const CLIENT_IP = process.env.NAMECHEAP_CLIENT_IP
const NAMECHEAP_API_URL = process.env.NAMECHEAP_API_URL || 'https://api.namecheap.com/xml.response'

// ✅ Проверка домена
app.post('/check-domain', async (req, res) => {
  const { domain } = req.body

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'No domain provided' })
  }

  console.log(`🔍 Проверка домена: ${domain}`)

  try {
    const response = await axios.get(NAMECHEAP_API_URL, {
      params: {
        ApiUser: NAMECHEAP_API_USER,
        ApiKey: NAMECHEAP_API_KEY,
        UserName: NAMECHEAP_API_USER,
        Command: 'namecheap.domains.check',
        ClientIp: CLIENT_IP,
        DomainList: domain,
      },
    })

    const xml = response.data
    console.log('📦 XML (обрезка):', xml.slice(0, 500))

    const parsed = await parseStringPromise(xml)

    // 🧪 Логика обработки результата
    const status = parsed?.ApiResponse?.$?.Status
    const result = parsed?.ApiResponse?.CommandResponse?.[0]?.DomainCheckResult?.[0]?.$

    const errorMessages = parsed?.ApiResponse?.Errors?.[0]?.Error
    if (errorMessages) {
      const msg = errorMessages[0]?._ || 'Unknown Namecheap error'
      console.error('❌ Ошибка от API:', msg)
      return res.status(500).json({ error: msg })
    }

    if (status !== 'OK' || !result) {
      console.error('⚠️ Некорректный ответ Namecheap:', parsed)
      return res.status(500).json({ error: 'Invalid Namecheap response structure' })
    }

    const isAvailable = result.Available === 'true'
    console.log(`✅ Домен ${domain} — ${isAvailable ? 'доступен' : 'занят'}`)

    res.json({ available: isAvailable })
  } catch (err) {
    const message = err?.message || 'Unknown error'
    console.error('❌ Ошибка:', message)
    res.status(500).json({ error: message })
  }
})

// Покупка домена
app.post('/buy-domain', async (req, res) => {
  const { domain } = req.body

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'No domain provided' })
  }

  const contact = {
    FirstName: process.env.CONTACT_FIRSTNAME,
    LastName: process.env.CONTACT_LASTNAME,
    Address1: process.env.CONTACT_ADDRESS1,
    City: process.env.CONTACT_CITY,
    StateProvince: process.env.CONTACT_STATE,
    PostalCode: process.env.CONTACT_ZIP,
    Country: process.env.CONTACT_COUNTRY,
    Phone: process.env.CONTACT_PHONE,
    EmailAddress: process.env.CONTACT_EMAIL,
  }

  const params = {
    ApiUser: NAMECHEAP_API_USER,
    ApiKey: NAMECHEAP_API_KEY,
    UserName: NAMECHEAP_API_USER,
    Command: 'namecheap.domains.create',
    ClientIp: CLIENT_IP,
    DomainName: domain,
    Years: 1,
    ...Object.fromEntries(
      ['Registrant', 'Tech', 'Admin', 'AuxBilling'].flatMap((role) =>
        Object.entries(contact).map(([key, value]) => [`${role}${key}`, value])
      )
    ),
  }

  try {
    console.log(`📥 Запрос на покупку домена: ${domain}`)

    if (process.env.TEST_MODE === 'true') {
      console.log(`🧪 Тестовий режим: покупка домена ${domain} не виконується`)
      return res.json({ success: true, test: true, domain })
    }

    const response = await axios.get(NAMECHEAP_API_URL, { params })
    const xml = response.data
    console.log('📦 XML (обрезка):', xml.slice(0, 500))

    const parsed = await parseStringPromise(xml)
    const errors = parsed?.ApiResponse?.Errors?.[0]?.Error
    const result = parsed?.ApiResponse?.CommandResponse?.[0]?.DomainCreateResult?.[0]?.$

    if (errors) {
      const msg = errors[0]?._ || 'Unknown Namecheap error'
      console.error('❌ Ошибка регистрации:', msg)
      return res.status(500).json({ error: msg })
    }

    if (result?.Registered === 'true') {
      console.log(`✅ Домен успешно куплен: ${result.Domain}`)
      return res.json({
        success: true,
        domain: result.Domain,
        charged: result.ChargedAmount,
        domainId: result.DomainID,
      })
    }

    return res.status(500).json({ error: 'Не вдалося зареєструвати домен' })
  } catch (err) {
    console.error('❌ Исключение при регистрации:', err.message)
    res.status(500).json({ error: 'Внутрішня помилка сервера' })
  }
})

// Додавання домену до Sedo.com
app.post('/send-to-sedo', async (req, res) => {
  const { domain, accountKey = 'TT1' } = req.body

  if (!domain) {
    return res.status(400).json({ error: 'No domain provided' })
  }

  const postData = {
    partnerid: process.env[`SEDO_PARTNER_ID_${accountKey}`],
    signkey: process.env[`SEDO_SIGN_KEY_${accountKey}`],
    username: process.env[`VITE_SEDO_USERNAME_${accountKey}`],
    password: process.env[`SEDO_PASSWORD_${accountKey}`],
    output_method: 'xml',
    domainentry: [
      {
        domain,
        forsale: 1,
        price: 0,
        minprice: 0,
        fixedprice: 0,
        currency: 1,
        domainlanguage: 'en',
      },
    ],
  }

  try {
    console.log(`📤 Отправка домена в Sedo (${accountKey}):`, postData.username, domain)

    const response = await axios.post(
      'https://api.sedo.com/api/v1/DomainInsert',
      qs.stringify(postData, { arrayFormat: 'indices' }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    )

    const xml = response.data
    console.log('📥 Ответ от Sedo (XML):', xml.slice(0, 500))

    const parsed = await parseStringPromise(xml)
    const result = parsed?.SEDOLIST?.item?.[0]

    const status = result?.status?.[0]
    const domainName = result?.domain?.[0]
    const message = result?.message?.[0] || ''

    if (status === 'ok' && message === '') {
      return res.json({
        success: true,
        domain: domainName,
        info: '',
      })
    }

    return res.status(200).json({
      success: false,
      error: message || 'Невідома помилка',
    })
  } catch (err) {
    if (err.response?.data?.startsWith?.('<?xml')) {
      const parsedError = await parseStringPromise(err.response.data)
      console.error('❌ XML-ошибка от Sedo:', JSON.stringify(parsedError, null, 2))
      const faultString = parsedError?.SEDOFAULT?.faultstring?.[0] || 'Невідома помилка'
      return res.status(500).json({ error: faultString })
    }

    console.error('❌ Ошибка при отправке в Sedo:', err.response?.data || err.message)
    return res.status(500).json({ error: err.message || 'Серверна помилка' })
  }
})

// Установка DNS для доменов
app.post('/set-dns', async (req, res) => {
  const { domain, nameservers } = req.body

  if (!domain || !Array.isArray(nameservers) || nameservers.length === 0) {
    return res.status(400).json({ error: 'Invalid input data' })
  }

  // 🔍 Разделение домена на SLD и TLD
  const [sld, ...tldParts] = domain.split('.')
  const tld = tldParts.join('.')

  if (!sld || !tld) {
    return res.status(400).json({ error: 'Invalid domain format' })
  }

  try {
    const response = await axios.get(NAMECHEAP_API_URL, {
      params: {
        ApiUser: NAMECHEAP_API_USER,
        ApiKey: NAMECHEAP_API_KEY,
        UserName: NAMECHEAP_API_USER,
        Command: 'namecheap.domains.dns.setCustom',
        ClientIp: CLIENT_IP,
        SLD: sld,
        TLD: tld,
        Nameservers: nameservers.join(','),
      },
    })

    const parsed = await parseStringPromise(response.data)
    const errors = parsed?.ApiResponse?.Errors?.[0]?.Error

    if (errors) {
      const msg = errors[0]?._ || 'Unknown DNS error'
      console.error('❌ DNS Error:', msg)
      return res.status(500).json({ error: msg })
    }

    console.log(`✅ DNS збережено для ${domain}:`, nameservers.join(', '))
    return res.json({ success: true, domain, nameservers })
  } catch (err) {
    console.error('❌ set-dns exception:', err.message)
    res.status(500).json({ error: 'Server error while setting DNS' })
  }
})

// Створити офер у ClickFlare
app.post('/clickflare/create-offer', async (req, res) => {
  const { name, url, workspace_id } = req.body
  const API_KEY = process.env.VITE_CLICKFLARE_API_KEY
  const AFFILIATE_NETWORK_ID = process.env.VITE_AFFILIATE_NETWORK_SEDO_ID

  if (!name || !url || !workspace_id) {
    console.warn('⚠️ Не вистачає обовʼязкових полів:', { name, url, workspace_id })
    return res.status(400).json({ error: 'Missing required fields: name, url, workspace_id' })
  }

  const payload = {
    name,
    url,
    workspace_id,
    direct: true,
    affiliateNetworkID: AFFILIATE_NETWORK_ID,
    payout: {
      type: 'manual',
      payout: 0,
      currency: 'USD',
    },
    keywordBuilderMode: 'free_form',
  }

  try {
    const response = await axios.post('https://public-api.clickflare.io/api/offers', payload, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
    })

    const offerId = response.data?.id || response.data?.offer_id

    if (!offerId) {
      console.warn('⚠️ Успішна відповідь без ID оффера:', response.data)
    }

    res.json({ success: true, offerId })
  } catch (error) {
    const rawData = error?.response?.data
    const statusCode = error?.response?.status || 500

    const msg =
      rawData?.message || rawData?.data?.[0]?.message || error.message || 'Unknown server error'

    console.error('❌ ClickFlare error:', {
      message: msg,
      status: statusCode,
      data: rawData,
      fullError: JSON.stringify(error?.response?.data?.data, null, 2), // <-- вот ключ
    })

    res.status(statusCode).json({ error: msg })
  }
})

// Створення кампаній Tonic

// Отримати список кампаній для форми
app.get('/tonic/offers', async (req, res) => {
  const rawSource = req.query.trafficSource
  const trafficSource = rawSource?.trim?.()

  if (!trafficSource) {
    return res.status(400).json({ error: 'Missing trafficSource' })
  }

  let key, secret

  if (trafficSource === 'TikTok') {
    key = process.env.VITE_TONIC_ARTEM_TT_CONSUMER_KEY
    secret = process.env.VITE_TONIC_ARTEM_TT_CONSUMER_SECRET
  } else if (trafficSource === 'Facebook') {
    key = process.env.VITE_TONIC_MAX_FB_CONSUMER_KEY
    secret = process.env.VITE_TONIC_MAX_FB_CONSUMER_SECRET
  } else {
    return res.status(400).json({ error: 'Invalid trafficSource' })
  }

  try {
    // Получение JWT
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

    // Получение офферов с JWT
    const offersResp = await axios.get(
      'https://api.publisher.tonic.com/privileged/v3/offers/list?output=json',
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    res.json({ offers: offersResp.data }) // это массив
  } catch (err) {
    console.error('❌ Ошибка при загрузке офферов:', err?.response?.data || err.message)
    res.status(500).json({ error: err?.response?.data || err.message })
  }
})

// 🔍 Отримати список країн, дозволених для конкретного оффера
app.get('/tonic/countries/allowed', async (req, res) => {
  const offer = req.query.offer
  const trafficSource = req.query.trafficSource

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

// Кеш для збереження jwt-токена
const tonicTokenCache = {
  tiktok: { token: '', expiresAt: 0 },
  facebook: { token: '', expiresAt: 0 },
}

// 🔐 Функция получения JWT токена по trafficSource
async function getTonicJwtToken(trafficSource) {
  const source = trafficSource.toLowerCase()

  // Если в кэше есть валидный токен — вернуть его
  const cached = tonicTokenCache[source]
  if (cached?.token && Date.now() < cached.expiresAt) {
    return cached.token
  }

  let key, secret
  if (source === 'tiktok') {
    key = process.env.VITE_TONIC_ARTEM_TT_CONSUMER_KEY
    secret = process.env.VITE_TONIC_ARTEM_TT_CONSUMER_SECRET
  } else if (source === 'facebook') {
    key = process.env.VITE_TONIC_MAX_FB_CONSUMER_KEY
    secret = process.env.VITE_TONIC_MAX_FB_CONSUMER_SECRET
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
  const expiresInMs = 90 * 60 * 1000 // 90 минут
  tonicTokenCache[source] = {
    token,
    expiresAt: Date.now() + expiresInMs - 60 * 1000, // с запасом в 1 минуту
  }

  return token
}

// 🎯 Створення (відправка) нової кампанії
app.post('/tonic/create-campaign', async (req, res) => {
  const { name, offer, country, trafficSource } = req.body

  // 🛑 Проверяем только то, что действительно нужно
  if (!name || !offer || !country) {
    return res.status(400).json({
      error: 'Missing required fields: name, offer, country',
    })
  }

  if (!trafficSource) {
    return res.status(400).json({
      error: 'Missing trafficSource for token auth',
    })
  }

  try {
    const token = await getTonicJwtToken(trafficSource.toLowerCase())

    const queryParams = new URLSearchParams({
      name,
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

    // 📋 Подробный лог
    console.log('📤 Параметры запроса Tonic:', queryParams)
    console.log('📩 Ответ Tonic API (RAW):', JSON.stringify(response.data, null, 2))

    if (response.data.success === false || response.data.error) {
      console.error('Tonic error:', response.data)
      return res.status(400).json({
        error: response.data.error || 'Tonic API error',
      })
    }

    res.json({ success: true, data: response.data })
  } catch (err) {
    const status = err.response?.status || 500
    const errorData = err.response?.data || err.message
    console.error(`❌ Ошибка создания кампании (status ${status}):`, errorData)

    res.status(status).json({ error: errorData })
  }
})

// Отримати список наших кампаній
app.get('/tonic/find-campaign', async (req, res) => {
  const { name, trafficSource } = req.query
  if (!name || !trafficSource) return res.status(400).json({ error: 'Missing params' })

  try {
    const token = await getTonicJwtToken(trafficSource.toLowerCase())

    const resp = await axios.get(
      'https://api.publisher.tonic.com/privileged/v3/campaign/list?output=json',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const found = resp.data.find((c) => c.name === name)

    if (found) {
      return res.json({
        success: true,
        id: found.id,
        link: found.link || found.target,
        status: found.status || null,
      })
    } else {
      return res.status(404).json({ error: 'Campaign not found' })
    }
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

// Отримати статус кампанії по ID або name
app.get('/tonic/campaign-status', async (req, res) => {
  const { id, name, trafficSource } = req.query

  if (!trafficSource || (!id && !name)) {
    return res.status(400).json({ error: 'Missing id/name or trafficSource' })
  }

  try {
    const token = await getTonicJwtToken(trafficSource.toLowerCase())

    const query = new URLSearchParams()
    if (id) query.append('id', id)
    if (name) query.append('name', name)

    const response = await axios.get(
      `https://api.publisher.tonic.com/privileged/v3/campaign/status?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = response.data

    return res.json({
      success: true,
      status: data.status || 'unknown',
      link: data?.[0]?.link || '',
    })
  } catch (err) {
    const code = err?.response?.status
    if (code === 404) {
      return res.status(200).json({
        success: true,
        status: 'inactive',
      })
    }

    console.error('❌ Статус кампанії (помилка):', err?.message || err)
    return res.status(500).json({ error: 'Не вдалося отримати статус кампанії' })
  }
})

// 🚀 Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на ${process.env.VITE_API_BASE_URL || 'http://localhost'}:${PORT}`)
})
