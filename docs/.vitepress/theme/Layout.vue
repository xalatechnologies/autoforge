<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { watchEffect } from 'vue'

const { isDark } = useData()

watchEffect(() => {
  document.documentElement.setAttribute('data-color-scheme', isDark.value ? 'dark' : 'light')
  document.documentElement.setAttribute('data-size', 'md')
  document.documentElement.setAttribute('data-typography', 'primary')
})
</script>

<template>
  <DefaultTheme.Layout />
</template>
