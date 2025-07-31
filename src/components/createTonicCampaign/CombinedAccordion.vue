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
          <span>🎯 ClickFlare Offer & Campaign</span>
        </button>
      </h2>
      <div
        ref="accordionCollapse"
        :id="`collapse-${uniqueId}`"
        class="accordion-collapse collapse"
        :class="{ show: isExpanded }"
      >
        <div class="accordion-body">
          <!-- ChatGPT AdTitle блок -->
          <div v-if="chatGptTitle" class="mb-4">
            <div class="bg-success bg-opacity-10 p-2 rounded">
              <span class="fw-bold">AdTitle: </span>
              <span class="fw-bold text-success">{{ chatGptTitle }}</span>
            </div>
          </div>

          <!-- ===== СЕКЦІЯ OFFER ===== -->
          <div class="mb-4">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold text-success mb-0">
                <i class="bi bi-box-seam me-2"></i>
                ClickFlare Offer
              </h6>
            </div>

            <div class="mb-2">
              <span class="fw-bold small text-muted fs-6">Offer Name:</span>
              <div class="small fw-semibold">{{ displayOfferName || 'Не задано' }}</div>
            </div>

            <div
              class="text-break bg-light p-2 rounded position-relative"
              style="font-family: monospace; word-break: break-all; font-size: 12px"
            >
              <div class="position-relative">
                <div class="fw-bold mb-1">Offer URL:</div>
                <a
                  :href="offerUrl"
                  target="_blank"
                  class="text-decoration-none d-block"
                  style="padding-right: 40px"
                >
                  {{ offerUrl }}
                </a>
                <button
                  @click="copyToClipboard(offerUrl)"
                  class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-1"
                  style="font-size: 10px; padding: 2px 6px"
                  :title="copyOfferText"
                >
                  <i :class="copyOfferIcon"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- ===== СЕКЦІЯ CAMPAIGN ===== -->
          <div v-if="campaignUrl" class="mb-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold text-success mb-0">
                <i class="bi bi-graph-up me-2"></i>
                ClickFlare Campaign
              </h6>
            </div>

            <div class="mb-2">
              <span class="fw-bold small text-muted fs-6">Campaign Name:</span>
              <div class="small fw-semibold">{{ displayCampaignName || 'Не задано' }}</div>
            </div>

            <div
              class="text-break bg-light p-2 rounded position-relative"
              style="font-family: monospace; word-break: break-all; font-size: 12px"
            >
              <div class="position-relative">
                <div class="fw-bold mb-1">Campaign URL:</div>
                <a
                  :href="campaignUrl"
                  target="_blank"
                  class="text-decoration-none d-block"
                  style="padding-right: 40px"
                >
                  {{ campaignUrl }}
                </a>
                <button
                  @click="copyToClipboard(campaignUrl)"
                  class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-1"
                  style="font-size: 10px; padding: 2px 6px"
                  :title="copyCampaignText"
                >
                  <i :class="copyCampaignIcon"></i>
                </button>
              </div>
            </div>
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
  // Tonic дані
  tonikId: {
    type: String,
    default: '',
  },

  // Offer дані
  offerUrl: {
    type: String,
    default: '',
  },
  offerName: {
    type: String,
    default: '',
  },
  offerId: {
    type: String,
    default: '',
  },

  // Campaign дані
  campaignUrl: {
    type: String,
    default: '',
  },
  campaignId: {
    type: String,
    default: '',
  },
  clickflareResCampaignName: {
    type: String,
    default: '',
  },
  // ChatGPT дані
  chatGptTitle: {
    type: String,
    default: '',
  },
})

// Генеруємо унікальний ID для accordion
const uniqueId = ref(nanoid(8))

// Refs для DOM елементів
const accordionButton = ref(null)
const accordionCollapse = ref(null)

// Стан accordion
const isExpanded = ref(false)

// Стан для кнопок копіювання
const isCopiedOffer = ref(false)
const isCopiedCampaign = ref(false)

// ✅ НОВІ COMPUTED для правильного відображення назв
const displayOfferName = computed(() => {
  const name = props.clickflareResCampaignName || props.offerName || ''

  // ✅ OFFER NAME: Видаляємо приставку "[будь-який текст] | " якщо вона є
  // Використовуємо регулярний вираз для пошуку шаблону [текст] | на початку
  const accountPrefixPattern = /^\[.*?\]\s*\|\s*/

  if (accountPrefixPattern.test(name)) {
    return name.replace(accountPrefixPattern, '')
  }

  return name
})

const displayCampaignName = computed(() => {
  const name = props.clickflareResCampaignName || props.offerName || ''

  // ✅ CAMPAIGN NAME: Залишаємо приставку "[текст] | " як є
  // Якщо приставки немає - додаємо стандартну "[Account name] | "
  const accountPrefixPattern = /^\[.*?\]\s*\|\s*/

  if (!accountPrefixPattern.test(name) && name.trim()) {
    return `[Account name] | ${name}`
  }

  return name
})

// Computed для статусу
const hasAllData = computed(() => {
  return props.offerUrl && props.campaignUrl && props.tonikId && props.offerId && props.campaignId
})

const statusText = computed(() => {
  if (hasAllData.value) {
    return 'Готово'
  } else if (props.offerUrl || props.campaignUrl) {
    return 'Частково'
  } else {
    return 'Відсутнє'
  }
})

// Computed для кнопок копіювання
const copyOfferIcon = computed(() => {
  return isCopiedOffer.value ? 'bi bi-check-lg text-success' : 'bi bi-copy'
})

const copyOfferText = computed(() => {
  return isCopiedOffer.value ? 'Скопійовано!' : 'Копіювати Offer URL'
})

const copyCampaignIcon = computed(() => {
  return isCopiedCampaign.value ? 'bi bi-check-lg text-success' : 'bi bi-copy'
})

const copyCampaignText = computed(() => {
  return isCopiedCampaign.value ? 'Скопійовано!' : 'Копіювати Campaign URL'
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

// Функція копіювання
const copyToClipboard = async (text) => {
  if (!text) return

  const isOffer = text === props.offerUrl

  try {
    await navigator.clipboard.writeText(text)

    if (isOffer) {
      isCopiedOffer.value = true
      setTimeout(() => {
        isCopiedOffer.value = false
      }, 2000)
    } else {
      isCopiedCampaign.value = true
      setTimeout(() => {
        isCopiedCampaign.value = false
      }, 2000)
    }
  } catch (err) {
    console.warn('Не вдалося скопіювати:', err)

    // Fallback для старих браузерів
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)

    if (isOffer) {
      isCopiedOffer.value = true
      setTimeout(() => {
        isCopiedOffer.value = false
      }, 2000)
    } else {
      isCopiedCampaign.value = true
      setTimeout(() => {
        isCopiedCampaign.value = false
      }, 2000)
    }
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

/* Стилі для секцій */
.border-top {
  border-color: #dee2e6 !important;
}
</style>
