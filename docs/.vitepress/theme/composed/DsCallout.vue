<script setup>
defineProps({
  type: { type: String, default: 'info' },
  title: { type: String, default: undefined },
})
</script>

<template>
  <div :class="['ds-callout', `ds-callout--${type}`]">
    <div v-if="title" class="ds-callout__title">{{ title }}</div>
    <slot />
  </div>
</template>
