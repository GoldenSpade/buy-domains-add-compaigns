<template>
  <div>
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
            style="background-color: #e8e8e8"
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChatGptStore } from '../../stores/chatGptStore'

const chatGptStore = useChatGptStore()
const testKeywordsInputWords = ref('')

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
