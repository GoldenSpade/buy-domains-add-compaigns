<template>
  <div class="card p-4 bg-light">
    <h4 class="mb-3">
      <i class="bi bi-broadcast me-2"></i>
      Створення кампаній Tonic
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
                @input="resetCardState(card)"
              />
            </div>

            <div
              v-if="card.resId && card.resUrl"
              class="alert alert-success mt-2 d-flex align-items-center gap-2 p-2 small"
            >
              <i class="bi bi-check-circle-fill text-success"></i>
              Кампанія вже існує. Отримано ID та URL.
            </div>

            <!-- 🔗 ID и URL -->
            <div v-if="card.resId || card.resUrl" class="mt-1 small">
              <div v-if="card.resId">🆔 ID: {{ card.resId }}</div>
              <div v-if="card.resUrl">
                🔗 <a :href="'https://' + card.resUrl" target="_blank">{{ card.resUrl }}</a>
              </div>
            </div>

            <div class="small text-muted">
              {{ card.country }} | {{ card.buyer }} | {{ card.trafficSource }}
            </div>
            <div v-if="card.error" class="mt-2 text-danger small border rounded bg-light p-2">
              <i class="bi bi-exclamation-triangle me-1"></i>
              {{ card.error }}
            </div>
            <!-- ClickFlare статус -->
            <div class="small mt-2">
              <span
                v-if="card.clickflareId"
                class="badge bg-success text-white px-2 py-1"
                style="font-size: 12px"
              >
                Успішно завантажено до ClickFlare
              </span>
            </div>
            <div v-if="card.clickFlareError" class="text-danger small mt-1">
              {{ card.clickFlareError }}
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

            <button
              class="btn btn-outline-secondary btn-sm d-flex align-items-center ms-1"
              @click="stopTimer"
              :disabled="!timerInterval"
            >
              <i class="bi bi-stop-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <button
      class="btn btn-primary mt-3"
      :class="{ disabled: tonicStore.cards.length === 0 }"
      @click="submitForm"
    >
      Створити кампанії
    </button>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch, computed, toRef } from 'vue'
import { useTonicStore } from '../../stores/tonicStore'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { nanoid } from 'nanoid'

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

const resetCardState = (card) => {
  card.clickFlareError = ''
  card.clickflareId = ''
  card.error = ''
  card.resId = ''
  card.resUrl = ''
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
      // form.offer уже null — не трогаем
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

const addCountry = () => {
  const selected = selectedCountry.value
  const offerName = form.offer?.name || ''

  if (!selected) return

  tonicStore.addCard({
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
  })

  selectedCountry.value = ''
}

const selectedCountries = computed(() => {
  return tonicStore.cards.map((card) => ({
    id: card.__id,
    name: card.country,
    code: allowedCountries.value.find((c) => c.name === card.country)?.code || '',
  }))
})

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

const submitForm = async () => {
  await preloadAllowedCountries()

  const cards = tonicStore.cards

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
      } else {
        const msg =
          typeof result.data === 'string'
            ? result.data
            : result?.error?.[0] || result?.error || '❌ Невідома помилка'

        card.error = msg
        console.warn(`⚠️ Campaign failed: ${card.adTitle} — ${msg}`)

        // 🧠 Проверка на "name already in use"
        if (msg.toLowerCase().includes('already in use')) {
          try {
            const query = new URLSearchParams({
              name: payload.name,
              trafficSource: payload.trafficSource,
            })

            const findRes = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/tonic/find-campaign?${query}`
            )
            const findData = await findRes.json()

            if (findData.success) {
              card.resId = findData.id
              card.resUrl = findData.link
              card.error = ''
              console.info(`ℹ️ Кампанія вже існує. ID: ${findData.id}, URL: ${findData.link}`)

              await submitCardToClickFlare(card)
            }
          } catch (e) {
            console.warn('⚠️ Не вдалося знайти кампанію по імені:', e)
          }
        }
      }
    } catch (e) {
      console.error(`❌ Помилка при запиті для ${payload.name}:`, e)
    }
  }

  if (!isTimerStarted) {
    if (!timerInterval.value) {
      startTimer()
    }
  }
}

onMounted(() => {
  fetchOffers()

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

const generateOfferUrl = (card) => {
  const baseUrl = `https://${card.resUrl?.trim()}`
  const adTitleEncoded = encodeURIComponent(card.offer.trim()) // 🔁 ВАЖНО: здесь не adTitle, а именно offer
  const adTitleSuffix = card.adTitle.trim().split(' ').at(-1).toLowerCase()

  const isFacebook = adTitleSuffix === 'facebook'
  const isTiktok = adTitleSuffix === 'tiktok'

  const facebookTemplate =
    'network=facebook&site=direct&subid1={trackingField6}&subid2={trackingField5}&subid3={trackingField3}|{trackingField2}|{trackingField1}&subid4={cf_click_id}&click_id={external_id}&adtitle=REPLACE+WITH+ADTITLE'

  const tiktokTemplate =
    'network=tiktok&site=direct&subid1={trackingField3}&subid2={trackingField5}&subid3={trackingField8}|{trackingField6}|{trackingField4}&subid4={cf_click_id}&click_id={external_id}&adtitle=REPLACE+WITH+ADTITLE'

  const selectedQuery = isFacebook ? facebookTemplate : isTiktok ? tiktokTemplate : ''

  if (!baseUrl || !selectedQuery) return '❌ Некоректний URL'

  const finalQuery = selectedQuery.replace('REPLACE+WITH+ADTITLE', adTitleEncoded)

  return `${baseUrl}?${finalQuery}`
}

const submitCardToClickFlare = async (card) => {
  if (!card.resId || !card.resUrl || card.clickflareId) return

  try {
    const name = `${card.resId}_${card.adTitle}`
    const url = generateOfferUrl(card)

    const payload = {
      name,
      url,
      workspace_id: workspaceMap[card.buyer],
      affiliateNetworkID: import.meta.env.VITE_AFFILIATE_NETWORK_TONIC_ID,
      direct: false,
      payout: {
        type: 'manual',
        payout: 0,
        currency: 'USD',
      },
      keywordBuilderMode: 'free_form',
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/clickflare/create-offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (result?.success && result.offerId) {
      card.clickflareId = result.offerId
      card.clickFlareError = ''
    } else {
      throw new Error(result?.error || 'Невідома помилка від ClickFlare')
    }
  } catch (err) {
    const raw = err?.response?.data || err
    const message = raw?.message || raw?.data?.[0]?.message || err.message || 'Невідома помилка'
    card.clickFlareError = message
  }
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

function stopTimer() {
  clearInterval(timerInterval.value)
  timerInterval.value = null
  showTimer.value = false
  timerMinutes.value = 0
  timerSeconds.value = 0
  timerPaused.value = false
  isTimerStarted = false
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
