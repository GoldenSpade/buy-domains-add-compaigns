// Додаємо нові поля в addCountry функцію
const addCountry = () => {
  const selected = selectedCountry.value
  const offerName = form.offer?.name || ''

  if (!selected) return

  const newCard = {
    __id: nanoid(),
    offer: offerName,
    country: selected.name,
    buyer: form.buyer,
    trafficSource: form.trafficSource,
    adTitle: `${offerName} - ${selected.name} - ${form.buyer} - ${form.trafficSource}`,
    resId: '',
    resUrl: '',
    error: '',
    clickflareId: '',
    clickFlareError: '',
    clickflareUrl: '',
    status: '',
    // Додаємо нові поля для ChatGPT
    chatGptTitle: '', // Згенерований заголовок від ChatGPT
    chatGptTitleEncoded: '', // Закодований заголовок для URL
    chatGptStatus: 'pending', // pending, success, error
    chatGptError: '', // Повідомлення про помилку
    isGeneratingTitle: false, // Індикатор завантаження
  }

  tonicStore.addCard(newCard)
  selectedCountry.value = ''
}

// Функція для генерації ChatGPT заголовка
const generateChatGptTitle = async (card) => {
  if (card.isGeneratingTitle) return

  card.isGeneratingTitle = true
  card.chatGptStatus = 'pending'
  card.chatGptError = ''

  try {
    console.log(`🤖 Генеруємо ChatGPT заголовок для: ${card.offer}`)

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chatgpt/generate-adtitle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offer: card.offer,
        country: card.country,
        trafficSource: card.trafficSource,
      }),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      card.chatGptTitle = result.data.originalTitle
      card.chatGptTitleEncoded = result.data.encodedTitle
      card.chatGptStatus = 'success'
      card.chatGptError = ''

      // Оновлюємо URL з новим adtitle
      if (card.resUrl) {
        card.clickflareUrl = generateOfferUrlWithChatGpt(card)
      }

      console.log(`✅ ChatGPT заголовок створено: "${card.chatGptTitle}"`)
    } else {
      throw new Error(result.error || 'Невідома помилка')
    }
  } catch (error) {
    console.error(`❌ Помилка генерації ChatGPT заголовка:`, error)
    card.chatGptStatus = 'error'
    card.chatGptError = error.message || 'Помилка при генерації заголовка'
  } finally {
    card.isGeneratingTitle = false
  }
}

// Оновлена функція генерації URL з ChatGPT заголовком
const generateOfferUrlWithChatGpt = (card) => {
  const baseUrl = `https://${card.resUrl?.trim()}`
  const adTitleSuffix = card.adTitle.trim().split(' ').at(-1).toLowerCase()

  const isFacebook = adTitleSuffix === 'facebook'
  const isTiktok = adTitleSuffix === 'tiktok'

  // Використовуємо ChatGPT заголовок якщо він є, інакше fallback на оригінальний
  const adTitleToUse = card.chatGptTitleEncoded || encodeURIComponent(card.offer.trim())

  const facebookTemplate = `network=facebook&site=direct&subid1={trackingField6}&subid2={trackingField5}&subid3={trackingField3}|{trackingField2}|{trackingField1}&subid4={cf_click_id}&click_id={external_id}&adtitle=${adTitleToUse}`

  const tiktokTemplate = `network=tiktok&site=direct&subid1={trackingField3}&subid2={trackingField5}&subid3={trackingField8}|{trackingField6}|{trackingField4}&subid4={cf_click_id}&click_id={external_id}&adtitle=${adTitleToUse}`

  const selectedQuery = isFacebook ? facebookTemplate : isTiktok ? tiktokTemplate : ''

  if (!baseUrl || !selectedQuery) return '❌ Некоректний URL'

  return `${baseUrl}?${selectedQuery}`
}

// Оновлюємо оригінальну функцію generateOfferUrl
const generateOfferUrl = (card) => {
  // Якщо є ChatGPT заголовок, використовуємо його
  if (card.chatGptTitleEncoded) {
    return generateOfferUrlWithChatGpt(card)
  }

  // Інакше використовуємо оригінальну логіку
  const baseUrl = `https://${card.resUrl?.trim()}`
  const adTitleEncoded = encodeURIComponent(card.offer.trim())
  const adTitleSuffix = card.adTitle.trim().split(' ').at(-1).toLowerCase()

  const isFacebook = adTitleSuffix === 'facebook'
  const isTiktok = adTitleSuffix === 'tiktok'

  const facebookTemplate = `network=facebook&site=direct&subid1={trackingField6}&subid2={trackingField5}&subid3={trackingField3}|{trackingField2}|{trackingField1}&subid4={cf_click_id}&click_id={external_id}&adtitle=${adTitleEncoded}`

  const tiktokTemplate = `network=tiktok&site=direct&subid1={trackingField3}&subid2={trackingField5}&subid3={trackingField8}|{trackingField6}|{trackingField4}&subid4={cf_click_id}&click_id={external_id}&adtitle=${adTitleEncoded}`

  const selectedQuery = isFacebook ? facebookTemplate : isTiktok ? tiktokTemplate : ''

  if (!baseUrl || !selectedQuery) return '❌ Некоректний URL'

  return `${baseUrl}?${selectedQuery}`
}

// Функція для масової генерації заголовків
const generateAllChatGptTitles = async () => {
  console.log('🤖 Запускаємо масову генерацію ChatGPT заголовків...')

  for (const card of tonicStore.cards) {
    if (card.chatGptStatus !== 'success' && !card.isGeneratingTitle) {
      await generateChatGptTitle(card)
      // Додаємо невелику затримку між запитами
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
