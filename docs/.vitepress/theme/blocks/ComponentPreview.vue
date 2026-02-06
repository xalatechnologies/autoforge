<script setup>
defineProps({
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
})
</script>

<template>
  <div class="ds-component-preview">
    <div v-if="title" class="ds-component-preview__header">
      <div class="ds-component-preview__title">{{ title }}</div>
      <div v-if="description" class="ds-component-preview__description">{{ description }}</div>
    </div>
    <div class="ds-component-preview__preview">
      <slot name="preview" />
    </div>
    <div v-if="$slots.code" class="ds-component-preview__code">
      <slot name="code" />
    </div>
  </div>
</template>
