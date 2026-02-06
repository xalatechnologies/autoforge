<script setup lang="ts">
/**
 * RoadmapTimeline
 * 
 * Displays milestones as a vertical timeline with progress indicators.
 */
import { ref, computed } from 'vue'

const demoMilestones = [
  { 
    name: 'Foundation Complete', 
    targetWeek: 4, 
    targetScore: 67,
    status: 'active',
    description: 'Auth, RBAC, Tenant Isolation operational',
    phase: 'foundation'
  },
  { 
    name: 'Core Complete', 
    targetWeek: 8, 
    targetScore: 88,
    status: 'upcoming',
    description: 'All components migrated, security hardened',
    phase: 'core'
  },
  { 
    name: 'Production Ready', 
    targetWeek: 12, 
    targetScore: 100,
    status: 'upcoming',
    description: 'Full platform ready for production',
    phase: 'production'
  },
]

const milestones = ref(demoMilestones)
const currentScore = ref(47)

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return '#22c55e'
    case 'active': return '#3b82f6'
    default: return '#6b7280'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return '✓'
    case 'active': return '◉'
    default: return '○'
  }
}
</script>

<template>
  <div class="roadmap-timeline">
    <div class="timeline-header">
      <h4>12-Week Roadmap</h4>
      <span class="current-score">Current: {{ currentScore }}/100</span>
    </div>
    
    <div class="timeline-container">
      <div 
        v-for="(milestone, index) in milestones" 
        :key="milestone.name"
        class="timeline-item"
      >
        <div class="timeline-marker">
          <div 
            class="marker-dot"
            :style="{ 
              backgroundColor: getStatusColor(milestone.status),
              borderColor: getStatusColor(milestone.status)
            }"
          >
            {{ getStatusIcon(milestone.status) }}
          </div>
          <div 
            v-if="index < milestones.length - 1"
            class="marker-line"
            :class="{ 'line-completed': milestone.status === 'completed' }"
          />
        </div>
        
        <div class="milestone-content">
          <div class="milestone-header">
            <span class="milestone-name">{{ milestone.name }}</span>
            <span class="milestone-week">Week {{ milestone.targetWeek }}</span>
          </div>
          <p class="milestone-description">{{ milestone.description }}</p>
          <div class="milestone-footer">
            <span class="milestone-target">Target: {{ milestone.targetScore }}/100</span>
            <span 
              class="milestone-status"
              :style="{ color: getStatusColor(milestone.status) }"
            >
              {{ milestone.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roadmap-timeline {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 24px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.timeline-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.current-score {
  font-size: 13px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-divider);
  padding: 4px 12px;
  border-radius: 12px;
}

.timeline-container {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 16px;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 24px;
  flex-shrink: 0;
}

.marker-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  font-weight: bold;
  background: var(--vp-c-bg);
}

.marker-line {
  width: 2px;
  flex: 1;
  background: var(--vp-c-divider);
  min-height: 40px;
}

.line-completed {
  background: #22c55e;
}

.milestone-content {
  flex: 1;
  padding-bottom: 24px;
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.milestone-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.milestone-week {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.milestone-description {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.milestone-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.milestone-target {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.milestone-status {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}
</style>
