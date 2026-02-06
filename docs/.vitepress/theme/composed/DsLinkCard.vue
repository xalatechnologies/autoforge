<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  href: { type: String, required: true },
})
</script>

<template>
  <a :href="href" class="ds-link-card">
    <div v-if="$slots.icon" class="ds-link-card__icon">
      <slot name="icon" />
    </div>
    <div class="ds-link-card__body">
      <div class="ds-link-card__title">{{ title }}</div>
      <div v-if="description" class="ds-link-card__description">{{ description }}</div>
    </div>
    <span class="ds-link-card__arrow">&rarr;</span>
  </a>
</template>
