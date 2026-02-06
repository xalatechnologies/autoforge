<script setup>
defineProps({
  cols: { type: [String, Number], default: 3 },
  gap: { type: String, default: 'md' },
})
</script>

<template>
  <DsGrid :cols="cols" :gap="gap" minColWidth="280px">
    <slot />
  </DsGrid>
</template>
