<template>
  <div class="app mt-4 mb-4 px-3">
    <Header title="Створення кампаній Sedo AFD" />
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
import DomainChecker from '@/components/domainsSedoAFD/DomainChecker.vue'
import DnsManager from '@/components/domainsSedoAFD/DnsManager.vue'
import SedoAdder from '@/components/domainsSedoAFD/SedoAdder.vue'
import Header from '@/components/domainsSedoAFD/Header.vue'
import ClickflareOffer from '@/components/domainsSedoAFD/ClickflareOffer.vue'

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
