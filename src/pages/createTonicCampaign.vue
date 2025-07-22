<template>
  <div>
    <MainMenu />
    <div class="app mb-4 px-3">
      <Header title="Створення кампаній Tonic та додавання до ClickFlare" />
      <div class="row justify-content-center">
        <div class="col-md-6">
          <TonicCampaignForm />
        </div>
        <!-- <div class="col-md-6" :class="{ 'mt-4': isMobile }">
          <ClickflareOfferTonic />
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

import MainMenu from '@/components/MainMenu.vue'
import Header from '@/components/Header.vue'
import TonicCampaignForm from '@/components/createTonicCampaign/TonicCampaignForm.vue'
import ClickflareOfferTonic from '@/components/createTonicCampaign/ClickflareOfferTonic.vue'

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
