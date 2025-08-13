<template>
  <!-- Prompt 1 - AdTitle -->
  <div class="border-bottom pb-4 mb-3">
    <h5 class="mb-3">AdTitle Prompt</h5>

    <!-- System Prompt -->
    <div class="row">
      <div class="col-md-6">
        <label class="form-label fw-bold">System Prompt:</label>
        <input
          class="form-control"
          placeholder="Enter system prompt..."
          v-model="chatGptStore.prompts.adTitle.systemPrompt"
        />
      </div>
      <div class="col-md-6">
        <label class="form-label fw-bold">User Prompt Template:</label>
        <input
          class="form-control"
          placeholder="Enter user prompt template with {offer}, {country}, {trafficSource} placeholders..."
          v-model="chatGptStore.prompts.adTitle.userPromptTemplate"
        />
      </div>
    </div>

    <!-- Test Input и Result -->
    <div class="row">
      <div class="col-md-6">
        <label class="form-label fw-bold">Test Input Words:</label>
        <input
          type="text"
          class="form-control mb-2"
          placeholder="Enter words to test AdTitle generation..."
          v-model="testAdTitleInputWords"
        />
        <label class="form-label fw-bold">Test Result:</label>
        <input
          type="text"
          class="form-control"
          style="background-color: #e8e8e8"
          placeholder="ChatGPT Answer..."
          v-model="chatGptStore.prompts.adTitle.testAnswer"
          readonly
        />
      </div>
      <div class="col-md-6">
        <div>
          <small class="form-text text-muted">
            You can set {offer}, {country}, {trafficSource}
          </small>
        </div>
        <label class="form-label fw-bold">Actions:</label>
        <div class="d-flex gap-2 align-items-center">
          <button
            class="btn btn-success btn-sm w-50"
            @click="testAdTitle"
            :disabled="chatGptStore.prompts.adTitle.isLoading"
          >
            <span
              v-if="chatGptStore.prompts.adTitle.isLoading"
              class="spinner-border spinner-border-sm me-1"
            ></span>
            Test
          </button>
          <button class="btn btn-danger btn-sm w-50" @click="resetAdtitleFields">
            Reset fields
          </button>
          <button class="btn btn-warning btn-sm w-50" @click="setDefaults">Previous prompt</button>
        </div>
      </div>
    </div>

    <!-- Показываем ошибку если есть -->
    <div v-if="chatGptStore.prompts.adTitle.testError" class="mt-2">
      <div class="alert alert-danger py-2 mb-0">
        <small>{{ chatGptStore.prompts.adTitle.testError }}</small>
      </div>
    </div>

    <!-- Показываем настройки модели -->
    <div class="mt-3">
      <h6>Model Settings:</h6>
      <div class="row">
        <div class="col-md-4">
          <label class="form-label">Model:</label>
          <input
            type="text"
            class="form-control form-control-sm"
            v-model="chatGptStore.prompts.adTitle.settings.model"
          />
        </div>
        <div class="col-md-4">
          <label class="form-label">Temperature:</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="2"
            class="form-control form-control-sm"
            v-model="chatGptStore.prompts.adTitle.settings.temperature"
          />
        </div>
        <div class="col-md-4">
          <label class="form-label">Max Tokens:</label>
          <input
            type="number"
            min="1"
            max="4000"
            class="form-control form-control-sm"
            v-model="chatGptStore.prompts.adTitle.settings.max_tokens"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChatGptStore } from '../../stores/chatGptStore'

const chatGptStore = useChatGptStore()
const testAdTitleInputWords = ref('')
// -----------------------------AdTitle Prompt Функції-----------------------------

// Функція тестування AdTitle промпту
const testAdTitle = async () => {
  if (chatGptStore.prompts.adTitle.isLoading) return

  chatGptStore.prompts.adTitle.isLoading = true
  chatGptStore.prompts.adTitle.testError = ''
  chatGptStore.prompts.adTitle.testAnswer = ''

  if (!testAdTitleInputWords.value.trim()) {
    chatGptStore.prompts.adTitle.testError = 'Input words are required'
    chatGptStore.prompts.adTitle.isLoading = false
    return
  }

  try {
    console.log('🧪 Тестируем AdTitle промпт...')
    console.log('📤 Отправляем данные:', {
      promptSettings: {
        systemPrompt: chatGptStore.prompts.adTitle.systemPrompt,
        userPromptTemplate: chatGptStore.prompts.adTitle.userPromptTemplate,
        settings: chatGptStore.prompts.adTitle.settings,
      },
    })

    const requestBody = {
      offer: testAdTitleInputWords.value.trim(), // передаємо введені слова як offer
      promptSettings: {
        systemPrompt: chatGptStore.prompts.adTitle.systemPrompt,
        userPromptTemplate: chatGptStore.prompts.adTitle.userPromptTemplate,
        settings: chatGptStore.prompts.adTitle.settings,
      },
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chatgpt/generate-adtitle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const result = await response.json()
    console.log('📥 Результат тестирования:', result)

    if (response.ok && result.success && result.data) {
      chatGptStore.prompts.adTitle.testAnswer = result.data.originalTitle
      console.log('✅ Тест успешен:', result.data.originalTitle)
    } else {
      throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
    chatGptStore.prompts.adTitle.testError = error.message || 'Ошибка при тестировании промпта'
  } finally {
    chatGptStore.prompts.adTitle.isLoading = false
  }
}

// Функція скидання полів до значень за замовчуванням
const resetAdtitleFields = () => {
  chatGptStore.resetAdTitleFields()
  testAdTitleInputWords.value = ''
}

// Функція скидання до значень за замовчуванням
const setDefaults = () => {
  chatGptStore.prompts.adTitle.systemPrompt =
    'You are a expert marketing copywriter. Generate compelling, short ad titles that grab attention and drive clicks. Always respond with just the title, no quotes or additional text.'
  chatGptStore.prompts.adTitle.userPromptTemplate =
    'Generate a headline / ad title for social media ad on topic "{offer}" for {country} audience on {trafficSource} platform. Maximum 50 characters. Return only the title without quotes or extra text.'
  chatGptStore.prompts.adTitle.testAnswer = ''
}
</script>

<style scoped>
.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
}

.form-label {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}
</style>
