<script setup>
defineProps({
  name: { type: String, required: true },
  type: { type: String, default: 'string' },
  required: { type: Boolean, default: false },
  default: { type: String, default: undefined },
  description: { type: String, default: undefined },
})
</script>

<template>
  <div class="ds-api-property">
    <span class="ds-api-property__name">{{ name }}</span>
    <span v-if="required" class="ds-api-property__required">required</span>
    <span class="ds-api-property__type">{{ type }}</span>
    <span class="ds-api-property__desc">
      {{ description }}
      <span v-if="$props.default" class="ds-api-property__default">
        Default: <code>{{ $props.default }}</code>
      </span>
    </span>
  </div>
</template>
