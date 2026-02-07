---
name: convex-agents
description: Build AI agents with Convex using the Agent component. Use when implementing AI-powered features, chatbots, LLM integrations, or when the user mentions agents, AI assistants, or LLM workflows. Covers agent setup, threads, messages, tools, streaming, and integration with Convex components.
---

# Convex Agents

Guide for building AI agents with Convex using the Agent component. Agents organize LLM prompting with models, prompts, and tools, managing threads and messages for persistent conversation context.

## Quick Start

### Installation

```bash
npm install @convex-dev/agent
```

### Component Setup

Add to `convex/convex.config.ts` (following XalaBaaS component registration pattern):

```typescript
/**
 * XalaBaaS App Configuration
 * 
 * Registers Convex components for the plug-and-play platform architecture.
 */
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();

// =============================================================================
// COMPONENTS — Added as each domain is migrated
// =============================================================================

// ... existing components ...

// Agent component (AI agents)
import agentComponent from "@convex-dev/agent/convex.config";
app.use(agentComponent);

export default app;
```

**Important**: 
- Run `npx convex dev` to generate component code before defining agents
- The component will appear in `components._generated/api` as `components.agent`
- Follow the phased migration pattern used for other components

### Basic Agent Definition

```typescript
import { components } from "./_generated/api";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";

const supportAgent = new Agent(components.agent, {
  name: "Support Agent",
  languageModel: openai.chat("gpt-4o-mini"),
  instructions: "You are a helpful assistant.",
  tools: { accountLookup, fileTicket, sendEmail },
});
```

### Using an Agent

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";

export const createThread = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const { threadId, thread } = await supportAgent.createThread(ctx);
    const result = await thread.generateText({ prompt });
    return { threadId, text: result.text };
  },
});

export const continueThread = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    const { thread } = await supportAgent.continueThread(ctx, { threadId });
    const result = await thread.generateText({ prompt });
    return result.text;
  },
});
```

## Core Concepts

### Agents
- Organize LLM prompting with models, prompts, and tools
- Can generate text and objects
- Used in any Convex action alongside business logic
- Default configuration can be overridden at call site

### Threads
- Persist message history
- Shared by multiple users and agents (including human agents)
- Automatically include conversation context in each LLM call
- Support hybrid vector/text search for messages

### Messages
- Saved automatically by default
- Clients subscribe via `useThreadMessages` hook for live updates
- Can be saved optimistically in mutations before async generation

## Agent Configuration

### Basic Configuration

```typescript
const agent = new Agent(components.agent, {
  name: "My Agent",
  languageModel: openai.chat("gpt-4o-mini"),
  instructions: "System prompt for the agent",
});
```

### Advanced Configuration

```typescript
import { tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod/v3";
import { Agent, createTool } from "@convex-dev/agent";

const agent = new Agent(components.agent, {
  name: "Advanced Agent",
  
  // Language model (required)
  languageModel: openai.chat("gpt-4o-mini"),
  
  // Embedding model for vector search (optional)
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  
  // System instructions
  instructions: "You are a helpful assistant.",
  
  // Tools (Convex or AI SDK)
  tools: {
    myConvexTool: createTool({
      description: "My Convex tool",
      args: z.object({ query: z.string() }),
      handler: async (ctx, args): Promise<string> => {
        // Tool implementation
        return "result";
      },
    }),
    myAISDKTool: tool({
      description: "AI SDK tool",
      parameters: z.object({ input: z.string() }),
      execute: async ({ input }) => ({ output: input }),
    }),
  },
  
  // Stop condition for tool calls
  stopWhen: stepCountIs(5), // Default is 1
  
  // Context options (see LLM Context section)
  contextOptions: { /* ... */ },
  
  // Storage options (see Messages section)
  storageOptions: { /* ... */ },
  
  // Usage tracking handler
  usageHandler: async (ctx, args) => {
    const { usage, model, provider, agentName, threadId, userId } = args;
    // Log or save usage to database
  },
  
  // Context handler for filtering/enriching messages
  contextHandler: async (ctx, args) => {
    return [...customMessages, ...args.allMessages];
  },
  
  // Raw response handler for logging
  rawResponseHandler: async (ctx, args) => {
    const { request, response, agentName, threadId, userId } = args;
    // Log request/response
  },
  
  // Call settings
  callSettings: {
    maxRetries: 3,
    temperature: 1.0,
  },
});
```

### Dynamic Agent Creation

Create agents at runtime for context-specific configurations:

```typescript
function createTenantAgent(
  ctx: ActionCtx,
  tenantId: Id<"tenants">,
  model: LanguageModel,
) {
  return new Agent(components.agent, {
    name: "Tenant Agent",
    languageModel: model,
    tools: {
      getTenantResources: getResourcesTool(ctx, tenantId),
      createBooking: createBookingTool(ctx, tenantId),
    },
    maxSteps: 10,
  });
}
```

## Generating Text

### Synchronous Generation

```typescript
export const generateReply = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});
```

**Note**: Best practice is to query thread messages via `useThreadMessages` hook instead of returning from action.

### Asynchronous Generation (Recommended)

Save prompt first, then generate response asynchronously:

```typescript
import { components, internal } from "./_generated/api";
import { saveMessage } from "@convex-dev/agent";
import { internalAction, mutation } from "./_generated/server";

// Step 1: Save user message and kick off async response
export const sendMessage = mutation({
  args: { threadId: v.id("threads"), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt,
    });
    
    await ctx.scheduler.runAfter(0, internal.chat.generateResponseAsync, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

// Step 2: Generate response asynchronously
export const generateResponseAsync = internalAction({
  args: { threadId: v.string(), promptMessageId: v.string() },
  handler: async (ctx, { threadId, promptMessageId }) => {
    await agent.generateText(ctx, { threadId }, { promptMessageId });
  },
});
```

Benefits:
- Optimistic UI updates in mutations
- Transactional message saving with other database writes
- Idempotent mutations (client can retry safely)
- Automatic message propagation to subscribed clients

### Generating Objects

Generate structured objects using Zod schemas:

```typescript
import { z } from "zod/v3";

const result = await thread.generateObject({
  prompt: "Generate a plan based on the conversation",
  schema: z.object({
    steps: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })),
  }),
});
```

**Note**: Object generation doesn't support tools. Use a tool call that returns the structured object instead.

## Threads and Messages

### Creating Threads

```typescript
const { threadId, thread } = await agent.createThread(ctx);
```

### Continuing Existing Threads

```typescript
const { thread } = await agent.continueThread(ctx, { threadId });
```

### Saving Messages

```typescript
import { saveMessage } from "@convex-dev/agent";

const { messageId } = await saveMessage(ctx, components.agent, {
  threadId,
  prompt: "User message",
  role: "user", // Optional, defaults to "user"
});
```

### Querying Messages

Use the `useThreadMessages` hook in React:

```typescript
import { useThreadMessages } from "@convex-dev/agent/react";

function ChatComponent({ threadId }: { threadId: string }) {
  const messages = useThreadMessages(threadId);
  // Messages update automatically as new ones are generated
}
```

## Tools

### Convex Tools

Use `createTool` for Convex-specific tools. Tools should call component functions via facades:

```typescript
import { createTool } from "@convex-dev/agent";
import { z } from "zod/v3";
import { components } from "./_generated/api";

const getResourceTool = createTool({
  description: "Get a resource by ID",
  args: z.object({
    resourceId: z.string(), // Component tables use strings
  }),
  handler: async (ctx, args): Promise<string> => {
    // Call component via facade or directly
    const resource = await ctx.runQuery(
      components.resources.queries.get,
      { id: args.resourceId }
    );
    return JSON.stringify(resource);
  },
});

// Tool that calls facade (for enriched data)
const getResourceWithDetails = createTool({
  description: "Get resource with user and booking details",
  args: z.object({ resourceId: z.string() }),
  handler: async (ctx, args): Promise<string> => {
    // Facades enrich with core table data
    const resource = await ctx.runQuery(
      api.domain.resources.get,
      { id: args.resourceId }
    );
    return JSON.stringify(resource);
  },
});
```

### AI SDK Tools

Standard AI SDK tools work as well:

```typescript
import { tool } from "ai";
import { z } from "zod/v3";

const weatherTool = tool({
  description: "Get weather for a city",
  parameters: z.object({
    city: z.string(),
  }),
  execute: async ({ city }) => {
    // External API call
    const weather = await fetchWeather(city);
    return { temperature: weather.temp, condition: weather.condition };
  },
});
```

### Tool Call Limits

Set `maxSteps` or `stopWhen` to control tool call iterations:

```typescript
const agent = new Agent(components.agent, {
  // ...
  maxSteps: 5, // Allow up to 5 tool calls
  // OR
  stopWhen: stepCountIs(5),
});
```

**Important**: Default `maxSteps` is 1. Set to > 1 for automatic tool calls.

## Streaming

Stream text responses for better UX:

```typescript
export const streamReply = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    const stream = await agent.streamText(ctx, { threadId }, { prompt });
    
    for await (const chunk of stream.textStream) {
      // Send chunk to client
    }
  },
});
```

See [Streaming documentation](https://docs.convex.dev/agents/streaming) for full details.

## Integration with XalaBaaS Architecture

### Component Structure Pattern

When creating an agent component, follow the standard component structure:

```
convex/components/agents/
├── convex.config.ts    # Component registration
├── schema.ts           # Agent tables (threads, messages, etc.)
├── contract.ts         # API contract definition
├── queries.ts          # Query functions (max 300 lines)
├── mutations.ts       # Mutation functions (max 300 lines)
└── functions.ts        # Agent definitions and tools (if needed)
```

**Component Schema** (`schema.ts`):
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agentThreads: defineTable({
    tenantId: v.string(), // v.string() for ALL external refs
    userId: v.string(),
    title: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_user", ["userId"]),
});
```

**Component Contract** (`contract.ts`):
```typescript
import { v } from "convex/values";
import { defineContract } from "../../lib/componentContract";

export const CONTRACT = defineContract({
  name: "agents",
  version: "1.0.0",
  category: "domain",
  description: "AI agent threads and messages",
  
  queries: {
    listThreads: {
      args: { tenantId: v.string(), userId: v.optional(v.string()) },
      returns: v.array(v.any()),
    },
  },
  
  mutations: {
    createThread: {
      args: { tenantId: v.string(), userId: v.string() },
      returns: v.object({ id: v.string() }),
    },
  },
  
  emits: ["agents.thread.created", "agents.message.generated"],
  subscribes: [],
  dependencies: { core: ["tenants", "users"], components: [] },
});
```

**Component Functions** (`functions.ts` or split into `queries.ts`/`mutations.ts`):
```typescript
// convex/components/agents/functions.ts
import { query, mutation } from "./_generated/server";
import { components } from "./_generated/api";
import { Agent, createTool } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod/v3";
import { v } from "convex/values";

// Define agent with component-specific tools
const supportAgent = new Agent(components.agent, {
  name: "Support Agent",
  languageModel: openai.chat("gpt-4o-mini"),
  instructions: "You are a helpful support assistant.",
  tools: {
    getResource: createTool({
      description: "Get a resource by ID",
      args: z.object({ resourceId: z.string() }),
      handler: async (ctx, args): Promise<string> => {
        // Call resources component via facade
        const resource = await ctx.runQuery(
          components.resources.queries.get,
          { id: args.resourceId }
        );
        return JSON.stringify(resource);
      },
    }),
  },
});

export const createThread = mutation({
  args: {
    tenantId: v.string(),
    userId: v.string(),
  },
  returns: v.object({ id: v.string() }),
  handler: async (ctx, { tenantId, userId }) => {
    const { threadId } = await supportAgent.createThread(ctx);
    // Save thread reference in component table
    const id = await ctx.db.insert("agentThreads", {
      tenantId,
      userId,
      threadId,
    });
    return { id: id as string };
  },
});
```

### Facade Pattern

Expose agent functionality through facades in `convex/domain/agents.ts`:

```typescript
// convex/domain/agents.ts
import { query, action, mutation } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { requireActiveUser } from "../lib/auth";

// Query facade: Accept typed IDs, convert to strings for component
export const listThreads = query({
  args: {
    tenantId: v.id("tenants"), // Typed ID from SDK
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { tenantId, userId }) => {
    // Delegate to component (convert typed IDs to strings)
    const threads = await ctx.runQuery(components.agents.queries.listThreads, {
      tenantId: tenantId as string,
      userId: userId ? (userId as string) : undefined,
    });
    
    // Enrich with user data from core tables
    const userIds = [...new Set(threads.map((t: any) => t.userId).filter(Boolean))];
    const users = await Promise.all(
      userIds.map((id: string) => ctx.db.get(id as Id<"users">))
    );
    const userMap = new Map(users.filter(Boolean).map((u: any) => [u._id, u]));
    
    return threads.map((thread: any) => ({
      ...thread,
      user: thread.userId ? userMap.get(thread.userId) : null,
    }));
  },
});

// Mutation facade: Handle auth, audit, events
export const createThread = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.id("users"),
  },
  handler: async (ctx, { tenantId, userId }) => {
    await requireActiveUser(ctx, userId);
    
    // Delegate to component
    const result = await ctx.runMutation(components.agents.mutations.createThread, {
      tenantId: tenantId as string,
      userId: userId as string,
    });
    
    // Create audit entry
    await ctx.runMutation(components.audit.functions.create, {
      tenantId: tenantId as string,
      userId: userId as string,
      entityType: "agentThread",
      entityId: result.id,
      action: "created",
      newState: { threadId: result.id },
      sourceComponent: "agents",
    });
    
    return result;
  },
});

// Action facade: For async agent generation
export const generateResponse = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, { threadId, prompt, tenantId }) => {
    // Use agent to generate response
    const agent = new Agent(components.agent, {
      name: "Tenant Agent",
      languageModel: openai.chat("gpt-4o-mini"),
    });
    
    const { thread } = await agent.continueThread(ctx, { threadId });
    await thread.generateText({ prompt });
    
    // Emit event to event bus
    await ctx.runMutation(components.eventBus.emit, {
      event: {
        type: "agents.message.generated",
        tenantId: tenantId as string,
        threadId,
      },
    });
  },
});
```

### Event Bus Integration

Agents should emit events for cross-component communication:

```typescript
// In agent tool handler or after generation
await ctx.runMutation(components.eventBus.emit, {
  event: {
    type: "agents.response.generated",
    tenantId: args.tenantId as string,
    threadId: args.threadId,
    metadata: { model: "gpt-4o-mini", tokens: 150 },
  },
});
```

### Frontend Integration with @xala/ds

When building agent UI components, use the design system following XalaBaaS patterns:

**Component Structure**:
```typescript
// apps/{app}/components/AgentChat.tsx
import { 
  ContentLayout,      // Composed component
  ContentSection,     // Composed component
  Button,              // Primitive (from @digdir/designsystemet-react)
  Textarea,            // Primitive
  Card,                // Primitive
  Stack,               // Primitive layout
} from '@xala/ds';
import { useThreadMessages } from '@convex-dev/agent/react';
import { useMutation } from 'convex/react';
import { api } from '@xalabaas/sdk';
import { useState } from 'react';

export function AgentChat({ threadId }: { threadId: string }) {
  const messages = useThreadMessages(threadId);
  const sendMessage = useMutation(api.domain.agents.sendMessage);
  const [input, setInput] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage({ threadId, prompt: input });
    setInput('');
  };
  
  return (
    <ContentLayout maxWidth="1200px" padding="24px">
      <ContentSection title="AI Assistant">
        <Card>
          <Stack gap="16px">
            {/* Messages list */}
            <Stack gap="8px" style={{ minHeight: '400px', maxHeight: '600px', overflowY: 'auto' }}>
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  style={{
                    padding: 'var(--ds-spacing-3)',
                    backgroundColor: msg.role === 'user' 
                      ? 'var(--ds-color-neutral-subtle)' 
                      : 'var(--ds-color-neutral-surface)',
                    borderRadius: 'var(--ds-border-radius-md)',
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </Stack>
            
            {/* Input form */}
            <form onSubmit={handleSubmit}>
              <Stack gap="8px">
                <Textarea 
                  placeholder="Type your message..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={3}
                />
                <Button type="submit" size="md">Send</Button>
              </Stack>
            </form>
          </Stack>
        </Card>
      </ContentSection>
    </ContentLayout>
  );
}
```

**Design System Component Hierarchy**:

1. **Primitives** (Low-level): `Container`, `Grid`, `Stack`, `Button`, `Input`, `Card`, etc.
2. **Composed** (Mid-level): `ContentLayout`, `ContentSection`, `PageHeader`
3. **Blocks** (Business logic): Coming soon (StatsGrid, FormBlock, etc.)
4. **Shells** (Application level): `AppShell`

**Design System Rules**:
- ✅ Import UI components only from `@xala/ds` (never `@digdir/*` directly)
- ✅ Use component hierarchy: Primitives → Composed → Blocks → Shells
- ✅ Follow accessibility guidelines (WCAG 2.2 AA)
- ✅ Use design tokens: `var(--ds-spacing-*)`, `var(--ds-color-*)`, `var(--ds-border-radius-*)`
- ✅ Compose components rather than creating custom UI
- ✅ Use `Stack` for vertical/horizontal layouts, `Grid` for grid layouts
- ✅ Import styles once: `import '@xala/ds/styles'` at app entry point

## Best Practices

### Component Architecture

1. **Follow component structure**: `convex.config.ts`, `schema.ts`, `contract.ts`, `queries.ts`, `mutations.ts`
2. **Use `v.string()` for external refs**: Component tables cannot use `v.id()` for non-core tables
3. **Define contracts**: Every component must have a `contract.ts` with API shape
4. **Split large files**: Keep `queries.ts` and `mutations.ts` under 300 lines each
5. **Return validators**: All functions MUST have `returns:` validators
6. **Return patterns**: Creates return `{ id: v.string() }`, updates return `{ success: v.boolean() }`

### Facade Pattern

1. **Accept typed IDs**: Facades use `v.id("tenants")` for SDK compatibility
2. **Convert to strings**: Convert typed IDs to strings when calling components
3. **Enrich data**: Join with core tables (users, resources) in facades
4. **Create audit entries**: All mutations create audit logs via `components.audit.functions.create`
5. **Emit events**: Use event bus for cross-component communication
6. **Batch queries**: Avoid N+1 by batch fetching related data

### Agent-Specific

1. **Use async generation** for better UX and transactional guarantees
2. **Query messages via hooks** instead of returning from actions
3. **Set appropriate maxSteps** for tool-calling agents (default is 1)
4. **Implement authorization** checks before thread access (`requireActiveUser`)
5. **Track usage** via `usageHandler` for billing/monitoring
6. **Use context handlers** to filter or enrich message history
7. **Leverage vector search** by setting `textEmbeddingModel` for RAG

### Frontend

1. **Import from @xala/ds**: Never import `@digdir/*` packages directly
2. **Use component hierarchy**: Primitives → Composed → Blocks → Shells
3. **Follow accessibility**: WCAG 2.2 AA standards, keyboard navigation, ARIA attributes
4. **Use design tokens**: Spacing, colors, typography from design system
5. **Compose components**: Build UI by composing design system components

## Common Patterns

### Multi-Agent Workflows

```typescript
const { thread } = await agent1.createThread(ctx);
await thread.generateText({ prompt: "Initial task" });

const { thread: continuedThread } = await agent2.continueThread(ctx, { 
  threadId: thread.threadId 
});
await continuedThread.generateText({ prompt: "Continue with different agent" });
```

### RAG Integration

```typescript
import { RAG } from "@convex-dev/rag";

const agent = new Agent(components.agent, {
  // ...
  tools: {
    searchKnowledge: createRAGTool(ctx, ragComponent),
  },
});
```

### Human-in-the-Loop

```typescript
// Wait for human agent response
const { thread } = await agent.continueThread(ctx, { threadId });
// Human message will be included in context automatically
```

## References

- [Convex Agents Docs](https://docs.convex.dev/agents)
- [Getting Started](https://docs.convex.dev/agents/getting-started)
- [Agent Usage](https://docs.convex.dev/agents/agent-usage)
- [Threads](https://docs.convex.dev/agents/threads)
- [Messages](https://docs.convex.dev/agents/messages)
- [Tools](https://docs.convex.dev/agents/tools)
- [Streaming](https://docs.convex.dev/agents/streaming)
- [Workflows](https://docs.convex.dev/agents/workflows)
- [RAG](https://docs.convex.dev/agents/rag)
