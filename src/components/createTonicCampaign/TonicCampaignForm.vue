<template>
  <div class="card p-4 bg-light">
    <h4 class="mb-3">
      <i class="bi bi-broadcast me-2"></i>
      Створення кампаній Tonic
    </h4>

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

    <!-- Страны -->
    <div class="mb-3">
      <label class="form-label">Обрати країну</label>
      <div class="d-flex gap-2 flex-wrap mb-2">
        <span
          v-for="countryName in uniqueCountryNames"
          :key="countryName"
          class="badge rounded-pill text-bg-success d-flex align-items-center"
        >
          {{ countryName }}
        </span>
      </div>

      <Multiselect
        v-model="selectedCountry"
        :options="allowedCountries"
        :noOptionsText="'Список порожній'"
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

    <!-- Источник трафика -->
    <div class="mb-4">
      <label class="form-label">Джерело трафіку</label>
      <select v-model="form.trafficSource" class="form-select">
        <option v-for="source in trafficSources" :key="source" :value="source">
          {{ source }}
        </option>
      </select>

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
              <label class="form-label fw-bold mb-2">Ad title</label>
              <input type="text" :value="card.adTitle" class="form-control" disabled />
            </div>

            <div
              v-if="card.resId && card.resUrl"
              class="alert alert-success mt-2 d-flex align-items-center gap-2 p-2 small"
            >
              <i class="bi bi-check-circle-fill text-success"></i>
              Кампанія вже існує. Отримано ID та URL.
            </div>

            <!-- Card status -->
            <div v-if="card.status" class="mt-2 small text-muted">
              <i class="bi bi-info-circle me-1"></i>
              Статус:
              <span class="fw-semibold text-muted">{{ card.status }}</span>
            </div>

            <div v-else class="mt-2 small text-muted">
              <i class="bi bi-hourglass-split me-1"></i>
              Статус:
              <span class="fw-semibold text-muted">очікується</span>
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
          </div>
        </div>
      </div>
    </div>

    <button
      class="btn btn-primary"
      :class="{ disabled: tonicStore.cards.length === 0 }"
      @click="submitForm"
    >
      Створити кампанії
    </button>

    <button
      v-if="tonicStore.cards.length"
      class="btn btn-outline-danger mt-2"
      @click="clearAllCards"
    >
      <i class="bi bi-trash3 me-1"></i>
      Видалити список кампаній
    </button>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch, computed, toRef } from 'vue'
import { useTonicStore } from '../../stores/tonicStore'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

const tonicStore = useTonicStore()

const form = reactive({
  offer: null,
  countries: [],
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

const CACHE_TTL = 1000

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

  if (!selected || form.countries.some((c) => c.code === selected.code)) return

  form.countries.push(selected)

  tonicStore.addCard({
    offer: offerName,
    country: selected.name,
    buyer: form.buyer,
    trafficSource: form.trafficSource,
    adTitle: `${offerName} - ${selected.name} - ${form.buyer} - ${form.trafficSource}`,
    resId: '',
    resUrl: '',
    status: '',
    error: '',
    clickflareId: '',
    clickFlareError: '',
  })

  selectedCountry.value = '' // очищаем после выбора
}

const uniqueCountryNames = computed(() => {
  const names = tonicStore.cards.map((card) => card.country)
  return [...new Set(names)]
})

const removeCountryByName = (countryName) => {
  const offerName = form.offer?.name || ''

  tonicStore.cards = tonicStore.cards.filter(
    (card) =>
      !(
        card.country === countryName &&
        card.offer === offerName &&
        card.buyer === form.buyer &&
        card.trafficSource === form.trafficSource
      )
  )

  form.countries = form.countries.filter((c) => c.name !== countryName)
}

const removeCountry = (country) => {
  const index = form.countries.indexOf(country)
  if (index !== -1) form.countries.splice(index, 1)

  tonicStore.cards = tonicStore.cards.filter(
    (card) =>
      !(
        card.country === country.name &&
        card.offer === (offers.value.find((o) => o.id === form.offer)?.name || '') &&
        card.buyer === form.buyer &&
        card.trafficSource === form.trafficSource
      )
  )
}

const removeCard = (cardToRemove) => tonicStore.removeCard(cardToRemove)

const mapCountryToCode = (name) => {
  const entry = allowedCountries.value.find((c) => c.name === name)
  return entry?.code || ''
}

const submitForm = async () => {
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

              try {
                const statusQuery = new URLSearchParams({
                  trafficSource: card.trafficSource,
                  name: payload.name,
                })

                const statusResp = await fetch(
                  `${import.meta.env.VITE_API_BASE_URL}/tonic/campaign-status?${statusQuery}`
                )
                const statusData = await statusResp.json()

                if (statusData.success) {
                  card.status = statusData.status || 'unknown'
                  if (statusData.link) {
                    card.resUrl = statusData.link
                  }
                }
              } catch (e) {
                console.warn(`⚠️ Не вдалося отримати статус кампанії: ${payload.name}`, e)
              }
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
  //Добавляем обновление статусов всех карточек после создания
  await updateAllCardStatuses()
}

const clearAllCards = () => {
  tonicStore.clearCards()

  form.offer = null
  form.countries = []
  form.buyer = 'Alex'
  form.trafficSource = 'TikTok'
  selectedCountry.value = ''
  offers.value = []
  allowedCountries.value = []

  fetchOffers()
}

const updateCardStatusByName = async (card) => {
  try {
    const query = new URLSearchParams({
      name: card.adTitle,
      trafficSource: card.trafficSource,
    })

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tonic/campaign-status?${query}`)
    const data = await res.json()

    if (data.success) {
      card.status = data.status || 'unknown'
      if (data.link) card.resUrl = data.link

      // 💥 Обнуляем, если статус stopped
      if (card.status === 'stopped') {
        card.resId = ''
        card.resUrl = ''
      }
    } else {
      card.status = 'not found'
    }
  } catch (err) {
    console.error(`❌ Status check error for ${card.adTitle}:`, err)
    card.status = 'error'
  }
}

const updateAllCardStatuses = async () => {
  for (const card of tonicStore.cards) {
    await updateCardStatusByName(card)
  }
}

onMounted(() => {
  fetchOffers()
})
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
