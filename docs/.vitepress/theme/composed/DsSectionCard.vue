<script setup>
defineProps({
  title: { type: String, default: undefined },
  subtitle: { type: String, default: undefined },
  variant: { type: String, default: 'default' },
  padding: { type: String, default: 'md' },
})
</script>

<template>
  <div :class="['ds-section-card', `ds-section-card--${variant}`]">
    <div v-if="title || $slots.header" class="ds-section-card__header">
      <slot name="header">
        <h3 class="ds-section-card__title">{{ title }}</h3>
        <p v-if="subtitle" class="ds-section-card__subtitle">{{ subtitle }}</p>
      </slot>
    </div>
    <div :class="['ds-section-card__body', `ds-section-card__body--pad-${padding}`]">
      <slot />
    </div>
    <div v-if="$slots.footer" class="ds-section-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>
