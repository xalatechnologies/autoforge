---
name: codebase-introspection
description: Analyze and understand an existing codebase before making changes. Use this skill when you need to understand project conventions, patterns, and structure.
---

# Codebase Introspection Skill

Use this skill to analyze an existing project before implementing features or making changes.

## When to Use

- **Before implementing a feature** — Understand existing patterns to match them
- **When unsure about conventions** — Learn how the project structures code
- **When extending functionality** — Discover related code and dependencies
- **When planning changes** — See what already exists to avoid duplication

## How to Use

### Quick Analysis

Call the `codebase_analyze` MCP tool:

```
codebase_analyze(project_dir="/path/to/project")
```

If you're already in the project directory, just call:

```
codebase_analyze()
```

### What You Get

The analysis returns:

| Section | What It Contains |
|---------|------------------|
| **tech_stack** | Language, framework, meta-framework, build tool, package manager, test framework |
| **styling** | CSS framework, CSS approach, preprocessor, design tokens, theme file |
| **dependencies** | All production and dev dependencies with versions |
| **docs** | README, CHANGELOG, CONTRIBUTING, API docs, architecture docs |
| **specs** | AutoForge specs, Traycer epics/tickets, PRDs, user stories |
| **tasks** | TODO/FIXME comments from source files |
| **structure** | Key directories, entry points, components, tests, config files |
| **summary** | Human-readable overview of findings |

## Best Practices

### 1. Match Existing Patterns

After running analysis, pay attention to:
- **Component structure** — How are components organized?
- **Naming conventions** — What naming style is used?
- **Test locations** — Where do tests live?
- **Styling approach** — What CSS methodology is used?

### 2. Respect Design Systems

If `styling.css_framework` is detected (e.g., "tailwind", "chakra"):
- Use those utilities/components
- Don't add conflicting styles
- Follow the project's theme configuration

### 3. Check Existing Documentation

The `docs` array shows what documentation exists:
- Read the README for project context
- Check architecture docs for design decisions
- Review specs for feature requirements

### 4. Incorporate Traycer Context

If Traycer epics/tickets are detected in `specs`:
- These represent planned work from Traycer.ai
- Reference them when implementing related features
- Keep tickets updated as work progresses

### 5. Address Existing Tasks

The `tasks` array shows TODO/FIXME items:
- Consider addressing nearby TODOs when touching that code
- Don't remove TODOs without actually fixing them
- FIXMEs are higher priority than TODOs

## Example Workflow

1. **Start with analysis:**
   ```
   result = codebase_analyze()
   ```

2. **Review key findings:**
   - Check `summary` for quick overview
   - Note the framework and styling approach
   - Look for existing specs or epics

3. **Plan your implementation:**
   - Match the detected patterns
   - Use existing design system
   - Follow test conventions

4. **Implement the feature:**
   - Create files in appropriate locations
   - Follow naming conventions
   - Add tests where expected

## Integration Points

This skill integrates with:
- **Import Project flow** — Analysis runs automatically during import
- **Feature implementation** — Agents can call `codebase_analyze` anytime
- **Expand Project flow** — Understand existing code before adding features

## Technical Details

The analysis is powered by:
- `server/services/codebase_analyzer.py` — Core analysis engine
- `mcp_server/feature_mcp.py` — MCP tool exposure

No external dependencies required — analysis is entirely local.

## Data Backend

AutoForge supports two data backends for feature and schedule storage:

| Backend | Location | Use Case |
|---------|----------|----------|
| **SQLite** (default) | Per-project `.autoforge/features.db` | Local development, single-machine |
| **Convex** | Centralized cloud database | Team collaboration, real-time sync |

### Backend Selection

The backend is controlled by the `AUTOFORGE_BACKEND` environment variable:

```bash
# Local SQLite (default)
AUTOFORGE_BACKEND=sqlite

# Convex cloud backend  
AUTOFORGE_BACKEND=convex
CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOY_KEY=prod:xxx
```

### MCP Tool Compatibility

**All MCP tools work identically regardless of backend.** The same tools you use for local development work seamlessly with Convex:

- `feature_get_stats`, `feature_get_by_id`, `feature_mark_passing`, etc.
- `feature_create_bulk`, `feature_add_dependency`, etc.

When Convex backend is active:
- Projects are identified by Convex document IDs (strings)
- Real-time sync enables multiple agents to collaborate
- Feature progress is visible in the docs dashboard

