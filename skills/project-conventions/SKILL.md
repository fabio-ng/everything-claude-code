---
name: project-conventions
description: Project-wide conventions for code style, git workflow, file organization, and naming that all agents must follow. Activates on every code task to enforce consistency.
origin: ECC
---

# Project Conventions

Conventions that apply across the entire codebase. All agents follow these rules regardless of their specific task.

## When to Activate

- Writing or modifying any code
- Creating new files or modules
- Making git commits
- Organizing code into directories
- Naming variables, functions, files, or modules

## Code Style

### Follow Existing Patterns

- Read neighboring files before writing new code — match their style
- Do not introduce new patterns, libraries, or conventions without explicit approval
- If the codebase uses callbacks, do not introduce promises without a migration plan
- If the codebase uses a specific ORM, do not introduce a different one

### Linter Is Law

- Follow the linter configuration — do not disable rules
- If a rule seems wrong, fix the code, not the rule
- Run the linter before considering any task complete

### Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| Variables, functions | camelCase | `getUserById`, `orderTotal` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Classes, interfaces, types | PascalCase | `UserService`, `OrderItem` |
| Files (code) | kebab-case or match project convention | `user-service.js`, `order-item.ts` |
| Files (tests) | mirror source path | `src/services/user.ts` → `tests/services/user.test.ts` |
| Boolean variables | `is`/`has`/`should`/`can` prefix | `isActive`, `hasPermission` |
| Private members | underscore prefix if project convention | `_internalCache` |

### Meaningful Names

- No single-letter variables except loop counters (`i`, `j`, `k`)
- No abbreviations unless universally understood (`id`, `url`, `db`)
- Function names describe what they do, not how
- Variable names describe what they hold, not their type

```javascript
// BAD
const d = new Date();
const arr = getUsers();
function proc(x) { ... }

// GOOD
const createdAt = new Date();
const activeUsers = getUsers();
function validateEmail(email) { ... }
```

## File Organization

### Follow Existing Structure

- New modules go in the established location for their type
- Do not create new top-level directories without explicit approval
- Group by feature/domain, not by file type (unless the project already groups by type)

### File Sizes

- Aim for 200-400 lines per file
- Hard limit: 800 lines — split before exceeding
- Extract utilities and helpers into separate modules
- Each file should have one clear responsibility

### Test File Location

Test files mirror the source file structure:

```
src/
├── services/
│   └── user-service.js
├── controllers/
│   └── user-controller.js
└── utils/
    └── validation.js

tests/
├── services/
│   └── user-service.test.js
├── controllers/
│   └── user-controller.test.js
└── utils/
    └── validation.test.js
```

## Git Conventions

### Commit Messages

```
<type>(<scope>): <description>

<optional body>
```

| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Build, CI, tooling changes |
| `perf` | Performance improvement |
| `ci` | CI/CD configuration changes |

Rules:
- Description is lowercase, imperative mood ("add user validation", not "added" or "adds")
- One logical change per commit
- Body explains **why**, not **what** (the diff shows the what)

### Branch Naming

```
<type>/<ticket-id>-<short-description>

Examples:
  feat/12345-user-validation
  fix/12346-order-total-rounding
  refactor/12347-extract-auth-middleware
```

## Dependency Management

- Do not add new dependencies unless explicitly approved in the task spec
- Prefer well-maintained packages with active maintenance and no known vulnerabilities
- Pin exact versions in lock files
- If a utility exists in the codebase, use it instead of installing a package

## Environment and Configuration

- Never hardcode environment-specific values (URLs, credentials, feature flags)
- Use environment variables or a configuration module
- Document required environment variables in `.env.example`
- Validate that required config values are present at startup

## Checklist

- [ ] Code matches existing patterns in the project
- [ ] Linter passes with no disabled rules
- [ ] File is under 800 lines
- [ ] Names are meaningful and follow conventions
- [ ] Tests mirror the source file structure
- [ ] Commit message follows conventional format
- [ ] No new dependencies added without approval
- [ ] No hardcoded environment values
