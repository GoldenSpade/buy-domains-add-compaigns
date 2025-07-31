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
      <StatusTimer />
    </div>
  </div>
</template>

<script setup>
import { useTonicStore } from '@/stores/tonicStore'
import StatusTimer from './StatusTimer.vue'
import CombinedAccordion from './CombinedAccordion.vue'
const tonicStore = useTonicStore()

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
  }
}

// Обробка оновлення статусу
const onStatusUpdated = (cardKey, statusData) => {
  tonicStore.updateActiveCardStatus(cardKey, statusData)
}

// Скидання стану картки (аналогічно TonicCampaignForm)
const resetCardState = (card) => {
  const preservedData = {
    clickflareCampaignUrl: card.clickflareCampaignUrl,
    clickflareId: card.clickflareId,
    clickflareCampaignId: card.clickflareCampaignId,
    resId: card.resId,
    resUrl: card.resUrl,
    clickflareResCampaignName: card.clickflareResCampaignName,
  }

  console.log(`🔄 Скидання стану для активної картки: ${card.adTitle}`)

  // Очищаємо тільки те, що потрібно перегенерувати
  card.clickFlareError = ''
  card.clickflareUrl = ''
  card.error = ''
  card.status = ''
  card.chatGptTitle = ''
  card.chatGptTitleEncoded = ''
  card.chatGptStatus = 'pending'
  card.chatGptError = ''

  // Відновлюємо збережені дані
  if (preservedData.resId) card.resId = preservedData.resId
  if (preservedData.resUrl) card.resUrl = preservedData.resUrl
  if (preservedData.clickflareId) card.clickflareId = preservedData.clickflareId
  if (preservedData.clickflareCampaignId)
    card.clickflareCampaignId = preservedData.clickflareCampaignId
  if (preservedData.clickflareResCampaignName)
    card.clickflareResCampaignName = preservedData.clickflareResCampaignName

  // Оновлюємо campaign URL якщо він існує
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
    } else {
      card.clickflareCampaignUrl = preservedData.clickflareCampaignUrl
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
</script>
