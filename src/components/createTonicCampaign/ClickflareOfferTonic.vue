<template>
  <div class="card p-3 bg-light col-12">
    <h5><i class="bi bi-rocket-takeoff me-2"></i> Створити оффери у ClickFlare</h5>

    <!-- Карточки -->
    <div
      v-for="(card, index) in tonicStore.cards"
      :key="index"
      class="border rounded p-3 mb-3 bg-white"
    >
      <!-- Заголовок -->
      <h6 class="mb-2 d-flex align-items-center">
        <i class="bi bi-clipboard me-2"></i>

        <span v-if="card.resId">
          <strong>{{ `${card.resId}_${card.adTitle}` }}</strong>
        </span>

        <span v-else class="d-flex align-items-center">
          <span v-if="card.status" class="badge me-2" :class="getBadgeClass(card.status)">
            {{ card.status }}
          </span>
          <strong>{{ card.adTitle }}</strong>
        </span>
      </h6>

      <!-- Ошибка -->
      <div v-if="card.clickFlareError" class="text-danger small mb-1">
        {{ card.clickFlareError }}
      </div>

      <!-- URL -->
      <div class="small text-muted mb-1">
        <strong>URL:</strong><br />
        {{ generateOfferUrl(card) }}
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
    </div>

    <!-- Кнопка -->
    <button
      class="btn btn-primary w-100 mt-2"
      @click="submitAll"
      :disabled="isSubmitting || !tonicStore.cards.length"
    >
      {{ isSubmitting ? 'Відправлення...' : 'Створити оффери' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTonicStore } from '../../stores/tonicStore'

const tonicStore = useTonicStore()

const isSubmitting = ref(false)

const workspaceMap = {
  Alex: import.meta.env.VITE_WORKSPACE_ALEX,
  Davyd: import.meta.env.VITE_WORKSPACE_DAVYD,
}

const getBadgeClass = (status) => {
  if (!status) return 'bg-secondary text-dark'
  const s = status.toLowerCase()
  if (s === 'active') return 'bg-success text-white'
  if (s === 'stopped') return 'bg-danger text-white'
  if (s === 'paused') return 'bg-warning text-dark'
  return 'bg-light text-dark'
}

const generateOfferUrl = (card) => {
  const baseUrl = `https://${card.resUrl?.trim()}`

  const adTitleEncoded = encodeURIComponent(card.adTitle.trim())
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

const submitAll = async () => {
  isSubmitting.value = true

  for (const card of tonicStore.cards) {
    // Пропустить если нет resId или статус "stopped"
    if (!card.resId) {
      continue
    }

    if (card.status === 'stopped') {
      continue
    }
    try {
      const name = `${card.resId}_${card.adTitle}`
      const url = generateOfferUrl(card)

      const payload = {
        name,
        url,
        workspace_id: workspaceMap[card.buyer],
        affiliateNetworkID: import.meta.env.VITE_AFFILIATE_NETWORK_TONIC_ID,
        direct: true,
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
        card.clickFlareError = '' // 🔥 сброс ошибки
      } else {
        throw new Error(result?.error || 'Невідома помилка від ClickFlare')
      }
    } catch (err) {
      const raw = err?.response?.data || err
      const message = raw?.message || raw?.data?.[0]?.message || err.message || 'Невідома помилка'
      card.clickFlareError = message
    }
  }

  isSubmitting.value = false
}
</script>
