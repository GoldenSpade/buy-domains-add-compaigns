import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useTonicStore = defineStore('tonic', () => {
  const chatGptAdtitleSettings = reactive({
    userMessage: `Generate a headline / ad title for social media ad on topic "${offer}" for ${
      country || 'global'
    } audience on ${
      trafficSource || 'social media'
    } platform. Maximum 50 characters. Return only the title without quotes or extra text.`,
    model: 'gpt-4o-mini',
    messages: {
      role: 'system',
      content:
        'You are a expert marketing copywriter. Generate compelling, short ad titles that grab attention and drive clicks. Always respond with just the title, no quotes or additional text.',
    },
  })

  const chatGptKeywordsSettings = reactive({
    userMessage: `Give me 6 most expensive keywords from Google Keywords Planner related to: "${inputWords.trim()}". ${
      country ? `Target country: ${country}. ` : ''
    }${
      trafficSource ? `Traffic source: ${trafficSource}. ` : ''
    }Return only the keywords separated by commas, without any additional text or explanations.`,
    model: 'gpt-4o-mini',
    messages: {
      role: 'system',
      content:
        'You are an expert SEO and PPC specialist. Generate high-value, expensive keywords that would have high cost-per-click in Google Ads. Focus on commercial intent keywords. Always respond with just the keywords separated by commas, no additional text.',
    },
  })

  const chatGptUrlSettings = reactive({
    userMessage: `Analyze the content and topic of this URL: "${url.trim()}" and give me 6 most expensive keywords from Google Keywords Planner based on the website's content and niche. ${
      country ? `Target country: ${country}. ` : ''
    }${
      trafficSource ? `Traffic source: ${trafficSource}. ` : ''
    }Focus on high commercial intent keywords that would be expensive in Google Ads for this type of website. Return only the keywords separated by commas, without any additional text or explanations.`,
    model: 'gpt-4o-mini',
    messages: {
      role: 'system',
      content:
        'You are an expert SEO and PPC specialist. Analyze website URLs and generate high-value, expensive keywords based on the website content and niche. Focus on commercial intent keywords that would have high cost-per-click in Google Ads. Always respond with just the keywords separated by commas, no additional text.',
    },
  })

  return {
    chatGptAdtitleSettings,
    chatGptKeywordsSettings,
    chatGptUrlSettings,
  }
})
