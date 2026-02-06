<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  trend: { type: Object, default: undefined },
  variant: { type: String, default: 'default' },
})

const trendArrows = { up: '\u2191', down: '\u2193', neutral: '\u2192' }
</script>

<template>
  <div class="ds-stat-card">
    <div v-if="$slots.icon" :class="['ds-stat-card__icon', `ds-stat-card__icon--${variant}`]">
      <slot name="icon" />
    </div>
    <div class="ds-stat-card__content">
      <div class="ds-stat-card__value">{{ value }}</div>
      <div class="ds-stat-card__label">{{ label }}</div>
      <div
        v-if="trend"
        :class="['ds-stat-card__trend', `ds-stat-card__trend--${trend.direction || 'neutral'}`]"
      >
        <span>{{ trendArrows[trend.direction] || trendArrows.neutral }}</span>
        <span>{{ trend.value }}</span>
      </div>
    </div>
  </div>
</template>
