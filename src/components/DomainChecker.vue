<template>
  <form @submit.prevent="checkDomain" class="domain-checker row justify-content-center">
    <div class="col-md-6 mt-3">
      <!-- Поле ввода + кнопка -->
      <div class="input-group mb-3">
        <input
          v-model="domain"
          type="text"
          class="form-control"
          placeholder="Введіть домен (наприклад, example.com)"
          required
        />
        <button type="submit" class="btn btn-primary" :disabled="checking">
          <span
            v-if="checking"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          {{ checking ? 'Перевірка…' : 'Перевірити' }}
        </button>

        <button
          @click="buyDomain"
          class="btn btn-success"
          :disabled="buying"
          v-if="status === 'available'"
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

      <!-- Сообщение о статусе -->
      <div v-if="statusMessage">
        <div :class="['alert d-flex align-items-center gap-2', statusClass]" role="alert">
          <span v-if="status === 'available' || status === 'taken'"></span>
          <span>{{ statusMessage }}</span>
        </div>
      </div>

      <!-- Кнопка покупки -->
      <div class="text-center" v-if="status === 'available'"></div>

      <!-- Серверная ошибка -->
      <div class="mt-3" v-if="serverError">
        <div class="alert alert-danger d-flex align-items-center gap-2" role="alert">
          ❌ <span>{{ serverError }}</span>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'

const domain = ref('')
const status = ref('')
const checking = ref(false)
const buying = ref(false)
const serverError = ref('')

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

    if (response.ok) {
      status.value = data.available ? 'available' : 'taken'
    } else {
      status.value = 'error'
      serverError.value = data.error || 'Невідома помилка з сервера'
    }
  } catch (err) {
    console.error('❌ Помилка при перевірці:', err)
    status.value = 'error'
    serverError.value = 'Помилка з’єднання з сервером'
  } finally {
    checking.value = false
  }
}

const buyDomain = async () => {
  buying.value = true
  serverError.value = ''
  
  try {
    const response = await fetch('http://localhost:3000/buy-domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domain.value }),
    })

    const data = await response.json()

    if (response.ok && data.success) {
      alert(data.test
        ? `🧪 Тестова покупка виконана: ${data.domain}`
        : `✅ Домен ${data.domain} куплено успішно!`
      )
    } else {
      serverError.value = data.error || 'Помилка під час покупки'
    }
  } catch (err) {
    console.error('❌ buyDomain error:', err)
    serverError.value = 'Помилка з’єднання з сервером'
  } finally {
    buying.value = false
  }
}


const statusMessage = computed(() => {
  switch (status.value) {
    case 'available':
      return '✅ Домен доступний!'
    case 'taken':
      return '❌ Домен вже зайнятий'
    case 'error':
      return '⚠️ Сталася помилка при перевірці'
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
