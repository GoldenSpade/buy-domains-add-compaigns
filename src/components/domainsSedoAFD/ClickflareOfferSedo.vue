<template>
  <div class="card p-3 bg-light col-12">
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
import { useDomainStore } from '../../stores/domainStore'

const workspaceMap = {
  Alex: import.meta.env.VITE_WORKSPACE_ALEX,
  Davyd: import.meta.env.VITE_WORKSPACE_DAVYD,
}

const domainStore = useDomainStore()

const adTitles = ref([])
const defaultQueryString = ref('')
const isSubmitting = ref(false)
const results = ref([])
const selectedWorkspace = ref('Alex')

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

const sedoAccountMap = {
  TT1: 'dgtluniontt1',
  TT2: 'dgtluniontt2',
  FB1: 'dgtlunionfb1',
  FB2: 'dgtlunionfb2',
}

const submitOffers = async () => {
  isSubmitting.value = true
  results.value = []

  const offers = domainStore.domains.map((d, i) => ({
    domain: d.name,
    adTitle: adTitles.value[i],
    url: generateOfferUrl(d.name, adTitles.value[i]),
  }))

  for (const offer of offers) {
    try {
      const name = `${offer.domain} - ${
        sedoAccountMap[domainStore.selectedSedoAccount] || domainStore.selectedSedoAccount
      }`

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/clickflare/create-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          url: offer.url,
          workspace_id: workspaceMap[selectedWorkspace.value],
          direct: false,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Не вдалося створити оффер')
      }

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
