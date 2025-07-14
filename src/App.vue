<template>
  <div class="app mt-4 mb-4 px-3">
    <TheHeader title="Перевірка домену" />
    <div class="row">
      <div class="col-md-6">
        <DomainChecker />
        <SedoAdder />
      </div>
      <div class="col-md-6">
        <DnsManager />
        <ClickflareOffer />
      </div>
    </div>
  </div>
</template>

<script setup>
import DomainChecker from './components/DomainChecker.vue'
import DnsManager from './components/DnsManager.vue'
import SedoAdder from './components/SedoAdder.vue'
import TheHeader from './components/TheHeader.vue'
import ClickflareOffer from './components/ClickflareOffer.vue'
</script>
