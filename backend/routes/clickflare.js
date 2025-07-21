// routes/clickflare.js
import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

// 🎯 Створити офер у ClickFlare
router.post('/clickflare/create-offer', async (req, res) => {
  const { name, url, workspace_id, affiliateNetworkID: clientAffiliateNetworkID } = req.body
  const API_KEY = process.env.VITE_CLICKFLARE_API_KEY

  // ✅ fallback: якщо не передано — беремо з ENV
  const AFFILIATE_NETWORK_ID =
    clientAffiliateNetworkID || process.env.VITE_AFFILIATE_NETWORK_SEDO_ID

  if (!name || !url || !workspace_id) {
    console.warn('⚠️ Не вистачає обовʼязкових полів:', { name, url, workspace_id })
    return res.status(400).json({ error: 'Missing required fields: name, url, workspace_id' })
  }

  const payload = {
    name,
    url,
    workspace_id,
    direct: typeof req.body.direct === 'boolean' ? req.body.direct : false,
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

    const offerId = response.data?._id || response.data?.id || response.data?.offer_id

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
      fullError: JSON.stringify(error?.response?.data?.data, null, 2),
    })

    res.status(statusCode).json({ error: msg })
  }
})

export default router
