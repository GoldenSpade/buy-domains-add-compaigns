<template>
  <div class="card-status-timer">
    <!-- Статус з індикатором -->
    <div class="d-flex align-items-center justify-content-between mb-2">
      <div class="d-flex align-items-center">
        <span class="badge me-2" :class="getStatusClass()">
          <i :class="getStatusIcon()" class="me-1"></i>
          {{ getStatusText() }}
        </span>
        <small v-if="card.resId" class="text-muted"> ID: {{ card.resId }} </small>
      </div>

      <!-- Кнопка перевірки -->
      <button
        @click="checkStatusNow"
        :disabled="isChecking || !card.resId"
        class="btn btn-outline-primary btn-sm"
        :title="card.resId ? 'Перевірити статус' : 'Спочатку створіть кампанію'"
      >
        <i class="bi bi-arrow-clockwise" :class="{ spinning: isChecking }"></i>
      </button>
    </div>

    <!-- Прогрес бар -->
    <div class="progress mb-2" style="height: 4px">
      <div
        class="progress-bar"
        :class="isChecking ? 'bg-warning' : 'bg-primary'"
        :style="{ width: progressPercentage + '%' }"
      ></div>
    </div>

    <!-- Таймер -->
    <div class="d-flex align-items-center justify-content-between text-muted small">
      <span>
        <i class="bi bi-clock"></i>
        {{ formatTimer(timeLeft) }}
      </span>

      <div>
        <button
          @click="toggleTimer"
          class="btn btn-outline-secondary btn-sm"
          :title="isRunning ? 'Призупинити' : 'Запустити'"
        >
          <i :class="isRunning ? 'bi-pause' : 'bi-play'"></i>
        </button>
      </div>
    </div>

    <!-- Помилка -->
    <div v-if="card.error" class="alert alert-danger mt-2 p-2 small">
      <i class="bi bi-exclamation-triangle"></i>
      {{ card.error }}
    </div>

    <!-- Час останньої перевірки -->
    <div v-if="card.lastStatusCheck" class="text-muted small mt-1">
      Останній раз: {{ formatTime(card.lastStatusCheck) }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['status-updated'])

// Стан компонента
const isRunning = ref(false)
const isChecking = ref(false)
const timeLeft = ref(30) // 30 секунд за замовчуванням
const timer = ref(null)
const checkInterval = 30000 // 30 секунд

// Ключ для ідентифікації картки
const cardKey = computed(
  () => `${props.card.offer}-${props.card.country}-${props.card.buyer}-${props.card.trafficSource}`
)

// Прогрес бар
const progressPercentage = computed(() => {
  return ((checkInterval - timeLeft.value * 1000) / checkInterval) * 100
})

// Запуск таймера
const startTimer = () => {
  // Запускаємо тільки якщо є resId і статус не фінальний
  if (!props.card.resId || isFinalStatus()) {
    console.log(
      `⏸️ Не запускаємо таймер для ${cardKey.value}: resId=${props.card.resId}, статус=${props.card.status}`
    )
    return
  }

  if (timer.value) clearInterval(timer.value)

  timeLeft.value = 30
  isRunning.value = true

  timer.value = setInterval(() => {
    timeLeft.value--

    if (timeLeft.value <= 0) {
      checkStatusNow()
    }
  }, 1000)

  console.log(`⏰ Таймер запущено для ${cardKey.value}`)
}

// Зупинка таймера
const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  isRunning.value = false
}

// Перемикання таймера
const toggleTimer = () => {
  if (isRunning.value) {
    stopTimer()
  } else {
    startTimer()
  }
}

// Перевірка чи статус фінальний
const isFinalStatus = () => {
  const finalStatuses = ['active', 'inactive', 'rejected']
  return finalStatuses.includes(props.card.status)
}

// Перевірка статусу
const checkStatusNow = async () => {
  if (isChecking.value || !props.card.resId) return

  isChecking.value = true
  timeLeft.value = 30 // Скидаємо таймер

  try {
    console.log(`🔍 Перевірка статусу для картки: ${cardKey.value}`)

    // ВИПРАВЛЕНО: Будуємо URL з параметрами БЕЗ дублювання
    const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/tonic/campaign-status`
    const params = new URLSearchParams({
      name: props.card.baseCampaignName,
      trafficSource: props.card.trafficSource,
    })

    const fullUrl = `${baseUrl}?${params}`
    console.log(`🌐 URL запиту: ${fullUrl}`)

    const response = await fetch(fullUrl)
    const result = await response.json()

    console.log(`📥 Відповідь сервера:`, result)

    if (response.ok) {
      const statusData = {
        status: result.status || 'unknown',
        link: result.link || props.card.link,
        lastStatusCheck: Date.now(),
        error: null,
      }

      console.log(`✅ Статус отримано для ${cardKey.value}:`, statusData)

      // Передаємо оновлення батьківському компоненту
      emit('status-updated', cardKey.value, statusData)

      // Зупиняємо таймер якщо статус фінальний
      if (statusData.status && ['active', 'inactive', 'rejected'].includes(statusData.status)) {
        stopTimer()
        console.log(
          `🏁 Таймер зупинено для ${cardKey.value} - фінальний статус: ${statusData.status}`
        )
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error(`❌ Помилка перевірки статусу для ${cardKey.value}:`, error)

    const errorData = {
      error: error.message || "Помилка з'єднання",
      lastStatusCheck: Date.now(),
    }

    emit('status-updated', cardKey.value, errorData)
  } finally {
    isChecking.value = false
  }
}
// Форматування часу
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Форматування таймера
const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Стилі статусу
const getStatusClass = () => {
  if (isChecking.value) return 'bg-warning text-dark'

  switch (props.card.status) {
    case 'active':
      return 'bg-success'
    case 'pending':
      return 'bg-warning text-dark'
    case 'inactive':
      return 'bg-secondary'
    case 'paused':
      return 'bg-info text-dark'
    case 'rejected':
      return 'bg-danger'
    case 'creating':
      return 'bg-info text-dark'
    default:
      return 'bg-light text-dark'
  }
}

// Іконки статусу
const getStatusIcon = () => {
  if (isChecking.value) return 'bi-arrow-clockwise spinning'

  switch (props.card.status) {
    case 'active':
      return 'bi-check-circle'
    case 'pending':
      return 'bi-clock'
    case 'inactive':
      return 'bi-x-circle'
    case 'paused':
      return 'bi-pause-circle'
    case 'rejected':
      return 'bi-exclamation-circle'
    case 'creating':
      return 'bi-gear'
    default:
      return 'bi-question-circle'
  }
}

// Текст статусу
const getStatusText = () => {
  if (isChecking.value) return 'Перевірка...'

  switch (props.card.status) {
    case 'active':
      return 'Активна'
    case 'pending':
      return 'Очікування'
    case 'inactive':
      return 'Неактивна'
    case 'paused':
      return 'Призупинена'
    case 'rejected':
      return 'Відхилена'
    case 'creating':
      return 'Створення'
    default:
      return props.card.status || 'Невідомо'
  }
}

// Відстеження змін картки
watch(
  () => props.card.status,
  (newStatus, oldStatus) => {
    console.log(`📈 Статус змінився для ${cardKey.value}: ${oldStatus} → ${newStatus}`)

    // Якщо статус став фінальним - зупиняємо таймер
    if (isFinalStatus()) {
      stopTimer()
    }
    // Якщо з'явився resId і статус не фінальний - запускаємо таймер
    else if (props.card.resId && !isRunning.value) {
      startTimer()
    }
  }
)

// Відстеження resId
watch(
  () => props.card.resId,
  (newResId) => {
    if (newResId && !isFinalStatus()) {
      // Затримка перед першою перевіркою
      setTimeout(() => {
        checkStatusNow()
        startTimer()
      }, 3000)
    }
  }
)

// Ініціалізація
onMounted(() => {
  // Запускаємо таймер тільки якщо є resId і статус не фінальний
  if (props.card.resId && !isFinalStatus()) {
    setTimeout(() => {
      checkStatusNow()
      startTimer()
    }, 2000)
  }
})

// Очищення
onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.card-status-timer {
  font-size: 0.875rem;
  border-top: 1px solid #e9ecef;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
}

.progress {
  border-radius: 2px;
}

.btn-sm {
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
}

.spinning {
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

.badge {
  font-size: 0.7em;
}
</style>
