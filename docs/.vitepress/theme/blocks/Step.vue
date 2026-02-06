<script setup>
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <div class="ds-step">
    <div class="ds-step__number" />
    <div class="ds-step__content">
      <h4 class="ds-step__title">{{ title }}</h4>
      <div class="ds-step__body">
        <slot />
      </div>
    </div>
  </div>
</template>
