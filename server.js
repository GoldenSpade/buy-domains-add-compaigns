import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import dotenv from 'dotenv'

// 📦 Загрузка .env переменных
dotenv.config()

const app = express()
const PORT = 3000

// 🛡️ Подключение middleware
app.use(cors())
app.use(express.json())

// 🔐 Настройки API Namecheap
const NAMECHEAP_API_USER = process.env.VITE_NAMECHEAP_API_USER
const NAMECHEAP_API_KEY = process.env.VITE_NAMECHEAP_API_KEY
const CLIENT_IP = process.env.VITE_CLIENT_IP

// Custom NameServers
const CUSTOM_DNS_1 = process.env.CUSTOM_DNS_1
const CUSTOM_DNS_2 = process.env.CUSTOM_DNS_2

// ✅ Проверка домена
app.post('/check-domain', async (req, res) => {
  const { domain } = req.body

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'No domain provided' })
  }

  console.log(`🔍 Проверка домена: ${domain}`)

  try {
    const response = await axios.get('https://api.namecheap.com/xml.response', {
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

    const response = await axios.get('https://api.namecheap.com/xml.response', { params })
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
      try {
        await setCustomDNS(result.Domain)
        console.log(`🧷 DNS встановлено на ns1.sedopark.net`)
      } catch (dnsErr) {
        console.warn(`⚠️ DNS не встановлено: ${dnsErr.message}`)
      }
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

async function setCustomDNS(domain) {
  const nameservers = [CUSTOM_DNS_1, CUSTOM_DNS_2].filter(Boolean).join(',')

  const response = await axios.get('https://api.namecheap.com/xml.response', {
    params: {
      ApiUser: NAMECHEAP_API_USER,
      ApiKey: NAMECHEAP_API_KEY,
      UserName: NAMECHEAP_API_USER,
      Command: 'namecheap.domains.dns.setCustom',
      ClientIp: CLIENT_IP,
      DomainName: domain,
      Nameservers: nameservers,
    },
  })

  const parsed = await parseStringPromise(response.data)
  const errors = parsed?.ApiResponse?.Errors?.[0]?.Error

  if (errors) {
    const msg = errors[0]?._ || 'Unknown DNS error'
    throw new Error(`DNS Error: ${msg}`)
  }

  return true
}

// 🚀 Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`)
})
