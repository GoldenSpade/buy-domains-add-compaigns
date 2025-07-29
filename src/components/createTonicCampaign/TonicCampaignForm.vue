<template>
  <div class="card p-4 bg-light">
    <h4 class="mb-3">
      <i class="bi bi-broadcast me-2"></i>
      Створення кампаній Tonic AFD
    </h4>

    <!-- Источник трафика -->
    <div class="mb-4">
      <label class="form-label">Джерело трафіку</label>
      <select v-model="form.trafficSource" class="form-select">
        <option v-for="source in trafficSources" :key="source" :value="source">
          {{ source }}
        </option>
      </select>
    </div>

    <!-- Офферы -->
    <div class="mb-3">
      <label class="form-label">Обрати оффер</label>
      <Multiselect
        v-model="form.offer"
        :options="offers"
        :track-by="'id'"
        :label="'name'"
        placeholder="Оберіть оффер"
        :searchable="true"
        :close-on-select="true"
        :allow-empty="false"
      />
    </div>

    <!-- Байер -->
    <div class="mb-3">
      <label class="form-label">Обрати байера</label>
      <select v-model="form.buyer" class="form-select">
        <option v-for="buyer in buyers" :key="buyer" :value="buyer">
          {{ buyer }}
        </option>
      </select>
    </div>

    <!-- Страны -->
    <div class="mb-3">
      <label class="form-label">Обрати країну</label>
      <div class="d-flex gap-2 flex-wrap mb-2">
        <span
          v-for="country in selectedCountries"
          :key="country.id"
          class="badge rounded-pill text-bg-success d-flex align-items-center"
          style="gap: 6px; padding-right: 8px"
        >
          {{ country.name }}
          <i
            class="bi bi-x-circle-fill ms-1"
            style="cursor: pointer; font-size: 0.9em"
            title="Видалити"
            @click="removeCountry(country)"
          ></i>
        </span>
      </div>

      <Multiselect
        v-model="selectedCountry"
        :options="allowedCountries"
        noOptionsText="Список порожній"
        :track-by="'code'"
        :label="'name'"
        placeholder="Оберіть країну"
        :searchable="true"
        :close-on-select="true"
        :allow-empty="false"
        @select="addCountry"
      >
        <template #noOptions>
          <div class="px-2 py-1 text-muted small">Список порожній</div>
        </template>
      </Multiselect>

      <!-- Карточки офферов -->
      <div class="mt-4" v-if="tonicStore.cards.length">
        <h5 class="mb-3">
          <i class="bi bi-card-checklist me-2"></i>
          Кампанії:
        </h5>

        <div class="d-flex flex-column gap-3">
          <div
            v-for="(card, index) in tonicStore.cards"
            :key="index"
            class="position-relative border rounded bg-white p-3 shadow-sm"
          >
            <i
              class="bi bi-x-lg position-absolute top-0 end-0 m-2 text-secondary"
              role="button"
              title="Видалити картку"
              @click="removeCard(card)"
            ></i>

            <h6 class="mb-2">
              <i class="bi bi-globe2 me-2"></i>
              {{ card.offer }}
            </h6>

            <div class="mb-2">
              <label class="form-label fw-bold mb-2">Campaign name</label>
              <input
                type="text"
                v-model="card.adTitle"
                class="form-control"
                :disabled="card.resId.length !== 0"
                @input="resetCardState(card)"
              />
            </div>

            <div
              v-if="card.resId && card.resUrl"
              class="alert alert-success mt-2 d-flex align-items-center gap-2 p-2 small"
            >
              <i class="bi bi-check-circle-fill text-success"></i>
              Кампанія вже існує у Tonik. Отримано ID та URL.
            </div>

            <!-- 🔗 ID и URL -->
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

              <div v-if="card.resUrl">
                🔗 <a :href="'https://' + card.resUrl" target="_blank">{{ card.resUrl }}</a>
              </div>
            </div>

            <!-- Помилка ChatGPT -->
            <div v-if="card.chatGptError" class="mt-1">
              <div class="bg-danger bg-opacity-10 p-2 rounded text-danger small">
                <i class="bi bi-exclamation-triangle me-1"></i>
                <span class="fw-bold">ChatGpt Error:</span> {{ card.chatGptError }}
              </div>
            </div>

            <!-- Відображення згенерованого ChatGPT заголовка -->
            <div v-if="card.chatGptTitle" class="mt-1">
              <div class="bg-success bg-opacity-10 p-2 rounded mt-1">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-bold">AdTitle:</span>
                  <div class="d-flex gap-2">
                    <!-- Кнопка редагування -->
                    <button
                      class="btn btn-sm btn-outline-secondary"
                      @click="toggleChatGptEdit(card)"
                      :title="card.isEditingChatGpt ? 'Зберегти зміни' : 'Редагувати AdTitle'"
                    >
                      <i :class="card.isEditingChatGpt ? 'bi bi-check-lg' : 'bi bi-pencil'"></i>
                    </button>

                    <!-- Кнопка підтвердження AdTitle -->
                    <button
                      v-if="!card.isAdTitleConfirmed"
                      class="btn btn-sm btn-success"
                      @click="confirmAdTitle(card)"
                      :disabled="card.isEditingChatGpt"
                      title="Підтвердити AdTitle та продовжити в ClickFlare"
                    >
                      <i class="bi bi-check-circle"></i> Підтвердити
                    </button>

                    <!-- Індикатор підтвердження -->
                    <span
                      v-else
                      class="badge bg-success d-flex align-items-center gap-1"
                      title="AdTitle підтверджено"
                    >
                      <i class="bi bi-check-circle-fill"></i> Підтверджено
                    </span>
                  </div>
                </div>

                <!-- Режим перегляду -->
                <div v-if="!card.isEditingChatGpt" class="fw-bold text-success">
                  {{ card.chatGptTitle }}
                </div>

                <!-- Режим редагування -->
                <div v-else>
                  <textarea
                    v-model="card.chatGptTitle"
                    class="form-control form-control-sm"
                    rows="2"
                    placeholder="Введіть новий AdTitle..."
                    @keydown.enter.ctrl="saveChatGptEdit(card)"
                  ></textarea>
                  <div class="small text-muted mt-1">Ctrl+Enter для збереження</div>
                </div>

                <!-- Показуємо encoded версію якщо редагуємо -->
                <div
                  v-if="card.isEditingChatGpt && card.chatGptTitleEncoded"
                  class="small text-muted mt-2"
                >
                  <strong>Encoded:</strong> {{ card.chatGptTitleEncoded }}
                </div>

                <!-- Повідомлення про необхідність підтвердження -->
                <div
                  v-if="!card.isAdTitleConfirmed && !card.isEditingChatGpt"
                  class="small text-danger mt-2"
                >
                  <i class="bi bi-exclamation-triangle"></i>
                  Підтвердіть AdTitle для продовження в ClickFlare
                </div>
              </div>
            </div>

            <!-- ClickFlare URL з ChatGPT заголовком -->
            <div v-if="card.clickflareUrl && card.isAdTitleConfirmed" class="mt-3">
              <UrlAccordion
                :url="card.clickflareUrl"
                title="🎯 ClickFlare Offer"
                text="Offer"
                :name="card.adTitle"
                :tonikId="card.resId"
              />
            </div>

            <!-- ClickFlare Campaign Info -->
            <div v-if="card.clickflareCampaignUrl" class="mt-2">
              <UrlAccordion
                :url="card.clickflareCampaignUrl"
                title="📊 ClickFlare Campaign"
                text="Campaign"
                :name="card.adTitle"
                :tonikId="card.resId"
              />
            </div>

            <!-- ClickFlare статус -->
            <div class="small mt-3">
              <span
                v-if="
                  card.clickflareId && card.clickflareCampaignId && card.clickflareId !== 'existing'
                "
                class="badge bg-success text-white px-2 py-1"
                style="font-size: 12px"
              >
                🎉 Новий оффер + кампанія створені у ClickFlare
              </span>

              <span
                v-else-if="card.clickflareId === 'existing'"
                class="badge bg-warning text-dark px-2 py-1"
                style="font-size: 12px"
              >
                Кампанія вже існує у ClickFlare
              </span>

              <span
                v-else-if="card.clickflareId && !card.clickflareCampaignId"
                class="badge bg-warning text-dark px-2 py-1"
                style="font-size: 12px"
              >
                ⚠️ Тільки офер створено (без кампанії)
              </span>

              <span
                v-else-if="card.clickFlareError"
                class="badge bg-danger text-white px-2 py-1"
                style="font-size: 12px"
              >
                ❌ Помилка створення в ClickFlare
              </span>
            </div>
            <div v-if="card.clickFlareError" class="text-danger small mt-1">
              {{ card.clickFlareError }}
            </div>

            <div class="small text-muted mt-3">
              {{ card.country }} | {{ card.buyer }} | {{ card.trafficSource }}
            </div>
            <div v-if="card.error" class="mt-2 text-danger small border rounded bg-light p-2">
              <i class="bi bi-exclamation-triangle me-1"></i>
              {{ card.error }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- timer -->
    <div class="mb-3">
      <label class="form-label">Перевірка статусів Tonik</label>
      <div class="border rounded bg-light-subtle p-3 shadow-sm">
        <div class="d-flex justify-content-between align-items-center">
          <!-- Слева — часы -->
          <div class="fw-bold timer-time-display text-dark-emphasis">
            {{ timerMinutesDisplay }}:{{ timerSecondsDisplay }}
          </div>

          <!-- Справа — ввод минут -->
          <div class="d-flex align-items-center gap-2">
            <input
              class="form-control text-center px-0"
              type="number"
              min="1"
              max="60"
              v-model="customTimerMinutes"
            />

            <span class="text-muted small">хвилин</span>

            <button
              class="btn btn-outline-secondary btn-sm d-flex align-items-center"
              @click="pauseTimer"
              :disabled="!timerInterval"
            >
              <i :class="timerPaused ? 'bi-play-fill' : 'bi-pause-fill'"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3">
      <button
        class="btn btn-primary w-100 mt-2"
        :class="{ disabled: tonicStore.cards.length === 0 }"
        @click="submitForm"
      >
        🚀 Створити кампанії
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch, computed, toRef } from 'vue'
import { useTonicStore } from '../../stores/tonicStore'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { nanoid } from 'nanoid'
import UrlAccordion from './UrlAccordion.vue'

//-------------------------Tonik-------------------------
const tonicStore = useTonicStore()

const form = reactive({
  offer: null,
  buyer: 'Alex',
  trafficSource: 'TikTok',
})

const offer = toRef(form, 'offer')

const selectedCountry = ref('')
const offers = ref([])
const allowedCountries = ref([])
const isLoadingOffers = ref(false)
const isLoadingCountries = ref(false)

const buyers = ['Alex', 'Davyd']
const trafficSources = ['TikTok', 'Facebook']

const CACHE_TTL = 60 * 60 * 1000

const getClickFlareNames = (card) => {
  // Формат для ClickFlare: "3777496_[Account name] | 24/7 Nurse - Algeria - Alex - TikTok"
  const clickFlareTitle = card.adTitle // Вже містить "[Account name] | ..."

  return {
    offerName: `${card.resId}_${clickFlareTitle}`,
    campaignName: `${card.resId}_${clickFlareTitle}`,
    displayTitle: clickFlareTitle,
  }
}

// ВИПРАВЛЕНА функція resetCardState
const resetCardState = (card) => {
  timerPaused.value = true

  // ЗБЕРІГАЄМО важливі дані, які не повинні очищатися
  const preservedData = {
    clickflareCampaignUrl: card.clickflareCampaignUrl,
    clickflareId: card.clickflareId,
    clickflareCampaignId: card.clickflareCampaignId,
    resId: card.resId,
    resUrl: card.resUrl, // Також зберігаємо resUrl
  }

  console.log(`🔄 Скидання стану для картки: ${card.adTitle}`)
  console.log(
    `   Збережено clickflareCampaignUrl: ${preservedData.clickflareCampaignUrl ? 'ТАК' : 'НІ'}`
  )

  // Очищаємо тільки те, що потрібно перегенерувати
  card.clickFlareError = ''
  card.clickflareUrl = '' // Цей URL потрібно перегенерувати з новою назвою
  card.error = ''
  card.status = '' // Статус потрібно перевірити знову
  card.chatGptTitle = ''
  card.chatGptTitleEncoded = ''
  card.chatGptStatus = 'pending'
  card.chatGptError = ''

  // ВІДНОВЛЮЄМО збережені дані
  if (preservedData.resId) card.resId = preservedData.resId
  if (preservedData.resUrl) card.resUrl = preservedData.resUrl
  if (preservedData.clickflareId) card.clickflareId = preservedData.clickflareId
  if (preservedData.clickflareCampaignId)
    card.clickflareCampaignId = preservedData.clickflareCampaignId

  // ОНОВЛЮЄМО campaign URL якщо він існує
  if (preservedData.clickflareCampaignUrl) {
    console.log(`🔄 Оновлюємо campaign URL для нової назви...`)

    // Перевіряємо чи є title параметр в URL
    if (preservedData.clickflareCampaignUrl.includes('title=')) {
      const encodedNewTitle = encodeURIComponent(card.adTitle.trim())
      card.clickflareCampaignUrl = preservedData.clickflareCampaignUrl.replace(
        /title=[^&]+/,
        `title=${encodedNewTitle}`
      )
      console.log(`Campaign URL оновлено з новою назвою: ${encodedNewTitle}`)
    } else if (preservedData.clickflareCampaignUrl.includes('MANUAL_REPLACE')) {
      // Якщо є MANUAL_REPLACE, замінюємо на нову назву
      const encodedNewTitle = encodeURIComponent(card.adTitle.trim())
      card.clickflareCampaignUrl = preservedData.clickflareCampaignUrl.replace(
        'MANUAL_REPLACE',
        encodedNewTitle
      )
      console.log(`MANUAL_REPLACE замінено на нову назву: ${encodedNewTitle}`)
    } else {
      // Просто відновлюємо URL без змін
      card.clickflareCampaignUrl = preservedData.clickflareCampaignUrl
      console.log(`ℹ️ Campaign URL відновлено без змін`)
    }
  }

  console.log(`Стан картки скинуто для: ${card.adTitle}`)
  console.log(`   Збережено IDs: resId=${card.resId}, clickflareId=${card.clickflareId}`)
  console.log(`   Campaign URL: ${card.clickflareCampaignUrl ? 'ЗБЕРЕЖЕНО' : 'ВІДСУТНІЙ'}`)
}

function getFromCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp < CACHE_TTL) return data
  } catch (e) {
    console.warn('Cache read error:', e)
  }
  return null
}

function setToCache(key, data) {
  try {
    const item = { data, timestamp: Date.now() }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (e) {
    console.warn('Cache write error:', e)
  }
}

const fetchCampaignStatus = async (card) => {
  try {
    console.log(`🔍 Перевіряємо статус для кампанії: ${card.adTitle}`)

    const query = new URLSearchParams({
      name: card.adTitle,
      trafficSource: card.trafficSource,
    })

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tonic/campaign-status?${query}`)
    const data = await res.json()

    console.log(`📊 Відповідь статусу для ${card.adTitle}:`, data)

    if (res.ok && data.success) {
      card.status = data.status || 'unknown'

      // ПОКРАЩЕННЯ: Встановлюємо resUrl тільки якщо його немає і є в відповіді
      if (!card.resUrl && data.link && data.link.trim()) {
        card.resUrl = data.link.replace('https://', '').replace('http://', '')
        console.log(`🔗 Додано resUrl з статусу: ${card.resUrl}`)

        // Якщо тепер є resUrl - генеруємо ClickFlare URL
        if (card.resUrl && card.resId) {
          card.clickflareUrl = generateOfferUrl(card)
        }
      }

      console.log(`Статус встановлено: ${card.status}`)
    } else {
      card.status = 'error'
      console.warn(`⚠️ Помилка отримання статусу для ${card.adTitle}`)
    }
  } catch (e) {
    console.warn(`⚠️ Не вдалося отримати статус для ${card.adTitle}:`, e)
    card.status = 'error'
  }
}

// ОНОВІТЬ функцію addCountry - додайте поле isEditingChatGpt
const addCountry = () => {
  const selected = selectedCountry.value
  const offerName = form.offer?.name || ''

  if (!selected) return

  console.log(`🆕 Створюємо нову картку:`)
  console.log(`   Offer: "${offerName}"`)
  console.log(`   Country: "${selected.name}"`)
  console.log(`   Buyer: "${form.buyer}"`)
  console.log(`   Traffic Source: "${form.trafficSource}"`)

  // ДОДАЄМО [Account name] до назви кампанії
  const baseCampaignName = `${offerName} - ${selected.name} - ${form.buyer} - ${form.trafficSource}`
  const displayCampaignName = `[Account name] | ${baseCampaignName}` // Для відображення на фронті

  const newCard = {
    __id: nanoid(),
    offer: offerName,
    country: selected.name,
    buyer: form.buyer,
    trafficSource: form.trafficSource,
    adTitle: displayCampaignName,
    baseCampaignName: baseCampaignName,
    resId: '',
    resUrl: '',
    error: '',
    clickflareId: '',
    clickflareCampaignId: '',
    clickflareCampaignUrl: '',
    clickFlareError: '',
    clickflareUrl: '',
    status: '',
    // ChatGPT поля
    chatGptTitle: '',
    chatGptTitleEncoded: '',
    chatGptStatus: 'pending',
    chatGptError: '',
    isGeneratingTitle: false,
    isEditingChatGpt: false,
    isAdTitleConfirmed: false,
  }

  console.log(`Створена картка:`, {
    offer: newCard.offer,
    country: newCard.country,
    buyer: newCard.buyer,
    trafficSource: newCard.trafficSource,
    adTitle: newCard.adTitle, // З [Account name]
    baseCampaignName: newCard.baseCampaignName, // Без [Account name]
  })

  tonicStore.addCard(newCard)
  selectedCountry.value = ''
}

// ПОКРАЩЕНА функція processCampaignUrl з кращою обробкою помилок
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

// ДОПОМІЖНА функція для отримання правильного заголовка
const getTitleForUrl = (card) => {
  if (card.chatGptTitleEncoded && card.chatGptTitleEncoded.trim()) {
    console.log(`🤖 Використовуємо ChatGPT заголовок: "${card.chatGptTitle}"`)
    return card.chatGptTitleEncoded
  } else if (card.adTitle && card.adTitle.trim()) {
    console.log(`📝 Використовуємо adTitle: "${card.adTitle}"`)
    return encodeURIComponent(card.adTitle.trim())
  } else {
    console.log(`🏷️ Використовуємо offer назву: "${card.offer}"`)
    return encodeURIComponent(card.offer.trim())
  }
}

const confirmAdTitle = async (card) => {
  console.log(`Підтверджуємо AdTitle для: ${card.offer}`)
  console.log(`   AdTitle: "${card.chatGptTitle}"`)

  // Відмічаємо як підтверджений
  card.isAdTitleConfirmed = true

  // Оновлюємо URLs з підтвердженим заголовком
  updateCardUrlsAfterEdit(card)

  console.log(`🎯 AdTitle підтверджено, запускаємо створення ClickFlare...`)

  // Тепер створюємо ClickFlare офер автоматично
  if (card.resId && card.resUrl && card.resUrl.trim() !== '' && !card.clickflareId) {
    await submitCardToClickFlare(card)
  } else {
    console.log(`⏸️ Не можемо створити ClickFlare - відсутні необхідні дані`)
    console.log(`   resId: ${card.resId || 'НЕМАЄ'}`)
    console.log(`   resUrl: "${card.resUrl || 'НЕМАЄ'}"`)
    console.log(`   clickflareId: ${card.clickflareId || 'НЕМАЄ'}`)
  }
}

// Функція для генерації ChatGPT заголовка
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

      // НЕ генеруємо URL тут - це буде зроблено в submitCardToClickFlare
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

// Функція для перемикання режиму редагування ChatGPT заголовка
const toggleChatGptEdit = (card) => {
  if (card.isEditingChatGpt) {
    // Зберігаємо зміни
    saveChatGptEdit(card)
  } else {
    // Переходимо в режим редагування
    card.isEditingChatGpt = true
    console.log(`✏️ Режим редагування ChatGPT для: ${card.offer}`)
  }
}

// Функція для збереження відредагованого ChatGPT заголовка
const saveChatGptEdit = (card) => {
  if (!card.chatGptTitle || card.chatGptTitle.trim() === '') {
    console.warn(`⚠️ Порожній ChatGPT заголовок для: ${card.offer}`)
    return
  }

  console.log(`💾 Зберігаємо відредагований ChatGPT заголовок для: ${card.offer}`)
  console.log(`   Новий заголовок: "${card.chatGptTitle}"`)

  // Оновлюємо encoded версію
  card.chatGptTitleEncoded = encodeURIComponent(card.chatGptTitle.trim())

  // Виходимо з режиму редагування
  card.isEditingChatGpt = false

  // СКИДАЄМО ПІДТВЕРДЖЕННЯ при редагуванні
  card.isAdTitleConfirmed = false

  console.log(`   Encoded версія: "${card.chatGptTitleEncoded}"`)
  console.log(`⚠️ Підтвердження скинуто - потрібне нове підтвердження`)

  // АВТОМАТИЧНО ОНОВЛЮЄМО URLs з новим заголовком
  updateCardUrlsAfterEdit(card)
}

// Функція для оновлення URL після редагування ChatGPT заголовка
const updateCardUrlsAfterEdit = (card) => {
  console.log(`🔄 Оновлюємо URLs після редагування ChatGPT заголовка...`)

  // Оновлюємо ClickFlare URL (Offer)
  if (card.resUrl && card.resId) {
    const oldClickflareUrl = card.clickflareUrl
    card.clickflareUrl = generateOfferUrl(card)

    if (oldClickflareUrl !== card.clickflareUrl) {
      console.log(`🔄 ClickFlare URL оновлено після редагування`)
      console.log(`   Старий: ${oldClickflareUrl}`)
      console.log(`   Новий: ${card.clickflareUrl}`)
    }
  }

  // Оновлюємо Campaign URL
  if (card.clickflareCampaignUrl) {
    console.log(`🔄 Оновлюємо Campaign URL...`)
    processCampaignUrl(card)
  }

  console.log(`URLs оновлено після редагування ChatGPT заголовка`)
}

// Оновлена функція генерації URL з ChatGPT заголовком
const generateOfferUrlWithChatGpt = (card) => {
  // Ця функція тепер не потрібна - логіка об'єднана в generateOfferUrl
  return generateOfferUrl(card)
}

// Функція для оновлення всіх URL з ChatGPT заголовками
const updateAllUrlsWithChatGpt = () => {
  const cards = tonicStore.cards

  for (const card of cards) {
    if (card.chatGptStatus === 'success') {
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
    }
  }
}

const selectedCountries = computed(() => {
  return tonicStore.cards.map((card) => ({
    id: card.__id,
    name: card.country,
    code: allowedCountries.value.find((c) => c.name === card.country)?.code || '',
  }))
})

const fetchOffers = async () => {
  const source = form.trafficSource
  if (!source) return
  isLoadingOffers.value = true

  // Сначала сбрасываем значение до загрузки
  form.offer = null
  offers.value = []

  const cacheKey = `offers_${source}`
  const cached = getFromCache(cacheKey)
  if (cached) {
    offers.value = cached
    isLoadingOffers.value = false
    return
  }

  try {
    const resp = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tonic/offers?trafficSource=${source}`
    )
    const data = await resp.json()
    if (resp.ok && Array.isArray(data.offers)) {
      const mapped = data.offers.map((o) => ({ id: o.id, name: o.name }))
      setToCache(cacheKey, mapped)
      offers.value = mapped
    } else {
      console.error('❌ Error loading offers:', data)
    }
  } catch (e) {
    console.error('❌ Fetch error (offers):', e)
  } finally {
    isLoadingOffers.value = false
  }
}

watch(
  () => form.offer,
  async (newOffer) => {
    allowedCountries.value = []

    if (!newOffer || !newOffer.name) return

    const offerName = newOffer.name
    console.log('▶️ Выбран оффер:', offerName)

    isLoadingCountries.value = true

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tonic/countries/allowed?offer=${encodeURIComponent(
          offerName
        )}&trafficSource=${form.trafficSource}&buyer=${form.buyer}`
      )

      const data = await res.json()

      if (res.ok && Array.isArray(data.allowedCountries)) {
        allowedCountries.value = data.allowedCountries
      } else {
        console.warn('⚠️ Не вдалося завантажити список дозволених країн')
      }
    } catch (err) {
      console.error('❌ Fetch error (allowed countries):', err)
    } finally {
      isLoadingCountries.value = false
    }
  }
)

watch(
  () => form.trafficSource,
  async (newSource) => {
    console.log('🔄 Сменился источник трафика:', newSource)

    form.offer = null // сброс оффера
    form.countries = [] // сброс выбранных стран
    selectedCountry.value = '' // сброс текущей выбранной страны
    offers.value = [] // очистка списка офферов
    allowedCountries.value = [] // очистка списка стран

    await fetchOffers() // загрузка офферов под новый трафик
  }
)

// -- timer
const timerMinutesDisplay = computed(() => {
  return timerInterval.value ? String(timerMinutes.value).padStart(2, '0') : '00'
})

const timerSecondsDisplay = computed(() => {
  return timerInterval.value ? String(timerSeconds.value).padStart(2, '0') : '00'
})

const removeCountry = (country) => {
  tonicStore.cards = tonicStore.cards.filter((card) => card.__id !== country.id)
}

const removeCard = (cardToRemove) => tonicStore.removeCard(cardToRemove)

const mapCountryToCode = (name) => {
  const entry = allowedCountries.value.find((c) => c.name === name)
  return entry?.code || ''
}

const preloadAllowedCountries = async () => {
  const uniqueCombos = new Map()

  // Собираем уникальные комбинации offer+buyer+trafficSource
  for (const card of tonicStore.cards) {
    const key = `${card.offer}__${card.buyer}__${card.trafficSource}`
    if (!uniqueCombos.has(key)) {
      uniqueCombos.set(key, {
        offer: card.offer,
        buyer: card.buyer,
        trafficSource: card.trafficSource,
      })
    }
  }

  // Загружаем по каждой комбинации разрешенные страны
  for (const { offer, buyer, trafficSource } of uniqueCombos.values()) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tonic/countries/allowed?offer=${encodeURIComponent(
          offer
        )}&buyer=${buyer}&trafficSource=${trafficSource}`
      )
      const data = await res.json()

      if (res.ok && Array.isArray(data.allowedCountries)) {
        allowedCountries.value = data.allowedCountries
      } else {
        console.warn(`⚠️ Не вдалося завантажити країни для "${offer}"`)
      }
    } catch (err) {
      console.error(`❌ Fetch error (allowed countries for "${offer}"):`, err)
    }
  }
}

let isTimerStarted = false

// ВИПРАВЛЕНИЙ порядок виконання в submitForm
const submitForm = async () => {
  await preloadAllowedCountries()

  const cards = tonicStore.cards

  // 🎯 КРОК 1: Створюємо кампанії Tonic і ОБОВ'ЯЗКОВО отримуємо resUrl
  for (const card of cards) {
    const allowedResp = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tonic/countries/allowed?offer=${encodeURIComponent(
        card.offer
      )}&buyer=${card.buyer}&trafficSource=${card.trafficSource}`
    )
    const allowedData = await allowedResp.json()
    const allowedCodes = allowedData?.allowedCountries?.map((c) => c.code) || []

    const countryCode = mapCountryToCode(card.country)
    if (!allowedCodes.includes(countryCode)) {
      card.error = `🚫 Країна ${card.country} не дозволена для оффера "${card.offer}"`
      console.warn(card.error)
      continue
    }

    const payload = {
      name: card.adTitle,
      offer: card.offer,
      country: countryCode,
      buyer: card.buyer,
      trafficSource: card.trafficSource,
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tonic/create-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (res.ok && result.success && typeof result.data === 'number') {
        card.resId = result.data
        card.error = ''

        // ОБОВ'ЯЗКОВО завантажуємо статус для отримання resUrl
        await fetchCampaignStatus(card)

        console.log(`Кампанія створена. ID: ${card.resId}, URL: ${card.resUrl}`)
      } else {
        // Обробка існуючих кампаній
        const msg =
          typeof result.data === 'string'
            ? result.data
            : result?.error?.[0] || result?.error || '❌ Невідома помилка'

        if (msg.toLowerCase().includes('already in use')) {
          try {
            const query = new URLSearchParams({
              name: payload.name,
              trafficSource: payload.trafficSource,
            })

            const findRes = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/tonic/find-campaign?${query}`
            )

            if (findRes.ok) {
              const findData = await findRes.json()
              if (findData.success) {
                card.resId = findData.id
                card.resUrl = findData.link || findData.target || ''
                card.error = ''

                console.log(`ℹ️ Кампанія вже існує. ID: ${findData.id}, URL: ${findData.link}`)

                // ОБОВ'ЯЗКОВО завантажуємо статус
                await fetchCampaignStatus(card)
              }
            }
          } catch (e) {
            console.warn('⚠️ Не вдалося знайти існуючу кампанію:', e)
            card.error = `⚠️ Помилка пошуку існуючої кампанії: ${e.message}`
          }
        } else {
          card.error = msg
          console.warn(`⚠️ Campaign failed: ${card.adTitle} — ${msg}`)
        }
      }
    } catch (e) {
      console.error(`❌ Помилка при запиті для ${payload.name}:`, e)
      card.error = `Помилка створення кампанії: ${e.message}`
    }
  }

  // 🤖 КРОК 2: Генеруємо ChatGPT заголовки ТІЛЬКИ для карток з resId та resUrl
  console.log('🤖 Початок генерації ChatGPT заголовків...')

  const cardsWithTonicData = cards.filter((card) => card.resId && card.resUrl && !card.error)
  console.log(`📊 Знайдено ${cardsWithTonicData.length} карток для ChatGPT генерації`)

  if (cardsWithTonicData.length > 0) {
    console.log('🤖 Генеруємо ChatGPT заголовки для всіх карток...')

    // Генеруємо ChatGPT заголовки послідовно
    for (const card of cardsWithTonicData) {
      if (card.chatGptStatus !== 'success') {
        console.log(`🤖 Генеруємо ChatGPT для: ${card.offer}`)
        await generateChatGptTitle(card)

        // Пауза між запитами
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }
    }

    console.log('Генерація ChatGPT заголовків завершена')

    // ВИДАЛЕНО КРОК 3: Автоматичне створення ClickFlare
    // Тепер ClickFlare створюється тільки після підтвердження AdTitle
    console.log('ℹ️ ClickFlare буде створено після підтвердження AdTitle користувачем')
  }

  // 🔄 КРОК 4: Фінальне оновлення всіх URL (тільки для підтверджених)
  setTimeout(() => {
    updateAllUrlsWithChatGpt()
  }, 2000)

  // Запускаємо таймер
  if (!isTimerStarted) {
    if (!timerInterval.value) {
      startTimer()
    }
  }
}

onMounted(async () => {
  fetchOffers()

  for (const card of tonicStore.cards) {
    // Завантажуємо статус для нової кампанії
    await fetchCampaignStatus(card)

    // 🎯 Відправляємо у ClickFlare якщо є resUrl
    if (card.resUrl) {
      await submitCardToClickFlare(card)
    }
    await fetchCampaignStatus(card)
  }

  if (!form.offer && tonicStore.cards.length > 0) {
    const firstCard = tonicStore.cards[0]
    const matchedOffer = offers.value.find((o) => o.name === firstCard.offer)
    if (matchedOffer) {
      form.offer = matchedOffer
    }
  }
})

//-------------------------ClickFlare-------------------------
const isSubmittingOffers = ref(false)

const workspaceMap = {
  Alex: import.meta.env.VITE_WORKSPACE_ALEX,
  Davyd: import.meta.env.VITE_WORKSPACE_DAVYD,
}

// ВИПРАВЛЕНА функція generateOfferUrl з кращою обробкою помилок
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

// ВИПРАВЛЕНА функція submitCardToClickFlare
const submitCardToClickFlare = async (card) => {
  console.log(`🚀 Перевіряємо можливість створення ClickFlare для: ${card.adTitle}`)
  console.log(`   resId: "${card.resId || 'ПОРОЖНІЙ'}"`)
  console.log(`   resUrl: "${card.resUrl || 'ПОРОЖНІЙ'}"`)
  console.log(`   trafficSource: "${card.trafficSource || 'ПОРОЖНІЙ'}"`)
  console.log(`   clickflareId: "${card.clickflareId || 'ПОРОЖНІЙ'}"`)
  console.log(`   isAdTitleConfirmed: ${card.isAdTitleConfirmed || false}`)

  // НОВА ПЕРЕВІРКА: AdTitle має бути підтверджений
  if (!card.isAdTitleConfirmed && card.chatGptTitle) {
    console.log(`⏸️ Пропускаємо ClickFlare для ${card.adTitle} - AdTitle не підтверджений`)
    card.clickFlareError = 'AdTitle не підтверджений. Натисніть "Підтвердити" для продовження.'
    return
  }

  // СТАНДАРТНІ ПЕРЕВІРКИ
  if (!card.resId) {
    console.log(`⏸️ Пропускаємо ClickFlare для ${card.adTitle} - немає resId`)
    return
  }

  if (!card.resUrl || card.resUrl.trim() === '') {
    console.log(`⏸️ Пропускаємо ClickFlare для ${card.adTitle} - немає resUrl`)
    return
  }

  if (card.clickflareId && card.clickflareId !== '') {
    console.log(
      `⏸️ Пропускаємо ClickFlare для ${card.adTitle} - вже створено (ID: ${card.clickflareId})`
    )
    return
  }

  try {
    console.log(`🚀 Створюємо ClickFlare офер + кампанію для: ${card.adTitle}`)
    console.log(`   ChatGPT Status: ${card.chatGptStatus}`)
    console.log(`   ChatGPT Title: ${card.chatGptTitle || 'Немає'}`)
    console.log(`   AdTitle підтверджений:`)

    // Очищаємо помилку перед спробою створення
    card.clickFlareError = ''

    const workspace_id = workspaceMap[card.buyer]

    // ВИКОРИСТОВУЄМО НОВІ НАЗВИ ДЛЯ CLICKFLARE
    const clickFlareNames = getClickFlareNames(card)

    console.log(`📝 Назви для ClickFlare:`)
    console.log(`   Display (frontend): "${card.adTitle}"`)
    console.log(`   ClickFlare format: "${clickFlareNames.displayTitle}"`)
    console.log(`   Offer name: "${clickFlareNames.offerName}"`)
    console.log(`   Campaign name: "${clickFlareNames.campaignName}"`)

    // ГЕНЕРУЄМО URL З ДЕТАЛЬНИМ ЛОГУВАННЯМ
    console.log(`🔗 Генеруємо URL...`)
    const offerUrl = generateOfferUrl(card)

    console.log(`🔍 Результат генерації URL:`)
    console.log(`   URL: ${offerUrl}`)
    console.log(`   Містить помилку: ${offerUrl.includes('error=') ? 'ТАК' : 'НІ'}`)

    card.clickflareUrl = offerUrl

    console.log(`🔗 URL встановлено для ClickFlare:`)
    console.log(`   ${offerUrl}`)

    const payload = {
      offerName: clickFlareNames.offerName, // З [Account name] |
      offerUrl,
      campaignName: clickFlareNames.campaignName, // З [Account name] |
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

      // ВИПРАВЛЕННЯ: Використовуємо campaign.url з відповіді
      card.clickflareCampaignUrl = result.campaign.url
      card.clickFlareError = ''

      console.log(`ClickFlare успішно створено:`)
      console.log(`   Offer ID: ${result.offer.id}`)
      console.log(`   Campaign ID: ${result.campaign.id}`)
      console.log(`   Campaign URL (raw): ${result.campaign.url}`)

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

      // Викликаємо дебаг функцію
      debugCardUrls(card)
    } else {
      throw new Error(result?.error || 'Невідома помилка від ClickFlare API')
    }
  } catch (err) {
    const message = err.message || 'Невідома помилка'
    card.clickFlareError = message
    card.clickflareId = ''
    card.clickflareCampaignId = ''
    card.clickflareCampaignUrl = ''
    console.error(`❌ Помилка створення в ClickFlare для ${card.adTitle}:`, message)
  }
}

// ===== ДОДАТКОВА ФУНКЦІЯ ДЛЯ ДЕБАГУ =====
const debugCardUrls = (card) => {
  console.log(`🔍 Дебаг URL для картки: ${card.adTitle}`)
  console.log(`   resUrl: ${card.resUrl}`)
  console.log(`   chatGptTitle: ${card.chatGptTitle || 'Немає'}`)
  console.log(`   chatGptTitleEncoded: ${card.chatGptTitleEncoded || 'Немає'}`)
  console.log(`   chatGptStatus: ${card.chatGptStatus}`)
  console.log(`   clickflareUrl: ${card.clickflareUrl || 'Немає'}`)
  console.log(`   clickflareCampaignUrl: ${card.clickflareCampaignUrl || 'Немає'}`)
}

//-------------------------timer-------------------------
const showTimer = ref(false)
const timerMinutes = ref(1)
const timerSeconds = ref(0)
let timerInterval = ref(null)
const timerPaused = ref(false)
const customTimerMinutes = ref(1)

function startTimer() {
  showTimer.value = true
  timerMinutes.value = customTimerMinutes.value || 10
  timerSeconds.value = 0
  timerPaused.value = false

  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }

  timerInterval.value = setInterval(async () => {
    if (timerPaused.value) return

    if (timerMinutes.value === 0 && timerSeconds.value === 0) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
      showTimer.value = false
      timerPaused.value = false

      await submitForm()

      // 🔁 Обновляем статус у всех карточек после отправки
      for (const card of tonicStore.cards) {
        // Завантажуємо статус для нової кампанії
        await fetchCampaignStatus(card)

        // 🎯 Відправляємо у ClickFlare якщо є resUrl
        if (card.resUrl) {
          await submitCardToClickFlare(card)
        }
      }

      return
    }

    if (timerSeconds.value === 0) {
      timerMinutes.value -= 1
      timerSeconds.value = 59
    } else {
      timerSeconds.value -= 1
    }
  }, 1000)
}

function pauseTimer() {
  if (!timerInterval.value) return

  if (!timerPaused.value) {
    // Ставим на паузу
    timerPaused.value = true
  } else {
    // Перезапускаем с новым временем
    const newMinutes = parseInt(customTimerMinutes.value)
    if (!isNaN(newMinutes) && newMinutes > 0) {
      timerMinutes.value = newMinutes
      timerSeconds.value = 0
    }
    timerPaused.value = false
  }
}
</script>

<style>
.multiselect__option {
  padding: 8px 12px;
  transition: background-color 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.multiselect__option--highlight {
  background-color: #0d6efd !important;
  color: #fff !important;
  cursor: pointer;
}

.multiselect__option--highlight::after {
  content: none !important;
}
</style>
