<template>
  <div class="keywords-planner">
    <!-- Заголовок -->
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="bi bi-search"></i>
          Google Keywords Planner
        </h5>
      </div>
      <div class="card-body">
        <p class="text-muted mb-0">Пошук та аналіз ключових слів за допомогою Google Ads API</p>
      </div>
    </div>

    <!-- Статус підключення -->
    <div class="card mb-4">
      <div class="card-header">
        <h6 class="mb-0">Статус підключення</h6>
      </div>
      <div class="card-body">
        <div v-if="loading.status" class="text-center">
          <div class="spinner-border spinner-border-sm me-2"></div>
          Перевіряємо підключення...
        </div>
        <div v-else>
          <div class="row">
            <div class="col-md-6">
              <div class="d-flex align-items-center mb-2">
                <i
                  :class="
                    apiStatus.configured
                      ? 'bi bi-check-circle text-success'
                      : 'bi bi-x-circle text-danger'
                  "
                  class="me-2"
                ></i>
                <span>API налаштований: {{ apiStatus.configured ? 'Так' : 'Ні' }}</span>
              </div>
              <div class="d-flex align-items-center mb-3">
                <i
                  :class="
                    apiStatus.authorized
                      ? 'bi bi-check-circle text-success'
                      : 'bi bi-x-circle text-danger'
                  "
                  class="me-2"
                ></i>
                <span>Авторизований: {{ apiStatus.authorized ? 'Так' : 'Ні' }}</span>
              </div>
              
              <!-- Кнопка авторизації -->
              <div v-if="apiStatus.configured && !apiStatus.authorized" class="mb-3">
                <button @click="authorize" class="btn btn-primary" :disabled="loading.authorize">
                  <span v-if="loading.authorize">
                    <div class="spinner-border spinner-border-sm me-2"></div>
                    Отримуємо URL...
                  </span>
                  <span v-else>
                    <i class="bi bi-shield-check"></i>
                    Авторизувати Google Ads API
                  </span>
                </button>
                <div class="mt-2">
                  <small class="text-muted">
                    Після авторизації додайте Refresh Token в .env файл та перезапустіть сервер
                  </small>
                </div>
              </div>

              <!-- Інструкції для авторизації -->
              <div v-if="apiStatus.configured && !apiStatus.authorized" class="alert alert-info">
                <h6 class="alert-heading">
                  <i class="bi bi-info-circle"></i>
                  Як отримати авторизацію:
                </h6>
                <ol class="mb-0">
                  <li>Натисніть кнопку "Авторизувати Google Ads API"</li>
                  <li>Увійдіть в свій Google акаунт з доступом до Google Ads</li>
                  <li>Дайте дозвіл додатку на доступ до Google Ads</li>
                  <li>Скопіюйте отриманий Refresh Token</li>
                  <li>Додайте його в .env файл як GOOGLE_ADS_REFRESH_TOKEN</li>
                  <li>Перезапустіть сервер</li>
                </ol>
              </div>
            </div>
            
            <!-- Деталі конфігурації -->
            <div class="col-md-6" v-if="apiStatus.details">
              <small class="text-muted">
                <div class="mb-1">
                  Client ID: 
                  <i :class="apiStatus.details.clientId ? 'bi bi-check text-success' : 'bi bi-x text-danger'"></i>
                </div>
                <div class="mb-1">
                  Client Secret: 
                  <i :class="apiStatus.details.clientSecret ? 'bi bi-check text-success' : 'bi bi-x text-danger'"></i>
                </div>
                <div class="mb-1">
                  Developer Token: 
                  <i :class="apiStatus.details.developerToken ? 'bi bi-check text-success' : 'bi bi-x text-danger'"></i>
                </div>
                <div class="mb-1">
                  Refresh Token: 
                  <i :class="apiStatus.details.refreshToken ? 'bi bi-check text-success' : 'bi bi-x text-danger'"></i>
                </div>
                <div>
                  Customer ID: 
                  <i :class="apiStatus.details.customerId ? 'bi bi-check text-success' : 'bi bi-x text-danger'"></i>
                </div>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Форма пошуку -->
    <div class="card mb-4" v-if="apiStatus.authorized">
      <div class="card-header">
        <h6 class="mb-0">Пошук ключових слів</h6>
      </div>
      <div class="card-body">
        <form @submit.prevent="searchKeywords">
          <div class="row">
            <div class="mb-3">
              <label class="form-label">Ключове слово</label>
              <input
                v-model="searchForm.keyword"
                type="text"
                class="form-control"
                placeholder="Введіть ключове слово..."
                maxlength="80"
                required
              />
              <div v-if="searchForm.keyword.length > 75" class="form-text text-warning">
                Залишилося символів: {{ 80 - searchForm.keyword.length }}
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Мова</label>
              <select v-model="searchForm.language" class="form-select">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="uk">Українська</option>
                <option value="ru">Російська</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Країна</label>
              <select v-model="searchForm.country" class="form-select">
                <option value="US">США</option>
                <option value="DE">Німеччина</option>
                <option value="UA">Україна</option>
                <option value="RU">Росія</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-success"
            :disabled="loading.search || !searchForm.keyword"
          >
            <span v-if="loading.search">
              <div class="spinner-border spinner-border-sm me-2"></div>
              Пошук...
            </span>
            <span v-else>
              <i class="bi bi-search"></i>
              Знайти ключові слова
            </span>
          </button>
        </form>
      </div>
    </div>

    <!-- Результати пошуку -->
    <div class="card" v-if="keywords.length > 0 || loading.search">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">
          <span v-if="loading.search">Пошук ключових слів...</span>
          <span v-else>Результати пошуку</span>
        </h6>
        <div v-if="!loading.search && keywords.length > 0">
          <span class="badge bg-primary me-2">{{ keywords.length }} слів</span>
          <button @click="exportKeywords" class="btn btn-sm btn-outline-success">
            <i class="bi bi-download"></i>
            Експорт
          </button>
        </div>
      </div>
      <div class="card-body">
        <!-- Індикатор завантаження -->
        <div v-if="loading.search" class="text-center py-5">
          <div class="spinner-border text-primary me-3"></div>
          <span class="text-muted">Отримуємо ключові слова від Google Ads API...</span>
        </div>
        
        <!-- Фільтри та результати -->
        <div v-else-if="keywords.length > 0">
          <!-- Фільтри -->
          <div class="row mb-3">
            <div class="col-md-4">
              <input
                v-model="filters.search"
                type="text"
                class="form-control form-control-sm"
                placeholder="Фільтр за ключовими словами..."
              />
            </div>
            <div class="col-md-4">
              <select v-model="filters.competition" class="form-select form-select-sm">
                <option value="">Усі рівні конкуренції</option>
                <option value="LOW">Низька конкуренція</option>
                <option value="MEDIUM">Середня конкуренція</option>
                <option value="HIGH">Висока конкуренція</option>
              </select>
            </div>
            <div class="col-md-4">
              <select v-model="filters.sortBy" class="form-select form-select-sm">
                <option value="monthlySearches">За пошуками</option>
                <option value="keyword">За алфавітом</option>
                <option value="competition">За конкуренцією</option>
              </select>
            </div>
          </div>

          <!-- Таблиця результатів -->
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Ключове слово</th>
                  <th>Пошуки/місяць</th>
                  <th>Конкуренція</th>
                  <th>Мін. ставка</th>
                  <th>Макс. ставка</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(keyword, index) in filteredKeywords" :key="index">
                  <td>
                    <strong>{{ keyword.keyword }}</strong>
                  </td>
                  <td>
                    <span class="badge bg-info">
                      {{ formatNumber(keyword.monthlySearches) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="getCompetitionClass(keyword.competition)">
                      {{ getCompetitionText(keyword.competition) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="keyword.lowBid" class="text-success"> ${{ keyword.lowBid }} </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <span v-if="keyword.highBid" class="text-danger"> ${{ keyword.highBid }} </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <button
                      @click="copyKeyword(keyword.keyword)"
                      class="btn btn-sm btn-outline-primary"
                      title="Скопіювати"
                    >
                      <i class="bi bi-clipboard"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Повідомлення про відсутність результатів -->
        <div v-else class="text-center py-4 text-muted">
          <i class="bi bi-search" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0">Введіть ключове слово та натисніть "Знайти ключові слова"</p>
        </div>

        <!-- Пагінація -->
        <nav v-if="!loading.search && keywords.length > 0 && filteredKeywords.length > itemsPerPage">
          <ul class="pagination pagination-sm justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="currentPage = Math.max(1, currentPage - 1)">
                Назад
              </button>
            </li>
            <li
              v-for="page in totalPages"
              :key="page"
              class="page-item"
              :class="{ active: page === currentPage }"
            >
              <button class="page-link" @click="currentPage = page">
                {{ page }}
              </button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button
                class="page-link"
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
              >
                Вперед
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Повідомлення про помилку -->
    <div v-if="error" class="alert" :class="getErrorClass(error)" role="alert">
      <div class="d-flex align-items-center">
        <i :class="getErrorIcon(error)" class="me-2"></i>
        <div>
          <h6 class="alert-heading mb-1">{{ getErrorTitle(error) }}</h6>
          <p class="mb-0">{{ error }}</p>
        </div>
      </div>
      <button @click="error = ''" type="button" class="btn-close" aria-label="Закрити"></button>
    </div>

    <!-- Модальне вікно з інструкціями авторизації -->
    <div v-if="showAuthModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-shield-check text-primary"></i>
              Авторизація Google Ads API
            </h5>
            <button @click="showAuthModal = false" type="button" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <h6 class="alert-heading">
                <i class="bi bi-info-circle"></i>
                Що робити далі:
              </h6>
              <ol class="mb-0">
                <li><strong>Авторизуйтесь</strong> в Google акаунті у відкритому вікні</li>
                <li><strong>Дайте дозвіл</strong> додатку на доступ до Google Ads</li>
                <li><strong>Скопіюйте Refresh Token</strong> з результуючої сторінки</li>
                <li><strong>Додайте token</strong> в .env файл:</li>
              </ol>
            </div>
            
            <div class="bg-dark text-light p-3 rounded">
              <code>GOOGLE_ADS_REFRESH_TOKEN=ваш_токен_тут</code>
            </div>
            
            <div class="alert alert-warning mt-3">
              <i class="bi bi-exclamation-triangle"></i>
              <strong>Важливо:</strong> Після додавання токену обов'язково перезапустіть сервер командою <code>npm run server</code>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="checkApiStatus" class="btn btn-primary">
              <i class="bi bi-arrow-clockwise"></i>
              Перевірити статус
            </button>
            <button @click="showAuthModal = false" class="btn btn-secondary">Закрити</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// Реактивні дані
const loading = ref({
  status: false,
  customers: false,
  search: false,
  authorize: false,
})

const apiStatus = ref({
  configured: false,
  authorized: false,
})

const customers = ref([])
const keywords = ref([])
const error = ref('')
const showAuthModal = ref(false)

const searchForm = ref({
  keyword: '',
  customerId: '', // Буде встановлено автоматично
  language: 'en',
  country: 'US',
})

const filters = ref({
  search: '',
  competition: '',
  sortBy: 'monthlySearches',
})

const currentPage = ref(1)
const itemsPerPage = ref(20)

// Обчислювані властивості
const filteredKeywords = computed(() => {
  let filtered = keywords.value

  // Фільтр за пошуком
  if (filters.value.search) {
    filtered = filtered.filter((kw) =>
      kw.keyword.toLowerCase().includes(filters.value.search.toLowerCase())
    )
  }

  // Фільтр за конкуренцією
  if (filters.value.competition) {
    filtered = filtered.filter((kw) => kw.competition === filters.value.competition)
  }

  // Сортування
  filtered.sort((a, b) => {
    const sortBy = filters.value.sortBy
    if (sortBy === 'keyword') {
      return a.keyword.localeCompare(b.keyword)
    } else if (sortBy === 'competition') {
      return a.competition.localeCompare(b.competition)
    } else {
      return b.monthlySearches - a.monthlySearches
    }
  })

  // Пагінація
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(keywords.value.length / itemsPerPage.value)
})

// Методи
const checkApiStatus = async () => {
  loading.value.status = true
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/google-ads/status`)
    apiStatus.value = response.data

    // Автоматично встановлюємо default customer ID
    if (response.data.authorized) {
      searchForm.value.customerId = 'default'
    }
  } catch (err) {
    error.value = 'Помилка перевірки статусу API'
  } finally {
    loading.value.status = false
  }
}

const authorize = async () => {
  loading.value.authorize = true
  error.value = ''
  
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/google-ads/auth-url`)
    
    if (!response.data.authUrl) {
      error.value = response.data.error || 'Не вдалося отримати URL авторизації'
      return
    }
    
    // Відкриваємо popup для авторизації
    const authWindow = window.open(
      response.data.authUrl, 
      'google-ads-auth', 
      'width=600,height=700,scrollbars=yes,resizable=yes'
    )

    if (!authWindow) {
      error.value = 'Не вдалося відкрити вікно авторизації. Дозвольте popup-и для цього сайту.'
      return
    }

    // Показуємо модальне вікно з інструкціями
    showAuthModal.value = true
    
    // Перевіряємо, чи закрилось вікно авторизації
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed)
        // Перевіряємо статус через 2 секунди після закриття
        setTimeout(checkApiStatus, 2000)
      }
    }, 1000)

  } catch (err) {
    error.value = err.response?.data?.error || 'Помилка отримання URL авторизації'
  } finally {
    loading.value.authorize = false
  }
}

const loadCustomers = async () => {
  loading.value.customers = true
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/google-ads/customers`
    )
    customers.value = response.data.customers
  } catch (err) {
    error.value = 'Помилка завантаження Customer ID'
  } finally {
    loading.value.customers = false
  }
}

const searchKeywords = async () => {
  loading.value.search = true
  error.value = ''

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/google-ads/keywords`,
      searchForm.value
    )
    
    if (!response.data.keywords || response.data.keywords.length === 0) {
      error.value = 'За вашим запитом не знайдено ключових слів. Спробуйте інше слово.'
      keywords.value = []
    } else {
      keywords.value = response.data.keywords
      error.value = ''
    }
    
    currentPage.value = 1
  } catch (err) {
    error.value = err.response?.data?.error || 'Помилка пошуку ключових слів'
    if (err.response?.data?.details) {
      console.error('Деталі помилки:', err.response.data.details)
    }
    keywords.value = []
  } finally {
    loading.value.search = false
  }
}

const exportKeywords = () => {
  const csvContent = [
    ['Ключове слово', 'Пошуки/місяць', 'Конкуренція', 'Мін. ставка', 'Макс. ставка'],
    ...keywords.value.map((kw) => [
      kw.keyword,
      kw.monthlySearches,
      kw.competition,
      kw.lowBid || '',
      kw.highBid || '',
    ]),
  ]
    .map((row) => row.join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `keywords_${searchForm.value.keyword}_${Date.now()}.csv`
  link.click()
}

const copyKeyword = async (keyword) => {
  try {
    await navigator.clipboard.writeText(keyword)
    // Можна додати toast повідомлення
  } catch (err) {
    console.error('Помилка копіювання:', err)
  }
}

// Допоміжні функції
const formatNumber = (num) => {
  return new Intl.NumberFormat('uk-UA').format(num)
}

const getCompetitionClass = (competition) => {
  switch (competition) {
    case 'LOW':
      return 'bg-success'
    case 'MEDIUM':
      return 'bg-warning'
    case 'HIGH':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}

const getCompetitionText = (competition) => {
  switch (competition) {
    case 'LOW':
      return 'Низька'
    case 'MEDIUM':
      return 'Середня'
    case 'HIGH':
      return 'Висока'
    default:
      return 'Невідомо'
  }
}

// Обробка помилок
const getErrorClass = (errorMessage) => {
  if (errorMessage.includes('авторизації') || errorMessage.includes('автентифікації')) {
    return 'alert-warning'
  }
  if (errorMessage.includes('не знайдено ключових слів')) {
    return 'alert-info'
  }
  if (errorMessage.includes('ліміт запитів')) {
    return 'alert-warning'
  }
  return 'alert-danger'
}

const getErrorIcon = (errorMessage) => {
  if (errorMessage.includes('авторизації') || errorMessage.includes('автентифікації')) {
    return 'bi bi-shield-exclamation'
  }
  if (errorMessage.includes('не знайдено ключових слів')) {
    return 'bi bi-info-circle'
  }
  if (errorMessage.includes('ліміт запитів')) {
    return 'bi bi-clock'
  }
  return 'bi bi-exclamation-triangle'
}

const getErrorTitle = (errorMessage) => {
  if (errorMessage.includes('авторизації') || errorMessage.includes('автентифікації')) {
    return 'Потрібна авторизація'
  }
  if (errorMessage.includes('не знайдено ключових слів')) {
    return 'Інформація'
  }
  if (errorMessage.includes('ліміт запитів')) {
    return 'Обмеження API'
  }
  return 'Помилка'
}

// Життєвий цикл
onMounted(() => {
  checkApiStatus()
})
</script>

<style scoped>
.keywords-planner {
  max-width: 100%;
}

.table th {
  font-weight: 600;
  border-top: none;
}

.badge {
  font-size: 0.75em;
}

.pagination {
  margin-bottom: 0;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}
</style>
