import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

// 🎯 Створити офер у ClickFlare (ClickflareOfferSedo & TonicCampaignForm)
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
      type: 'auto',
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

// 🔄 Комбінований метод: створити офер + кампанію з flow (TonicCampaignForm)
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
    cost_type = 'no_tracked',
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

    // 🔍 ВИПРАВЛЕНИЙ КРОК 0: Перевіряємо чи вже існують офер та кампанія
    console.log('🔍 Перевіряємо наявність існуючих офера та кампанії...')

    // Перевіряємо офер - використовуємо базовий ендпоінт
    const checkOfferResponse = await axios.get(`https://public-api.clickflare.io/api/offers`, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
    })

    let existingOffer = null
    if (checkOfferResponse.data && Array.isArray(checkOfferResponse.data)) {
      existingOffer = checkOfferResponse.data.find(
        (offer) => offer.name === offerName && offer.workspace_id === workspace_id
      )
    }

    // Перевіряємо кампанію - використовуємо правильний ендпоінт /api/campaigns/list
    const checkCampaignResponse = await axios.get(
      `https://public-api.clickflare.io/api/campaigns/list?pageSize=5000`,
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY,
        },
      }
    )

    let existingCampaign = null
    if (checkCampaignResponse.data && Array.isArray(checkCampaignResponse.data)) {
      existingCampaign = checkCampaignResponse.data.find(
        (campaign) => campaign.name === campaignName && campaign.workspace_id === workspace_id
      )
    }

    // Якщо обидва вже існують - повертаємо їх
    if (existingOffer && existingCampaign) {
      console.log(`ℹ️ Офер "${offerName}" вже існує з ID: ${existingOffer._id || existingOffer.id}`)
      console.log(
        `ℹ️ Кампанія "${campaignName}" вже існує з ID: ${
          existingCampaign._id || existingCampaign.id
        }`
      )

      return res.json({
        success: true,
        offer: {
          id: existingOffer._id || existingOffer.id,
          data: existingOffer,
        },
        campaign: {
          id: existingCampaign._id || existingCampaign.id,
          url: existingCampaign.url,
          data: existingCampaign,
        },
        flow: {
          id: existingCampaign.flow_id || existingCampaign.flow?._id,
        },
        message: 'Офер та кампанія вже існують.',
        alreadyExisted: true,
      })
    }

    let offerId

    // 1️⃣ Створюємо або використовуємо існуючий офер
    if (existingOffer) {
      console.log(`ℹ️ Використовуємо існуючий офер з ID: ${existingOffer._id || existingOffer.id}`)
      offerId = existingOffer._id || existingOffer.id
    } else {
      console.log('1️⃣ Створюємо новий офер:', offerName)

      const offerPayload = {
        name: offerName,
        url: offerUrl,
        workspace_id,
        direct: false,
        affiliateNetworkID: affiliateNetworkID || process.env.VITE_AFFILIATE_NETWORK_TONIC_ID,
        payout: {
          type: 'auto',
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

      offerId = offerResponse.data?._id || offerResponse.data?.id

      if (!offerId) {
        throw new Error('Не вдалося отримати ID створеного офера')
      }

      console.log('✅ Новий офер створено з ID:', offerId)
    }

    let campaignResponse

    // 2️⃣ Створюємо або використовуємо існуючу кампанію
    if (existingCampaign) {
      console.log(
        `ℹ️ Використовуємо існуючу кампанію з ID: ${existingCampaign._id || existingCampaign.id}`
      )
      campaignResponse = { data: existingCampaign }
    } else {
      console.log('2️⃣ Створюємо нову кампанію з flow:', campaignName)

      const trafficSourceMap = {
        TikTok: process.env.VITE_TIKTOK_TRAFFIC_SOURCE_ID || '684bf93e5f67710012addf85',
        Facebook: process.env.VITE_FACEBOOK_TRAFFIC_SOURCE_ID || '684bf954359cb30012ff1586',
      }

      const selectedTrafficSourceId = trafficSourceMap[trafficSource]
      console.log(`🎯 Traffic Source: ${trafficSource} -> ID: ${selectedTrafficSourceId}`)

      if (!selectedTrafficSourceId) {
        throw new Error(`Невідомий traffic source: ${trafficSource}`)
      }

      // ✅ Payload з вбудованим flow
      const campaignPayload = {
        name: campaignName,
        workspace_id,
        tracking_type: 'redirect',
        traffic_source_id: selectedTrafficSourceId,
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
        integrations: [
          process.env.CLICKFLARE_INTEGRATION_1,
          process.env.CLICKFLARE_INTEGRATION_2,
          process.env.CLICKFLARE_INTEGRATION_3,
        ],
      }

      console.log('🔍 Деталі payload для кампанії:')
      console.log(`   workspace_id: ${workspace_id}`)
      console.log(`   traffic_source_id: ${selectedTrafficSourceId}`)
      console.log(`   buyer: ${buyer}`)
      console.log(`   country: ${country}`)
      console.log(`   offerId в flow: ${offerId}`)

      // Додаємо країну тільки якщо вона передана
      if (country && country !== null && country !== 'null') {
        campaignPayload.country = country
      }

      console.log('📤 Campaign payload:', JSON.stringify(campaignPayload, null, 2))

      campaignResponse = await axios.post(
        'https://public-api.clickflare.io/api/campaigns',
        campaignPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': API_KEY,
          },
        }
      )

      console.log('✅ Нова кампанія створена')
    }

    const campaignId = campaignResponse.data?._id || campaignResponse.data?.id
    const campaignUrl = campaignResponse.data?.url
    const flowId = campaignResponse.data?.flow?._id || campaignResponse.data?.flow_id

    console.log('✅ Кампанія ID:', campaignId)
    console.log('✅ Flow ID:', flowId)

    // 🔍 Перевіряємо чи офер справді прив'язаний (тільки для нових кампаній)
    if (!existingCampaign) {
      const createdFlow = campaignResponse.data?.flow
      if (createdFlow?.paths?.defaultPaths?.paths?.[0]?.offers_only?.offers) {
        const linkedOffers = createdFlow.paths.defaultPaths.paths[0].offers_only.offers
        console.log(
          "🔗 Прив'язані офери в flow:",
          linkedOffers.map((o) => o.id)
        )

        const isOfferLinked = linkedOffers.some((o) => o.id === offerId)
        console.log(`🎯 Офер ${offerId} прив'язаний: ${isOfferLinked ? '✅ ТАК' : '❌ НІ'}`)

        if (!isOfferLinked) {
          console.warn("⚠️ УВАГА: Офер НЕ прив'язаний до кампанії!")
        }
      } else {
        console.warn('⚠️ УВАГА: Flow не містить офери або має неправильну структуру!')
      }
    }

    console.log('📊 Повна відповідь кампанії:', JSON.stringify(campaignResponse.data, null, 2))

    res.json({
      success: true,
      offer: {
        id: offerId,
        data: existingOffer || campaignResponse.data, // Повертаємо дані існуючого або нового офера
      },
      campaign: {
        id: campaignId,
        url: campaignUrl,
        data: campaignResponse.data,
      },
      flow: {
        id: flowId,
      },
      message:
        existingCampaign || existingOffer
          ? 'Частково використані існуючі компоненти, частково створені нові.'
          : "Офер, flow та кампанія успішно створені та прив'язані.",
      wasCreated: !existingCampaign && !existingOffer,
      wasPartiallyExisting: !!(existingCampaign || existingOffer),
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

export default router
