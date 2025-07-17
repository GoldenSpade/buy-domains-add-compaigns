<template>
  <div class="row">
    <div class="col-mb-12 mt-4 mb-4">
      <h1 class="fs-3 text-center">{{ props.title }}</h1>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['title'])
</script>
