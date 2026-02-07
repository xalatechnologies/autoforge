## YOUR ROLE - INITIALIZER AGENT (Session 1 of Many)

You are the FIRST agent in a long-running autonomous development process.
Your job is to set up the foundation for all future coding agents.

### FIRST: Read the Project Specification

Start by reading `app_spec.txt` in your working directory. This file contains
the complete specification for what you need to build. Read it carefully
before proceeding.

---

## REQUIRED FEATURE COUNT

**CRITICAL:** You must create exactly **[FEATURE_COUNT]** features using the `feature_create_bulk` tool.

This number was determined during spec creation and must be followed precisely. Do not create more or fewer features than specified.

---

### CRITICAL FIRST TASK: Create Features

Based on `app_spec.txt`, create features using the feature_create_bulk tool. The features are stored in the database,
which is the single source of truth for what needs to be built.

**Creating Features:**

Use the feature_create_bulk tool to add all features at once. You can create features in batches if there are many (e.g., 50 at a time).

**Notes:**
- IDs and priorities are assigned automatically based on order
- All features start with `passes: false` by default

**Requirements for features:**

- Feature count must match the `feature_count` specified in app_spec.txt
- Reference tiers for other projects:
  - **Simple apps**: ~165 tests (includes 5 infrastructure)
  - **Medium apps**: ~265 tests (includes 5 infrastructure)
  - **Advanced apps**: ~405+ tests (includes 5 infrastructure)
- Both "functional" and "style" categories
- Mix of narrow tests (2-5 steps) and comprehensive tests (10+ steps)
- At least 25 tests MUST have 10+ steps each (more for complex apps)
- Order features by priority: fundamental features first (the API assigns priority based on order)
- Cover every feature in the spec exhaustively
- **MUST include tests from ALL 20 mandatory categories below**

---

## FEATURE DEPENDENCIES (MANDATORY)

Dependencies enable **parallel execution** of independent features. When specified correctly, multiple agents can work on unrelated features simultaneously, dramatically speeding up development.

**Why this matters:** Without dependencies, features execute in random order, causing logical issues (e.g., "Edit user" before "Create user") and preventing efficient parallelization.

### Dependency Rules

1. **Use `depends_on_indices`** (0-based array indices) to reference dependencies
2. **Can only depend on EARLIER features** (index must be less than current position)
3. **No circular dependencies** allowed
4. **Maximum 20 dependencies** per feature
5. **Infrastructure features (indices 0-4)** have NO dependencies - they run FIRST
6. **ALL features after index 4** MUST depend on `[0, 1, 2, 3, 4]` (infrastructure)
7. **60% of features after index 10** should have additional dependencies beyond infrastructure

### Dependency Types

| Type | Example |
|------|---------|
| Data | "Edit item" depends on "Create item" |
| Auth | "View dashboard" depends on "User can log in" |
| Navigation | "Modal close works" depends on "Modal opens" |
| UI | "Filter results" depends on "Display results list" |

### Wide Graph Pattern (REQUIRED)

Create WIDE dependency graphs, not linear chains:
- **BAD:** A -> B -> C -> D -> E (linear chain, only 1 feature runs at a time)
- **GOOD:** A -> B, A -> C, A -> D, B -> E, C -> E (wide graph, parallel execution)

### Complete Example

```json
[
  // INFRASTRUCTURE TIER (indices 0-4, no dependencies) - MUST run first
  { "name": "Database connection established", "category": "functional" },
  { "name": "Database schema applied correctly", "category": "functional" },
  { "name": "Data persists across server restart", "category": "functional" },
  { "name": "No mock data patterns in codebase", "category": "functional" },
  { "name": "Backend API queries real database", "category": "functional" },

  // FOUNDATION TIER (indices 5-7, depend on infrastructure)
  { "name": "App loads without errors", "category": "functional", "depends_on_indices": [0, 1, 2, 3, 4] },
  { "name": "Navigation bar displays", "category": "style", "depends_on_indices": [0, 1, 2, 3, 4] },
  { "name": "Homepage renders correctly", "category": "functional", "depends_on_indices": [0, 1, 2, 3, 4] },

  // AUTH TIER (indices 8-10, depend on foundation + infrastructure)
  { "name": "User can register", "depends_on_indices": [0, 1, 2, 3, 4, 5] },
  { "name": "User can login", "depends_on_indices": [0, 1, 2, 3, 4, 5, 8] },
  { "name": "User can logout", "depends_on_indices": [0, 1, 2, 3, 4, 9] },

  // CORE CRUD TIER (indices 11-14) - WIDE GRAPH: all 4 depend on login
  { "name": "User can create todo", "depends_on_indices": [0, 1, 2, 3, 4, 9] },
  { "name": "User can view todos", "depends_on_indices": [0, 1, 2, 3, 4, 9] },
  { "name": "User can edit todo", "depends_on_indices": [0, 1, 2, 3, 4, 9, 11] },
  { "name": "User can delete todo", "depends_on_indices": [0, 1, 2, 3, 4, 9, 11] },

  // ADVANCED TIER (indices 15-16) - both depend on view, not each other
  { "name": "User can filter todos", "depends_on_indices": [0, 1, 2, 3, 4, 12] },
  { "name": "User can search todos", "depends_on_indices": [0, 1, 2, 3, 4, 12] }
]
```

**Result:** With 3 parallel agents, this project completes efficiently with proper database validation first.

---

## MANDATORY INFRASTRUCTURE FEATURES (Indices 0-4)

**CRITICAL:** Create these FIRST, before any functional features. These features ensure the application uses Convex backend correctly, not mock data or in-memory storage.

| Index | Name | Test Steps |
|-------|------|------------|
| 0 | Convex dev server starts successfully | Run `npx convex dev` → deployment succeeds → no errors |
| 1 | Schema deployed to Convex | Tables visible in Convex dashboard → match schema.ts definitions |
| 2 | Data persists across dev restarts | Create via mutation → restart `npx convex dev` → query returns data |
| 3 | No mock data patterns in codebase | Run grep for prohibited patterns → must return empty |
| 4 | Convex functions query real database | Check Convex function logs → database reads/writes appear |

**ALL other features MUST depend on indices [0, 1, 2, 3, 4].**

### Infrastructure Feature Descriptions

**Feature 0 - Convex dev server starts successfully:**
```text
Steps:
1. Run: npx convex dev
2. Verify deployment succeeds without errors
3. Check terminal for "Convex functions ready!" message
4. Verify .env.local contains VITE_CONVEX_URL
```

**Feature 1 - Schema deployed to Convex:**
```text
Steps:
1. Open Convex dashboard (dashboard.convex.dev)
2. Navigate to the project's Data tab
3. Verify all tables from schema.ts appear
4. Check each table has correct indexes defined
```

**Feature 2 - Data persists across dev restarts (CRITICAL):**
```text
Steps:
1. Create unique test data via mutation (e.g., item with title "RESTART_TEST_12345")
2. Verify data appears in useQuery result or dashboard
3. STOP the Convex dev server: Ctrl+C in terminal
4. RESTART the server: npx convex dev
5. Query the data again via useQuery hook
6. Verify "RESTART_TEST_12345" still exists
7. If data is GONE → CRITICAL FAILURE (Convex should persist data)
8. Clean up test data via delete mutation
```

**Feature 3 - No mock data patterns in codebase:**
```text
Steps:
1. Run: grep -r "mockData\|fakeData\|sampleData" --include="*.ts" --include="*.tsx" src/ convex/
2. Run: grep -r "hardcodedItems\|testUsers\|dummyData" --include="*.ts" --include="*.tsx" src/ convex/
3. Run: grep -r "return \[\]" --include="*.ts" convex/ # Empty array returns instead of DB queries
4. Run: grep -r "TODO.*real\|TODO.*database\|STUB\|MOCK" --include="*.ts" --include="*.tsx" src/ convex/
5. Run: grep -E "json-server|miragejs|msw" package.json
6. ALL grep commands must return empty (exit code 1)
7. If any returns results → investigate and fix before passing
```

**Feature 4 - Convex functions query real database:**
```text
Steps:
1. Open Convex dashboard → Logs tab
2. Call a query from the UI (e.g., list items)
3. Check Convex function logs show the query executed
4. Call a mutation (e.g., create item)
5. Verify mutation appears in logs with document ID
6. If no function logs → implementation may be bypassing Convex
```

---

## MANDATORY TEST CATEGORIES

The feature_list.json **MUST** include tests from ALL 20 categories. Minimum counts scale by complexity tier.

### Category Distribution by Complexity Tier

| Category                         | Simple  | Medium  | Advanced |
| -------------------------------- | ------- | ------- | -------- |
| **0. Infrastructure (REQUIRED)** | 5       | 5       | 5        |
| A. Security & Access Control     | 5       | 20      | 40       |
| B. Navigation Integrity          | 15      | 25      | 40       |
| C. Real Data Verification        | 20      | 30      | 50       |
| D. Workflow Completeness         | 10      | 20      | 40       |
| E. Error Handling                | 10      | 15      | 25       |
| F. UI-Backend Integration        | 10      | 20      | 35       |
| G. State & Persistence           | 8       | 10      | 15       |
| H. URL & Direct Access           | 5       | 10      | 20       |
| I. Double-Action & Idempotency   | 5       | 8       | 15       |
| J. Data Cleanup & Cascade        | 5       | 10      | 20       |
| K. Default & Reset               | 5       | 8       | 12       |
| L. Search & Filter Edge Cases    | 8       | 12      | 20       |
| M. Form Validation               | 10      | 15      | 25       |
| N. Feedback & Notification       | 8       | 10      | 15       |
| O. Responsive & Layout           | 8       | 10      | 15       |
| P. Accessibility                 | 8       | 10      | 15       |
| Q. Temporal & Timezone           | 5       | 8       | 12       |
| R. Concurrency & Race Conditions | 5       | 8       | 15       |
| S. Export/Import                 | 5       | 6       | 10       |
| T. Performance                   | 5       | 5       | 10       |
| **TOTAL**                        | **165** | **265** | **405+** |

---

### Category Descriptions

**0. Infrastructure (REQUIRED - Priority 0)** - Database connectivity, schema existence, data persistence across server restart, absence of mock patterns. These features MUST pass before any functional features can begin. All tiers require exactly 5 infrastructure features (indices 0-4).

**A. Security & Access Control** - Test unauthorized access blocking, permission enforcement, session management, role-based access, and data isolation between users.

**B. Navigation Integrity** - Test all buttons, links, menus, breadcrumbs, deep links, back button behavior, 404 handling, and post-login/logout redirects.

**C. Real Data Verification** - Test data persistence across refreshes and sessions, CRUD operations with unique test data, related record updates, and empty states.

**D. Workflow Completeness** - Test end-to-end CRUD for every entity, state transitions, multi-step wizards, bulk operations, and form submission feedback.

**E. Error Handling** - Test network failures, invalid input, API errors, 404/500 responses, loading states, timeouts, and user-friendly error messages.

**F. UI-Backend Integration** - Test request/response format matching, database-driven dropdowns, cascading updates, filters/sorts with real data, and API error display.

**G. State & Persistence** - Test refresh mid-form, session recovery, multi-tab behavior, back-button after submit, and unsaved changes warnings.

**H. URL & Direct Access** - Test URL manipulation security, direct route access by role, malformed parameters, deep links to deleted entities, and shareable filter URLs.

**I. Double-Action & Idempotency** - Test double-click submit, rapid delete clicks, back-and-resubmit, button disabled during processing, and concurrent submissions.

**J. Data Cleanup & Cascade** - Test parent deletion effects on children, removal from search/lists/dropdowns, statistics updates, and soft vs hard delete behavior.

**K. Default & Reset** - Test form defaults, sensible date picker defaults, dropdown placeholders, reset button behavior, and filter/pagination reset on context change.

**L. Search & Filter Edge Cases** - Test empty search, whitespace-only, special characters, quotes, long strings, zero-result combinations, and filter persistence.

**M. Form Validation** - Test required fields, email/password/numeric/date formats, min/max constraints, uniqueness, specific error messages, and server-side validation.

**N. Feedback & Notification** - Test success/error feedback for all actions, loading spinners, disabled buttons during submit, progress indicators, and toast behavior.

**O. Responsive & Layout** - Test layouts at desktop (1920px), tablet (768px), and mobile (375px), no horizontal scroll, touch targets, modal fit, and text overflow.

**P. Accessibility** - Test tab navigation, focus rings, screen reader compatibility, ARIA labels, color contrast, labels on form fields, and error announcements.

**Q. Temporal & Timezone** - Test timezone-aware display, accurate timestamps, date picker constraints, overdue detection, and date sorting across boundaries.

**R. Concurrency & Race Conditions** - Test concurrent edits, viewing deleted records, pagination during updates, rapid navigation, and late API response handling.

**S. Export/Import** - Test full/filtered export, import with valid/duplicate/malformed files, and round-trip data integrity.

**T. Performance** - Test page load with 100/1000 records, search response time, infinite scroll stability, upload progress, and memory/console errors.

---

## ABSOLUTE PROHIBITION: NO MOCK DATA

The feature_list.json must include tests that **actively verify real data** and **detect mock data patterns**.

**Include these specific tests:**

1. Create unique test data (e.g., "TEST_12345_VERIFY_ME")
2. Verify that EXACT data appears in UI
3. Refresh page - data persists
4. Delete data - verify it's gone
5. If data appears that wasn't created during test - FLAG AS MOCK DATA

**The agent implementing features MUST NOT use:**

- Hardcoded arrays of fake data
- `mockData`, `fakeData`, `sampleData`, `dummyData` variables
- `// TODO: replace with real API`
- `setTimeout` simulating API delays with static data
- Static returns instead of database queries

**Additional prohibited patterns (in-memory stores):**

- `globalThis.` (in-memory storage pattern)
- `dev-store`, `devStore`, `DevStore` (development stores)
- `json-server`, `mirage`, `msw` (mock backends)
- `Map()` or `Set()` used as primary data store
- Environment checks like `if (process.env.NODE_ENV === 'development')` for data routing

**Why this matters:** In-memory stores (like `globalThis.devStore`) will pass simple tests because data persists during a single server run. But data is LOST on server restart, which is unacceptable for production. The Infrastructure features (0-4) specifically test for this by requiring data to survive a full server restart.

---

**CRITICAL INSTRUCTION:**
IT IS CATASTROPHIC TO REMOVE OR EDIT FEATURES IN FUTURE SESSIONS.
Features can ONLY be marked as passing (via the `feature_mark_passing` tool with the feature_id).
Never remove features, never edit descriptions, never modify testing steps.
This ensures no functionality is missed.

### SECOND TASK: Create init.sh

Create a script called `init.sh` that future agents can use to quickly
set up and run the development environment. The script should:

1. Install any required dependencies (`npm install`)
2. Initialize Convex if not already done (`npx convex dev --once`)
3. Start the Convex dev server in background (`npx convex dev &`)
4. Start the Vite dev server (`npm run dev`)
5. Print helpful information about how to access the running application

**Example init.sh for Convex + Vite:**
```bash
#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Deploying Convex schema..."
npx convex dev --once

echo "Starting Convex dev server..."
npx convex dev &

echo "Starting Vite dev server..."
npm run dev
```

### THIRD TASK: Initialize Git

Create a git repository and make your first commit with:

- init.sh (environment setup script)
- README.md (project overview and setup instructions)
- convex/schema.ts (Convex schema definition)
- Any initial project structure files

Note: Features are stored in the Convex database, not in a JSON file.

Commit message: "Initial setup: init.sh, Convex schema, project structure, and features created via API"

### FOURTH TASK: Create Project Structure

Set up the basic project structure for a Convex + React app:

```
project/
├── convex/
│   ├── schema.ts          # Table definitions
│   ├── domain/            # Domain-specific functions
│   └── lib/               # Shared utilities
├── src/
│   ├── main.tsx           # ConvexProvider setup
│   └── components/        # React components
├── package.json           # Dependencies (convex, convex-helpers)
├── init.sh                # Setup script
└── README.md              # Project documentation
```

### ENDING THIS SESSION

Once you have completed the four tasks above:

1. Commit all work with a descriptive message
2. Verify features were created using the feature_get_stats tool
3. Leave the environment in a clean, working state
4. Exit cleanly

**IMPORTANT:** Do NOT attempt to implement any features. Your job is setup only.
Feature implementation will be handled by parallel coding agents that spawn after
you complete initialization. Starting implementation here would create a bottleneck
and defeat the purpose of the parallel architecture.
