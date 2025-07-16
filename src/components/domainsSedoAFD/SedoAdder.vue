<template>
  <div class="card p-3 mt-3 bg-light">
    <h5><i class="bi bi-plus-circle me-2"></i> Додати домени до Sedo.com</h5>

    <div class="form-group mt-2">
      <label for="sedoAccount">Обрати акаунт Sedo</label>
      <select id="sedoAccount" v-model="domainStore.selectedSedoAccount" class="form-select">
        <option value="TT1">dgtluniontt1</option>
        <option value="TT2">dgtluniontt2</option>
        <option value="FB1">dgtlunionfb1</option>
        <option value="FB2">dgtlunionfb2</option>
      </select>
    </div>

    <button
      class="btn btn-primary w-100 my-3"
      :disabled="loading || domains.length === 0"
      @click="submitAll"
    >
      {{ loading ? 'Відправка...' : 'Додати на Sedo' }}
    </button>

    <ul class="list-group mt-2" v-if="results.length > 0">
      <li
        v-for="item in results"
        :key="item.domain"
        class="list-group-item d-flex justify-content-between align-items-center"
      >
        {{ item.domain }}
        <span :title="item.message">
          <i
            :class="item.success ? 'bi bi-check-circle text-success' : 'bi bi-x-circle text-danger'"
          ></i>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { useDomainStore } from '@/stores/domainStore'

const domainStore = useDomainStore()
const { domains } = domainStore

const loading = ref(false)
const results = ref([])

// восстановление значения при загрузке
const savedAccount = localStorage.getItem('selectedSedoAccount')
if (savedAccount) {
  domainStore.selectedSedoAccount = savedAccount
}

// сохранение при изменении
watch(
  () => domainStore.selectedSedoAccount,
  (val) => {
    localStorage.setItem('selectedSedoAccount', val)
  },
  { immediate: true }
)

const submitAll = async () => {
  loading.value = true
  results.value = []

  for (const d of domains) {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/send-to-sedo`, {
        domain: d.name.trim(),
        accountKey: domainStore.selectedSedoAccount,
      })

      const { error = {}, info = '' } = res.data || {}

      const isObjectError = typeof error === 'object' && error !== null
      const errorKeys = Object.keys(error)
      const isTrulySuccess = isObjectError && errorKeys.length === 1 && errorKeys[0] === '$'

      const message = isTrulySuccess ? info || '' : error._ || error || 'Невідома помилка'

      results.value.push({
        domain: d.name,
        success: isTrulySuccess,
        message,
      })
    } catch (err) {
      results.value.push({
        domain: d.name,
        success: false,
        message: err?.response?.data?.error || err.message || 'Помилка при відправці',
      })
    }
  }

  loading.value = false
}
</script>

<style scoped>
.list-group-item {
  border-top: 1px !important;
}
</style>
