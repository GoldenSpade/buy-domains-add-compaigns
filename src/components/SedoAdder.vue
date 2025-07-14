<template>
  <div class="card p-3 mt-3 bg-light">
    <h5><i class="bi bi-plus-circle me-2"></i> Додати домени до Sedo.com</h5>

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
import { ref } from 'vue'
import axios from 'axios'
import { useDomainStore } from '@/stores/domainStore'

const { domains } = useDomainStore()

const loading = ref(false)
const results = ref([])

const submitAll = async () => {
  loading.value = true
  results.value = []

  for (const d of domains) {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/send-to-sedo`, {
        domain: d.name.trim(),
      })

      const { error = {}, info = '' } = res.data || {}

      const isObjectError = typeof error === 'object' && error !== null
      const errorKeys = Object.keys(error)
      const isTrulySuccess = isObjectError && errorKeys.length === 1 && errorKeys[0] === '$'

      const message = isTrulySuccess
        ? info || '' // Всё хорошо
        : error._ || error || 'Невідома помилка'

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

function extractMessage(msg) {
  if (typeof msg === 'string') return msg
  if (msg && typeof msg === 'object' && '_' in msg) return msg._
  return 'Невідома помилка'
}
</script>

<style scoped>
.list-group-item {
  border-top: 1px !important;
}
</style>
