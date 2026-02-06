<script setup>
defineProps({
  method: { type: String, default: 'GET' },
  path: { type: String, required: true },
  description: { type: String, default: undefined },
  auth: { type: Boolean, default: false },
})
</script>

<template>
  <div class="ds-api-endpoint">
    <div class="ds-api-endpoint__header">
      <span :class="['ds-api-endpoint__method', `ds-api-endpoint__method--${method.toLowerCase()}`]">
        {{ method }}
      </span>
      <code class="ds-api-endpoint__path">{{ path }}</code>
      <span v-if="auth" class="ds-api-endpoint__auth">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Auth
      </span>
    </div>
    <div v-if="description" class="ds-api-endpoint__description">{{ description }}</div>
    <div class="ds-api-endpoint__body">
      <slot />
    </div>
  </div>
</template>
