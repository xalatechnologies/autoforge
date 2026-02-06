<script setup>
defineProps({
  title: { type: String, default: undefined },
  tagline: { type: String, default: undefined },
  description: { type: String, default: undefined },
})
</script>

<template>
  <div class="ds-docs-hero">
    <h1 v-if="title" class="ds-docs-hero__title">{{ title }}</h1>
    <p v-if="tagline" class="ds-docs-hero__tagline">{{ tagline }}</p>
    <p v-if="description" class="ds-docs-hero__description">{{ description }}</p>
    <div v-if="$slots.actions" class="ds-docs-hero__actions">
      <slot name="actions" />
    </div>
    <div v-if="$slots.features" class="ds-docs-hero__features">
      <slot name="features" />
    </div>
  </div>
</template>
