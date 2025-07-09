<template>
  <div class="app col-12">
    <main class="main mt-5">
      <div class="wrapper text-center">
        <h1 class="fs-3">Перевірка домену</h1>
      </div>
      <DomainChecker />
      <DnsManager />
    </main>
  </div>
</template>

<script setup>
import DomainChecker from './components/DomainChecker.vue'
import DnsManager from './components/DnsManager.vue'
</script>

<style>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>
