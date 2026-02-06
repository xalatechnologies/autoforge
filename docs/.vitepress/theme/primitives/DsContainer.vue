<script setup>
const props = defineProps({
  maxWidth: { type: String, default: 'max' },
  padding: { type: String, default: 'lg' },
  fluid: { type: Boolean, default: false },
  centered: { type: Boolean, default: true },
})

const knownSizes = ['sm', 'md', 'lg', 'max', 'full']
</script>

<template>
  <div
    :class="[
      'ds-container',
      fluid ? 'ds-container--fluid' : (knownSizes.includes(maxWidth) ? `ds-container--${maxWidth}` : ''),
      `ds-container--pad-${padding}`,
      { 'ds-container--not-centered': !centered },
    ]"
    :style="!fluid && !knownSizes.includes(maxWidth) ? { maxWidth } : undefined"
  >
    <slot />
  </div>
</template>
