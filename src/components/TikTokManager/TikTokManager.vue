<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        
        <!-- Упрощенная панель авторизации -->
        <div class="card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">TikTok API Manager</h5>
            <span v-if="store.isAuthenticated" class="badge bg-success">
              <i class="fas fa-check me-1"></i>Connected
            </span>
            <span v-else class="badge bg-danger">
              <i class="fas fa-exclamation-triangle me-1"></i>Not Connected
            </span>
          </div>
          <div class="card-body">
            
            <!-- Если НЕ авторизован - показать кнопку авторизации -->
            <div v-if="!store.isAuthenticated" class="text-center">
              <div v-if="store.loading" class="mb-3">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Connecting to TikTok...
              </div>
              <div v-else>
                <p class="text-muted mb-3">Connect your TikTok Business account to start managing campaigns</p>
                <button @click="authorizeWithTikTok" class="btn btn-primary btn-lg" :disabled="store.loading">
                  <i class="fab fa-tiktok me-2"></i>Connect TikTok Account
                </button>
              </div>
              <div v-if="store.error" class="alert alert-danger mt-3">
                {{ store.error }}
                <button @click="store.clearError" class="btn-close float-end" aria-label="Close"></button>
              </div>
            </div>

            <!-- Если авторизован - показать управление -->
            <div v-else>
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <i class="fas fa-check-circle text-success me-2"></i>
                  <strong>TikTok account connected successfully</strong>
                  <div class="small text-muted mt-1">Ready to manage your advertising campaigns</div>
                </div>
                <div>
                  <button @click="store.testApi" class="btn btn-sm btn-outline-info me-2" :disabled="store.loading">
                    <i class="fas fa-sync-alt me-1"></i>Test Connection
                  </button>
                  <button @click="store.resetStore" class="btn btn-sm btn-outline-danger" :disabled="store.loading">
                    <i class="fas fa-sign-out-alt me-1"></i>Disconnect
                  </button>
                </div>
              </div>
              
              <!-- Показать данные рекламодателей если есть -->
              <div v-if="store.advertisers" class="mt-3">
                <h6>Connected Advertisers:</h6>
                <div class="bg-light p-3 rounded">
                  <pre class="mb-0 small">{{ JSON.stringify(store.advertisers, null, 2) }}</pre>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTikTokStore } from '@/stores/tiktokStore'
import { onMounted } from 'vue'

const store = useTikTokStore()

// Автоматическая инициализация при загрузке компонента
onMounted(async () => {
  await store.initializeAuth()
})

// Упрощенная авторизация - одна кнопка
const authorizeWithTikTok = async () => {
  await store.getAuthUrl()
  if (store.authUrl) {
    // Открываем в новой вкладке для авторизации
    window.open(store.authUrl, '_blank')
  }
}
</script>
