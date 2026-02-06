<script setup>
defineProps({
  variant: { type: String, default: 'accent' },
  size: { type: String, default: 'sm' },
})
</script>

<template>
  <span :class="['ds-badge', `ds-badge--${variant}`, `ds-badge--${size}`]">
    <slot />
  </span>
</template>
