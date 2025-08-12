<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <!-- Шаг 1: Получение Authorization URL -->
        <div class="card mb-3">
          <div class="card-header">
            <h5>Step 1: Authorization</h5>
          </div>
          <div class="card-body">
            <button @click="getAuthUrl" class="btn btn-primary me-2" :disabled="loading">
              Get Authorization URL
            </button>
            <div v-if="authUrl" class="mt-3">
              <p>Authorization URL:</p>
              <a :href="authUrl" target="_blank" class="btn btn-success">
                Open TikTok Authorization
              </a>
            </div>
          </div>
        </div>

        <!-- Шаг 2: Обмен кода на токен -->
        <div class="card mb-3">
          <div class="card-header">
            <h5>Step 2: Exchange Code for Token</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="authCode" class="form-label">Authorization Code:</label>
              <input
                v-model="authCode"
                type="text"
                class="form-control"
                id="authCode"
                placeholder="Enter authorization code from callback"
              />
            </div>
            <button @click="exchangeToken" class="btn btn-warning" :disabled="loading || !authCode">
              Exchange for Access Token
            </button>
            <div v-if="accessToken" class="mt-3">
              <p><strong>Access Token:</strong></p>
              <div class="alert alert-success">
                {{ accessToken }}
              </div>
            </div>
          </div>
        </div>

        <!-- Шаг 3: Тест API -->
        <div class="card mb-3">
          <div class="card-header">
            <h5>Step 3: Test API</h5>
          </div>
          <div class="card-body">
            <button @click="testApi" class="btn btn-info" :disabled="loading || !accessToken">
              Get Advertisers
            </button>
            <div v-if="advertisers" class="mt-3">
              <p><strong>Advertisers:</strong></p>
              <pre class="bg-light p-3">{{ JSON.stringify(advertisers, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <!-- Результаты и ошибки -->
        <div v-if="error" class="alert alert-danger"><strong>Error:</strong> {{ error }}</div>

        <div v-if="loading" class="text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const loading = ref(false)
const authUrl = ref('')
const authCode = ref('')
const accessToken = ref('')
const advertisers = ref(null)
const error = ref('')

const getAuthUrl = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth-url`)
    authUrl.value = response.data.authUrl
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  }

  loading.value = false
}

const exchangeToken = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/exchange-token`, {
      auth_code: authCode.value,
    })
    accessToken.value = response.data.data.data.access_token
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  }

  loading.value = false
}

const testApi = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/advertisers`, {
      params: { access_token: accessToken.value },
    })
    advertisers.value = response.data.data
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  }

  loading.value = false
}
</script>
