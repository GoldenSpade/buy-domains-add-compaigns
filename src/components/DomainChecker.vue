<template>
  <div>
    <!-- 🔍 Форма перевірки -->
    <form
      @submit.prevent="checkDomain"
      class="domain-checker row my-0 justify-content-center align-items-center"
    >
      <!-- Інпут -->
      <div class="col position-relative">
        <input
          v-model="domain"
          type="text"
          class="form-control pe-5"
          placeholder="Введіть домен (наприклад, example.com)"
          required
        />
        <i
          v-if="domain"
          class="bi bi-x-circle-fill position-absolute text-secondary"
          style="top: 50%; right: 20px; transform: translateY(-50%); cursor: pointer"
          @click="domain = ''"
        ></i>
      </div>

      <!-- Кнопки -->
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
          @click="addToList"
          class="btn btn-success ms-2"
          :disabled="adding"
        >
          <span
            v-if="adding"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Додати домен
        </button>
      </div>

      <!-- Alerts -->
      <div class="col-12 mt-3">
        <div v-if="statusMessage" :class="['alert', statusClass, 'mb-2']">
          {{ statusMessage }}
        </div>

        <div v-if="serverError" class="alert alert-danger mb-0" role="alert">
          ⚠️ {{ serverError }}
        </div>
      </div>
    </form>

    <!-- 📄 Блок з доданими доменами -->
    <div v-if="domainStore.domains.length" class="border rounded p-3 bg-light">
      <h5 class="mb-3">📋 Додані домени:</h5>
      <ul class="list-group mb-3 bg-light">
        <li v-for="d in domainStore.domains" :key="d.name" class="list-group-item">
          <div class="d-flex justify-content-between align-items-center">
            <span class="me-2">{{ d.name }}</span>
            <button class="btn btn-sm btn-outline-danger" @click="domainStore.removeDomain(d.name)">
              <i class="bi bi-trash"></i>
            </button>
          </div>

          <div class="mt-1 d-flex align-items-center gap-2">
            <i
              v-if="d.status === 'success'"
              class="bi bi-check-circle text-success"
              title="Успішно куплено"
            ></i>
            <i
              v-else-if="d.status === 'error'"
              class="bi bi-x-circle text-danger"
              :title="d.message"
            ></i>
            <small
              :class="{
                'text-muted': d.status === 'pending',
                'text-success': d.status === 'success',
                'text-danger': d.status === 'error',
              }"
            >
              {{ d.message }}
            </small>
          </div>
        </li>
      </ul>

      <button class="btn btn-primary w-100" @click="buyAll" :disabled="buyingAll">
        <span
          v-if="buyingAll"
          class="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        ></span>
        Купити домени
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDomainStore } from '@/stores/domainStore'

const domainStore = useDomainStore()

const domain = ref('')
const status = ref('')
const checking = ref(false)
const adding = ref(false)
const buyingAll = ref(false)
const serverError = ref('')

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
    status.value = 'error'
    serverError.value = 'Помилка з’єднання з сервером'
  } finally {
    checking.value = false
  }
}

const addToList = () => {
  if (!domain.value.trim()) return
  adding.value = true

  setTimeout(() => {
    domainStore.addDomain(domain.value.trim())
    domain.value = ''
    status.value = ''
    adding.value = false
  }, 300) // лёгкая задержка для визуальной плавности
}

const buyAll = async () => {
  if (!domainStore.domains.length) return
  const confirmed = window.confirm('Ви впевнені, що хочете купити всі домени?')
  if (!confirmed) return

  buyingAll.value = true

  for (const d of domainStore.domains) {
    d.status = 'pending'
    d.message = ''

    try {
      const response = await fetch('http://localhost:3000/buy-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d.name }),
      })

      const data = await response.json()

      if (response.ok) {
        d.status = 'success'
        d.message = 'Куплено'
      } else {
        d.status = 'error'
        d.message = `${data.error || 'Помилка купівлі'}`
      }
    } catch (err) {
      d.status = 'error'
      d.message = 'Помилка з’єднання'
    }
  }

  buyingAll.value = false
}
</script>
