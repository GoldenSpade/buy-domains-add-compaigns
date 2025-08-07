<template>
  <div>
    <MainMenu />
    <div class="app mb-4 px-3">
      <Header title="Google Ads Manager" />
      <div class="row justify-content-center">
        <div class="col-md-8">
          <GoogleKeywordsPlanner />
        </div>
        <!-- <div class="col-md-6" :class="{ 'mt-4': isMobile }">col-2</div> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import MainMenu from '@/components/MainMenu.vue'
import Header from '@/components/Header.vue'
import GoogleKeywordsPlanner from '@/components/GoogleKeywordsPlanner.vue'

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
