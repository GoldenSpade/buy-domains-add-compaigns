<template>
  <div class="app mt-4 mb-4 px-3">
    <TheHeader title="Перевірка домену" />
    <div class="row">
      <div class="col-md-6">
        <DomainChecker />
        <SedoAdder />
      </div>
      <div class="col-md-6" :class="{ 'mt-4': isMobile }">
        <DnsManager />
        <ClickflareOffer />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import DomainChecker from './components/DomainChecker.vue'
import DnsManager from './components/DnsManager.vue'
import SedoAdder from './components/SedoAdder.vue'
import TheHeader from './components/TheHeader.vue'
import ClickflareOffer from './components/ClickflareOffer.vue'

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
