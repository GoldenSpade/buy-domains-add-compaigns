<template>
  <div>
    <MainMenu />
    <div class="app mb-4 px-3">
      <Header title="Prompts Manager" />
      <div class="row justify-content-center">
        <div class="col-md-8">
          <ChatGptPromptsManager />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue'
import MainMenu from '@/components/MainMenu.vue'
import ChatGptPromptsManager from '@/components/promptsManager/ChatGptPromptsManager.vue'
</script>
