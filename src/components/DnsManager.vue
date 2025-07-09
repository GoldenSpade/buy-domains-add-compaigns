<template>
  <div class="row justify-content-center">
    <div class="col-md-6">
      <div class="card p-4 mt-3">
        <h5 class="mb-3">
          <i class="bi bi-wrench-adjustable-circle me-2"></i>
          Управління DNS
        </h5>

        <div class="mb-3">
          <label class="form-label">Домен</label>
          <input v-model="dnsDomain" type="text" class="form-control" placeholder="example.com" />
        </div>

        <div class="mb-3">
          <label class="form-label">Nameserver 1</label>
          <input v-model="ns1" type="text" class="form-control" placeholder="ns1.example.net" />
        </div>

        <div class="mb-3">
          <label class="form-label">Nameserver 2</label>
          <input v-model="ns2" type="text" class="form-control" placeholder="ns2.example.net" />
        </div>

        <button @click="setDNS" class="btn btn-secondary w-100" :disabled="loading">
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Зберегти DNS
        </button>

        <div
          v-if="resultMessage"
          :class="['alert mt-3', resultSuccess ? 'alert-success' : 'alert-danger']"
        >
          {{ resultMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDomainStore } from '@/stores/domainStore'

const domainStore = useDomainStore()

// Автоматически подставляем текущий домен из стора
const dnsDomain = computed({
  get: () => domainStore.domain,
  set: (val) => (domainStore.domain = val),
})

const ns1 = ref('ns1.sedopark.net')
const ns2 = ref('ns2.sedopark.net')

const loading = ref(false)
const resultMessage = ref('')
const resultSuccess = ref(false)

const setDNS = async () => {
  if (!dnsDomain.value.trim() || !ns1.value.trim() || !ns2.value.trim()) {
    resultMessage.value = '❌ Заповніть всі поля'
    resultSuccess.value = false
    return
  }

  loading.value = true
  resultMessage.value = ''

  try {
    const response = await fetch('http://localhost:3000/set-dns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: dnsDomain.value.trim(),
        nameservers: [ns1.value.trim(), ns2.value.trim()],
      }),
    })

    const data = await response.json()

    resultSuccess.value = response.ok
    resultMessage.value = response.ok
      ? '✅ DNS оновлено успішно'
      : `❌ ${data.error || 'Помилка сервера'}`
  } catch (err) {
    resultMessage.value = '❌ Помилка з’єднання з сервером'
    resultSuccess.value = false
  } finally {
    loading.value = false
  }
}
</script>
