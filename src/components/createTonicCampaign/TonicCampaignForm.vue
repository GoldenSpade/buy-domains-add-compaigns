<template>
  <div class="card p-4 bg-light">
    <h4 class="mb-3">
      <i class="bi bi-broadcast me-2"></i>
      Створення кампаній Tonic
    </h4>

    <!-- Офферы -->
    <div class="mb-3">
      <label class="form-label">Обрати оффер</label>
      <select v-model="form.offer" class="form-select">
        <option disabled value="">
          {{ isLoadingOffers ? 'Завантаження...' : '' }}
        </option>
        <option v-for="offer in offers" :key="offer.id" :value="offer.id">
          {{ offer.name }}
        </option>
      </select>
    </div>

    <!-- Страны -->
    <div class="mb-3">
      <label class="form-label">Обрати країну</label>
      <div class="d-flex gap-2 flex-wrap mb-2">
        <span
          v-for="country in form.countries"
          :key="country.code"
          class="badge rounded-pill text-bg-success d-flex align-items-center"
        >
          {{ country.name }}
          <i class="bi bi-x ms-2" role="button" @click="removeCountry(country)"></i>
        </span>
      </div>

      <select v-model="selectedCountry" class="form-select" @change="addCountry">
        <option disabled value="">
          {{ isLoadingCountries ? 'Завантаження...' : '' }}
        </option>
        <option v-for="country in countries" :key="country.code" :value="country.code">
          {{ country.name }}
        </option>
      </select>
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
    </div>

    <button class="btn btn-primary" @click="submitForm">Створити кампанію</button>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue'

const form = reactive({
  offer: '',
  countries: [],
  buyer: 'Alex',
  trafficSource: 'TikTok',
})

const selectedCountry = ref('')
const offers = ref([])
const countries = ref([])

const isLoadingOffers = ref(false)
const isLoadingCountries = ref(false)

const buyers = ['Alex', 'Davyd']
const trafficSources = ['TikTok', 'Facebook']

const CACHE_TTL = 60 * 60 * 1000 // 60 минут

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
    const item = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (e) {
    console.warn('Cache write error:', e)
  }
}

const fetchOffers = async () => {
  const source = form.trafficSource
  if (!source) return

  isLoadingOffers.value = true
  offers.value = []
  form.offer = ''

  const cacheKey = `offers_${source}`
  const cached = getFromCache(cacheKey)
  if (cached) {
    offers.value = cached
    form.offer = cached[0]?.id || ''
    isLoadingOffers.value = false
    return
  }

  try {
    const resp = await fetch(`http://localhost:3000/tonic/offers?trafficSource=${source}`)
    const data = await resp.json()

    if (resp.ok && Array.isArray(data.offers)) {
      const mapped = data.offers.map((o) => ({ id: o.id, name: o.name }))
      offers.value = mapped
      form.offer = mapped[0]?.id || ''
      setToCache(cacheKey, mapped)
    } else {
      console.error('❌ Error loading offers:', data)
    }
  } catch (e) {
    console.error('❌ Fetch error (offers):', e)
  } finally {
    isLoadingOffers.value = false
  }
}

const fetchCountries = async () => {
  const source = form.trafficSource
  if (!source) return

  isLoadingCountries.value = true
  countries.value = []
  selectedCountry.value = ''

  const cacheKey = `countries_${source}`
  const cached = getFromCache(cacheKey)
  if (cached) {
    countries.value = cached
    selectedCountry.value = cached[0]?.code || ''
    isLoadingCountries.value = false
    return
  }

  try {
    const resp = await fetch(`http://localhost:3000/tonic/countries?trafficSource=${source}`)
    const data = await resp.json()

    if (resp.ok && Array.isArray(data.countries)) {
      countries.value = data.countries
      selectedCountry.value = data.countries[0]?.code || ''
      setToCache(cacheKey, data.countries)
    } else {
      console.error('❌ Error loading countries:', data)
    }
  } catch (e) {
    console.error('❌ Fetch error (countries):', e)
  } finally {
    isLoadingCountries.value = false
  }
}

watch(
  () => form.trafficSource,
  () => {
    fetchOffers()
    fetchCountries()
  }
)

const addCountry = () => {
  const selected = countries.value.find((c) => c.code === selectedCountry.value)
  if (selected && !form.countries.some((c) => c.code === selected.code)) {
    form.countries.push(selected)
  }
}

const removeCountry = (country) => {
  const index = form.countries.indexOf(country)
  if (index !== -1) form.countries.splice(index, 1)
}

const submitForm = async () => {
  const payload = {
    name: `${form.offer} - ${form.trafficSource}`,
    trafficSource: form.countries.map(c => c.code),
    countries: form.countries,
    buyer_id: form.buyer,
    offer_id: form.offer,
    flow_id: 'some-flow-id',
  }

  try {
    const response = await fetch('http://localhost:3000/tonic/create-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (response.ok) {
      alert(`✅ Кампанія створена: ${result.campaign?.campaign?.name || 'без імені'}`)
      console.log(result)
    } else {
      console.error('❌ Error:', result)
      alert(`❌ Помилка: ${result?.error?.message || 'невідома помилка'}`)
    }
  } catch (err) {
    console.error('❌ Exception:', err)
    alert('❌ Помилка при відправці запиту')
  }
}

onMounted(() => {
  fetchOffers()
  fetchCountries()
})
</script>
