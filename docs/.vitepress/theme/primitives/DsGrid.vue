<script setup>
const props = defineProps({
  cols: { type: [String, Number], default: 3 },
  gap: { type: String, default: 'md' },
  minColWidth: { type: String, default: undefined },
})

const knownGaps = ['xs', 'sm', 'md', 'lg', 'xl']
const knownCols = [1, 2, 3, 4, 5, 6]
</script>

<template>
  <div
    :class="[
      'ds-grid',
      !minColWidth && knownCols.includes(Number(cols)) ? `ds-grid--cols-${cols}` : '',
      knownGaps.includes(gap) ? `ds-grid--gap-${gap}` : '',
    ]"
    :style="{
      ...(minColWidth ? { gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}, 1fr))` } : {}),
      ...(!knownCols.includes(Number(cols)) && !minColWidth ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : {}),
      ...(!knownGaps.includes(gap) ? { gap } : {}),
    }"
  >
    <slot />
  </div>
</template>
