<template>
  <div class="card p-4 bg-light">
    <AdTitlePrompt />
    <KeywordsPrompt />
    <URLPrompt />
    <!-- Clear LocalStorage Button -->
    <div class="text-center mt-4">
      <button
        class="btn btn-outline-danger px-4 py-2"
        style="min-width: 180px"
        @click="clearLocalStorage"
      >
        <i class="bi bi-trash"></i>
        Clear Cache
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChatGptStore } from '../../stores/chatGptStore'
import AdTitlePrompt from './AdTitlePrompt.vue'
import KeywordsPrompt from './KeywordsPrompt.vue'
import URLPrompt from './URLPrompt.vue'

const chatGptStore = useChatGptStore()

// Функция очистки localStorage
const clearLocalStorage = () => {
  if (confirm('Are you sure you want to clear all prompts? This action cannot be undone.')) {
    chatGptStore.clearLocalStorage()
    chatGptStore.prompts.adTitle.testAnswer = ''
    chatGptStore.prompts.adTitle.testError = ''
    chatGptStore.prompts.keywords.testAnswer = ''
    chatGptStore.prompts.keywords.testError = ''
    chatGptStore.prompts.url.testAnswer = ''
    chatGptStore.prompts.url.testError = ''
    console.log('🗑️ LocalStorage очищен пользователем')
  }
}
</script>
