<template>
  <div class="card p-3 bg-light mt-3 col-12">
    <h5><i class="bi bi-rocket-takeoff me-2"></i> Створити оффери у ClickFlare</h5>

    <div class="border rounded p-3 mb-4 bg-white">
      <label class="form-label">Загальний шаблон параметрів</label>
      <input
        v-model="defaultQueryString"
        class="form-control"
        placeholder="?sub1={cf_click_id}&network=tiktok&site=tiktok&adtitle="
      />
    </div>
    <div class="mb-3">
      <label class="form-label">Workspace</label>
      <select v-model="selectedWorkspace" class="form-select">
        <option value="Alex">Alex</option>
        <option value="Davyd">Davyd</option>
      </select>
    </div>

    <div
      class="border rounded p-3 mb-3"
      v-for="(domainObj, index) in domainStore.domains"
      :key="domainObj.name"
    >
      <h6><i class="bi bi-globe2 me-2"></i>{{ domainObj.name }}</h6>

      <div class="mb-2">
        <label class="form-label">Ad title</label>
        <input
          v-model="adTitles[index]"
          class="form-control"
          placeholder="Наприклад, Rooftop solar panels"
        />
      </div>

      <div class="mt-2 small text-muted">
        <strong>Offer URL:</strong><br />
        {{ getDisplayUrl(domainObj.name, adTitles[index]) }}
      </div>
    </div>

    <button
      class="btn btn-primary mt-2 w-100"
      @click="submitOffers"
      :disabled="isSubmitting || domainStore.domains.length === 0"
      :class="{
        disabled: isSubmitting || domainStore.domains.length === 0,
      }"
    >
      {{ isSubmitting ? 'Відправлення...' : 'Створити всі оффери' }}
    </button>

    <div class="mt-3" v-if="results.length">
      <h6>Результати:</h6>
      <ul class="list-group">
        <li
          class="list-group-item d-flex justify-content-between align-items-center"
          v-for="r in results"
          :key="r.domain"
        >
          {{ r.domain }}
          <span :class="['badge rounded-pill', r.success ? 'bg-success' : 'bg-danger']">
            {{ r.message }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import axios from 'axios'
import { useDomainStore } from '../../stores/domainStore'

const domainStore = useDomainStore()

const adTitles = ref([])
const defaultQueryString = ref('')
const isSubmitting = ref(false)
const results = ref([])
const selectedWorkspace = ref('Alex')

const workspaceMap = {
  Alex: import.meta.env.VITE_WORKSPACE_ALEX,
  Davyd: import.meta.env.VITE_WORKSPACE_DAVYD,
}

selectedWorkspace.value = localStorage.getItem('selectedWorkspace') || 'Alex'

watch(selectedWorkspace, (val) => {
  localStorage.setItem('selectedWorkspace', val)
})

const network = computed(() => {
  return ['FB1', 'FB2'].includes(domainStore.selectedSedoAccount) ? 'meta' : 'tiktok'
})

watch(
  () => domainStore.selectedSedoAccount,
  () => {
    defaultQueryString.value = `?sub1={cf_click_id}&network=${network.value}&site=${network.value}&adtitle=`
  },
  { immediate: true }
)

const generateOfferUrl = (domain, adTitle) => {
  const cleanDomain = domain.trim()
  const title = adTitle?.trim() || ''
  const base = `https://${cleanDomain}`
  const query = `${defaultQueryString.value}${encodeURIComponent(title)}`
  return base + query
}

const getDisplayUrl = (domain, adTitle) => {
  const cleanDomain = domain.trim()
  const title = adTitle?.trim() || ''
  const base = `https://${cleanDomain}`
  const query = `${defaultQueryString.value}${title}`
  return base + query
}

const submitOffers = async () => {
  isSubmitting.value = true
  results.value = []

  const sedoUsername = import.meta.env[`VITE_SEDO_USERNAME_${domainStore.selectedSedoAccount}`]
  const apiUrl = import.meta.env.VITE_CLICKFLARE_API_URL
  const apiKey = import.meta.env.VITE_CLICKFLARE_API_KEY
  const workspaceId = workspaceMap[selectedWorkspace.value]

  const offers = domainStore.domains.map((d, i) => ({
    domain: d.name,
    adTitle: adTitles.value[i],
    url: generateOfferUrl(d.name, adTitles.value[i]),
  }))

  for (const offer of offers) {
    try {
      const res = await axios.post(
        apiUrl,
        {
          workspace_id: workspaceId,
          name: `${offer.domain} - ${sedoUsername}`,
          url: offer.url,
          direct: true,
          affiliateNetworkID: import.meta.env.VITE_AFFILIATE_NETWORK_ID,
          keywordBuilderMode: 'free_form',
          payout: {
            type: 'auto',
          },
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('✅ Успешно:', res.data)
      results.value.push({ domain: offer.domain, success: true, message: 'Створено успішно' })
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.data?.[0]?.message ||
        err.message ||
        'Невідома помилка'

      console.error('❌ Помилка:', msg)
      results.value.push({ domain: offer.domain, success: false, message: msg })
    }
  }

  isSubmitting.value = false
}
</script>
