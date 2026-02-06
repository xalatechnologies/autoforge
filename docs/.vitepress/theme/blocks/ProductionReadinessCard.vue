<script setup lang="ts">
/**
 * ProductionReadinessCard
 * 
 * Displays the current production readiness score with a progress gauge
 * and category breakdown. Uses Convex for real-time data.
 */
import { ref, computed, onMounted } from 'vue'

// Props for static/demo mode when Convex is not connected
const props = defineProps<{
  demo?: boolean
}>()

// Demo data (used before Convex is connected)
const demoData = {
  totalScore: 47,
  categories: [
    { category: 'security', weight: 20, currentScore: 30, notes: 'Implementation unclear' },
    { category: 'testing', weight: 20, currentScore: 50, notes: 'Unit good, E2E weak' },
    { category: 'architecture', weight: 15, currentScore: 60, notes: '7/18 migrated' },
    { category: 'compliance', weight: 15, currentScore: 25, notes: 'Not activated' },
    { category: 'performance', weight: 10, currentScore: 20, notes: 'No monitoring' },
    { category: 'monitoring', weight: 10, currentScore: 20, notes: 'No prod monitoring' },
    { category: 'documentation', weight: 5, currentScore: 80, notes: 'Comprehensive' },
    { category: 'cicd', weight: 5, currentScore: 60, notes: 'E2E disabled' },
  ]
}

const data = ref(demoData)
const isLoading = ref(false)

// Score color based on value
const scoreColor = computed(() => {
  const score = data.value.totalScore
  if (score >= 90) return '#22c55e' // green
  if (score >= 70) return '#3b82f6' // blue
  if (score >= 50) return '#f59e0b' // amber
  return '#ef4444' // red
})

const scoreLabel = computed(() => {
  const score = data.value.totalScore
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Needs Work'
})

// Category color helper
const getCategoryColor = (score: number) => {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#3b82f6'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

// Format category name for display
const formatCategory = (cat: string) => {
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace('cicd', 'CI/CD')
}
</script>

<template>
  <div class="readiness-card">
    <div class="score-section">
      <div class="score-gauge">
        <svg viewBox="0 0 120 120" class="gauge-svg">
          <!-- Background circle -->
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--vp-c-divider)"
            stroke-width="10"
          />
          <!-- Progress arc -->
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            :stroke="scoreColor"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="`${(data.totalScore / 100) * 314} 314`"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div class="score-value">
          <span class="score-number">{{ data.totalScore }}</span>
          <span class="score-max">/100</span>
        </div>
      </div>
      <div class="score-label" :style="{ color: scoreColor }">
        {{ scoreLabel }}
      </div>
    </div>

    <div class="categories-section">
      <h4>Category Breakdown</h4>
      <div class="category-list">
        <div 
          v-for="cat in data.categories" 
          :key="cat.category"
          class="category-row"
        >
          <div class="category-info">
            <span class="category-name">{{ formatCategory(cat.category) }}</span>
            <span class="category-weight">{{ cat.weight }}%</span>
          </div>
          <div class="category-bar-container">
            <div 
              class="category-bar"
              :style="{ 
                width: `${cat.currentScore}%`,
                backgroundColor: getCategoryColor(cat.currentScore)
              }"
            />
          </div>
          <span class="category-score">{{ cat.currentScore }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.readiness-card {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 150px;
}

.score-gauge {
  position: relative;
  width: 120px;
  height: 120px;
}

.gauge-svg {
  width: 100%;
  height: 100%;
}

.score-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.score-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  line-height: 1;
}

.score-max {
  font-size: 14px;
  color: var(--vp-c-text-3);
}

.score-label {
  font-weight: 600;
  font-size: 14px;
}

.categories-section {
  flex: 1;
  min-width: 280px;
}

.categories-section h4 {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-info {
  display: flex;
  justify-content: space-between;
  width: 120px;
  flex-shrink: 0;
}

.category-name {
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.category-weight {
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.category-bar-container {
  flex: 1;
  height: 8px;
  background: var(--vp-c-divider);
  border-radius: 4px;
  overflow: hidden;
}

.category-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.category-score {
  width: 40px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
</style>
