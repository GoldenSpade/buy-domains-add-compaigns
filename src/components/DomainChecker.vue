<template>
  <div class="row justify-content-center">
    <div class="col-md-6">
      <form
        @submit.prevent="checkDomain"
        class="domain-checker row g-2 mt-3 justify-content-center"
      >
        <div class="col">
          <input
            v-model="domain"
            type="text"
            class="form-control"
            placeholder="Введіть домен (наприклад, example.com)"
            required
          />
        </div>
        <div class="col-auto">
          <button type="submit" class="btn btn-primary" :disabled="checking">
            <span
              v-if="checking"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Перевірити
          </button>

          <button
            v-if="status === 'available'"
            @click="buyDomain"
            class="btn btn-success ms-2"
            :disabled="buying"
          >
            <span
              v-if="buying"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Купити домен
          </button>
        </div>

        <div class="col-12 mt-3 mb-0" v-if="purchaseMessage">
          <div :class="['alert', purchaseSuccess ? 'alert-success' : 'alert-danger', 'mb-0']">
            {{ purchaseMessage }}
          </div>
        </div>

        <div class="col-12 mt-3 my-0 mb-0" v-if="statusMessage">
          <div :class="['alert', statusClass, 'mb-0']" role="alert">
            {{ statusMessage }}
          </div>
        </div>

        <div class="col-12 mt-2" v-if="serverError">
          <div class="alert alert-danger" role="alert">⚠️ {{ serverError }}</div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDomainStore } from '@/stores/domainStore'

const domainStore = useDomainStore()

// Глобальная ссылка на домен
const domain = computed({
  get: () => domainStore.domain,
  set: (val) => (domainStore.domain = val),
})

const status = ref('')
const checking = ref(false)
const buying = ref(false)
const serverError = ref('')

const purchaseMessage = ref('')
const purchaseSuccess = ref(false)

const checkDomain = async () => {
  if (!domain.value.trim()) return

  checking.value = true
  status.value = ''
  serverError.value = ''

  try {
    const response = await fetch('http://localhost:3000/check-domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domain.value }),
    })

    const data = await response.json()
    status.value = response.ok && data.available ? 'available' : 'taken'

    if (!response.ok) {
      serverError.value = data.error || 'Невідома помилка з сервера'
    }
  } catch (err) {
    console.error('❌ Помилка перевірки домену:', err)
    status.value = 'error'
    serverError.value = 'Помилка з’єднання з сервером'
  } finally {
    checking.value = false
  }
}

const buyDomain = async () => {
  if (!domain.value.trim()) return

  checking.value = true
  purchaseMessage.value = ''
  status.value = ''

  try {
    const response = await fetch('http://localhost:3000/buy-domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domain.value }),
    })

    const data = await response.json()

    if (response.ok) {
      purchaseSuccess.value = true
      purchaseMessage.value = '✅ Домен успішно куплено!'
      domainStore.domain = domain.value // записать в хранилище
    } else {
      purchaseSuccess.value = false
      purchaseMessage.value = `❌ ${data.error || 'Помилка під час купівлі'}`
    }
  } catch (err) {
    purchaseSuccess.value = false
    purchaseMessage.value = '❌ Помилка з’єднання з сервером'
  } finally {
    checking.value = false
  }
}

const statusMessage = computed(() => {
  switch (status.value) {
    case 'available':
      return '✅ Домен доступний!'
    case 'taken':
      return '❌ Домен вже зайнятий'
    case 'error':
      return '⚠️ Сталася помилка при перевірці або покупці'
    default:
      return ''
  }
})

const statusClass = computed(() => {
  switch (status.value) {
    case 'available':
      return 'alert-success'
    case 'taken':
      return 'alert-danger'
    case 'error':
      return 'alert-warning'
    default:
      return ''
  }
})
</script>
