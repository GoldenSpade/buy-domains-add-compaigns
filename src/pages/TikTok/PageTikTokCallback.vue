<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header text-center">
            <h5>TikTok Authorization</h5>
          </div>
          <div class="card-body text-center">
            
            <div v-if="loading" class="mb-3">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Processing...</span>
              </div>
              <p class="mt-3">Processing authorization...</p>
            </div>
            
            <div v-else-if="success" class="mb-3">
              <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
              <h6 class="text-success">Authorization Successful!</h6>
              <p class="text-muted">Redirecting to TikTok Manager...</p>
            </div>
            
            <div v-else-if="error" class="mb-3">
              <i class="fas fa-exclamation-circle text-danger fa-3x mb-3"></i>
              <h6 class="text-danger">Authorization Failed</h6>
              <p class="text-muted">{{ error }}</p>
              <router-link to="/tiktok-manager" class="btn btn-primary">
                Try Again
              </router-link>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTikTokStore } from '@/stores/tiktokStore'

const route = useRoute()
const router = useRouter()
const store = useTikTokStore()

const loading = ref(true)
const success = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    // Извлекаем auth_code из URL параметров
    const authCode = route.query.auth_code || route.query.code
    
    if (!authCode) {
      error.value = 'Authorization code not found in URL parameters'
      loading.value = false
      return
    }

    console.log('Processing TikTok callback with auth_code:', authCode)
    
    // Обрабатываем авторизацию через store
    const authSuccess = await store.handleAuthCallback(authCode)
    
    if (authSuccess) {
      success.value = true
      // Перенаправляем на страницу TikTok Manager через 2 секунды
      setTimeout(() => {
        router.push('/tiktok-manager')
      }, 2000)
    } else {
      error.value = store.error || 'Failed to process authorization'
    }
    
  } catch (err) {
    console.error('Error processing TikTok callback:', err)
    error.value = err.message || 'Unexpected error occurred'
  } finally {
    loading.value = false
  }
})
</script>