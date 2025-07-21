import express from 'express'
import axios from 'axios'
import qs from 'qs'
import { parseStringPromise } from 'xml2js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

// 📤 Додавання домену до Sedo.com
router.post('/send-to-sedo', async (req, res) => {
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

export default router
