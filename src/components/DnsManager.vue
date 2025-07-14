<template>
  <div class="card p-3 bg-light" :class="{ 'mt-4': isMobile }">
    <h5><i class="bi bi-globe-americas me-2"></i> Управління DNS</h5>

    <div class="mt-3 mb-2">
      <label class="form-label">Nameserver 1</label>
      <input v-model="nameservers[0]" class="form-control" />
    </div>
    <div class="mb-3">
      <label class="form-label">Nameserver 2</label>
      <input v-model="nameservers[1]" class="form-control" />
    </div>

    <button
      class="btn btn-primary w-100"
      :disabled="loading || domains.length === 0"
      @click="setDnsForAll"
    >
      {{ loading ? 'Збереження...' : 'Зберегти DNS' }}
    </button>

    <ul class="mt-3 list-group" v-if="results.length > 0">
      <li
        v-for="res in results"
        :key="res.domain"
        class="list-group-item d-flex justify-content-between align-items-center"
      >
        {{ res.domain }}
        <span>
          <span :title="!res.success ? res.message : ''">
            <i
              :class="
                res.success ? 'bi bi-check-circle text-success' : 'bi bi-x-circle text-danger'
              "
            ></i>
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDomainStore } from '@/stores/domainStore'
import axios from 'axios'

const domainStore = useDomainStore()
const domains = domainStore.domains

const nameservers = ref(['ns1.sedopark.net', 'ns2.sedopark.net'])
const loading = ref(false)
const results = ref([])

const isMobile = ref(window.innerWidth <= 767)

const handleResize = () => {
  isMobile.value = window.innerWidth <= 767
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

const setDnsForAll = async () => {
  loading.value = true
  results.value = []

  for (const d of domains) {
    try {
      const response = await axios.post('http://localhost:3000/set-dns', {
        domain: d.name,
        nameservers: nameservers.value,
      })

      if (response.data?.success) {
        results.value.push({ domain: d.name, success: true })
      } else {
        results.value.push({
          domain: d.name,
          success: false,
          message: err?.response?.data?.error || err.message || 'Невідома помилка',
        })
      }
    } catch (err) {
      results.value.push({
        domain: d.name,
        success: false,
        message: err?.response?.data?.error || err.message || 'Невідома помилка',
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
