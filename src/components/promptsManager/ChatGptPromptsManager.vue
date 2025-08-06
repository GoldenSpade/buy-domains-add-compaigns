<template>
  <div class="card p-4 bg-light">
    <!-- Prompt 1 - AdTitle -->
    <div class="mb-4">
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
            placeholder="ChatGPT Answer..."
            v-model="chatGptStore.prompts.adTitle.testAnswer"
            readonly
          />
        </div>
        <div class="col-md-6">
          <div>
            <small class="form-text text-muted">
              You can set {inputWords}, {country}, {trafficSource}
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
            <button class="btn btn-warning btn-sm w-50" @click="setDefaults">Defaults</button>
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

    <hr class="my-4" />

    <!-- Prompt 2 - Keywords -->
    <div class="mb-4">
      <h5 class="mb-3">Keywords Prompt</h5>

      <!-- System Prompt и User Prompt Template -->
      <div class="row">
        <div class="col-md-6">
          <label class="form-label fw-bold">System Prompt:</label>
          <input
            class="form-control"
            placeholder="Enter system prompt..."
            v-model="chatGptStore.prompts.keywords.systemPrompt"
          />
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">User Prompt Template:</label>
          <input
            class="form-control"
            placeholder="Enter user prompt template with {inputWords}, {country}, {trafficSource} placeholders..."
            v-model="chatGptStore.prompts.keywords.userPromptTemplate"
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
            placeholder="Enter words to test keywords generation..."
            v-model="testKeywordsInputWords"
          />
          <label class="form-label fw-bold">Test Result:</label>
          <input
            type="text"
            class="form-control"
            placeholder="ChatGPT Answer..."
            v-model="chatGptStore.prompts.keywords.testAnswer"
            readonly
          />
        </div>

        <div class="col-md-6">
          <div>
            <small class="form-text text-muted">
              You can set {inputWords}, {country}, {trafficSource}
            </small>
          </div>
          <label class="form-label fw-bold">Actions:</label>
          <div class="d-flex gap-2 align-items-center">
            <button
              class="btn btn-success btn-sm w-50"
              @click="testKeywords"
              :disabled="chatGptStore.prompts.keywords.isLoading"
            >
              <span
                v-if="chatGptStore.prompts.keywords.isLoading"
                class="spinner-border spinner-border-sm me-1"
              ></span>
              Test
            </button>
            <button class="btn btn-danger btn-sm w-50" @click="resetKeywordsFields">
              Reset fields
            </button>
            <button class="btn btn-warning btn-sm w-50" @click="setKeywordsDefaults">
              Defaults
            </button>
          </div>
        </div>
      </div>

      <!-- Показываем ошибку если есть -->
      <div v-if="chatGptStore.prompts.keywords.testError" class="mt-2">
        <div class="alert alert-danger py-2 mb-0">
          <small>{{ chatGptStore.prompts.keywords.testError }}</small>
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
              v-model="chatGptStore.prompts.keywords.settings.model"
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
              v-model="chatGptStore.prompts.keywords.settings.temperature"
            />
          </div>
          <div class="col-md-4">
            <label class="form-label">Max Tokens:</label>
            <input
              type="number"
              min="1"
              max="4000"
              class="form-control form-control-sm"
              v-model="chatGptStore.prompts.keywords.settings.max_tokens"
            />
          </div>
        </div>
      </div>
    </div>

    <hr class="my-4" />

    <!-- Prompt 3 - URL (пока без функциональности) -->
    <div class="mb-4">
      <h5 class="mb-3">URL Prompt</h5>
      <div class="row">
        <div class="col-md-6">
          <input class="form-control" placeholder="Enter your URL Prompt" />
        </div>
        <div class="col-md-6">
          <div class="d-flex gap-2 align-items-center">
            <input type="text" class="form-control" placeholder="ChatGPT Answer..." />
            <button
              class="btn btn-outline-success btn-sm fs-6"
              style="min-width: 60px; min-height: 38px"
            >
              Test
            </button>
            <button
              class="btn btn-outline-success btn-sm fs-6"
              style="min-width: 60px; min-height: 38px"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Clear LocalStorage Button -->
    <div class="text-center mt-4">
      <button
        class="btn btn-outline-danger px-4 py-2"
        style="min-width: 180px"
        @click="clearLocalStorage"
      >
        <i class="bi bi-trash"></i>
        Clear Cache
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChatGptStore } from '../../stores/chatGptStore'

const testKeywordsInputWords = ref('')
const testAdTitleInputWords = ref('')
const chatGptStore = useChatGptStore()

// -----------------------------AdTitle Prompt Functions-----------------------------

// Функция тестирования AdTitle промпта
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
      offer: testAdTitleInputWords.value.trim(), // передаем введенные слова как offer
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

// Функция сброса полей к дефолтным значениям
const resetAdtitleFields = () => {
  chatGptStore.resetAdTitleFields()
  testAdTitleInputWords.value = ''
}

// Функция сброса к дефолтным значениям
const setDefaults = () => {
  chatGptStore.prompts.adTitle.systemPrompt =
    'You are a expert marketing copywriter. Generate compelling, short ad titles that grab attention and drive clicks. Always respond with just the title, no quotes or additional text.'
  chatGptStore.prompts.adTitle.userPromptTemplate =
    'Generate a headline / ad title for social media ad on topic "{offer}" for {country} audience on {trafficSource} platform. Maximum 50 characters. Return only the title without quotes or extra text.'
  chatGptStore.prompts.adTitle.testAnswer = ''
}

// -----------------------------Keywords Prompt Functions-----------------------------

// Функция тестирования Keywords промпта
const testKeywords = async () => {
  if (chatGptStore.prompts.keywords.isLoading) return

  chatGptStore.prompts.keywords.isLoading = true
  chatGptStore.prompts.keywords.testError = ''
  chatGptStore.prompts.keywords.testAnswer = ''

  if (!testKeywordsInputWords.value.trim()) {
    chatGptStore.prompts.keywords.testError = 'Input words are required'
    chatGptStore.prompts.keywords.isLoading = false
    return
  }

  try {
    console.log('🧪 Тестируем Keywords промпт...')
    console.log('📤 Отправляем данные:', {
      promptSettings: {
        systemPrompt: chatGptStore.prompts.keywords.systemPrompt,
        userPromptTemplate: chatGptStore.prompts.keywords.userPromptTemplate,
        settings: chatGptStore.prompts.keywords.settings,
      },
    })

    const requestBody = {
      inputWords: testKeywordsInputWords.value.trim(),
      promptSettings: {
        systemPrompt: chatGptStore.prompts.keywords.systemPrompt,
        userPromptTemplate: chatGptStore.prompts.keywords.userPromptTemplate,
        settings: chatGptStore.prompts.keywords.settings,
      },
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/chatgpt/generate-keywords-from-words`,
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
      chatGptStore.prompts.keywords.testAnswer = result.data.keywords
      console.log('✅ Тест успешен:', result.data.keywords)
    } else {
      throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
    chatGptStore.prompts.keywords.testError = error.message || 'Ошибка при тестировании промпта'
  } finally {
    chatGptStore.prompts.keywords.isLoading = false
  }
}

// Функция сброса полей Keywords к дефолтным значениям
const resetKeywordsFields = () => {
  chatGptStore.resetKeywordsFields()
  testKeywordsInputWords.value = ''
}

// Функция сброса Keywords к дефолтным значениям
const setKeywordsDefaults = () => {
  chatGptStore.prompts.keywords.systemPrompt =
    'You are an expert SEO and PPC specialist. Generate high-value, expensive keywords that would have high cost-per-click in Google Ads. Focus on commercial intent keywords. Always respond with just the keywords separated by commas, no additional text.'
  chatGptStore.prompts.keywords.userPromptTemplate =
    'Give me 6 most expensive keywords from Google Keywords Planner related to: "{inputWords}". Target country: {country}. Traffic source: {trafficSource}. Return only the keywords separated by commas, without any additional text or explanations.'
  chatGptStore.prompts.keywords.testAnswer = ''
}

// Функция очистки localStorage
const clearLocalStorage = () => {
  if (confirm('Вы уверены, что хотите очистить все промпты? Это действие нельзя отменить.')) {
    chatGptStore.clearLocalStorage()
    // Сбрасываем все поля к пустым значениям
    chatGptStore.prompts.adTitle.testAnswer = ''
    chatGptStore.prompts.adTitle.testError = ''
    chatGptStore.prompts.keywords.testAnswer = ''
    chatGptStore.prompts.keywords.testError = ''
    console.log('🗑️ LocalStorage очищен пользователем')
  }
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
