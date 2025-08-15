<template>
  <div>
    <MainMenu />
    <div class="app mb-4 px-2 px-md-3">
      <Header title="TikTok Campaigns Manager" />
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10 col-xl-8">
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
