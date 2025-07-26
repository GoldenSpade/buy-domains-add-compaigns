import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

const workspaceMap = {
  Alex: process.env.VITE_WORKSPACE_ALEX,
  Davyd: process.env.VITE_WORKSPACE_DAVYD,
}

// 📋 Отримати список всіх офферів з ClickFlare
router.get('/clickflare/offers', async (req, res) => {
  const API_KEY = process.env.VITE_CLICKFLARE_API_KEY
  const { workspace_id, search, page = 1, pageSize = 100 } = req.query

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    })

    if (search) {
      params.append('search', search)
    }

    const response = await axios.get(`https://public-api.clickflare.io/api/offers?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
    })

    // Фільтруємо по workspace_id якщо передано
    let offers = response.data || []
    if (workspace_id) {
      offers = offers.filter((offer) => offer.workspace_id === workspace_id)
    }

    res.json({ success: true, offers })
  } catch (error) {
    const rawData = error?.response?.data
    const statusCode = error?.response?.status || 500

    const msg =
      rawData?.message || rawData?.data?.[0]?.message || error.message || 'Unknown server error'

    console.error('❌ ClickFlare GET offers error:', {
      message: msg,
      status: statusCode,
      data: rawData,
    })

    res.status(statusCode).json({ error: msg })
  }
})

// 📋 Отримати список кампаній з ClickFlare
router.get('/clickflare/campaigns', async (req, res) => {
  const API_KEY = process.env.VITE_CLICKFLARE_API_KEY
  const { workspace_id, search, page = 1, pageSize = 100 } = req.query

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    })

    if (search) {
      params.append('search', search)
    }

    const response = await axios.get(`https://public-api.clickflare.io/api/campaigns?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
    })

    // Фільтруємо по workspace_id якщо передано
    let campaigns = response.data || []
    if (workspace_id) {
      campaigns = campaigns.filter((campaign) => campaign.workspace_id === workspace_id)
    }

    res.json({ success: true, campaigns })
  } catch (error) {
    const rawData = error?.response?.data
    const statusCode = error?.response?.status || 500

    const msg =
      rawData?.message || rawData?.data?.[0]?.message || error.message || 'Unknown server error'

    console.error('❌ ClickFlare GET campaigns error:', {
      message: msg,
      status: statusCode,
      data: rawData,
    })

    res.status(statusCode).json({ error: msg })
  }
})

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

    res.json({ success: true, offerId, data: response.data })
  } catch (error) {
    const rawData = error?.response?.data
    const statusCode = error?.response?.status || 500

    const msg =
      rawData?.message || rawData?.data?.[0]?.message || error.message || 'Unknown server error'

    console.error('❌ ClickFlare create offer error:', {
      message: msg,
      status: statusCode,
      data: rawData,
      fullError: JSON.stringify(error?.response?.data?.data, null, 2),
    })

    res.status(statusCode).json({ error: msg })
  }
})

// 🔄 ВИПРАВЛЕНИЙ комбінований метод: створити офер + кампанію з flow
router.post('/clickflare/create-offer-and-campaign', async (req, res) => {
  const {
    offerName,
    offerUrl,
    campaignName,
    workspace_id,
    buyer,
    affiliateNetworkID,
    trafficSource = 'TikTok',
    country = null,
    cost = 0,
    cost_type = 'cpc',
  } = req.body

  const API_KEY = process.env.VITE_CLICKFLARE_API_KEY

  if (!offerName || !offerUrl || !campaignName || !workspace_id) {
    return res.status(400).json({
      error: 'Missing required fields: offerName, offerUrl, campaignName, workspace_id',
    })
  }

  try {
    console.log('🚀 Початок створення offer + campaign з flow')
    console.log('📋 Параметри:', {
      offerName,
      campaignName,
      workspace_id,
      buyer,
      trafficSource,
      country,
    })

    // 1️⃣ Створюємо офер
    console.log('1️⃣ Створюємо офер:', offerName)

    const offerPayload = {
      name: offerName,
      url: offerUrl,
      workspace_id,
      direct: false,
      affiliateNetworkID: affiliateNetworkID || process.env.VITE_AFFILIATE_NETWORK_TONIC_ID,
      payout: {
        type: 'manual',
        payout: 0,
        currency: 'USD',
      },
      keywordBuilderMode: 'free_form',
    }

    console.log('📤 Offer payload:', JSON.stringify(offerPayload, null, 2))

    const offerResponse = await axios.post(
      'https://public-api.clickflare.io/api/offers',
      offerPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY,
        },
      }
    )

    const offerId = offerResponse.data?._id || offerResponse.data?.id

    if (!offerId) {
      throw new Error('Не вдалося отримати ID створеного офера')
    }

    console.log('✅ Офер створено з ID:', offerId)

    // 2️⃣ Створюємо кампанію з вбудованим flow
    console.log('2️⃣ Створюємо кампанію з flow:', campaignName)

    const trafficSourceMap = {
      TikTok: process.env.VITE_TIKTOK_TRAFFIC_SOURCE_ID || '684bf93e5f67710012addf85',
      Facebook: process.env.VITE_FACEBOOK_TRAFFIC_SOURCE_ID || '684bf954359cb30012ff1586',
    }

    // ✅ Payload з вбудованим flow
    const campaignPayload = {
      name: campaignName,
      workspace_id,
      tracking_type: 'redirect',
      traffic_source_id: trafficSourceMap[trafficSource],
      cost,
      cost_type,
      disable_postbacks: false,
      notes: `Auto-created campaign for Tonic offer - ${trafficSource}`,
      // ✅ Додаємо вбудований flow з офером
      flow: {
        internal: true,
        flow: {
          name: `Flow for ${campaignName}`,
          transition: '302',
          workspace_id: workspace_id,
        },
        paths: {
          defaultPaths: {
            paths: [
              {
                name: 'Default Path',
                destination: 'offers_only',
                enabled: true,
                transition: '302',
                weight: 100,
                offers_only: {
                  offers: [
                    {
                      id: offerId,
                      weight: 100,
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    }

    // Додаємо країну тільки якщо вона передана
    if (country && country !== null && country !== 'null') {
      campaignPayload.country = country
    }

    console.log('📤 Campaign payload:', JSON.stringify(campaignPayload, null, 2))

    const campaignResponse = await axios.post(
      'https://public-api.clickflare.io/api/campaigns',
      campaignPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY,
        },
      }
    )

    const campaignId = campaignResponse.data?._id || campaignResponse.data?.id
    const campaignUrl = campaignResponse.data?.url
    const flowId = campaignResponse.data?.flow?._id || campaignResponse.data?.flow_id

    console.log('✅ Кампанія створена з ID:', campaignId)
    console.log('✅ Flow створений з ID:', flowId)
    console.log('📊 Повна відповідь кампанії:', JSON.stringify(campaignResponse.data, null, 2))

    res.json({
      success: true,
      offer: {
        id: offerId,
        data: offerResponse.data,
      },
      campaign: {
        id: campaignId,
        url: campaignUrl,
        data: campaignResponse.data,
      },
      flow: {
        id: flowId,
      },
      message: "Офер, flow та кампанія успішно створені та прив'язані.",
    })
  } catch (error) {
    const rawData = error?.response?.data
    const statusCode = error?.response?.status || 500

    const msg =
      rawData?.message || rawData?.data?.[0]?.message || error.message || 'Unknown server error'

    console.error('❌ ClickFlare create offer+campaign error:', {
      message: msg,
      status: statusCode,
      data: rawData,
      stack: error.stack,
    })

    res.status(statusCode).json({ error: msg, details: rawData })
  }
})

// 🔗 Прив'язати офер до кампанії через flow
router.post('/clickflare/link-offer-to-campaign', async (req, res) => {
  const { campaignId, offerId } = req.body
  const API_KEY = process.env.VITE_CLICKFLARE_API_KEY

  if (!campaignId || !offerId) {
    return res.status(400).json({
      error: 'Missing required fields: campaignId, offerId',
    })
  }

  try {
    console.log(`🔗 Прив'язуємо офер ${offerId} до кампанії ${campaignId}`)

    // Спочатку отримуємо поточну кампанію
    const getCampaignResponse = await axios.get(
      `https://public-api.clickflare.io/api/campaigns/${campaignId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY,
        },
      }
    )

    const currentCampaign = getCampaignResponse.data

    // Оновлюємо flow кампанії з новим офером
    const updatePayload = {
      ...currentCampaign,
      flow: {
        internal: true,
        flow: {
          name: `Flow for ${currentCampaign.name}`,
          transition: '302',
          workspace_id: currentCampaign.workspace_id,
        },
        paths: {
          defaultPaths: {
            paths: [
              {
                name: 'Default Path',
                destination: 'offers_only',
                enabled: true,
                transition: '302',
                weight: 100,
                offers_only: {
                  offers: [
                    {
                      id: offerId,
                      weight: 100,
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    }

    const updateResponse = await axios.put(
      `https://public-api.clickflare.io/api/campaigns/${campaignId}`,
      updatePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY,
        },
      }
    )

    console.log("✅ Офер успішно прив'язано до кампанії")

    res.json({
      success: true,
      data: updateResponse.data,
      message: "Офер успішно прив'язано до кампанії",
    })
  } catch (error) {
    const rawData = error?.response?.data
    const statusCode = error?.response?.status || 500

    const msg =
      rawData?.message || rawData?.data?.[0]?.message || error.message || 'Unknown server error'

    console.error('❌ ClickFlare link offer to campaign error:', {
      message: msg,
      status: statusCode,
      data: rawData,
    })

    res.status(statusCode).json({ error: msg, details: rawData })
  }
})

export default router
