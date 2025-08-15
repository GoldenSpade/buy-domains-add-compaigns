<template>
  <div>
    <div class="col-mb-12 pt-4 pb-4 d-flex align-items-center justify-content-center">
      <slot name="header-icon"></slot>
      <h1 class="fs-3 text-center">{{ props.title }}</h1>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['title'])
</script>
