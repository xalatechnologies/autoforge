<script setup>
defineProps({
  direction: { type: String, default: 'vertical' },
  gap: { type: String, default: 'md' },
  align: { type: String, default: undefined },
  justify: { type: String, default: undefined },
  wrap: { type: Boolean, default: false },
})

const knownGaps = ['xs', 'sm', 'md', 'lg', 'xl']
</script>

<template>
  <div
    :class="[
      'ds-stack',
      `ds-stack--${direction}`,
      knownGaps.includes(gap) ? `ds-stack--gap-${gap}` : '',
      wrap && 'ds-stack--wrap',
      align && `ds-stack--align-${align}`,
      justify && `ds-stack--justify-${justify}`,
    ]"
    :style="!knownGaps.includes(gap) ? { gap } : undefined"
  >
    <slot />
  </div>
</template>
