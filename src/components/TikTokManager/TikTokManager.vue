<template>
  <div class="container">
    <div class="row">
      <div class="col-md-12">
        <!-- Упрощенная панель авторизации -->
        <div class="card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Connection Status</h5>
            <div class="d-flex gap-2">
              <span v-if="store.isAuthenticated" class="badge bg-success">
                <i class="bi bi-check-circle me-1"></i>Connected
              </span>
              <span v-else class="badge bg-danger">
                <i class="bi bi-exclamation-triangle me-1"></i>Not Connected
              </span>
              <span
                v-if="store.isAuthenticated"
                @click="handleDisconnect"
                class="badge bg-danger"
                style="cursor: pointer"
                title="Disconnect from TikTok"
              >
                Disconnect<i class="bi bi-box-arrow-right ms-1"></i>
              </span>
            </div>
          </div>
          <div class="card-body">
            <!-- Если НЕ авторизован - показать кнопку авторизации -->
            <div v-if="!store.isAuthenticated" class="text-center">
              <div v-if="store.loading" class="mb-3">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Connecting to TikTok...
              </div>
              <div v-else>
                <p class="text-muted mb-3">
                  Connect your TikTok Business account to start managing campaigns
                </p>
                <button
                  @click="openAuthModal"
                  class="btn btn-primary btn-lg"
                  :disabled="store.loading"
                >
                  <i class="bi bi-tiktok me-2"></i>Connect TikTok Account
                </button>
              </div>
              <div v-if="store.error" class="alert alert-danger mt-3">
                {{ store.error }}
                <button
                  @click="store.clearError"
                  class="btn-close float-end"
                  aria-label="Close"
                ></button>
              </div>
            </div>

            <!-- Если авторизован - показать базовую информацию -->
            <div v-else class="text-center">
              <h6 class="text-success">
                <i class="bi bi-check-circle me-1"></i>
                TikTok account connected successfully</h6>
              <p class="text-muted">Ready to manage your advertising campaigns</p>

              <!-- Базовая информация -->
              <div class="row mt-4">
                <div class="col-md-6">
                  <div class="small text-muted">Advertiser Accounts</div>
                  <div class="fw-bold">{{ store.advertiserIds.length }}</div>
                </div>
                <div class="col-md-6">
                  <div class="small text-muted">API Permissions</div>
                  <div class="fw-bold">{{ store.scope.length }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно авторизации TikTok -->
    <div
      class="modal fade"
      id="tiktokAuthModal"
      tabindex="-1"
      aria-labelledby="tiktokAuthModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="tiktokAuthModalLabel">
              <i class="bi bi-tiktok me-2"></i>TikTok Authorization
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <!-- Состояние загрузки -->
            <div v-if="modalState.loading" class="text-center py-4">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mb-0">{{ modalState.loadingMessage }}</p>
            </div>

            <!-- Инструкции для popup окна -->
            <div v-else-if="modalState.showPopupInstructions" class="text-center py-4">
              <i class="bi bi-box-arrow-up-right fs-1 text-primary mb-3"></i>
              <h6>Authorization Window Opened</h6>
              <p class="text-muted mb-3">Please complete the authorization in the popup window.</p>
              <div class="alert alert-info mb-3">
                <i class="bi bi-info-circle me-2"></i>
                <small>Waiting for authorization to complete...</small>
              </div>
              <div class="d-flex justify-content-center gap-2">
                <button @click="openPopupWindow" class="btn btn-outline-primary btn-sm">
                  <i class="bi bi-box-arrow-up-right me-1"></i>Reopen Window
                </button>
                <button @click="cancelAuth" class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-x me-1"></i>Cancel
                </button>
              </div>
            </div>

            <!-- Успешная авторизация -->
            <div v-else-if="modalState.success" class="text-center py-4">
              <i class="bi bi-check-circle text-success fs-1 mb-3"></i>
              <h6 class="text-success">Authorization Successful!</h6>
              <p class="text-muted">Your TikTok account has been connected successfully.</p>
            </div>

            <!-- Ошибка авторизации -->
            <div v-else-if="modalState.error" class="text-center py-4">
              <i class="bi bi-exclamation-circle text-danger fs-1 mb-3"></i>
              <h6 class="text-danger">Authorization Failed</h6>
              <p class="text-muted">{{ modalState.error }}</p>
            </div>
          </div>
          <div class="modal-footer" v-if="modalState.error">
            <button @click="retryAuth" class="btn btn-primary">
              <i class="bi bi-arrow-clockwise me-1"></i>Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTikTokStore } from '@/stores/tiktokStore'
import { onMounted, ref, reactive } from 'vue'
import { Modal } from 'bootstrap'

const store = useTikTokStore()

// Состояние модального окна
const modalState = reactive({
  loading: false,
  loadingMessage: '',
  showPopupInstructions: false,
  authUrl: '',
  success: false,
  error: null,
})

let authModal = null
let authPopup = null

// Автоматическая инициализация при загрузке компонента
onMounted(async () => {
  await store.initializeAuth()

  // Инициализируем модальное окно Bootstrap
  const modalElement = document.getElementById('tiktokAuthModal')
  if (modalElement) {
    authModal = new Modal(modalElement)

    // Слушаем события модального окна
    modalElement.addEventListener('hidden.bs.modal', () => {
      resetModalState()
    })
  }
})

// Функция отключения (очистки данных)
const handleDisconnect = () => {
  store.resetStore()
}

// Сброс состояния модального окна
const resetModalState = () => {
  modalState.loading = false
  modalState.loadingMessage = ''
  modalState.showPopupInstructions = false
  modalState.authUrl = ''
  modalState.success = false
  modalState.error = null
}

// Открытие модального окна авторизации
const openAuthModal = async () => {
  if (!authModal) return

  resetModalState()
  modalState.loading = true
  modalState.loadingMessage = 'Preparing authorization...'

  authModal.show()

  try {
    // Получаем URL авторизации
    await store.getAuthUrl()

    if (store.authUrl) {
      modalState.loading = false
      modalState.showPopupInstructions = true
      modalState.authUrl = store.authUrl

      // Открываем popup окно
      openPopupWindow()
    } else {
      modalState.loading = false
      modalState.error = 'Failed to get authorization URL'
    }
  } catch (error) {
    console.error('Error opening auth modal:', error)
    modalState.loading = false
    modalState.error = error.message || 'Failed to start authorization process'
  }
}

// Открытие popup окна
const openPopupWindow = () => {
  if (!modalState.authUrl) return

  // Закрываем предыдущий popup если он есть
  if (authPopup && !authPopup.closed) {
    authPopup.close()
  }

  // Открываем новый popup
  authPopup = window.open(
    modalState.authUrl,
    'tiktok-auth',
    'width=500,height=700,scrollbars=yes,resizable=yes,centerscreen=yes'
  )

  if (authPopup) {
    // Настраиваем слушателей
    setupPopupListeners()
  } else {
    modalState.error = 'Failed to open popup window. Please allow popups for this site.'
    modalState.showPopupInstructions = false
  }
}

// Настройка слушателей для popup окна
const setupPopupListeners = () => {
  // Слушаем сообщения от popup
  const messageListener = async (event) => {
    // Проверяем происхождение сообщения
    if (event.origin !== window.location.origin) return

    if (event.data.type === 'TIKTOK_AUTH_SUCCESS' && event.data.authCode) {
      console.log('Received auth code from popup:', event.data.authCode)

      modalState.loading = true
      modalState.loadingMessage = 'Processing authorization...'
      modalState.showPopupInstructions = false

      try {
        // Обрабатываем код авторизации
        store.authCode = event.data.authCode
        await store.exchangeToken()

        modalState.loading = false
        modalState.success = true

        // Закрываем модальное окно через 2 секунды
        setTimeout(() => {
          if (authModal) {
            authModal.hide()
          }
        }, 2000)
      } catch (error) {
        console.error('Error exchanging token:', error)
        modalState.loading = false
        modalState.error = error.message || 'Failed to complete authorization'
      }

      // Очищаем слушатели
      cleanupListeners()
    }
  }

  // Слушаем закрытие popup
  const checkPopupClosed = setInterval(() => {
    if (authPopup && authPopup.closed) {
      clearInterval(checkPopupClosed)
      console.log('Popup was closed by user')

      // Очищаем слушатели
      window.removeEventListener('message', messageListener)
    }
  }, 500)

  window.addEventListener('message', messageListener)

  // Функция очистки слушателей
  const cleanupListeners = () => {
    clearInterval(checkPopupClosed)
    window.removeEventListener('message', messageListener)
    authPopup = null
  }

  // Очистка слушателей через 15 минут для безопасности
  setTimeout(() => {
    cleanupListeners()
  }, 15 * 60 * 1000)
}

// Отмена авторизации
const cancelAuth = () => {
  // Закрываем popup если открыт
  if (authPopup && !authPopup.closed) {
    authPopup.close()
  }

  // Закрываем модальное окно
  if (authModal) {
    authModal.hide()
  }
}

// Повтор авторизации при ошибке
const retryAuth = () => {
  resetModalState()
  openAuthModal()
}
</script>
