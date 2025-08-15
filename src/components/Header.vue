<template>
  <div>
    <div class="col-mb-12 pt-4 pb-4">
      <h1 class="fs-3 text-center">{{ props.title }}</h1>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['title'])
</script>
