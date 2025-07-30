<template>
  <div class="accordion" :id="`accordion-${uniqueId}`">
    <div class="accordion-item">
      <h2 class="accordion-header">
        <button
          ref="accordionButton"
          class="accordion-button collapsed d-flex align-items-center gap-2"
          type="button"
          :aria-expanded="isExpanded"
          :aria-controls="`collapse-${uniqueId}`"
          @click="toggleAccordion"
        >
          <span>{{ headerTitle }}</span>
        </button>
      </h2>
      <div
        ref="accordionCollapse"
        :id="`collapse-${uniqueId}`"
        class="accordion-collapse collapse"
        :class="{ show: isExpanded }"
      >
        <div class="accordion-body">
          <div class="fw-bold">{{ cardTitle }}</div>
          <div class="fw-medium mt-1 text-muted">{{ displayName }}</div>
          <div
            class="text-break bg-light p-2 rounded position-relative"
            style="font-family: monospace; word-break: break-all; font-size: 12px"
          >
            <!-- Кнопка копіювання -->
            <button
              @click="copyToClipboard"
              class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-1"
              style="font-size: 10px; padding: 2px 6px"
              :title="copyButtonText"
            >
              <i :class="copyIcon"></i>
            </button>
            <div class="fw-bold">{{ urlLabel }}</div>
            <!-- URL як посилання -->
            <a
              :href="url"
              target="_blank"
              class="text-decoration-none d-block mt-1"
              style="padding-right: 40px"
            >
              {{ url }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { nanoid } from 'nanoid'

const props = defineProps({
  type: {
    type: String,
    required: true, // 'offer' або 'campaign'
  },
  tonikId: {
    type: String,
    default: '',
  },
  url: {
    type: String,
    required: true,
  },
  headerTitle: {
    type: String,
    default: 'Title',
  },
  cardTitle: {
    type: String,
    default: 'Card Title',
  },
  offerName: {
    type: String,
    default: '',
  },
  campaignName: {
    type: String,
    default: '',
  },
})

// ✅ ВИПРАВЛЕНО: Правильна логіка для displayName
const displayName = computed(() => {
  if (props.type === 'offer') {
    // Для offer показуємо offerName (це adTitle з картки)
    return props.offerName || 'Не задано'
  } else if (props.type === 'campaign') {
    // Для campaign показуємо збережену назву з ClickFlare
    return props.campaignName || 'Не задано'
  }
  return 'Невідомий тип'
})

// ✅ ДОДАНО: Лейбл для URL секції
const urlLabel = computed(() => {
  if (props.type === 'offer') {
    return 'Offer URL'
  } else if (props.type === 'campaign') {
    return 'Campaign URL'
  }
  return 'URL'
})

// Генеруємо унікальний ID для accordion
const uniqueId = ref(nanoid(8))

// Refs для DOM елементів
const accordionButton = ref(null)
const accordionCollapse = ref(null)

// Стан accordion
const isExpanded = ref(false)

// Стан для кнопки копіювання
const isCopied = ref(false)

const copyIcon = computed(() => {
  return isCopied.value ? 'bi bi-check-lg text-success' : 'bi bi-copy'
})

const copyButtonText = computed(() => {
  return isCopied.value ? 'Скопійовано!' : 'Копіювати URL'
})

// Функція для перемикання accordion
const toggleAccordion = () => {
  isExpanded.value = !isExpanded.value

  // Оновлюємо aria-expanded атрибут
  if (accordionButton.value) {
    accordionButton.value.setAttribute('aria-expanded', isExpanded.value.toString())

    // Додаємо/прибираємо клас collapsed
    if (isExpanded.value) {
      accordionButton.value.classList.remove('collapsed')
    } else {
      accordionButton.value.classList.add('collapsed')
    }
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.url)
    isCopied.value = true

    // Скидаємо стан через 2 секунди
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.warn('Не вдалося скопіювати:', err)

    // Fallback для старих браузерів
    const textArea = document.createElement('textarea')
    textArea.value = props.url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)

    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  }
}

// Ініціалізація Bootstrap Accordion після монтування
onMounted(async () => {
  await nextTick()

  // Альтернативний спосіб ініціалізації через Bootstrap JS API
  if (typeof window !== 'undefined' && window.bootstrap) {
    try {
      const accordionElement = document.getElementById(`accordion-${uniqueId.value}`)
      if (accordionElement) {
        new window.bootstrap.Collapse(accordionCollapse.value, {
          toggle: false,
        })
      }
    } catch (error) {
      console.warn('Bootstrap Collapse не вдалося ініціалізувати:', error)
    }
  }
})
</script>

<style scoped>
/* Додаємо плавну анімацію для accordion */
.accordion-collapse {
  transition: height 0.35s ease;
}

.accordion-button:not(.collapsed) {
  color: var(--bs-accordion-active-color);
  background-color: var(--bs-accordion-active-bg);
}

.accordion-button::after {
  transition: transform 0.2s ease-in-out;
}

.accordion-button:not(.collapsed)::after {
  transform: rotate(-180deg);
}
</style>
