<template>
  <div class="card p-4 bg-light">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">
        <i class="bi bi-check-circle me-2"></i>
        Завершені кампанії
      </h4>
      <button
        v-if="completedCards.length > 0"
        @click="clearAllCompleted"
        class="btn btn-outline-danger btn-sm"
        title="Очистити всі завершені кампанії"
      >
        <i class="bi bi-trash"></i>
        Очистити всі
      </button>
    </div>

    <div v-if="completedCards.length === 0" class="text-center text-muted py-4">
      <i class="bi bi-inbox" style="font-size: 2rem"></i>
      <p class="mt-2 mb-0">Немає завершених кампаній</p>
    </div>

    <div v-else class="d-flex flex-column gap-3">
      <div
        v-for="(card, index) in completedCards"
        :key="index"
        class="position-relative border rounded bg-white p-3 shadow-sm"
      >
        <i
          class="bi bi-x-lg position-absolute top-0 end-0 m-2 text-secondary"
          role="button"
          title="Видалити картку"
          @click="removeCard(card)"
        ></i>

        <label class="form-label fw-bold mb-2">Campaign name</label>
        <div class="form-control-plaintext bg-light p-2 rounded border" style="font-size: 14px">
          {{ card.adTitle }}
        </div>

        <div class="alert alert-success mt-2 mb-2 d-flex align-items-center gap-2 p-2 small">
          <i class="bi bi-check-circle-fill text-success"></i>
          Кампанія вже створена.
        </div>

        <!-- 🔗 ID и статус -->
        <div class="mt-1 small">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              🆔 {{ card.resId }}

              <div class="small d-flex align-items-center">
                <span
                  class="badge ms-1"
                  :class="{
                    'bg-success': card.status === 'active',
                    'bg-warning text-dark': card.status === 'paused' || card.status === 'pending',
                    'bg-secondary': card.status === 'inactive',
                    'bg-danger': card.status === 'error' || card.status === 'unknown',
                    'bg-info': !card.status || card.status === '' || card.status === 'loading',
                  }"
                >
                  {{ card.status || 'завантаження...' }}
                </span>
              </div>
            </div>

            <!-- Бейдж Keywords справа со стрелочкой -->
            <span
              @click="card.showKeywords = !card.showKeywords"
              class="badge bg-success"
              style="cursor: pointer; font-size: 10px"
              title="Показати/приховати ключові слова"
            >
              Keywords
              <i
                class="bi ms-1"
                :class="card.showKeywords ? 'bi-chevron-up' : 'bi-chevron-down'"
              ></i>
            </span>
          </div>

          <!-- ✨ БЛОК KEYWORDS - перенесен сюда -->
          <div v-if="card.showKeywords" class="mt-2 pt-2 border-top">
            <label class="form-label fw-bold mb-2 small">Ключові слова</label>
            <div class="d-flex gap-2 align-items-center">
              <!-- Чекбокс-переключатель для режима -->
              <div class="form-check form-switch d-flex align-items-center">
                <input
                  :checked="card.keywordsMode === 'url'"
                  @change="card.keywordsMode = $event.target.checked ? 'url' : 'inputWords'"
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  style="cursor: pointer"
                />
              </div>

              <!-- Инпут для режима "inputWords" (manual words) -->
              <div v-if="card.keywordsMode === 'inputWords'" class="flex-grow-1">
                <div class="input-group input-group-sm">
                  <input
                    v-model="card.keywordsFromInputWords"
                    type="text"
                    class="form-control"
                    placeholder="Введіть слова для генерації"
                    style="font-size: 14px; padding-right: 30px"
                  />
                  <!-- Хрестик для очищення -->
                  <button
                    v-if="card.keywordsFromInputWords && card.keywordsFromInputWords.trim()"
                    @click="clearKeywordsInput(card, 'inputWords')"
                    class="btn btn-sm position-absolute"
                    type="button"
                    style="
                      right: 65px;
                      top: 50%;
                      transform: translateY(-50%);
                      z-index: 10;
                      border: none;
                      background: none;
                      color: #6c757d;
                      font-size: 14px;
                      padding: 2px 4px;
                    "
                    title="Очистити поле"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                  <button
                    @click="generateKeywordsFromWords(card)"
                    :disabled="card.isGeneratingKeywords || !card.keywordsFromInputWords?.trim()"
                    class="btn btn-outline-primary"
                    type="button"
                    title="Генерувати по словах"
                  >
                    <i v-if="card.isGeneratingKeywords" class="bi bi-arrow-repeat spin"></i>
                    <i v-else class="bi bi-magic"></i>
                  </button>
                  <button
                    @click="confirmKeywords(card)"
                    :disabled="card.isConfirmingKeywords || !card.generatedKeywords"
                    class="btn btn-outline-success"
                    type="button"
                    title="Підтвердити ключові слова"
                  >
                    <i v-if="card.isConfirmingKeywords" class="bi bi-arrow-repeat spin"></i>
                    <i v-else class="bi bi-check-lg"></i>
                  </button>
                </div>
              </div>

              <!-- Инпут для режима "url" -->
              <div v-else class="flex-grow-1">
                <div class="input-group input-group-sm">
                  <input
                    v-model="card.keywordsFromUrl"
                    type="text"
                    class="form-control"
                    placeholder="Введіть URL для генерації"
                    style="font-size: 14px; padding-right: 30px"
                  />
                  <!-- Хрестик для очищення URL -->
                  <button
                    v-if="card.keywordsFromUrl && card.keywordsFromUrl.trim()"
                    @click="clearKeywordsInput(card, 'url')"
                    class="btn btn-sm position-absolute"
                    type="button"
                    style="
                      right: 65px;
                      top: 50%;
                      transform: translateY(-50%);
                      z-index: 10;
                      border: none;
                      background: none;
                      color: #6c757d;
                      font-size: 14px;
                      padding: 2px 4px;
                    "
                    title="Очистити поле"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                  <button
                    @click="generateKeywordsFromUrl(card)"
                    :disabled="card.isGeneratingKeywords || !card.keywordsFromUrl?.trim()"
                    class="btn btn-outline-primary"
                    type="button"
                    title="Генерувати по URL"
                  >
                    <i v-if="card.isGeneratingKeywords" class="bi bi-arrow-repeat spin"></i>
                    <i v-else class="bi bi-link-45deg"></i>
                  </button>
                  <button
                    @click="confirmKeywords(card)"
                    :disabled="card.isConfirmingKeywords || !card.generatedKeywordsFromUrl"
                    class="btn btn-outline-success"
                    type="button"
                    title="Підтвердити ключові слова"
                  >
                    <i v-if="card.isConfirmingKeywords" class="bi bi-arrow-repeat spin"></i>
                    <i v-else class="bi bi-check-lg"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Блок для отображения сгенерированных ключевых слов -->
            <div
              v-if="
                card.keywordsMode === 'inputWords' &&
                (card.generatedKeywords || card.keywordsInputWordsError)
              "
              class="mt-2"
            >
              <!-- Успешно сгенерированные ключевые слова -->
              <div v-if="card.generatedKeywords" class="bg-success bg-opacity-10 p-2 rounded">
                <div class="small fw-bold text-success mb-1">
                  <i class="bi bi-check-circle me-1"></i>
                  Згенеровані ключові слова:
                </div>
                <div class="small" style="font-size: 12px; line-height: 1.4">
                  {{ card.generatedKeywords }}
                </div>
              </div>

              <!-- Ошибка генерации -->
              <div
                v-if="card.keywordsInputWordsError"
                class="bg-danger bg-opacity-10 p-2 rounded text-danger"
              >
                <i class="bi bi-exclamation-triangle me-1"></i>
                <span class="fw-bold small">Помилка генерації:</span>
                <span class="small">{{ card.keywordsInputWordsError }}</span>
              </div>
            </div>

            <!-- Блок для отображения сгенерированных ключевых слов по URL -->
            <div
              v-if="
                card.keywordsMode === 'url' &&
                (card.generatedKeywordsFromUrl || card.keywordsUrlError)
              "
              class="mt-2"
            >
              <!-- Успешно сгенерированные ключевые слова по URL -->
              <div
                v-if="card.generatedKeywordsFromUrl"
                class="bg-success bg-opacity-10 p-2 rounded"
              >
                <div class="small fw-bold text-success mb-1">
                  <i class="bi bi-check-circle me-1"></i>
                  Згенеровані ключові слова по URL:
                </div>
                <div class="small" style="font-size: 12px; line-height: 1.4">
                  {{ card.generatedKeywordsFromUrl }}
                </div>
              </div>

              <!-- Ошибка генерации по URL -->
              <div
                v-if="card.keywordsUrlError"
                class="bg-danger bg-opacity-10 p-2 rounded text-danger"
              >
                <i class="bi bi-exclamation-triangle me-1"></i>
                <span class="fw-bold small">Помилка генерації по URL:</span>
                <span class="small">{{ card.keywordsUrlError }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Помилка ChatGPT (если есть) -->
        <div v-if="card.chatGptError" class="mt-1">
          <div class="bg-danger bg-opacity-10 p-2 rounded text-danger small">
            <i class="bi bi-exclamation-triangle me-1"></i>
            <span class="fw-bold">ChatGpt Error:</span> {{ card.chatGptError }}
          </div>
        </div>

        <!-- Блок з CombinedAccordion (точно такой же как в основном компоненте) -->
        <div v-if="card.clickflareUrl || card.clickflareCampaignUrl" class="mt-2">
          <CombinedAccordion
            :tonikId="card.resId"
            :offerUrl="card.clickflareUrl"
            :offerName="getOfferName(card)"
            :offerId="card.clickflareId"
            :campaignUrl="card.clickflareCampaignUrl"
            :campaignId="card.clickflareCampaignId"
            :clickflareResCampaignName="card.clickflareResCampaignName"
            :chatGptTitle="card.chatGptTitle"
          />
        </div>

        <!-- ClickFlare статус -->
        <div class="small d-flex justify-content-center mt-2">
          <span
            v-if="
              card.clickflareId && card.clickflareCampaignId && card.clickflareId !== 'existing'
            "
            class="badge bg-success text-white px-2 py-1 w-100"
            style="font-size: 12px"
          >
            🎉 Оффер + кампанія створені у ClickFlare
          </span>

          <span
            v-else-if="card.clickflareId === 'existing'"
            class="badge bg-warning text-dark px-2 py-1 w-100"
            style="font-size: 12px"
          >
            Кампанія вже існує у ClickFlare
          </span>
        </div>

        <div v-if="card.clickFlareError" class="text-danger small mt-1">
          {{ card.clickFlareError }}
        </div>

        <div v-if="card.error" class="mt-2 text-danger small border rounded bg-light p-2">
          <i class="bi bi-exclamation-triangle me-1"></i>
          {{ card.error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTonicStore } from '../../stores/tonicStore'
import { useChatGptStore } from '../../stores/chatGptStore'
import CombinedAccordion from './CombinedAccordion.vue'

const tonicStore = useTonicStore()
const chatGptStore = useChatGptStore()

// Получаем только завершенные карточки
const completedCards = computed(() => {
  return tonicStore.completedCards || []
})

// Функция для получения имени оффера (упрощенная версия getClickFlareNames)
const getOfferName = (card) => {
  const parts = card.adTitle.split(' | ')
  let baseName = parts.length > 1 ? parts.slice(1).join(' | ') : card.adTitle

  // Убираем resId из baseName если он уже есть
  const resIdMatch = baseName.match(/^(\d+)_(.+)$/)
  if (resIdMatch) {
    baseName = resIdMatch[2]
  }

  return card.resId ? `${card.resId}_${baseName}` : baseName
}

// Функция удаления карточки из завершенных
const removeCard = (cardToRemove) => {
  tonicStore.removeCompletedCard(cardToRemove)
}

// Функция очистки всех завершенных карточек
const clearAllCompleted = () => {
  if (confirm('Видалити всі завершені кампанії?')) {
    tonicStore.clearCompletedCards()
  }
}

// Функция генерации ключевых слов по введенным словам
const generateKeywordsFromWords = async (card) => {
  if (!card.keywordsFromInputWords?.trim()) {
    return
  }

  card.isGeneratingKeywords = true
  card.keywordsInputWordsError = ''
  card.generatedKeywords = ''

  try {
    console.log(`🔤 Генеруємо ключові слова для: "${card.keywordsFromInputWords}"`)

    const requestBody = {
      inputWords: card.keywordsFromInputWords.trim(),
      country: card.country,
      trafficSource: card.trafficSource,
      promptSettings: chatGptStore.prompts.keywords,
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

    if (response.ok && result.success && result.data) {
      card.generatedKeywords = result.data.keywords
      card.keywordsInputWordsStatus = 'success'
      card.keywordsLastGenerated = Date.now()

      console.log(`✅ Ключові слова згенеровано: "${result.data.keywords}"`)
    } else {
      throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error(`❌ Помилка генерації ключових слів:`, error)
    card.keywordsInputWordsError = error.message || 'Невідома помилка ChatGPT API'
    card.keywordsInputWordsStatus = 'error'
  } finally {
    card.isGeneratingKeywords = false
  }
}

// Функция генерации ключевых слов по URL
const generateKeywordsFromUrl = async (card) => {
  if (!card.keywordsFromUrl?.trim()) {
    return
  }

  card.isGeneratingKeywords = true
  card.keywordsUrlError = ''
  card.generatedKeywordsFromUrl = ''

  try {
    console.log(`🌐 Генеруємо ключові слова для URL: "${card.keywordsFromUrl}"`)

    const requestBody = {
      url: card.keywordsFromUrl.trim(),
      country: card.country,
      trafficSource: card.trafficSource,
      promptSettings: chatGptStore.prompts.url,
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

    if (response.ok && result.success && result.data) {
      card.generatedKeywordsFromUrl = result.data.keywords
      card.keywordsUrlStatus = 'success'
      card.keywordsLastGenerated = Date.now()

      console.log(`✅ Ключові слова по URL згенеровано: "${result.data.keywords}"`)
    } else {
      throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error(`❌ Помилка генерації ключових слів по URL:`, error)
    card.keywordsUrlError = error.message || 'Невідома помилка ChatGPT API'
    card.keywordsUrlStatus = 'error'
  } finally {
    card.isGeneratingKeywords = false
  }
}

// Функция подтверждения ключевых слов (отправка в Tonic)
const confirmKeywords = async (card) => {
  // Определяем какие ключевые слова использовать
  let keywordsToSend = ''
  if (card.keywordsMode === 'inputWords') {
    keywordsToSend = card.generatedKeywords
  } else if (card.keywordsMode === 'url') {
    keywordsToSend = card.generatedKeywordsFromUrl
  }

  if (!keywordsToSend || !keywordsToSend.trim()) {
    console.warn('⚠️ Нет ключевых слов для отправки')
    return
  }

  if (!card.resId) {
    console.warn('⚠️ Нет ID кампании для отправки ключевых слов')
    return
  }

  card.isConfirmingKeywords = true
  card.keywordsConfirmError = ''

  try {
    console.log(`🏷️ Подтверждаем ключевые слова для кампании ${card.resId}`)
    console.log(`   Режим: ${card.keywordsMode}`)
    console.log(`   Ключевые слова: "${keywordsToSend}"`)

    // Преобразуем строку ключевых слов в массив
    const keywordsArray = keywordsToSend
      .split(',')
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0)

    const requestBody = {
      campaignId: card.resId,
      keywords: keywordsArray,
      keywordAmount: Math.min(keywordsArray.length, 8), // Максимум 8 по API
    }

    console.log('📤 Отправляем в Tonic:', requestBody)

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tonic/add-keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      console.log('✅ Ключевые слова успешно добавлены в Tonic:', result.data)

      // Сохраняем результат
      card.confirmedKeywords = result.data.keywords
      card.keywordSetId = result.data.keywordSetId
      card.keywordsConfirmed = true

      console.log(`🎉 Подтверждено! Keyword Set ID: ${result.data.keywordSetId}`)
    } else {
      throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error('❌ Ошибка подтверждения ключевых слов:', error)
    card.keywordsConfirmError = error.message || 'Ошибка отправки в Tonic'
  } finally {
    card.isConfirmingKeywords = false
  }
}

// Функція очищення інпутів ключових слів
const clearKeywordsInput = (card, mode) => {
  if (mode === 'inputWords') {
    card.keywordsFromInputWords = ''
    card.generatedKeywords = ''
    card.keywordsInputWordsError = ''
  } else if (mode === 'url') {
    card.keywordsFromUrl = ''
    card.generatedKeywordsFromUrl = ''
    card.keywordsUrlError = ''
  }

  console.log(`🧹 Очищено поле ключових слів (${mode}) для картки: ${card.adTitle}`)
}
</script>

<style scoped>
.form-control-plaintext {
  word-break: break-word;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
