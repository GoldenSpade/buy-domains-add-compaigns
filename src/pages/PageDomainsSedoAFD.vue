<template>
  <div>
    <MainMenu />
    <div class="app mb-4 px-3">
      <Header title="Sedo AFD">
        <template #header-icon>
          <i class="bi bi-diagram-3 me-2 fs-4" style="transform: translateY(-4px)"></i>
        </template>
      </Header>
      <div class="row">
        <div class="col-md-6">
          <DomainChecker />
          <SedoAdder />
        </div>
        <div class="col-md-6" :class="{ 'mt-4': isMobile }">
          <DnsManager />
          <ClickflareOfferSedo class="mt-3" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import MainMenu from '@/components/MainMenu.vue'
import DomainChecker from '@/components/domainsSedoAFD/DomainChecker.vue'
import DnsManager from '@/components/domainsSedoAFD/DnsManager.vue'
import SedoAdder from '@/components/domainsSedoAFD/SedoAdder.vue'
import Header from '@/components/Header.vue'
import ClickflareOfferSedo from '@/components/domainsSedoAFD/ClickflareOfferSedo.vue'

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
