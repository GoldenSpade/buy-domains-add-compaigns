<template>
  <div class="container">
    <!-- Dropdown with Radio Buttons -->
    <div class="d-flex align-items-center gap-3 mb-3">
      <div class="form-check">
        <input
          class="form-check-input"
          type="radio"
          name="trafficSource"
          id="tiktok"
          value="TikTok"
          v-model="selectedTrafficSource"
        />
        <label class="form-check-label" for="tiktok"> Tiktok </label>
      </div>
      <div class="form-check">
        <input
          class="form-check-input"
          type="radio"
          name="trafficSource"
          id="meta"
          value="Meta"
          v-model="selectedTrafficSource"
        />
        <label class="form-check-label" for="meta"> Meta </label>
      </div>

      <select class="form-select" v-model="selectedCampaign" :disabled="isLoadingCampaigns">
        <option v-if="isLoadingCampaigns" disabled>Загрузка кампаний...</option>
        <option v-else-if="campaigns.length === 0" disabled>Кампании не найдены</option>
        <option v-for="campaign in campaigns" :key="campaign.id" :value="campaign">
          {{ campaign.id }}_{{ campaign.name }}
        </option>
      </select>
    </div>

    <!-- Action Buttons Row -->
    <div class="row mb-3">
      <div class="col-md-6">
        <button class="btn btn-primary w-100 fs-6 fw-semibold" @click="toggleKeywords">
          Pull keywords
        </button>
      </div>
      <div class="col-md-6">
        <button class="btn btn-primary w-100 fs-6 fw-semibold">Add to clickflare</button>
      </div>
    </div>

    <!-- URL Input Section -->
    <div class="row mb-3">
      <div class="col-md-8">
        <input type="text" class="form-control" placeholder="Enter URL" />
      </div>
      <div class="col-md-4">
        <button class="btn btn-primary w-100 fs-6 fw-semibold">Add from URL</button>
      </div>
    </div>

    <!-- Keywords Input Section -->
    <div class="row">
      <div class="col-md-8">
        <input type="text" class="form-control" placeholder="Enter keyword" />
      </div>
      <div class="col-md-4">
        <button class="btn btn-primary w-100 fs-6 fw-semibold">Generate keywords</button>
      </div>
    </div>

    <!-- Keywords Section -->
    <div v-if="showKeywords" class="mt-3">
      <div v-for="n in 6" :key="n" class="row mb-3">
        <div class="col-md-8">
          <input type="text" class="form-control" :placeholder="`Enter keyword ${n}`" />
        </div>
        <div class="col-md-4 d-flex gap-1">
          <button class="btn btn-outline-secondary btn-sm flex-fill">+ city</button>
          <button class="btn btn-outline-secondary btn-sm flex-fill">+ region</button>
          <button class="btn btn-outline-secondary btn-sm flex-fill">+ country</button>
        </div>
      </div>

      <div class="text-center mt-4">
        <button class="btn btn-success fs-6 fw-semibold px-4">Update keywords</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const showKeywords = ref(false)

const toggleKeywords = () => {
  showKeywords.value = !showKeywords.value
}

const selectedTrafficSource = ref('TikTok')
const campaigns = ref([])
const selectedCampaign = ref(null)
const isLoadingCampaigns = ref(false)

// Функция загрузки кампаний через наш API
const fetchCampaigns = async () => {
  const source = selectedTrafficSource.value === 'Meta' ? 'Facebook' : 'TikTok'
  if (!source) return

  isLoadingCampaigns.value = true
  campaigns.value = []
  selectedCampaign.value = null

  try {
    const resp = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tonic/campaigns?trafficSource=${source}`
    )
    const data = await resp.json()

    if (resp.ok && Array.isArray(data.campaigns)) {
      campaigns.value = data.campaigns
      console.log(`Загружено ${campaigns.value.length} кампаний для ${source}`)
    } else {
      console.error('❌ Error loading campaigns:', data)
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки кампаний:', err)
  } finally {
    isLoadingCampaigns.value = false
  }
}

// Следим за изменением traffic source
watch(selectedTrafficSource, () => {
  fetchCampaigns()
})

// Загружаем кампании при монтировании
onMounted(() => {
  fetchCampaigns()
})
</script>
