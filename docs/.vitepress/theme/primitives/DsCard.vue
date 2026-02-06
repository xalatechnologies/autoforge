<script setup>
defineProps({
  variant: { type: String, default: 'default' },
  padding: { type: String, default: 'md' },
})
</script>

<template>
  <div :class="['ds-card', `ds-card--${variant}`, `ds-card--pad-${padding}`]">
    <slot />
  </div>
</template>
