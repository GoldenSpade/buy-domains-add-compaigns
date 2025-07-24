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

export default router
