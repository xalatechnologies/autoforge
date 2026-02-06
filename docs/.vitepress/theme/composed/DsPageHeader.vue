<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: undefined },
  bordered: { type: Boolean, default: false },
})
</script>

<template>
  <div :class="['ds-page-header', bordered && 'ds-page-header--bordered']">
    <div class="ds-page-header__top">
      <div class="ds-page-header__title-area">
        <div class="ds-page-header__title-row">
          <h1 class="ds-page-header__title">{{ title }}</h1>
          <slot name="badge" />
        </div>
        <p v-if="subtitle" class="ds-page-header__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="ds-page-header__actions">
        <slot name="actions" />
      </div>
    </div>
    <div v-if="$slots.default" class="ds-page-header__content">
      <slot />
    </div>
  </div>
</template>
