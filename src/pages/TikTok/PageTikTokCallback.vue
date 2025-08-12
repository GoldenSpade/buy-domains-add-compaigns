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
              <p class="text-muted" v-if="isInIframe">Completing authorization...</p>
              <p class="text-muted" v-else>Redirecting to TikTok Manager...</p>
            </div>
            
            <div v-else-if="error" class="mb-3">
              <i class="fas fa-exclamation-circle text-danger fa-3x mb-3"></i>
              <h6 class="text-danger">Authorization Failed</h6>
              <p class="text-muted">{{ error }}</p>
              <router-link v-if="!isInIframe" to="/tiktok-manager" class="btn btn-primary">
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

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const success = ref(false)
const error = ref('')
const isInIframe = ref(false)

onMounted(async () => {
  // Проверяем, загружена ли страница в iframe
  isInIframe.value = window.self !== window.top

  try {
    // Извлекаем auth_code из URL параметров
    const authCode = route.query.auth_code || route.query.code
    
    if (!authCode) {
      error.value = 'Authorization code not found in URL parameters'
      loading.value = false
      return
    }

    console.log('Processing TikTok callback with auth_code:', authCode)
    
    // Если в iframe - отправляем сообщение в родительское окно
    if (isInIframe.value) {
      window.parent.postMessage({
        type: 'TIKTOK_AUTH_SUCCESS',
        authCode: authCode
      }, window.location.origin)
      
      success.value = true
      loading.value = false
      
      console.log('Message sent to parent window from iframe')
    }
    // Если в popup - отправляем сообщение в opener
    else if (window.opener) {
      window.opener.postMessage({
        type: 'TIKTOK_AUTH_SUCCESS',
        authCode: authCode
      }, window.location.origin)
      
      success.value = true
      loading.value = false
      
      // Закрываем popup через 1 секунду
      setTimeout(() => {
        window.close()
      }, 1000)
    } 
    // Если обычная страница - редиректим на TikTok Manager
    else {
      success.value = true
      loading.value = false
      
      // Редиректим через 2 секунды
      setTimeout(() => {
        router.push('/tiktok-manager')
      }, 2000)
    }
    
  } catch (err) {
    console.error('Error processing TikTok callback:', err)
    error.value = err.message || 'Unexpected error occurred'
    loading.value = false
  }
})
</script>