<template>
  <div>
    <MainMenu />
    <div class="app mb-4 px-2 px-md-3">
      <Header title="TikTok Campaigns Manager">
        <template #header-icon>
          <i class="bi bi-tiktok me-2 fs-4" style="transform: translateY(-4px)"></i>
        </template>
      </Header>
      <div class="row justify-content-center">
        <div class="col-8">
          <TikTokManager />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue'
import MainMenu from '@/components/MainMenu.vue'
import TikTokManager from '@/components/TikTokManager/TikTokManager.vue'
</script>
