<template>
  <!-- Prompt 3 - URL -->
  <div class="mb-4">
    <h5 class="mb-3">URL Prompt</h5>

    <!-- System Prompt и User Prompt Template -->
    <div class="row">
      <div class="col-md-6">
        <label class="form-label fw-bold">System Prompt:</label>
        <input
          class="form-control"
          placeholder="Enter system prompt..."
          v-model="chatGptStore.prompts.url.systemPrompt"
        />
      </div>
      <div class="col-md-6">
        <label class="form-label fw-bold">User Prompt Template:</label>
        <input
          class="form-control"
          placeholder="Enter user prompt template with {url}, {country}, {trafficSource} placeholders..."
          v-model="chatGptStore.prompts.url.userPromptTemplate"
        />
      </div>
    </div>

    <!-- Test Input и Result -->
    <div class="row">
      <div class="col-md-6">
        <label class="form-label fw-bold">Test Input URL:</label>
        <input
          type="text"
          class="form-control mb-2"
          placeholder="Enter URL to test keywords generation..."
          v-model="testUrlInputUrl"
        />
        <label class="form-label fw-bold">Test Result:</label>
        <input
          type="text"
          class="form-control"
          style="background-color: #e8e8e8"
          placeholder="ChatGPT Answer..."
          v-model="chatGptStore.prompts.url.testAnswer"
          readonly
        />
      </div>

      <div class="col-md-6">
        <div>
          <small class="form-text text-muted">
            You can set {url}, {country}, {trafficSource}
          </small>
        </div>
        <label class="form-label fw-bold">Actions:</label>
        <div class="d-flex gap-2 align-items-center">
          <button
            class="btn btn-success btn-sm w-50"
            @click="testUrl"
            :disabled="chatGptStore.prompts.url.isLoading"
          >
            <span
              v-if="chatGptStore.prompts.url.isLoading"
              class="spinner-border spinner-border-sm me-1"
            ></span>
            Test
          </button>
          <button class="btn btn-danger btn-sm w-50" @click="resetUrlFields">Reset fields</button>
          <button class="btn btn-warning btn-sm w-50" @click="setUrlDefaults">Defaults</button>
        </div>
      </div>
    </div>

    <!-- Показываем ошибку если есть -->
    <div v-if="chatGptStore.prompts.url.testError" class="mt-2">
      <div class="alert alert-danger py-2 mb-0">
        <small>{{ chatGptStore.prompts.url.testError }}</small>
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
            v-model="chatGptStore.prompts.url.settings.model"
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
            v-model="chatGptStore.prompts.url.settings.temperature"
          />
        </div>
        <div class="col-md-4">
          <label class="form-label">Max Tokens:</label>
          <input
            type="number"
            min="1"
            max="4000"
            class="form-control form-control-sm"
            v-model="chatGptStore.prompts.url.settings.max_tokens"
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
const testUrlInputUrl = ref('')
// -----------------------------URL Prompt Functions-----------------------------

// Функция тестирования URL промпта
const testUrl = async () => {
  if (chatGptStore.prompts.url.isLoading) return

  chatGptStore.prompts.url.isLoading = true
  chatGptStore.prompts.url.testError = ''
  chatGptStore.prompts.url.testAnswer = ''

  if (!testUrlInputUrl.value.trim()) {
    chatGptStore.prompts.url.testError = 'Input URL is required'
    chatGptStore.prompts.url.isLoading = false
    return
  }

  try {
    console.log('🧪 Тестируем URL промпт...')
    console.log('📤 Отправляем данные:', {
      promptSettings: {
        systemPrompt: chatGptStore.prompts.url.systemPrompt,
        userPromptTemplate: chatGptStore.prompts.url.userPromptTemplate,
        settings: chatGptStore.prompts.url.settings,
      },
    })

    const requestBody = {
      url: testUrlInputUrl.value.trim(),
      promptSettings: {
        systemPrompt: chatGptStore.prompts.url.systemPrompt,
        userPromptTemplate: chatGptStore.prompts.url.userPromptTemplate,
        settings: chatGptStore.prompts.url.settings,
      },
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/chatgpt/generate-keywords-from-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    const result = await response.json()
    console.log('📥 Результат тестирования:', result)

    if (response.ok && result.success && result.data) {
      chatGptStore.prompts.url.testAnswer = result.data.keywords
      console.log('✅ Тест успешен:', result.data.keywords)
    } else {
      throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
    chatGptStore.prompts.url.testError = error.message || 'Ошибка при тестировании промпта'
  } finally {
    chatGptStore.prompts.url.isLoading = false
  }
}

// Функция сброса полей URL к дефолтным значениям
const resetUrlFields = () => {
  chatGptStore.resetUrlFields()
  testUrlInputUrl.value = ''
}

// Функция сброса URL к дефолтным значениям
const setUrlDefaults = () => {
  chatGptStore.prompts.url.systemPrompt =
    'You are an expert SEO and PPC specialist. Generate high-value, expensive keywords based on website URLs and content. Focus on commercial intent keywords that would have high cost-per-click in Google Ads. Always respond with just the keywords separated by commas, no additional text.'
  chatGptStore.prompts.url.userPromptTemplate =
    'Analyze the content and topic of this URL: "{url}" and give me 6 most expensive keywords from Google Keywords Planner based on the website\'s content and niche. Target country: {country}. Traffic source: {trafficSource}. Focus on high commercial intent keywords that would be expensive in Google Ads for this type of website. Return only the keywords separated by commas, without any additional text or explanations.'
  chatGptStore.prompts.url.testAnswer = ''
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
