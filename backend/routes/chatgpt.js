import express from 'express'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

const openai = new OpenAI({
  apiKey: process.env.CHATGPT_API_KEY,
})

// Генерація adtitle для кампанії
router.post('/chatgpt/generate-adtitle', async (req, res) => {
  try {
    const { offer, country, trafficSource } = req.body

    if (!offer) {
      return res.status(400).json({
        success: false,
        error: 'Offer name is required',
      })
    }

    // Формуємо промпт для ChatGPT
    const userMessage = `Generate a headline / ad title for social media ad on topic "${offer}" for ${
      country || 'global'
    } audience on ${
      trafficSource || 'social media'
    } platform. Maximum 50 characters. Return only the title without quotes or extra text.`

    console.log('📤 Відправляю запит до ChatGPT:', userMessage)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Використовуємо доступну модель
      messages: [
        {
          role: 'system',
          content:
            'You are a expert marketing copywriter. Generate compelling, short ad titles that grab attention and drive clicks. Always respond with just the title, no quotes or additional text.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    })

    const generatedTitle = completion.choices[0].message.content.trim()
    console.log('📥 Відповідь від ChatGPT:', generatedTitle)

    // Кодуємо для URL
    const encodedTitle = encodeURIComponent(generatedTitle)

    res.json({
      success: true,
      data: {
        originalTitle: generatedTitle,
        encodedTitle: encodedTitle,
      },
    })
  } catch (error) {
    console.error('❌ Помилка при запиті до ChatGPT:', error)

    let errorMessage = 'Невідома помилка'
    if (error.code === 'insufficient_quota') {
      errorMessage = 'Перевищено квоту API'
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Невірний API ключ'
    } else if (error.message) {
      errorMessage = error.message
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
    })
  }
})

// Генерація ключових слів для Tonik по введених словах
router.post('/chatgpt/generate-keywords-from-words', async (req, res) => {
  try {
    const { inputWords, country, trafficSource } = req.body

    if (!inputWords || inputWords.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Input words are required',
      })
    }

    // Формуємо промпт для ChatGPT (англійською)
    const userMessage = `Give me 6 most expensive keywords from Google Keywords Planner related to: "${inputWords.trim()}". ${
      country ? `Target country: ${country}. ` : ''
    }${
      trafficSource ? `Traffic source: ${trafficSource}. ` : ''
    }Return only the keywords separated by commas, without any additional text or explanations.`

    console.log('📤 Відправляю запит до ChatGPT для keywords:', userMessage)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO and PPC specialist. Generate high-value, expensive keywords that would have high cost-per-click in Google Ads. Focus on commercial intent keywords. Always respond with just the keywords separated by commas, no additional text.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    const generatedKeywords = completion.choices[0].message.content.trim()
    console.log('📥 Відповідь від ChatGPT keywords:', generatedKeywords)

    res.json({
      success: true,
      data: {
        keywords: generatedKeywords,
        inputWords: inputWords.trim(),
      },
    })
  } catch (error) {
    console.error('❌ Помилка при запиті keywords до ChatGPT:', error)

    let errorMessage = 'Невідома помилка'
    if (error.code === 'insufficient_quota') {
      errorMessage = 'Перевищено квоту API'
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Невірний API ключ'
    } else if (error.message) {
      errorMessage = error.message
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
    })
  }
})

// Генерація ключових слів для Tonik по URL
router.post('/chatgpt/generate-keywords-from-url', async (req, res) => {
  try {
    const { url, country, trafficSource } = req.body

    if (!url || url.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      })
    }

    // Формуємо промпт для ChatGPT (англійською)
    const userMessage = `Analyze the content and topic of this URL: "${url.trim()}" and give me 6 most expensive keywords from Google Keywords Planner based on the website's content and niche. ${
      country ? `Target country: ${country}. ` : ''
    }${
      trafficSource ? `Traffic source: ${trafficSource}. ` : ''
    }Focus on high commercial intent keywords that would be expensive in Google Ads for this type of website. Return only the keywords separated by commas, without any additional text or explanations.`

    console.log('📤 Відправляю запит до ChatGPT для keywords по URL:', userMessage)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO and PPC specialist. Analyze website URLs and generate high-value, expensive keywords based on the website content and niche. Focus on commercial intent keywords that would have high cost-per-click in Google Ads. Always respond with just the keywords separated by commas, no additional text.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    const generatedKeywords = completion.choices[0].message.content.trim()
    console.log('📥 Відповідь від ChatGPT keywords по URL:', generatedKeywords)

    res.json({
      success: true,
      data: {
        keywords: generatedKeywords,
        sourceUrl: url.trim(),
      },
    })
  } catch (error) {
    console.error('❌ Помилка при запиті keywords по URL до ChatGPT:', error)

    let errorMessage = 'Невідома помилка'
    if (error.code === 'insufficient_quota') {
      errorMessage = 'Перевищено квоту API'
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Невірний API ключ'
    } else if (error.message) {
      errorMessage = error.message
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
    })
  }
})

export default router
