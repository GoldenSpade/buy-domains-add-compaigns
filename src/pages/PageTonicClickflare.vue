<template>
  <div>
    <MainMenu />
    <div class="app mb-4 px-3">
      <Header title="Tonic AFD">
        <template #header-icon>
          <i class="bi bi-bar-chart-line me-2 fs-4" style="transform: translateY(-4px)"></i>
        </template>
      </Header>
      <div class="row">
        <div class="col-md-6">
          <TonicCampaignForm />
        </div>
        <div class="col-md-6" :class="{ 'mt-4': isMobile }">
          <CompletedCards />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

import MainMenu from '@/components/MainMenu.vue'
import Header from '@/components/Header.vue'
import TonicCampaignForm from '@/components/createTonicCampaign/TonicCampaignForm.vue'
import CompletedCards from '@/components/createTonicCampaign/CompletedCards.vue'

const isMobile = ref(window.innerWidth <= 767)

const handleResize = () => {
  isMobile.value = window.innerWidth <= 767
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
