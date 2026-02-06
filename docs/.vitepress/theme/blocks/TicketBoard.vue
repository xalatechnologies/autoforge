<script setup lang="ts">
/**
 * TicketBoard
 * 
 * Kanban-style board showing tickets by status.
 * Displays todo, in-progress, done, and blocked columns.
 */
import { ref, computed } from 'vue'

// Demo data (used before Convex is connected)
const demoTickets = [
  { ticketId: 'A1', title: 'RBAC and Auth Migration', status: 'todo', priority: 'critical', track: 'A', scoreImpact: 8 },
  { ticketId: 'B1', title: 'Rate Limiting and Secrets', status: 'todo', priority: 'critical', track: 'B', scoreImpact: 6 },
  { ticketId: 'A2', title: 'Bookings and Addons Migration', status: 'todo', priority: 'high', track: 'A', scoreImpact: 7 },
  { ticketId: 'C1', title: 'Performance Baseline', status: 'todo', priority: 'high', track: 'C', scoreImpact: 5 },
  { ticketId: 'B2', title: 'GDPR Compliance', status: 'todo', priority: 'high', track: 'B', scoreImpact: 5 },
  { ticketId: 'A3', title: 'Pricing and Billing Migration', status: 'todo', priority: 'high', track: 'A', scoreImpact: 7 },
  { ticketId: 'C2', title: 'Testing Expansion', status: 'todo', priority: 'medium', track: 'C', scoreImpact: 4 },
  { ticketId: 'D1', title: 'Web and Minside Completion', status: 'todo', priority: 'medium', track: 'D', scoreImpact: 4 },
]

const tickets = ref(demoTickets)

const columns = [
  { id: 'todo', label: 'To Do', color: '#6b7280' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'done', label: 'Done', color: '#22c55e' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444' },
]

const getTicketsByStatus = (status: string) => {
  return tickets.value.filter(t => t.status === status)
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return '#dc2626'
    case 'high': return '#f59e0b'
    case 'medium': return '#3b82f6'
    case 'low': return '#6b7280'
    default: return '#6b7280'
  }
}

const getTrackColor = (track: string) => {
  switch (track) {
    case 'A': return '#8b5cf6' // purple
    case 'B': return '#ec4899' // pink
    case 'C': return '#06b6d4' // cyan
    case 'D': return '#f97316' // orange
    case 'E': return '#22c55e' // green
    default: return '#6b7280'
  }
}
</script>

<template>
  <div class="ticket-board">
    <div 
      v-for="column in columns" 
      :key="column.id"
      class="board-column"
    >
      <div class="column-header" :style="{ borderColor: column.color }">
        <span class="column-title">{{ column.label }}</span>
        <span class="column-count">{{ getTicketsByStatus(column.id).length }}</span>
      </div>
      
      <div class="column-content">
        <div 
          v-for="ticket in getTicketsByStatus(column.id)"
          :key="ticket.ticketId"
          class="ticket-card"
        >
          <div class="ticket-header">
            <span 
              class="ticket-id"
              :style="{ backgroundColor: getTrackColor(ticket.track) }"
            >
              {{ ticket.ticketId }}
            </span>
            <span 
              class="ticket-priority"
              :style="{ color: getPriorityColor(ticket.priority) }"
            >
              {{ ticket.priority }}
            </span>
          </div>
          <div class="ticket-title">{{ ticket.title }}</div>
          <div class="ticket-footer">
            <span class="ticket-impact">+{{ ticket.scoreImpact }} pts</span>
          </div>
        </div>
        
        <div v-if="getTicketsByStatus(column.id).length === 0" class="empty-column">
          No tickets
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

@media (max-width: 900px) {
  .ticket-board {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .ticket-board {
    grid-template-columns: 1fr;
  }
}

.board-column {
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  min-height: 200px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 2px solid;
  background: var(--vp-c-bg-elv);
  border-radius: 8px 8px 0 0;
}

.column-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.column-count {
  background: var(--vp-c-divider);
  color: var(--vp-c-text-2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.column-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ticket-card {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 12px;
  transition: box-shadow 0.2s ease;
}

.ticket-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ticket-id {
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.ticket-priority {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.ticket-title {
  font-size: 13px;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  margin-bottom: 8px;
}

.ticket-footer {
  display: flex;
  justify-content: flex-end;
}

.ticket-impact {
  font-size: 11px;
  color: #22c55e;
  font-weight: 500;
}

.empty-column {
  text-align: center;
  padding: 24px;
  color: var(--vp-c-text-3);
  font-size: 13px;
}
</style>
