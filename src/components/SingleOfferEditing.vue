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
          v-model="store.selectedTrafficSource"
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
          v-model="store.selectedTrafficSource"
        />
        <label class="form-check-label" for="meta"> Meta </label>
      </div>

      <select
        class="form-select"
        v-model="store.selectedCampaign"
        :disabled="store.isLoadingCampaigns"
      >
        <option value="" disabled>Select campaign</option>
        <option v-if="store.isLoadingCampaigns" disabled>Загрузка кампаний...</option>
        <option v-else-if="store.campaigns.length === 0" disabled>Кампании не найдены</option>
        <option v-for="campaign in store.campaigns" :key="campaign.id" :value="campaign">
          {{ campaign.id }}_{{ campaign.name }}
        </option>
      </select>
    </div>

    <!-- Action Buttons Row -->
    <div class="row mb-3">
      <div class="col-md-6">
        <button class="btn btn-primary w-100 fs-6 fw-semibold" @click="store.toggleKeywords">
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
        <input type="text" class="form-control" placeholder="Enter URL" v-model="store.urlInput" />
      </div>
      <div class="col-md-4">
        <button
          class="btn btn-primary w-100 fs-6 fw-semibold"
          @click="store.generateKeywordsFromUrl"
          :disabled="!store.urlInput.trim() || !store.selectedCampaign"
        >
          Add from URL
        </button>
      </div>
    </div>

    <!-- Keywords Input Section -->
    <div class="row">
      <div class="col-md-8">
        <input
          type="text"
          class="form-control"
          placeholder="Enter keyword"
          v-model="store.keywordInput"
        />
      </div>
      <div class="col-md-4">
        <button
          class="btn btn-primary w-100 fs-6 fw-semibold"
          @click="store.generateKeywordsFromWords"
          :disabled="!store.keywordInput.trim() || !store.selectedCampaign"
        >
          Generate keywords
        </button>
      </div>
    </div>

    <!-- Keywords Section -->
    <div v-if="store.showKeywords" class="mt-3">
      <div v-for="(value, key, index) in store.keywords" :key="key" class="row mb-3">
        <div class="col-md-8">
          <input
            type="text"
            class="form-control"
            :placeholder="`Enter keyword ${index + 1}`"
            v-model="store.keywords[key]"
          />
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
import { watch, onMounted } from 'vue'
import { useSingleOfferStore } from '../stores/singleOfferStore'

const store = useSingleOfferStore()

// Следим за изменением traffic source
watch(
  () => store.selectedTrafficSource,
  () => {
    store.fetchCampaigns()
  }
)

// Следим за изменением выбранной кампании
watch(
  () => store.selectedCampaign,
  (newCampaign) => {
    if (newCampaign && newCampaign.id) {
      store.fetchCampaignKeywords(newCampaign.id)
      // Автоматически показываем секцию keywords
      if (!store.showKeywords) {
        store.toggleKeywords()
      }
    }
  }
)

// Загружаем кампании при монтировании
onMounted(() => {
  store.fetchCampaigns()
})
</script>
