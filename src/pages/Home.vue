<template>
  <div class="container mt-5 text-center">
    <h1 class="mb-4"><i class="bi bi-globe2 me-2"></i>Панель управління</h1>
    <p class="lead">Ласкаво просимо! Оберіть розділ щоб розпочати роботу.</p>
    <router-link :to="{ name: 'domainsSedoAFD' }" class="fs-5">Створення кампаній Sedo AFD</router-link>
  </div>
</template>
