<template>
  <div class="row justify-content-center">
    <div class="col-md-6">
      <div class="card p-4 mt-4 shadow-sm border-1">
        <h5 class="mb-3">
          <i class="bi bi-plus-circle me-2"></i>
          Додати домен до Sedo.com
        </h5>

        <!-- Поле ввода домена -->
        <div class="position-relative mb-3">
          <input
            v-model="sedoDomain"
            @input="clearMessages"
            type="text"
            class="form-control pe-5"
            placeholder="example.com"
          />
          <i
            v-if="sedoDomain"
            class="bi bi-x-circle-fill position-absolute text-secondary"
            style="top: 50%; right: 10px; transform: translateY(-50%); cursor: pointer"
            @click="clearDomain"
          ></i>
        </div>

        <!-- Кнопка отправки -->
        <button @click="addToSedo" class="btn btn-secondary w-100">
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Додати на Sedo
        </button>
        <!-- Сообщение об успехе -->
        <div v-if="sedoSuccess" class="alert alert-success mt-3 mb-0" role="alert">
          {{ sedoSuccess }}
        </div>

        <!-- Сообщение об ошибке -->
        <div v-if="sedoError" class="alert alert-danger mt-3 mb-0" role="alert">
          {{ sedoError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDomainStore } from '@/stores/domainStore'

const domainStore = useDomainStore()

const sedoDomain = computed({
  get: () => domainStore.domain,
  set: (val) => (domainStore.domain = val),
})

const loading = ref(false)
const sedoError = ref('')
const sedoSuccess = ref('')

const clearMessages = () => {
  sedoError.value = ''
  sedoSuccess.value = ''
}

const clearDomain = () => {
  sedoDomain.value = ''
  clearMessages()
}

const addToSedo = async () => {
  const domain = sedoDomain.value.trim().toLowerCase()

  if (!domain) {
    sedoError.value = '❌ Введіть домен'
    sedoSuccess.value = ''
    return
  }

  loading.value = true
  sedoError.value = ''
  sedoSuccess.value = ''

  try {
    const response = await fetch('http://localhost:3000/send-to-sedo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    })

    const data = await response.json()

    const isEmptySedoXMLObject =
      typeof data.error === 'object' && !('_' in data.error) && data.error?.$?.type === 'xsd:string'

    if ((response.ok && data.success) || isEmptySedoXMLObject) {
      sedoSuccess.value = `✅ Домен ${data.domain || domain} успішно додано на Sedo!`
      sedoError.value = ''
      return
    }

    const errorText =
      typeof data.error === 'string'
        ? data.error
        : typeof data.error === 'object' && typeof data.error._ === 'string'
        ? data.error._
        : JSON.stringify(data.error)

    sedoError.value = `❌ ${errorText}`
    sedoSuccess.value = ''
  } catch (err) {
    sedoError.value = '❌ Помилка з’єднання з сервером'
    sedoSuccess.value = ''
  } finally {
    loading.value = false
  }
}
</script>
