<template>
  <div class="container-fluid px-2 px-md-3">
    <div class="row">
      <div class="col-12">
        <!-- Упрощенная панель авторизации -->
        <div class="card mb-3">
          <div class="card-header">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 class="mb-0 me-2">Connection Status</h5>
              <div class="d-flex gap-1 gap-md-2 flex-wrap">
                <span v-if="store.isAuthenticated" class="badge bg-success text-nowrap">
                  <i class="bi bi-check-circle me-1"></i>Connected
                </span>
                <span v-else class="badge bg-danger text-nowrap">
                  <i class="bi bi-exclamation-triangle me-1"></i>Not Connected
                </span>
                <span
                  v-if="store.isAuthenticated"
                  @click="handleDisconnect"
                  class="badge bg-danger text-nowrap"
                  style="cursor: pointer"
                  title="Disconnect from TikTok"
                >
                  Disconnect<i class="bi bi-box-arrow-right ms-1"></i>
                </span>
              </div>
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
                TikTok account connected successfully
              </h6>
              <p class="text-muted">Ready to manage your advertising campaigns</p>

              <!-- Детальная информация -->
              <div class="row g-3">
                <!-- Advertiser Accounts -->
                <div class="col-12 col-md-6">
                  <div class="card h-100">
                    <div class="card-body p-3">
                      <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="card-title mb-0">
                          <i class="bi bi-building me-2"></i>Advertiser Accounts
                          <span class="badge bg-primary ms-2">{{ visibleAccounts.length }}/{{ accountStats.total }}</span>
                        </h6>
                        <div class="dropdown">
                          <button 
                            class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                            type="button" 
                            data-bs-toggle="dropdown"
                            title="Filter accounts"
                          >
                            <i class="bi bi-funnel"></i>
                          </button>
                          <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 250px;">
                            <h6 class="dropdown-header">Filter Options</h6>
                            <div class="form-check mb-2">
                              <input 
                                class="form-check-input" 
                                type="checkbox" 
                                id="showOnlyActive"
                                v-model="accountFilters.showOnlyActive"
                              >
                              <label class="form-check-label" for="showOnlyActive">
                                Show only active accounts
                              </label>
                            </div>
                            <div class="mb-2">
                              <label class="form-label small">Currency:</label>
                              <select class="form-select form-select-sm" v-model="accountFilters.currency">
                                <option value="all">All currencies</option>
                                <option v-for="currency in accountStats.currencies" :key="currency" :value="currency">
                                  {{ currency }}
                                </option>
                              </select>
                            </div>
                            <div class="mb-0">
                              <label class="form-label small">Sort by:</label>
                              <select class="form-select form-select-sm" v-model="accountFilters.sortBy">
                                <option value="status">Status</option>
                                <option value="name">Name</option>
                                <option value="created">Date created</option>
                                <option value="balance">Balance</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-if="visibleAccounts.length > 0" class="list-group list-group-flush">
                        <div
                          v-for="account in visibleAccounts"
                          :key="account.advertiser_id"
                          class="list-group-item px-3 py-2 border-0 account-item"
                          style="cursor: pointer"
                          @click="handleSelectAccount(account.advertiser_id)"
                          :class="{ 'selected-account': store.selectedAdvertiserId === account.advertiser_id }"
                        >
                          <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                              <div class="d-flex align-items-center gap-2 mb-1">
                                <div class="fw-bold small account-name">
                                  {{ getDisplayAccountName(account) }}
                                </div>
                                <span
                                  :class="getAccountStatusBadge(account.status)"
                                  class="badge account-status-badge"
                                  style="font-size: 10px"
                                  :title="getAccountStatusTooltip(account)"
                                  data-bs-toggle="tooltip"
                                  data-bs-placement="top"
                                >
                                  {{ getAccountStatusText(account.status) }}
                                </span>
                                <span class="badge bg-light text-dark" style="font-size: 9px">
                                  {{ account.currency }}
                                </span>
                              </div>
                              <div class="account-details">
                                <div class="text-muted text-start" style="font-size: 11px">
                                  <div class="mb-1">
                                    <i class="bi bi-hash me-1"></i>ID: {{ account.advertiser_id }}
                                  </div>
                                  <div class="d-flex gap-3 flex-wrap">
                                    <span v-if="account.balance > 0">
                                      <i class="bi bi-wallet2 me-1"></i>{{ formatCurrency(account.balance, account.currency) }}
                                    </span>
                                    <span v-if="account.company">
                                      <i class="bi bi-building me-1"></i>{{ getDisplayCompanyName(account) }}
                                    </span>
                                    <span v-if="account.display_timezone">
                                      <i class="bi bi-clock me-1"></i>{{ account.display_timezone }}
                                    </span>
                                  </div>
                                  <div v-if="account.create_time" class="mt-1">
                                    <i class="bi bi-calendar3 me-1"></i>Created: {{ formatDate(account.create_time, account.display_timezone) }}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class="text-end">
                              <span
                                v-if="store.selectedAdvertiserId === account.advertiser_id"
                                class="badge bg-primary me-3"
                              >
                                <i class="bi bi-check me-1"></i>Active
                              </span>
                              <span v-else class="badge bg-outline-secondary" style="opacity: 0.5">
                                Click to select
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-else-if="store.loading" class="text-center py-3">
                        <div
                          class="spinner-border spinner-border-sm text-primary mb-2"
                          role="status"
                        ></div>
                        <div class="small text-muted">Loading accounts...</div>
                      </div>
                      
                      <div v-else class="text-center py-3">
                        <i class="bi bi-building text-muted" style="font-size: 2rem;"></i>
                        <div class="small text-muted mt-2">No accounts found</div>
                        <div class="small text-muted">Try adjusting your filters</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- API Permissions -->
                <div class="col-12 col-md-6">
                  <div class="card h-100">
                    <div class="card-body p-3">
                      <h6 class="card-title mb-3">
                        <i class="bi bi-key me-2"></i>API Permissions ({{ store.scope.length }})
                      </h6>
                      <div class="list-group list-group-flush">
                        <div
                          v-for="permission in store.getScopeInfo()"
                          :key="permission.id"
                          class="list-group-item px-0 py-2 border-0"
                        >
                          <div class="d-flex align-items-center">
                            <i
                              class="bi bi-check-circle text-success me-2"
                              style="font-size: 12px"
                            ></i>
                            <span class="small">{{ permission.name }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TikTok Campaign Manager Component -->
    <TikTokCampaignManager />

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
import { onMounted, ref, reactive, computed, nextTick } from 'vue'
import { Modal } from 'bootstrap'
import TikTokCampaignManager from './TikTokCampaignManager.vue'

const store = useTikTokStore()

// ID аккаунта News World One, который отображаем как Admin
const ADMIN_ADVERTISER_ID = '7524260058755170320'

// Состояние фильтров
const accountFilters = ref({
  showOnlyActive: true,
  currency: 'all',
  sortBy: 'status' // 'status', 'name', 'created', 'balance'
})

// Фильтрованный список аккаунтов
const visibleAccounts = computed(() => {
  if (!store.advertisers?.data?.list) return []
  
  let accounts = [...store.advertisers.data.list] // Теперь показываем все аккаунты
  
  // Фильтр по активности
  if (accountFilters.value.showOnlyActive) {
    accounts = accounts.filter(acc => acc.status === 'STATUS_ENABLE')
  }
  
  // Фильтр по валюте
  if (accountFilters.value.currency !== 'all') {
    accounts = accounts.filter(acc => acc.currency === accountFilters.value.currency)
  }
  
  // Сортировка
  accounts.sort((a, b) => {
    switch (accountFilters.value.sortBy) {
      case 'status':
        const statusOrder = { 'STATUS_ENABLE': 0, 'STATUS_PENDING': 1, 'STATUS_LIMIT': 2, 'STATUS_DISABLE': 3, 'STATUS_REJECTED': 4 }
        return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5)
      case 'name':
        return (a.name || '').localeCompare(b.name || '')
      case 'created':
        return b.create_time - a.create_time
      case 'balance':
        return b.balance - a.balance
      default:
        return 0
    }
  })
  
  return accounts
})

// Статистика аккаунтов
const accountStats = computed(() => {
  const allAccounts = store.advertisers?.data?.list || []
  return {
    total: allAccounts.length,
    active: allAccounts.filter(acc => acc.status === 'STATUS_ENABLE').length,
    limited: allAccounts.filter(acc => acc.status === 'STATUS_LIMIT').length,
    currencies: [...new Set(allAccounts.map(acc => acc.currency))],
    totalBalance: allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  }
})

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

  // Если авторизован, загружаем данные о рекламодателях
  if (store.isAuthenticated) {
    await store.getAdvertiserInfo()
    
    // Store уже автоматически выберет первый активный аккаунт
  }

  // Инициализируем модальное окно Bootstrap
  const modalElement = document.getElementById('tiktokAuthModal')
  if (modalElement) {
    authModal = new Modal(modalElement)

    // Слушаем события модального окна
    modalElement.addEventListener('hidden.bs.modal', () => {
      resetModalState()
    })
  }
  
  // Инициализируем Bootstrap tooltips
  nextTick(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl)
    })
  })
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

        // Загружаем данные о рекламодателях после успешной авторизации
        if (store.isAuthenticated) {
          modalState.loadingMessage = 'Loading account information...'
          await store.getAdvertiserInfo()
        }

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

// Функции для обработки статуса аккаунта
const getAccountStatusText = (status) => {
  const statusMap = {
    STATUS_ENABLE: 'Active',
    STATUS_DISABLE: 'Disabled',
    STATUS_LIMIT: 'Limited',
    STATUS_PENDING: 'Pending',
    STATUS_REJECTED: 'Rejected',
  }
  return statusMap[status] || 'Unknown'
}

const getAccountStatusBadge = (status) => {
  const badgeMap = {
    STATUS_ENABLE: 'bg-success',
    STATUS_DISABLE: 'bg-danger',
    STATUS_LIMIT: 'bg-warning',
    STATUS_PENDING: 'bg-info',
    STATUS_REJECTED: 'bg-danger',
  }
  return badgeMap[status] || 'bg-secondary'
}

// Получить подробную информацию о статусе для тултипа
const getAccountStatusTooltip = (account) => {
  let tooltip = `Status: ${getAccountStatusText(account.status)}`
  
  if (account.status === 'STATUS_LIMIT' && account.rejection_reason) {
    const reason = parseRejectionReason(account.rejection_reason)
    tooltip += `\nReason: ${reason.message}`
    if (reason.endTime) {
      tooltip += `\nUntil: ${reason.endTime}`
    }
  }
  
  return tooltip
}

// Парсинг причины блокировки
const parseRejectionReason = (rejectionReason) => {
  if (!rejectionReason) return { message: 'No details available' }
  
  // Формат: "1:Your account has been suspended...,endtime:2035-08-13 07:19:04"
  const parts = rejectionReason.split(',endtime:')
  const message = parts[0].replace(/^\d+:/, '').trim()
  const endTime = parts[1] ? new Date(parts[1]).toLocaleString() : null
  
  return { message, endTime }
}

// Форматирование валюты
const formatCurrency = (amount, currency) => {
  if (!amount || amount === 0) return `0.00 ${currency}`
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  try {
    return formatter.format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

// Форматирование даты с учетом часового пояса
const formatDate = (timestamp, timezone) => {
  if (!timestamp) return 'N/A'
  
  const date = new Date(timestamp * 1000) // timestamp в секундах
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone || 'UTC'
    }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

// Получение отображаемого имени аккаунта
const getDisplayAccountName = (account) => {
  // Проверяем по ID или по содержимому полей name/company
  if (isAdminAccount(account)) {
    return 'Admin'
  }
  
  // Для остальных - обычное имя
  return account.name || account.advertiser_name || account.advertiser_id
}

// Получение отображаемого названия компании
const getDisplayCompanyName = (account) => {
  // Проверяем по ID или по содержимому полей name/company
  if (isAdminAccount(account)) {
    return 'Admin'
  }
  
  return account.company || account.name || account.advertiser_name || account.advertiser_id
}

// Проверка является ли аккаунт администраторским
const isAdminAccount = (account) => {
  return account.advertiser_id === ADMIN_ADVERTISER_ID || 
         account.name === 'News World One' || 
         account.company === 'News World One'
}

// Обработчик выбора аккаунта
const handleSelectAccount = async (advertiserId) => {
  await store.setSelectedAdvertiserId(advertiserId)
}
</script>

<style scoped>
/* Новые стили для аккаунтов */
.account-item {
  transition: background-color 0.2s ease;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}

.account-item:hover {
  background-color: var(--bs-gray-50);
}

.account-name {
  color: var(--bs-dark);
  font-weight: 600;
}

.account-status-badge {
  font-weight: 500;
  border-radius: 12px;
}

.account-details {
  margin-top: 0.5rem;
}

.account-details i {
  opacity: 0.7;
}

/* Стили для админ беджа */
.badge.bg-info {
  background-color: #0dcaf0 !important;
  color: white;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 4px;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 767.98px) {
  .card-header h5 {
    font-size: 1rem;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.375rem 0.5rem;
  }

  .card-body {
    padding: 1rem !important;
  }

  .list-group-item {
    padding: 0.5rem 0 !important;
  }

  .fw-bold.small {
    font-size: 0.8rem;
  }

  .text-muted {
    font-size: 0.7rem !important;
  }
  
  .account-details .d-flex {
    flex-direction: column;
    gap: 0.25rem !important;
  }
  
  .dropdown-menu {
    min-width: 200px !important;
  }
}

/* Предотвращаем переполнение */
.text-nowrap {
  white-space: nowrap;
}

.card-title {
  word-break: break-word;
}

/* Стили для dropdown фильтра */
.dropdown-menu {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.dropdown-header {
  font-weight: 600;
  color: var(--bs-primary);
  border-bottom: 1px solid var(--bs-border-color);
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
}
</style>
