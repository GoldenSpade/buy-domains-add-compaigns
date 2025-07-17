<template>
  <div class="card p-4 bg-light">
    <h4 class="mb-3">
      <i class="bi bi-broadcast me-2"></i>
      Створення кампаній Tonic
    </h4>

    <div class="mb-3">
      <label class="form-label">Обрати оффер</label>
      <select v-model="form.offer" class="form-select">
        <option v-for="offer in offers" :key="offer" :value="offer">
          {{ offer }}
        </option>
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Обрати країну</label>
      <div class="d-flex gap-2 flex-wrap mb-2">
        <span
          v-for="country in form.countries"
          :key="country"
          class="badge rounded-pill text-bg-success d-flex align-items-center"
        >
          {{ country }}
          <i class="bi bi-x ms-2" role="button" @click="removeCountry(country)"></i>
        </span>
      </div>
      <select v-model="selectedCountry" class="form-select" @change="addCountry">
        <option v-for="country in countries" :key="country" :value="country">
          {{ country }}
        </option>
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Обрати байера</label>
      <select v-model="form.buyer" class="form-select">
        <option v-for="buyer in buyers" :key="buyer" :value="buyer">
          {{ buyer }}
        </option>
      </select>
    </div>

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
import { reactive, ref, onMounted } from 'vue'

const form = reactive({
  offer: 'Offer 1',
  countries: [],
  buyer: 'Alex',
  trafficSource: 'TikTok',
})

const selectedCountry = ref('')

const offers = ['Offer 1', 'Offer 2', 'Offer 3']
const countries = ['US', 'UK', 'CA', 'DE', 'FR']
const buyers = ['Alex', 'Davyd']
const trafficSources = ['TikTok', 'Facebook']

onMounted(() => {
  selectedCountry.value = countries[0] || ''
})

const addCountry = () => {
  if (selectedCountry.value && !form.countries.includes(selectedCountry.value)) {
    form.countries.push(selectedCountry.value)
  }
}

const removeCountry = (country) => {
  const index = form.countries.indexOf(country)
  if (index !== -1) form.countries.splice(index, 1)
}

const submitForm = () => {
  console.log('Форма для Tonic кампанії:', form)
  // Здесь позже будет логика інтеграції з publisher.tonic.com
}
</script>

<style scoped>
/* .card {
  max-width: 600px;
  margin: auto;
} */
</style>
