<template>
  <div class="mb-3">
    <label class="form-label">Перевірка статусів</label>
    <div class="border rounded bg-light-subtle p-3 shadow-sm">
      <div class="d-flex justify-content-between align-items-center">
        <!-- Слева — часы -->
        <div class="fw-bold timer-time-display text-dark-emphasis">
          {{ timerMinutesDisplay }}:{{ timerSecondsDisplay }}
        </div>

        <!-- Справа — ввод минут и кнопки -->
        <div class="d-flex align-items-center gap-2">
          <input
            class="form-control text-center px-0"
            type="number"
            min="1"
            max="60"
            v-model="customTimerMinutes"
            :disabled="isRunning && !isPaused"
            style="width: 60px"
          />

          <span class="text-muted small">хвилин</span>

          <!-- Единственная кнопка play/pause -->
          <button
            class="btn btn-outline-secondary btn-sm d-flex align-items-center"
            @click="toggleTimer"
          >
            <i :class="getButtonIcon"></i>
          </button>

          <!-- Кнопка стоп показывается только когда таймер работает -->
          <button
            class="btn btn-outline-danger btn-sm d-flex align-items-center"
            @click="stopTimer"
            :disabled="!isRunning"
            v-if="isRunning"
          >
            <i class="bi bi-stop-fill"></i>
          </button>
        </div>
      </div>

      <!-- Прогресс бар -->
      <div class="mt-2" v-if="isRunning">
        <div class="progress" style="height: 4px">
          <div
            class="progress-bar"
            :class="{ 'bg-warning': isPaused, 'bg-success': !isPaused }"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

// Props
const props = defineProps({
  autoStart: {
    type: Boolean,
    default: false,
  },
  defaultMinutes: {
    type: Number,
    default: 1,
  },
})

// Emits
const emit = defineEmits(['timerComplete', 'timerStart', 'timerPause', 'timerStop'])

// Reactive data
const customTimerMinutes = ref(props.defaultMinutes)
const timerMinutes = ref(0)
const timerSeconds = ref(0)
const timerInterval = ref(null)
const isPaused = ref(false)
const totalSeconds = ref(0) // для прогресс бара

// Computed
const isRunning = computed(() => timerInterval.value !== null)

const timerMinutesDisplay = computed(() => {
  return isRunning.value ? String(timerMinutes.value).padStart(2, '0') : '00'
})

const timerSecondsDisplay = computed(() => {
  return isRunning.value ? String(timerSeconds.value).padStart(2, '0') : '00'
})

const progressPercentage = computed(() => {
  if (!isRunning.value || totalSeconds.value === 0) return 0

  const currentSeconds = timerMinutes.value * 60 + timerSeconds.value
  const elapsed = totalSeconds.value - currentSeconds
  return Math.min(100, Math.max(0, (elapsed / totalSeconds.value) * 100))
})

// Computed для иконки кнопки
const getButtonIcon = computed(() => {
  if (!isRunning.value) {
    return 'bi bi-play-fill' // Не запущен - показываем play
  } else if (isPaused.value) {
    return 'bi bi-play-fill' // На паузе - показываем play
  } else {
    return 'bi bi-pause-fill' // Работает - показываем pause
  }
})

// Methods
const toggleTimer = () => {
  if (!isRunning.value) {
    // Таймер не запущен - запускаем
    startTimer()
  } else if (isPaused.value) {
    // Таймер на паузе - продолжаем
    resumeTimer()
  } else {
    // Таймер работает - ставим на паузу
    pauseTimer()
  }
}

const startTimer = () => {
  const minutes = parseInt(customTimerMinutes.value)
  if (isNaN(minutes) || minutes <= 0) {
    console.warn('Невірне значення хвилин для таймера')
    return
  }

  // Запускаем новый таймер
  timerMinutes.value = minutes
  timerSeconds.value = 0
  totalSeconds.value = minutes * 60
  isPaused.value = false

  if (timerInterval.value) {
    console.log('🔄 Очищаємо попередній інтервал')
    clearInterval(timerInterval.value)
  }

  console.log(`🕐 Запуск НОВОГО таймера на ${minutes} хвилин`)
  emit('timerStart', { minutes, seconds: 0 })

  timerInterval.value = setInterval(() => {
    if (isPaused.value) return

    if (timerMinutes.value === 0 && timerSeconds.value === 0) {
      // Таймер завершено
      console.log('⏰ Таймер дійшов до 00:00 - зупиняємо інтервал')
      clearInterval(timerInterval.value)
      timerInterval.value = null
      isPaused.value = false

      console.log('📤 Відправляю timerComplete event')
      emit('timerComplete')
      return
    }

    if (timerSeconds.value === 0) {
      timerMinutes.value -= 1
      timerSeconds.value = 59
    } else {
      timerSeconds.value -= 1
    }
  }, 1000)

  console.log('✅ Інтервал створено, таймер запущено')
}

const resumeTimer = () => {
  isPaused.value = false
  console.log('▶️ Таймер продовжено')
  emit('timerStart', { minutes: timerMinutes.value, seconds: timerSeconds.value })
}

const pauseTimer = () => {
  if (!timerInterval.value) return

  isPaused.value = true
  console.log('⏸️ Таймер на паузі')
  emit('timerPause', { minutes: timerMinutes.value, seconds: timerSeconds.value })
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }

  isPaused.value = false
  timerMinutes.value = 0
  timerSeconds.value = 0
  totalSeconds.value = 0

  console.log('⏹️ Таймер зупинено')
  emit('timerStop')
}

const resetTimer = () => {
  stopTimer()
  customTimerMinutes.value = props.defaultMinutes
}

// Public methods через defineExpose
defineExpose({
  startTimer,
  pauseTimer: pauseTimer,
  stopTimer,
  resetTimer,
  isRunning: computed(() => isRunning.value),
  isPaused: computed(() => isPaused.value),
})

// Lifecycle
onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

// Auto start якщо потрібно
if (props.autoStart) {
  startTimer()
}
</script>

<style scoped>
.timer-time-display {
  font-size: 1.5rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}

.progress {
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  transition: width 0.3s ease;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-sm i {
  font-size: 0.75rem;
}
</style>
