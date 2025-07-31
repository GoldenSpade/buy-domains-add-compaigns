<template>
  <div class="active-cards-column">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">
        <i class="bi bi-activity"></i> Активні кампанії
        <span class="badge bg-primary ms-2">{{ tonicStore.activeCards.length }}</span>
      </h5>
      <button
        v-if="tonicStore.activeCards.length > 0"
        @click="clearAll"
        class="btn btn-outline-danger btn-sm"
        title="Очистити всі"
      >
        <i class="bi bi-trash"></i>
      </button>
    </div>

    <div v-if="tonicStore.activeCards.length === 0" class="text-center text-muted py-5">
      <i class="bi bi-inbox" style="font-size: 3rem"></i>
      <p class="mt-2">Активних кампаній немає</p>
      <small>Картки з'являться тут після отримання статусу від Tonic</small>
    </div>

    <div v-else class="active-cards-list">
      <!-- StatusTimer компонент -->
      <StatusTimer
        ref="statusTimer"
        @timerComplete="onTimerComplete"
        @timerStart="onTimerStart"
        :defaultMinutes="1"
      />

      <div
        v-for="(card, index) in tonicStore.activeCards"
        :key="`active-${index}`"
        class="position-relative border rounded bg-white p-3 shadow-sm mb-3"
      >
        <!-- Кнопка видалення -->
        <i
          class="bi bi-x-lg position-absolute top-0 end-0 m-2 text-secondary"
          role="button"
          title="Видалити картку"
          @click="removeCard(card)"
        ></i>

        <!-- Campaign name -->
        <label class="form-label fw-bold mb-2">Campaign name</label>
        <input
          type="text"
          v-model="card.adTitle"
          class="form-control"
          :disabled="card.resId && card.resId.length !== 0"
          @input="resetCardState(card)"
        />

        <!-- Підказка про структуру назви -->
        <div class="small text-muted mt-1">
          <i class="bi bi-info-circle"></i>
          Формат: [Account name] | Offer - Country - Buyer - Traffic
        </div>

        <!-- Статус кампанії -->
        <div
          v-if="card.resId && card.resUrl"
          class="alert alert-success mt-2 mb-2 d-flex align-items-center gap-2 p-2 small"
        >
          <i class="bi bi-check-circle-fill text-success"></i>
          Кампанія вже створена.
        </div>

        <!-- ID та URL -->
        <div v-if="card.resId || card.resUrl" class="mt-1 small">
          <div v-if="card.resId" class="d-flex align-items-center gap-2">
            🆔 {{ card.resId }}

            <div v-if="card.resId" class="small d-flex align-items-center">
              <span
                class="badge ms-1"
                :class="{
                  'bg-success': card.status === 'active',
                  'bg-warning text-dark': card.status === 'paused' || card.status === 'pending',
                  'bg-secondary': card.status === 'inactive',
                  'bg-danger': card.status === 'error' || card.status === 'unknown',
                  'bg-info': !card.status || card.status === '' || card.status === 'loading',
                }"
              >
                {{ card.status || 'завантаження...' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Помилка ChatGPT -->
        <div v-if="card.chatGptError" class="mt-1">
          <div class="bg-danger bg-opacity-10 p-2 rounded text-danger small">
            <i class="bi bi-exclamation-triangle me-1"></i>
            <span class="fw-bold">ChatGpt Error:</span> {{ card.chatGptError }}
          </div>
        </div>

        <!-- CombinedAccordion -->
        <div v-if="card.clickflareUrl || card.clickflareCampaignUrl" class="mt-2">
          <CombinedAccordion
            :tonikId="card.resId"
            :offerUrl="card.clickflareUrl"
            :offerName="card.adTitle"
            :offerId="card.clickflareId"
            :campaignUrl="card.clickflareCampaignUrl"
            :campaignId="card.clickflareCampaignId"
            :clickflareResCampaignName="card.clickflareResCampaignName"
            :chatGptTitle="card.chatGptTitle"
          />
        </div>

        <!-- ClickFlare статус -->
        <div class="small d-flex justify-content-center mt-2">
          <span
            v-if="
              card.clickflareId && card.clickflareCampaignId && card.clickflareId !== 'existing'
            "
            class="badge bg-success text-white px-2 py-1 w-100"
            style="font-size: 12px"
          >
            🎉 Новий оффер + кампанія створені у ClickFlare
          </span>

          <span
            v-else-if="card.clickflareId === 'existing'"
            class="badge bg-warning text-dark px-2 py-1 w-100"
            style="font-size: 12px"
          >
            Кампанія вже існує у ClickFlare
          </span>

          <span
            v-else-if="card.clickflareId && !card.clickflareCampaignId"
            class="badge bg-warning text-dark px-2 py-1 w-100"
            style="font-size: 12px"
          >
            ⚠️ Тільки офер створено (без кампанії)
          </span>

          <span
            v-else-if="card.clickFlareError"
            class="badge bg-danger text-white px-2 py-1 w-100"
            style="font-size: 12px"
          >
            ❌ Помилка створення в ClickFlare
          </span>
        </div>

        <!-- Помилки ClickFlare -->
        <div v-if="card.clickFlareError" class="text-danger small mt-1">
          {{ card.clickFlareError }}
        </div>

        <!-- Загальні помилки -->
        <div v-if="card.error" class="mt-2 text-danger small border rounded bg-light p-2">
          <i class="bi bi-exclamation-triangle me-1"></i>
          {{ card.error }}
        </div>

        <!-- Час створення/переміщення -->
        <div class="text-muted small mt-2 pt-2">
          <i class="bi bi-clock"></i>
          Переміщено: {{ formatTime(card.movedToActiveAt) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTonicStore } from '@/stores/tonicStore'
import StatusTimer from './StatusTimer.vue'
import CombinedAccordion from './CombinedAccordion.vue'

const tonicStore = useTonicStore()
const statusTimer = ref(null)

// Видалення картки
const removeCard = (card) => {
  if (confirm('Видалити цю картку з активних?')) {
    tonicStore.removeActiveCard(card)
  }
}

// Очищення всіх карток
const clearAll = () => {
  if (confirm('Видалити всі активні картки?')) {
    tonicStore.clearActiveCards()
    // Зупиняємо таймер при очищенні всіх карток
    if (statusTimer.value) {
      statusTimer.value.stopTimer()
    }
  }
}

// 🎯 ОСНОВНА ФУНКЦІЯ: Перевірка статусів активних карток
// 🎯 ОСНОВНА ФУНКЦІЯ: Повна перевірка активних карток (аналог submitForm)
const checkActiveCardsStatus = async () => {
  console.log('🔄 Початок ПОВНОЇ перевірки активних карток...')
  const activeCards = tonicStore.activeCards

  if (activeCards.length === 0) {
    console.log('ℹ️ Немає активних карток для перевірки')
    return
  }

  console.log(`📊 Перевіряємо ${activeCards.length} активних карток`)

  // 🎯 КРОК 1: Перевіряємо статуси Tonic кампаній і отримуємо resUrl
  console.log('🎯 КРОК 1: Перевірка статусів Tonic кампаній...')
  for (const card of activeCards) {
    console.log(`🔍 Перевіряємо статус кампанії: ${card.adTitle}`)

    try {
      await fetchCampaignStatus(card)
    } catch (error) {
      console.error(`❌ Помилка при перевірці статусу ${card.adTitle}:`, error)
      card.error = `Помилка перевірки статусу: ${error.message}`
    }
  }

  // 🤖 КРОК 2: Генеруємо ChatGPT заголовки для карток що потребують
  console.log('🤖 КРОК 2: Генерація ChatGPT заголовків...')

  const cardsNeedingChatGpt = activeCards.filter(
    (card) =>
      card.resId &&
      card.resUrl &&
      card.chatGptStatus !== 'success' &&
      !card.error &&
      !card.isGeneratingTitle
  )

  console.log(`📊 Знайдено ${cardsNeedingChatGpt.length} карток для ChatGPT генерації`)

  if (cardsNeedingChatGpt.length > 0) {
    for (const card of cardsNeedingChatGpt) {
      console.log(`🤖 Генеруємо ChatGPT заголовок для: ${card.offer}`)

      try {
        await generateChatGptTitle(card)

        // Пауза між запитами ChatGPT
        await new Promise((resolve) => setTimeout(resolve, 1500))
      } catch (error) {
        console.error(`❌ Помилка генерації ChatGPT для ${card.offer}:`, error)
        card.chatGptError = error.message || 'Невідома помилка ChatGPT'
      }
    }

    console.log('✅ Генерація ChatGPT заголовків завершена')
  }

  // 🔗 КРОК 3: Створюємо в ClickFlare якщо потрібно
  console.log('🔗 КРОК 3: Створення в ClickFlare...')

  const cardsNeedingClickflare = activeCards.filter(
    (card) => card.resId && card.resUrl && !card.clickflareId && !card.error
  )

  console.log(`📊 Знайдено ${cardsNeedingClickflare.length} карток для створення в ClickFlare`)

  if (cardsNeedingClickflare.length > 0) {
    for (const card of cardsNeedingClickflare) {
      console.log(`🔗 Створюємо ClickFlare для: ${card.offer}`)

      try {
        await submitCardToClickFlare(card)

        // Невелика пауза між створенням ClickFlare кампаній
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`❌ Помилка створення ClickFlare для ${card.offer}:`, error)
        card.clickFlareError = error.message || 'Невідома помилка ClickFlare'
      }
    }

    console.log('✅ Створення в ClickFlare завершено')
  }

  // 🔄 КРОК 4: Оновлюємо всі URL з ChatGPT заголовками
  console.log('🔄 КРОК 4: Оновлення URL з ChatGPT заголовками...')

  const cardsWithSuccessfulChatGpt = activeCards.filter((card) => card.chatGptStatus === 'success')

  console.log(
    `📊 Знайдено ${cardsWithSuccessfulChatGpt.length} карток з успішним ChatGPT для оновлення URL`
  )

  for (const card of cardsWithSuccessfulChatGpt) {
    try {
      // Оновлюємо ClickFlare URL
      if (card.resUrl) {
        const oldClickflareUrl = card.clickflareUrl
        card.clickflareUrl = generateOfferUrl(card)

        if (oldClickflareUrl !== card.clickflareUrl) {
          console.log(`🔄 ClickFlare URL оновлено для: ${card.offer}`)
        }
      }

      // Оновлюємо Campaign URL
      if (card.clickflareCampaignUrl) {
        processCampaignUrl(card)
      }
    } catch (error) {
      console.error(`❌ Помилка оновлення URL для ${card.offer}:`, error)
    }
  }

  // 💾 КРОК 5: Зберігаємо оновлення в localStorage
  console.log('💾 КРОК 5: Збереження оновлень...')

  for (const card of activeCards) {
    tonicStore.updateActiveCardStatus(
      `${card.offer}-${card.country}-${card.buyer}-${card.trafficSource}`,
      {
        status: card.status,
        resUrl: card.resUrl,
        chatGptTitle: card.chatGptTitle,
        chatGptTitleEncoded: card.chatGptTitleEncoded,
        chatGptStatus: card.chatGptStatus,
        chatGptError: card.chatGptError,
        clickflareId: card.clickflareId,
        clickflareCampaignId: card.clickflareCampaignId,
        clickflareCampaignUrl: card.clickflareCampaignUrl,
        clickflareUrl: card.clickflareUrl,
        clickFlareError: card.clickFlareError,
        clickflareResCampaignName: card.clickflareResCampaignName,
        error: card.error,
        lastStatusCheck: Date.now(),
      }
    )
  }

  console.log('✅ ПОВНА перевірка активних карток завершена!')

  // Статистика
  const successfulCards = activeCards.filter(
    (card) =>
      card.resId &&
      card.resUrl &&
      card.chatGptStatus === 'success' &&
      card.clickflareId &&
      !card.error
  ).length

  const pendingCards = activeCards.filter(
    (card) =>
      card.resId &&
      (card.status === 'pending' || card.chatGptStatus === 'pending' || !card.clickflareId)
  ).length

  const errorCards = activeCards.filter((card) => card.error).length

  console.log(`📈 Статистика перевірки:`)
  console.log(`   ✅ Повністю готові: ${successfulCards}`)
  console.log(`   ⏳ В процесі: ${pendingCards}`)
  console.log(`   ❌ З помилками: ${errorCards}`)
}

// 🔄 Функція перевірки статусу кампанії
const fetchCampaignStatus = async (card) => {
  try {
    console.log(`🔍 Перевіряємо статус для кампанії: ${card.adTitle}`)

    const query = new URLSearchParams({
      name: card.baseCampaignName,
      trafficSource: card.trafficSource,
    })

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tonic/campaign-status?${query}`)
    const data = await res.json()

    if (res.ok && data.success) {
      const oldStatus = card.status
      card.status = data.status || 'unknown'

      console.log(`📈 Статус змінено з "${oldStatus}" на "${card.status}"`)

      // Оновлюємо resUrl якщо його немає
      if (!card.resUrl && data.link && data.link.trim()) {
        const cleanUrl = data.link.replace('https://', '').replace('http://', '')
        card.resUrl = cleanUrl
        console.log(`🔗 Додано resUrl: ${cleanUrl}`)
      }

      // Оновлюємо в localStorage
      tonicStore.updateActiveCardStatus(
        `${card.offer}-${card.country}-${card.buyer}-${card.trafficSource}`,
        { status: card.status, resUrl: card.resUrl }
      )
    } else {
      card.status = 'error'
      console.warn(`⚠️ Помилка отримання статусу для ${card.adTitle}:`, data)
    }
  } catch (e) {
    console.error(`❌ Виняток при отриманні статусу для ${card.adTitle}:`, e)
    card.status = 'error'
  }
}

// 🔧 Покращена функція generateChatGptTitle
const generateChatGptTitle = async (card) => {
  if (card.isGeneratingTitle) {
    console.log(`⏸️ Генерація вже в процесі для: ${card.offer}`)
    return
  }

  card.isGeneratingTitle = true
  card.chatGptStatus = 'pending'
  card.chatGptError = ''

  try {
    console.log(`🤖 Відправляємо запит до ChatGPT для: ${card.offer}`)
    console.log(`   Country: ${card.country}`)
    console.log(`   Traffic Source: ${card.trafficSource}`)

    const requestBody = {
      offer: card.offer,
      country: card.country,
      trafficSource: card.trafficSource,
    }

    console.log(`📤 Тіло запиту:`, requestBody)

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chatgpt/generate-adtitle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log(`📥 Статус відповіді ChatGPT: ${response.status} ${response.statusText}`)

    const result = await response.json()
    console.log(`📥 Повна відповідь ChatGPT:`, result)

    if (response.ok && result.success && result.data) {
      card.chatGptTitle = result.data.originalTitle
      card.chatGptTitleEncoded = result.data.encodedTitle
      card.chatGptStatus = 'success'
      card.chatGptError = ''

      console.log(`ChatGPT заголовок успішно створено:`)
      console.log(`   Original: "${card.chatGptTitle}"`)
      console.log(`   Encoded: "${card.chatGptTitleEncoded}"`)
    } else {
      const errorMsg = result?.error || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error(`❌ Повна помилка генерації ChatGPT:`, error)
    card.chatGptStatus = 'error'
    card.chatGptError = error.message || 'Невідома помилка ChatGPT API'

    console.error(`❌ Деталі помилки:`)
    console.error(`   Card: ${card.offer}`)
    console.error(`   Error: ${card.chatGptError}`)
  } finally {
    card.isGeneratingTitle = false
  }
}

// 🔗 Функція створення в ClickFlare (повна версія як в TonicCampaignForm)
const submitCardToClickFlare = async (card) => {
  console.log(`🚀 Перевіряємо можливість створення ClickFlare для: ${card.adTitle}`)
  console.log(`   resId: "${card.resId || 'ПОРОЖНІЙ'}"`)
  console.log(`   resUrl: "${card.resUrl || 'ПОРОЖНІЙ'}"`)
  console.log(`   trafficSource: "${card.trafficSource || 'ПОРОЖНІЙ'}"`)
  console.log(`   clickflareId: "${card.clickflareId || 'ПОРОЖНІЙ'}"`)

  // СТАНДАРТНІ ПЕРЕВІРКИ
  if (!card.resId) {
    console.log(`⏸️ Пропускаємо ${card.offer} - немає resId`)
    return
  }
  if (!card.resUrl || card.resUrl.trim() === '') {
    console.log(`⏸️ Пропускаємо ${card.offer} - немає resUrl`)
    return
  }
  if (card.clickflareId && card.clickflareId !== '') {
    console.log(`⏸️ Пропускаємо ${card.offer} - ClickFlare вже створено`)
    return
  }

  try {
    console.log(`🚀 Створюємо ClickFlare офер + кампанію для: ${card.adTitle}`)
    console.log(`   ChatGPT Status: ${card.chatGptStatus}`)
    console.log(`   ChatGPT Title: ${card.chatGptTitle || 'Немає'}`)

    // Очищаємо помилку перед спробою створення
    card.clickFlareError = ''

    const workspaceMap = {
      Alex: import.meta.env.VITE_WORKSPACE_ALEX,
      Davyd: import.meta.env.VITE_WORKSPACE_DAVYD,
    }

    const workspace_id = workspaceMap[card.buyer]

    // ВИКОРИСТОВУЄМО НОВІ НАЗВИ ДЛЯ CLICKFLARE
    const clickFlareNames = getClickFlareNames(card)

    console.log(`📝 Назви для ClickFlare:`)
    console.log(`   Display (frontend): "${card.adTitle}"`)
    console.log(`   Base title (без [Account name]): "${card.baseCampaignName}"`)
    console.log(`   ✨ ОФЕР name (БЕЗ [Account name]): "${clickFlareNames.offerName}"`)
    console.log(`   🎯 КАМПАНІЯ name (З [Account name]): "${clickFlareNames.campaignName}"`)

    // ГЕНЕРУЄМО URL З ДЕТАЛЬНИМ ЛОГУВАННЯМ
    console.log(`🔗 Генеруємо URL...`)
    const offerUrl = generateOfferUrl(card)

    console.log(`🔍 Результат генерації URL:`)
    console.log(`   URL: ${offerUrl}`)
    console.log(`   Містить помилку: ${offerUrl.includes('error=') ? 'ТАК' : 'НІ'}`)

    card.clickflareUrl = offerUrl

    const payload = {
      offerName: clickFlareNames.offerName,
      offerUrl,
      campaignName: clickFlareNames.campaignName,
      workspace_id,
      buyer: card.buyer,
      affiliateNetworkID: import.meta.env.VITE_AFFILIATE_NETWORK_TONIC_ID,
      trafficSource: card.trafficSource,
      country: card.country,
      cost: 0,
      cost_type: 'no_tracked',
    }

    console.log(`📤 Відправляємо в ClickFlare:`, {
      offerName: clickFlareNames.offerName,
      campaignName: clickFlareNames.campaignName,
      workspace_id,
      trafficSource: card.trafficSource,
      offerUrl: offerUrl.substring(0, 100) + '...',
    })

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/clickflare/create-offer-and-campaign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const result = await response.json()
    console.log(`📥 ClickFlare повна відповідь:`, result)

    if (result?.success) {
      card.clickflareId = result.offer.id
      card.clickflareCampaignId = result.campaign.id
      card.clickflareCampaignUrl = result.campaign.url
      card.clickFlareError = ''

      // ✅ Зберігаємо campaign.name з відповіді
      if (result.campaign.data?.name) {
        card.clickflareResCampaignName = result.campaign.data.name
        console.log(`💾 Збережено campaign.name: "${card.clickflareResCampaignName}"`)
      }

      console.log(`ClickFlare успішно створено:`)
      console.log(`   Offer ID: ${result.offer.id}`)
      console.log(`   Campaign ID: ${result.campaign.id}`)
      console.log(`   Campaign URL (raw): ${result.campaign.url}`)
      console.log(`   Campaign Name: ${card.clickflareResCampaignName}`)

      // КЛЮЧОВА ЧАСТИНА: Обробляємо Campaign URL ОДРАЗУ після отримання
      if (card.clickflareCampaignUrl) {
        console.log(`🔧 Обробляємо Campaign URL з MANUAL_REPLACE...`)

        const originalCampaignUrl = card.clickflareCampaignUrl
        processCampaignUrl(card) // Замінюємо MANUAL_REPLACE на ChatGPT заголовок

        if (originalCampaignUrl !== card.clickflareCampaignUrl) {
          console.log(`🔄 Campaign URL успішно оброблено:`)
          console.log(`   До обробки:  ${originalCampaignUrl}`)
          console.log(`   Після обробки: ${card.clickflareCampaignUrl}`)
        } else {
          console.log(`ℹ️ Campaign URL не змінився (можливо, MANUAL_REPLACE вже був замінений)`)
        }
      }

      if (result.alreadyExisted) {
        console.log(`ℹ️ Офер та кампанія вже існували у ClickFlare`)
        card.clickflareId = 'existing'
      }

      console.log(`✅ ClickFlare створено успішно для: ${card.offer}`)
    } else {
      throw new Error(result?.error || 'Невідома помилка від ClickFlare API')
    }
  } catch (err) {
    const message = err.message || 'Невідома помилка'
    card.clickFlareError = message
    card.clickflareId = ''
    card.clickflareCampaignId = ''
    card.clickflareCampaignUrl = ''
    card.clickflareResCampaignName = ''
    console.error(`❌ Помилка створення в ClickFlare для ${card.adTitle}:`, message)
  }
}

// 🔧 Покращена функція getClickFlareNames
const getClickFlareNames = (card) => {
  console.log(`📝 Генерація назв для ClickFlare:`)
  console.log(`   Full adTitle (з [Account name]): "${card.adTitle}"`)
  console.log(`   Base campaign name (без [Account name]): "${card.baseCampaignName}"`)

  // ✅ ВИПРАВЛЕНО: Витягуємо частину БЕЗ [Account name] для офера
  let offerNameClean = card.baseCampaignName

  // Якщо в adTitle є resId_, то беремо частину після [Account name] |
  if (card.resId && card.adTitle.includes(`${card.resId}_`)) {
    const afterAccountName = card.adTitle.replace(/^\[Account name\]\s*\|\s*/, '')
    offerNameClean = afterAccountName
  }

  // Для кампанії використовуємо повну назву З [Account name]
  const campaignNameWithAccount = card.adTitle

  console.log(`   ✨ ОФЕР name (БЕЗ [Account name]): "${offerNameClean}"`)
  console.log(`   🎯 КАМПАНІЯ name (З [Account name]): "${campaignNameWithAccount}"`)

  return {
    // Офер БЕЗ [Account name]
    offerName: offerNameClean,
    // Кампанія З [Account name]
    campaignName: campaignNameWithAccount,
    displayTitle: campaignNameWithAccount,
  }
}

const generateOfferUrl = (card) => {
  console.log(`🔍 Генерація URL для ${card.offer}:`)
  console.log(`   resUrl: "${card.resUrl || 'ПОРОЖНІЙ'}"`)
  console.log(`   adTitle: "${card.adTitle || 'ПОРОЖНІЙ'}"`)

  // ПЕРЕВІРЯЄМО чи є resUrl
  if (!card.resUrl || card.resUrl.trim() === '') {
    console.warn(`❌ Відсутній resUrl для картки: ${card.offer}`)
    return `https://placeholder-domain.com/?error=missing_resUrl&offer=${encodeURIComponent(
      card.offer
    )}`
  }

  const baseUrl = `https://${card.resUrl?.trim()}`
  const isFacebook = card.trafficSource === 'Facebook'
  const isTiktok = card.trafficSource === 'TikTok'

  // ПОКРАЩЕННЯ: Використовуємо різні джерела для заголовка
  let adTitleToUse = ''

  if (card.chatGptTitleEncoded && card.chatGptTitleEncoded.trim()) {
    adTitleToUse = card.chatGptTitleEncoded
    console.log(`🤖 Використовуємо ChatGPT заголовок: "${card.chatGptTitle}"`)
  } else if (card.adTitle && card.adTitle.trim()) {
    adTitleToUse = encodeURIComponent(card.adTitle.trim())
    console.log(`📝 Використовуємо adTitle: "${card.adTitle}"`)
  } else if (card.offer && card.offer.trim()) {
    adTitleToUse = encodeURIComponent(card.offer.trim())
    console.log(`🏷️ Використовуємо offer назву: "${card.offer}"`)
  } else {
    adTitleToUse = 'default_title'
    console.log(`⚠️ Використовуємо default title`)
  }

  console.log(`   Base URL: ${baseUrl}`)
  console.log(`   Traffic: ${isFacebook ? 'Facebook' : isTiktok ? 'TikTok' : 'Unknown'}`)
  console.log(`   Encoded Title: ${adTitleToUse}`)

  // Шаблони з правильними фігурними дужками
  const facebookTemplate = `network=facebook&site=direct&subid1={{trackingField6}}&subid2={{trackingField5}}&subid3={{trackingField3}}|{{trackingField2}}|{{trackingField1}}&subid4={{cf_click_id}}&click_id={{external_id}}&adtitle=${adTitleToUse}`
  const tiktokTemplate = `network=tiktok&site=direct&subid1={{trackingField3}}&subid2={{trackingField5}}&subid3={{trackingField8}}|{{trackingField6}}|{{trackingField4}}&subid4={{cf_click_id}}&click_id={{external_id}}&adtitle=${adTitleToUse}`

  const selectedQuery = isFacebook ? facebookTemplate : isTiktok ? tiktokTemplate : ''

  if (!selectedQuery) {
    console.warn(`❌ Невідомий тип трафіка для: ${card.adTitle}`)
    return `${baseUrl}?error=unknown_traffic_type&adtitle=${adTitleToUse}`
  }

  const finalUrl = `${baseUrl}?${selectedQuery}`
  console.log(`Згенерований URL: ${finalUrl}`)

  return finalUrl
}

const processCampaignUrl = (card) => {
  if (!card.clickflareCampaignUrl) {
    console.log(`⚠️ Немає campaign URL для обробки: ${card.offer}`)
    return
  }

  let updatedUrl = card.clickflareCampaignUrl

  console.log(`🔄 Початок обробки Campaign URL для: ${card.offer}`)
  console.log(`   Original URL: ${updatedUrl}`)

  // ВАРІАНТ 1: Перевіряємо чи є MANUAL_REPLACE в URL
  if (updatedUrl.includes('MANUAL_REPLACE')) {
    console.log(`🔧 Знайдено MANUAL_REPLACE, замінюємо...`)

    const titleToUse = getTitleForUrl(card)
    console.log(`📝 Encoded title для заміни: "${titleToUse}"`)

    // Замінюємо MANUAL_REPLACE на заголовок
    updatedUrl = updatedUrl.replace('MANUAL_REPLACE', titleToUse)
    card.clickflareCampaignUrl = updatedUrl

    console.log(`Campaign URL успішно оновлено:`)
    console.log(`   Before: ...title=MANUAL_REPLACE`)
    console.log(`   After:  ...title=${titleToUse}`)
  }
  // ВАРІАНТ 2: Оновлення існуючого title параметра
  else if (updatedUrl.includes('title=')) {
    console.log(`🔧 Оновлюємо існуючий title параметр...`)

    const titleToUse = getTitleForUrl(card)
    const oldUrl = updatedUrl

    updatedUrl = updatedUrl.replace(/title=[^&]+/, `title=${titleToUse}`)
    card.clickflareCampaignUrl = updatedUrl

    console.log(`Title параметр оновлено:`)
    console.log(`   Before: ${oldUrl}`)
    console.log(`   After:  ${updatedUrl}`)
  }
  // ВАРІАНТ 3: URL без title параметра - додаємо його
  else if (!updatedUrl.includes('title=') && card.adTitle) {
    console.log(`🔧 Додаємо title параметр до URL...`)

    const titleToUse = getTitleForUrl(card)
    const separator = updatedUrl.includes('?') ? '&' : '?'

    updatedUrl = `${updatedUrl}${separator}title=${titleToUse}`
    card.clickflareCampaignUrl = updatedUrl

    console.log(`Title параметр додано до URL:`)
    console.log(`   After: ${updatedUrl}`)
  } else {
    console.log(`ℹ️ URL не потребує обробки`)
  }
}

const getTitleForUrl = (card) => {
  if (card.chatGptTitleEncoded && card.chatGptTitleEncoded.trim()) {
    return card.chatGptTitleEncoded
  } else if (card.adTitle && card.adTitle.trim()) {
    return encodeURIComponent(card.adTitle.trim())
  } else {
    return encodeURIComponent(card.offer.trim())
  }
}

const updateCardUrls = (card) => {
  if (card.resUrl) {
    card.clickflareUrl = generateOfferUrl(card)
  }
  if (card.clickflareCampaignUrl) {
    processCampaignUrl(card)
  }
}

// 🎯 Обработчики событий таймера
const onTimerComplete = async () => {
  console.log('⏰ Таймер завершився - запускаємо перевірку статусів')
  await checkActiveCardsStatus()

  // Автоматично перезапускаємо таймер після перевірки
  if (tonicStore.activeCards.length > 0 && statusTimer.value) {
    console.log('🔄 Автоматично перезапускаємо таймер')
    statusTimer.value.startTimer()
  }
}

const onTimerStart = (data) => {
  console.log('▶️ Таймер запущено:', data)
}

// 🚀 Автоматичний запуск таймера при додаванні нових карток
const startTimerIfNeeded = () => {
  if (tonicStore.activeCards.length > 0 && statusTimer.value) {
    const timerIsRunning = statusTimer.value.isRunning?.value || false

    if (!timerIsRunning) {
      console.log('🚀 Автоматично запускаємо таймер для нових активних карток')
      statusTimer.value.startTimer()
    }
  }
}

// Скидання стану картки
const resetCardState = (card) => {
  const preservedData = {
    clickflareCampaignUrl: card.clickflareCampaignUrl,
    clickflareId: card.clickflareId,
    clickflareCampaignId: card.clickflareCampaignId,
    resId: card.resId,
    resUrl: card.resUrl,
    clickflareResCampaignName: card.clickflareResCampaignName,
  }

  card.clickFlareError = ''
  card.clickflareUrl = ''
  card.error = ''
  card.status = ''
  card.chatGptTitle = ''
  card.chatGptTitleEncoded = ''
  card.chatGptStatus = 'pending'
  card.chatGptError = ''

  // Відновлюємо збережені дані
  Object.assign(card, preservedData)

  // Оновлюємо campaign URL
  if (preservedData.clickflareCampaignUrl) {
    if (preservedData.clickflareCampaignUrl.includes('title=')) {
      const encodedNewTitle = encodeURIComponent(card.adTitle.trim())
      card.clickflareCampaignUrl = preservedData.clickflareCampaignUrl.replace(
        /title=[^&]+/,
        `title=${encodedNewTitle}`
      )
    } else if (preservedData.clickflareCampaignUrl.includes('MANUAL_REPLACE')) {
      const encodedNewTitle = encodeURIComponent(card.adTitle.trim())
      card.clickflareCampaignUrl = preservedData.clickflareCampaignUrl.replace(
        'MANUAL_REPLACE',
        encodedNewTitle
      )
    }
  }

  // Оновлюємо в localStorage
  tonicStore.updateActiveCardStatus(
    `${card.offer}-${card.country}-${card.buyer}-${card.trafficSource}`,
    card
  )
}

// Форматування часу
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 🎯 EXPOSE функції для зовнішнього виклику
defineExpose({
  startTimer: () => {
    if (statusTimer.value) {
      statusTimer.value.startTimer()
    }
  },
  stopTimer: () => {
    if (statusTimer.value) {
      statusTimer.value.stopTimer()
    }
  },
  checkActiveCardsStatus,
})

// Відстежуємо зміни в activeCards для автозапуску таймера
let activeCardsCount = tonicStore.activeCards.length

onMounted(() => {
  // Перевіряємо кожні 500мс чи з'явилися нові активні картки
  const watchInterval = setInterval(() => {
    const currentCount = tonicStore.activeCards.length

    if (currentCount > activeCardsCount) {
      console.log(`📈 Кількість активних карток збільшилася: ${activeCardsCount} → ${currentCount}`)
      startTimerIfNeeded()
    }

    activeCardsCount = currentCount
  }, 500)

  // Очищуємо інтервал при демонтуванні
  onUnmounted(() => {
    clearInterval(watchInterval)
  })
})
</script>
