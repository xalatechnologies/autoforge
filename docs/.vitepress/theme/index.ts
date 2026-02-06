import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import './xala-theme.css'
import './components.css'
import './enhancements.css'

// Primitives
import DsContainer from './primitives/DsContainer.vue'
import DsStack from './primitives/DsStack.vue'
import DsGrid from './primitives/DsGrid.vue'
import DsCard from './primitives/DsCard.vue'
import DsBadge from './primitives/DsBadge.vue'

// Composed
import DsSectionCard from './composed/DsSectionCard.vue'
import DsStatCard from './composed/DsStatCard.vue'
import DsLinkCard from './composed/DsLinkCard.vue'
import DsCardGrid from './composed/DsCardGrid.vue'
import DsPageHeader from './composed/DsPageHeader.vue'
import DsCallout from './composed/DsCallout.vue'

// Blocks
import ApiEndpoint from './blocks/ApiEndpoint.vue'
import ApiProperty from './blocks/ApiProperty.vue'
import StepList from './blocks/StepList.vue'
import Step from './blocks/Step.vue'
import ComponentPreview from './blocks/ComponentPreview.vue'

// Project Management Dashboard
import ProductionReadinessCard from './blocks/ProductionReadinessCard.vue'
import TicketBoard from './blocks/TicketBoard.vue'
import RoadmapTimeline from './blocks/RoadmapTimeline.vue'

// Layouts
import DocsHero from './layouts/DocsHero.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // Primitives
    app.component('DsContainer', DsContainer)
    app.component('DsStack', DsStack)
    app.component('DsGrid', DsGrid)
    app.component('DsCard', DsCard)
    app.component('DsBadge', DsBadge)
    // Composed
    app.component('DsSectionCard', DsSectionCard)
    app.component('DsStatCard', DsStatCard)
    app.component('DsLinkCard', DsLinkCard)
    app.component('DsCardGrid', DsCardGrid)
    app.component('DsPageHeader', DsPageHeader)
    app.component('DsCallout', DsCallout)
    // Blocks
    app.component('ApiEndpoint', ApiEndpoint)
    app.component('ApiProperty', ApiProperty)
    app.component('StepList', StepList)
    app.component('Step', Step)
    app.component('ComponentPreview', ComponentPreview)
    // Project Management Dashboard
    app.component('ProductionReadinessCard', ProductionReadinessCard)
    app.component('TicketBoard', TicketBoard)
    app.component('RoadmapTimeline', RoadmapTimeline)
    // Layouts
    app.component('DocsHero', DocsHero)
  },
}
