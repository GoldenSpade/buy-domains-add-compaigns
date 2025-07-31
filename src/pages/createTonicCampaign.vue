<template>
  <div>
    <MainMenu />
    <div class="app mb-4 px-3">
      <Header title="Tonic AFD" />
      <div class="row">
        <!-- Ліва колонка - форма створення кампаній -->
        <div class="col-md-6">
          <TonicCampaignForm />
        </div>

        <!-- Права колонка - активні кампанії -->
        <div class="col-md-6" :class="{ 'mt-4': isMobile }">
          <ActiveCardsColumn />
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
import ActiveCardsColumn from '@/components/createTonicCampaign/ActiveCardsColumn.vue'

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
