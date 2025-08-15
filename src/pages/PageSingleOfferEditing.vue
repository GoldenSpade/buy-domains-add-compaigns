<template>
  <div>
    <MainMenu />
    <div class="app mb-4 px-3">
      <Header title="Single Offer Editing">
        <template #header-icon>
          <i class="bi bi-pencil me-2 fs-4" style="transform: translateY(-4px)"></i>
        </template>
      </Header>
      <div class="row justify-content-center">
        <div class="col-md-8">
          <SingleOfferEditing />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue'
import MainMenu from '@/components/MainMenu.vue'
import SingleOfferEditing from '@/components/SingleOfferEditing.vue'
</script>
