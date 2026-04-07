# Phase 2: Spec → Plan — Review & Improvements

## Overview

Phase 2 takes an approved `01-spec.md` and produces `02-plan.md` — the technical design document covering data models, API contracts, file/dependency mapping, risks, migration strategy, and security considerations.

---

## Flow Diagram

```
╔════════════════════════════════════════════════════════════════════╗
║  PHASE 2: SPEC → PLAN                                            ║
║  "Investigate codebase, evaluate approaches, lock decisions"      ║
╚════════════════════════════════════════════════════════════════════╝

                    ┌─────────────────┐
                    │  INPUT:         │
                    │  Approved       │
                    │  01-spec.md     │
                    │  + Codebase     │
                    └────────┬────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │        ARCHITECT             │
              │        (opus)                │
              │  Role: Producer              │
              │  Tools: Read, Write,         │
              │         Grep, Glob           │
              │                              │
              │  Reads: approved spec        │
              │         + codebase           │
              │                              │
              │  Produces:                   │
              │  - Data models               │
              │  - API contracts             │
              │  - File/dep mapping          │
              │  - Risk assessment           │
              │  - Migration strategy        │
              │  - Security considerations   │
              └──────────────┬───────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   02-plan.md    │
                    │   (Plan doc)    │
                    └────────┬────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │       PLAN REVIEWER          │
              │       (sonnet)               │
              │  Role: Reviewer (read-only)  │
              │  Tools: Read, Grep, Glob     │
              │                              │
              │  Reads: 02-plan.md           │
              │       + 01-spec.md           │
              │       + codebase             │
              │                              │
              │  Checks:                     │
              │  - FR->plan section mapping  │
              │  - API contracts match spec  │
              │  - Data models cover all FRs │
              │  - File paths exist (>=3)    │
              │  - Deps justified            │
              │  - Risks have mitigations    │
              │  - Migration is reversible   │
              └──────────────┬───────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                 PASS           NEEDS REVISION
                    │            (max 2 cycles)
                    │                 │
                    │                 └──► back to Architect
                    │                      to revise 02-plan.md
                    ▼
              ┌──────────────┐
              │  GATE 2      │
              │  Human       │
              │  reviews     │
              │  02-plan.md  │
              │              │
              │  Options:    │
              │  - Approve   │
              │  - Revise    │
              │  - Edit      │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │  OUTPUT:     │
              │  Approved    │
              │  02-plan.md  │
              └──────────────┘
```

---

## Current Agents & Skills

### Agents (2 total)

| Agent | Model | Role | Tools |
|-------|-------|------|-------|
| Architect | opus | Producer — writes the plan | Read, Write, Grep, Glob |
| Plan Reviewer | sonnet | Reviewer — verifies plan (read-only) | Read, Grep, Glob |

### Current Skills (flat, 7 total)

| Skill | Type | Auto-activates For |
|-------|------|--------------------|
| `api-design` | Domain | API contracts, pagination patterns |
| `db-migration` | Domain | Migration strategy, reversibility |
| `mongo-schema` | Domain | MongoDB data modeling |
| `es-indexing` | Domain | Elasticsearch indexing |
| `error-handling` | Domain | Error strategies, fault tolerance |
| `project-conventions` | Domain | Project-specific patterns |
| `verification-before-completion` | Workflow | Evidence-based review checks |

---

## Cons

### 0. Plan Is High-Level Only — No Implementation Depth (HIGHEST PRIORITY)

The `02-plan.md` output reads like an architecture overview — "we'll add a payments table", "we'll create a REST endpoint" — but never drills into implementation specifics. It lacks exact file paths for new code, concrete function signatures, actual SQL/schema definitions, specific error codes, request/response payload shapes, and step-by-step implementation order. This forces the Phase 3 Planner and Phase 4 Implementer to re-derive all implementation details from scratch, which means:

- **Decisions made in Phase 2 get re-made (differently) in Phase 3/4** — the plan becomes advisory, not authoritative
- **The reviewer can't verify what doesn't exist** — "add a payments endpoint" is unverifiable; `POST /api/v2/payments` with a defined request body is verifiable
- **The human gate is reviewing a brochure, not a blueprint** — they can't catch design mistakes in vague descriptions
- **Phase 3 task breakdown is guesswork** — without concrete file paths, function signatures, and dependencies, the Planner invents implementation details that may contradict the Architect's intent

### 1. Single-Point-of-Failure on Architect

One agent (Architect) owns the entire plan — data models, API contracts, file mapping, risks, migration, security. If it hallucinates on one area, the whole plan is compromised.

### 2. Opus Cost Is High, Scope Is Broad

Architect is the only agent using Opus across all 5 phases. The justification is "complex reasoning," but it's doing everything — including mechanical work like file/dep mapping that Sonnet handles fine elsewhere.

### 3. Reviewer Has No Domain Skills

The Plan Reviewer only has `verification-before-completion` (a workflow skill). It has zero domain skills — no `api-design`, no `db-migration`, no `error-handling`. So it checks structural completeness (FR mapping, file paths exist) but cannot catch substantive design mistakes (wrong pagination strategy, non-reversible migration, missing error codes).

### 4. Max 2 Revision Cycles Is Arbitrary

After 2 failed revisions, the reviewer emits "PASS with caveats" — meaning a known-bad plan reaches the human gate. The human now inherits unresolved technical issues they may not have the context to evaluate.

### 5. No Codebase Exploration Agent

The Architect reads the codebase directly via Grep/Glob. For large codebases, this means the Architect spends tokens on exploration instead of design. It also means codebase understanding is limited to what the Architect thinks to search for.

### 6. No Validation Against Existing Architecture

There's no check that the plan is consistent with existing architecture. The Architect might propose a REST endpoint in a codebase that uses GraphQL, or a new ORM in a project already using raw SQL.

### 7. No Security-Focused Review

The Architect considers security as one bullet among many. The Plan Reviewer has no `security-review` skill. Security issues in the plan (auth gaps, injection surfaces, data exposure) can slip through to Phase 4 where they're much more expensive to fix.

### 8. No Parallelization Possible

Phase 2 is strictly sequential: Architect -> Plan Reviewer -> Human Gate. No part of it can run in parallel. Compare with Phase 3 which at least has Test Designer and Planner as separable concerns.

### 9. Human Gate Has No Guided Checklist

Gate 2 says "Human reviews 02-plan.md" but provides no structured checklist. The human sees a pre-vetted document but has no framework for what they should focus on (the reviewer already checked structural completeness — so what's left for the human?).

### 10. No Feedback Loop to Phase 1

If the Architect discovers during codebase investigation that the spec is infeasible or missing critical context, there's no mechanism to loop back to Phase 1. The Architect must work with what it has.

---

## Improvements

### Proposed Skill Layers

Replace the flat skill list with a **layered architecture** where skills are organized by concern. Each layer activates independently based on the spec's scope — a backend-only change doesn't load frontend skills.

```
┌──────────────────────────────────────────────────────────────────┐
│                      SKILL LAYERS                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  LAYER: WORKFLOW (always active)                           │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐    │  │
│  │  │ writing-plans    │  │ verification-before-         │    │  │
│  │  │                  │  │ completion                    │    │  │
│  │  └──────────────────┘  └──────────────────────────────┘    │  │
│  │  ┌──────────────────┐                                      │  │
│  │  │ analyze-         │                                      │  │
│  │  │ requirement      │                                      │  │
│  │  └──────────────────┘                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  LAYER: FRONTEND (activates if spec touches UI/UX)        │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ frontend-        │  │ component-       │                │  │
│  │  │ patterns         │  │ design           │                │  │
│  │  └──────────────────┘  └──────────────────┘                │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ state-           │  │ accessibility    │                │  │
│  │  │ management       │  │                  │                │  │
│  │  └──────────────────┘  └──────────────────┘                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  LAYER: BACKEND (activates if spec touches APIs/services) │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ api-design       │  │ error-handling   │                │  │
│  │  └──────────────────┘  └──────────────────┘                │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ backend-         │  │ event-driven     │                │  │
│  │  │ patterns         │  │ architecture     │                │  │
│  │  └──────────────────┘  └──────────────────┘                │  │
│  │  ┌──────────────────┐                                      │  │
│  │  │ caching-         │                                      │  │
│  │  │ strategy         │                                      │  │
│  │  └──────────────────┘                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  LAYER: DATABASE (activates if spec touches data/storage) │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ db-migration     │  │ postgres-        │                │  │
│  │  │                  │  │ patterns         │                │  │
│  │  └──────────────────┘  └──────────────────┘                │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ mongo-schema     │  │ es-indexing      │                │  │
│  │  └──────────────────┘  └──────────────────┘                │  │
│  │  ┌──────────────────┐                                      │  │
│  │  │ data-modeling    │                                      │  │
│  │  └──────────────────┘                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  LAYER: SECURITY (always active)                           │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ security-review  │  │ auth-patterns    │                │  │
│  │  └──────────────────┘  └──────────────────┘                │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ input-           │  │ data-privacy     │                │  │
│  │  │ validation       │  │                  │                │  │
│  │  └──────────────────┘  └──────────────────┘                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  LAYER: INFRASTRUCTURE (activates if spec touches         │  │
│  │         deployment, CI/CD, scaling)                        │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ deployment-      │  │ docker-patterns  │                │  │
│  │  │ patterns         │  │                  │                │  │
│  │  └──────────────────┘  └──────────────────┘                │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ observability    │  │ scaling-         │                │  │
│  │  │                  │  │ strategy         │                │  │
│  │  └──────────────────┘  └──────────────────┘                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  LAYER: PROJECT (always active)                            │  │
│  │                                                            │  │
│  │  ┌──────────────────┐                                      │  │
│  │  │ project-         │  Coding style, import conventions,   │  │
│  │  │ conventions      │  naming, test patterns, tech stack   │  │
│  │  └──────────────────┘                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Layer Activation Rules

| Layer | Activation | Rationale |
|-------|------------|-----------|
| **Workflow** | Always | Process rigor applies to every plan |
| **Frontend** | Spec mentions UI, components, pages, routes, styles | Only load when there's a frontend surface |
| **Backend** | Spec mentions APIs, endpoints, services, queues | Only load when there's a backend surface |
| **Database** | Spec mentions tables, schemas, migrations, queries | Only load when data layer is affected |
| **Security** | Always | Security must be reviewed in every plan, no exceptions |
| **Infrastructure** | Spec mentions deploy, CI/CD, scaling, containers | Only load when infra is in scope |
| **Project** | Always | Conventions apply to every plan |

### Improved Flow Diagram

```
╔════════════════════════════════════════════════════════════════════╗
║  PHASE 2 (IMPROVED): SPEC → PLAN                                 ║
╚════════════════════════════════════════════════════════════════════╝

                    ┌─────────────────┐
                    │  INPUT:         │
                    │  Approved       │
                    │  01-spec.md     │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │     LAYER DETECTOR      │
                │     (sonnet)            │
                │                         │
                │  Scans spec to decide   │
                │  which layers activate: │
                │  [x] Workflow (always)  │
                │  [ ] Frontend           │
                │  [x] Backend            │
                │  [x] Database           │
                │  [x] Security (always)  │
                │  [ ] Infrastructure     │
                │  [x] Project (always)   │
                └────────────┬────────────┘
                             │
                ┌────────────┴────────────┐
                │     CODEBASE SCOUT      │
                │     (sonnet)            │
                │                         │
                │  Proactively maps:      │
                │  - Relevant files       │
                │  - Existing patterns    │
                │  - Tech stack in use    │
                │  - Related impls        │
                │  - Tech debt in area    │
                │                         │
                │  Output: codebase       │
                │  summary (not raw grep) │
                └────────────┬────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
 ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
 │ ARCHITECT    │  │ ARCHITECT    │  │ ARCHITECT    │
 │ (Backend)    │  │ (Database)   │  │ (Security)   │
 │ (opus)       │  │ (sonnet)     │  │ (sonnet)     │
 │              │  │              │  │              │
 │ Skills:      │  │ Skills:      │  │ Skills:      │
 │ - api-design │  │ - db-migrat. │  │ - security-  │
 │ - error-     │  │ - postgres-  │  │   review     │
 │   handling   │  │   patterns   │  │ - auth-      │
 │ - backend-   │  │ - data-      │  │   patterns   │
 │   patterns   │  │   modeling   │  │ - input-     │
 │              │  │              │  │   validation │
 │ Output:      │  │ Output:      │  │              │
 │ API section  │  │ Data section │  │ Output:      │
 │ of plan      │  │ of plan      │  │ Security     │
 └──────┬───────┘  └──────┬───────┘  │ section      │
        │                 │          └──────┬───────┘
        │                 │                 │
        └────────┬────────┴─────────────────┘
                 │          (parallel)
                 ▼
        ┌──────────────────┐
        │  PLAN ASSEMBLER  │
        │  (sonnet)        │
        │                  │
        │  Merges layer    │
        │  outputs into    │
        │  unified         │
        │  02-plan.md      │
        │                  │
        │  Resolves cross- │
        │  layer conflicts │
        └────────┬─────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   02-plan.md    │
        └────────┬────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
┌────────────┐      ┌────────────────┐
│ PLAN       │      │ SECURITY       │
│ REVIEWER   │      │ REVIEWER       │
│ (sonnet)   │      │ (sonnet)       │
│            │      │                │
│ Skills:    │      │ Skills:        │
│ - verif.   │      │ - security-    │
│ - api-     │      │   review       │
│   design   │      │ - auth-        │
│ - db-      │      │   patterns     │
│   migrat.  │      │ - verif.       │
│            │      │                │
│ Checks:    │      │ Checks:        │
│ Structural │      │ - Auth model   │
│ + domain   │      │ - Injection    │
│ correctnes │      │   surfaces     │
│            │      │ - Data         │
│            │      │   exposure     │
└─────┬──────┘      └──────┬─────────┘
      │       (parallel)   │
      └──────────┬─────────┘
                 │
          PASS / NEEDS REVISION
          (max 2 cycles, severity-based)
                 │
                 ▼
        ┌──────────────────┐
        │  GATE 2          │
        │  Human reviews   │
        │  02-plan.md      │
        │                  │
        │  + gate-2-       │
        │  review-guide.md │
        │  (auto-generated │
        │  checklist)      │
        │                  │
        │  + SPEC_REVISION │
        │  _NEEDED signal  │
        │  if applicable   │
        └──────────────────┘
```

### Improved Phase 2: Agent Count

| Agent | Model | Role | New? |
|-------|-------|------|------|
| Layer Detector | sonnet | Scans spec, activates relevant skill layers | New |
| Codebase Scout | sonnet | Maps relevant files, patterns, tech stack | New |
| Architect (Backend) | opus | API contracts, service design, error handling | Split |
| Architect (Database) | sonnet | Data models, migrations, query patterns | Split |
| Architect (Security) | sonnet | Auth model, threat surface, data privacy | Split |
| Architect (Frontend) | sonnet | Component design, state, routing (if activated) | Split |
| Architect (Infra) | sonnet | Deployment, scaling, CI/CD (if activated) | Split |
| Plan Assembler | sonnet | Merges layer outputs, resolves conflicts | New |
| Plan Reviewer | sonnet | Structural + domain review (now has domain skills) | Enhanced |
| Security Reviewer | sonnet | Dedicated security-focused review | New |

**Current: 2 agents** → **Improved: 6-10 agents** (depending on layer activation)

### Improved Phase 2: Skills by Layer

| Layer | Skills | Activates For | Loaded By |
|-------|--------|---------------|-----------|
| **Workflow** | `writing-plans`, `verification-before-completion`, `analyze-requirement` | Always | All agents |
| **Frontend** | `frontend-patterns`, `component-design`, `state-management`, `accessibility` | UI/UX in spec | Architect (Frontend), Plan Reviewer |
| **Backend** | `api-design`, `error-handling`, `backend-patterns`, `event-driven-architecture`, `caching-strategy` | APIs/services in spec | Architect (Backend), Plan Reviewer |
| **Database** | `db-migration`, `postgres-patterns`, `mongo-schema`, `es-indexing`, `data-modeling` | Data/storage in spec | Architect (Database), Plan Reviewer |
| **Security** | `security-review`, `auth-patterns`, `input-validation`, `data-privacy` | Always | Architect (Security), Security Reviewer |
| **Infrastructure** | `deployment-patterns`, `docker-patterns`, `observability`, `scaling-strategy` | Deploy/CI/CD in spec | Architect (Infra), Plan Reviewer |
| **Project** | `project-conventions` | Always | All agents |

**Current: 7 flat skills** → **Improved: 24 skills across 7 layers**

---

## Priority Matrix

| # | Issue | Impact | Effort | Priority |
|---|-------|--------|--------|----------|
| 0 | Plan is high-level only, no implementation depth | **Critical** | High | **Fix immediately** |
| 1 | Single architect bottleneck | High | High | **Fix immediately** |
| 3 | Reviewer lacks domain skills | High | Low | **Do first** |
| 7 | No security review | High | Low | **Do first** |
| 10 | No feedback loop to Phase 1 | High | Medium | **Do second** |
| 5 | No codebase scout | Medium | Medium | **Do second** |
| 6 | No architecture consistency check | Medium | Low | **Do second** |
| 9 | No human review checklist | Medium | Low | **Do second** |
| 2 | Opus cost too broad | Medium | Medium | **Optimize later** |
| 4 | Arbitrary 2-cycle cap | Low | Low | **Optimize later** |
| 8 | No parallelization | Low | High | **Optimize later** |

---

## Migration Path

### Step 0: Fix the plan depth problem (Critical — do before anything else)

- Rewrite the `02-plan.md` template to require implementation-level sections per layer
- Add depth enforcement to the Architect agent prompt (concrete deliverables, not summaries)
- Add depth checks to the Plan Reviewer (reject plans that say "add endpoint" without showing the contract)
- Add the `implementation-depth` skill to enforce specificity standards

### Step 1: Split Architect + quick wins

- Split Architect into layer-specific sub-agents (Con 0 + Con 1 together — each layer architect produces deep output for its domain)
- Add `Layer Detector`, `Plan Assembler` agents
- Add domain skills to Plan Reviewer (currently only has `verification-before-completion`)
- Add `security-review` skill to Plan Reviewer
- Generate `gate-2-review-guide.md` in the `/plan` command

### Step 2: Add new agents

- Add `Codebase Scout` agent before Architect
- Add `Security Reviewer` agent in parallel with Plan Reviewer
- Add `SPEC_REVISION_NEEDED` signal handling in `/plan` command

### Step 3: Optimize

- Move Opus usage to Backend Architect only; other layer architects use Sonnet
- Enable parallelization across layer architects and dual reviewers

---

## Resolving Each Con — Detailed Solutions

### Con 0: Plan Is High-Level Only — No Implementation Depth (HIGHEST PRIORITY)

**Problem:** The current `02-plan.md` reads like an architecture overview, not an implementation blueprint. It says "add a payments endpoint" but never specifies the route, request/response shape, validation rules, error codes, or which existing files to modify. Downstream agents (Planner, Implementer) must re-derive all details, often contradicting the Architect's intent.

**Why this is the highest priority:** Every other con (single architect, no security review, no parallelization) is secondary if the plan's output quality is fundamentally too shallow. A perfectly reviewed, parallelized, security-checked plan that says "add an endpoint" is still useless.

**Resolution: Depth-enforced plan template + layer-specific implementation sections**

The fix has three parts: a new template, depth-enforcement in the agent prompt, and depth checks in the reviewer.

#### Part 1: New `02-plan.md` template — before vs. after

```
BEFORE (high-level, vague):
┌─────────────────────────────────────────────────────────────┐
│  ## 3. API Design                                           │
│                                                             │
│  We will add a payments endpoint that accepts payment       │
│  details and processes them. The endpoint will validate     │
│  input and return appropriate error responses.              │
│                                                             │
│  ## 4. Database                                             │
│                                                             │
│  A new payments table will store payment records with       │
│  relevant fields for tracking payment status.               │
└─────────────────────────────────────────────────────────────┘
          ↓ What downstream agents actually need ↓

AFTER (implementation-depth):
┌─────────────────────────────────────────────────────────────┐
│  ## 3. API Design                                           │
│                                                             │
│  ### 3.1 New endpoint: POST /api/v2/payments                │
│                                                             │
│  **File:** `src/routes/payment.routes.ts` (NEW)             │
│  **Controller:** `src/controllers/payment.controller.ts`    │
│  **Auth:** JWT required, roles: [admin, manager]            │
│  **Rate limit:** 10 req/min per user                        │
│                                                             │
│  **Request body:**                                          │
│  ```json                                                    │
│  {                                                          │
│    "orderId": "string (UUID, required)",                    │
│    "amount": "number (positive, max 999999.99, required)",  │
│    "currency": "string (ISO 4217, default: USD)",           │
│    "method": "enum: credit_card | bank_transfer | wallet"   │
│  }                                                          │
│  ```                                                        │
│                                                             │
│  **Response 201:**                                          │
│  ```json                                                    │
│  {                                                          │
│    "id": "string (UUID)",                                   │
│    "status": "pending",                                     │
│    "createdAt": "ISO 8601"                                  │
│  }                                                          │
│  ```                                                        │
│                                                             │
│  **Error responses:**                                       │
│  | Code | Condition | Body |                                │
│  |------|-----------|------|                                 │
│  | 400  | Invalid amount | `{ code: "INVALID_AMOUNT" }` |   │
│  | 404  | Order not found | `{ code: "ORDER_NOT_FOUND" }` | │
│  | 409  | Duplicate payment | `{ code: "DUPLICATE" }` |     │
│  | 422  | Order already paid | `{ code: "ALREADY_PAID" }` | │
│                                                             │
│  **Validation rules:**                                      │
│  - `orderId`: must exist in `orders` table, status != paid  │
│  - `amount`: must match `orders.totalAmount`                │
│  - `currency`: must match `orders.currency`                 │
│                                                             │
│  **Depends on:**                                            │
│  - `src/middleware/auth.ts` (existing, no changes)          │
│  - `src/lib/validate.ts` (existing, add amount validator)   │
│  - `src/models/payment.model.ts` (NEW, see Section 4)      │
│                                                             │
│  ### 3.2 Modified endpoint: GET /api/v2/orders/:id          │
│                                                             │
│  **File:** `src/controllers/order.controller.ts` (MODIFY)   │
│  **Change:** Add `payment` field to response, populated     │
│  from `payments` table via `orderId` foreign key             │
│  **Migration note:** Existing clients receive `null` for    │
│  `payment` field on unpaid orders (backward compatible)      │
│                                                             │
│  ---                                                        │
│                                                             │
│  ## 4. Database                                             │
│                                                             │
│  ### 4.1 New table: payments                                │
│                                                             │
│  **Migration file:** `migrations/20260408_create_payments`   │
│  **Rollback:** DROP TABLE payments (no data loss, new table) │
│                                                             │
│  ```sql                                                     │
│  CREATE TABLE payments (                                    │
│    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),   │
│    order_id    UUID NOT NULL REFERENCES orders(id),          │
│    amount      DECIMAL(10,2) NOT NULL CHECK (amount > 0),   │
│    currency    VARCHAR(3) NOT NULL DEFAULT 'USD',            │
│    method      VARCHAR(20) NOT NULL,                        │
│    status      VARCHAR(20) NOT NULL DEFAULT 'pending',      │
│    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),          │
│    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),          │
│    CONSTRAINT  uq_payment_order UNIQUE (order_id)           │
│  );                                                         │
│                                                             │
│  CREATE INDEX idx_payments_status ON payments(status);      │
│  CREATE INDEX idx_payments_created ON payments(created_at); │
│  ```                                                        │
│                                                             │
│  **Column rationale:**                                      │
│  - `uq_payment_order`: prevents duplicate payments (FR-003) │
│  - `CHECK (amount > 0)`: DB-level guard, not just app-level │
│  - `status` enum values: pending, processing, completed,    │
│    failed, refunded                                         │
│                                                             │
│  ### 4.2 Modified table: orders                             │
│                                                             │
│  No schema change. Relationship is via `payments.order_id`  │
│  foreign key (orders owns the relationship).                │
└─────────────────────────────────────────────────────────────┘
```

#### Part 2: Depth enforcement in Architect agent prompt

Add these rules to each layer architect's prompt:

```markdown
## Output depth requirements

Your plan section MUST include implementation-level detail. Every item you write
must pass the "can an implementer code this without guessing?" test.

### Required for every API endpoint:
- Exact route path (e.g., `POST /api/v2/payments`, not "a payments endpoint")
- File path: new file or existing file to modify
- Request/response JSON shapes with field types and constraints
- All error responses with HTTP codes and error code strings
- Auth requirements (which roles, which middleware)
- Validation rules for every input field
- Dependencies on other files/modules

### Required for every database change:
- Exact SQL for CREATE TABLE / ALTER TABLE
- Column types, constraints, defaults, indexes
- Migration file name
- Rollback strategy (exact SQL)
- Rationale for non-obvious choices (why this index? why this constraint?)

### Required for every service/module:
- File path (new or modify)
- Public function signatures with parameter types and return types
- Error cases and how they propagate
- Dependencies (imports from where)

### Forbidden phrases (plan FAILS if these appear):
- "appropriate error handling" → specify the exact errors
- "relevant fields" → list every field with its type
- "proper validation" → specify every validation rule
- "similar to X" → write the actual code/schema
- "as needed" → define exactly what is needed
- "etc." → list every item
- "standard approach" → describe the specific approach
- "will be implemented" → describe HOW it will be implemented
```

#### Part 3: Depth checks in Plan Reviewer

Add these verification checks to the Plan Reviewer:

```markdown
## Depth verification checklist

Before issuing PASS, verify EVERY section against these depth gates:

### API sections — reject if:
- [ ] Any endpoint lacks an exact route path
- [ ] Any endpoint has no request/response JSON shape
- [ ] Any endpoint missing error response table
- [ ] Any endpoint has no file path (new or modify)
- [ ] Validation rules say "validate input" without listing rules

### Database sections — reject if:
- [ ] Any table change has no SQL definition
- [ ] Any column lacks a type
- [ ] Migration has no rollback strategy
- [ ] Indexes not justified

### General — reject if:
- [ ] Contains any forbidden phrase (see list above)
- [ ] Any section says "will be determined" or "TBD"
- [ ] File paths reference files that don't exist (verify via Glob)
  and are not marked as NEW
- [ ] Function signatures missing parameter types or return types

### Depth score (report in verdict):
Count: X endpoints fully specified / Y total
Count: X tables with full SQL / Y total
Count: X forbidden phrases found

If forbidden phrases > 0: NEEDS REVISION (always, regardless of cycle count)
```

#### Part 4: New skill — `implementation-depth`

```markdown
# implementation-depth skill

## When to activate
When any agent is writing or reviewing a plan document (02-plan.md).

## Rules
1. Every technical decision must be concrete enough to implement without guessing
2. "What" without "how" is not a plan — it's a wish list
3. Depth test: if you removed the spec entirely, could someone implement
   from the plan alone? If not, the plan is too shallow.
4. Each plan section maps 1:1 to a task in Phase 3 — if the plan section
   is vague, the task will be vague, and the implementation will diverge
```

#### How Con 0 and Con 1 reinforce each other

Con 0 (depth) and Con 1 (single architect) are best solved together. A single architect producing a deep plan for all layers will hit context limits and quality drops. Layer-specific architects can go deep in their domain:

```
                    COMBINED SOLUTION: Con 0 + Con 1

  ┌────────────────────────────────────────────────────────────┐
  │  SINGLE ARCHITECT (current)                                │
  │                                                            │
  │  Produces shallow output across ALL domains because:       │
  │  - Too many concerns in one context window                 │
  │  - No domain-specific depth enforcement                    │
  │  - "Good enough" overview for each area                    │
  │                                                            │
  │  Result: 02-plan.md is a 2-page brochure                   │
  └────────────────────────────────────────────────────────────┘

                              ▼ fix both together ▼

  ┌────────────────────────────────────────────────────────────┐
  │  LAYER ARCHITECTS (improved)                               │
  │                                                            │
  │  Each architect has:                                        │
  │  - ONE domain to focus on (backend OR database OR ...)     │
  │  - Full context window for that domain's depth             │
  │  - Domain-specific depth template (API template ≠ DB       │
  │    template ≠ security template)                           │
  │  - Domain skills loaded (api-design for backend,           │
  │    db-migration for database, etc.)                        │
  │  - Depth enforcement rules specific to their domain        │
  │                                                            │
  │  Result: 02-plan.md is a 15-page blueprint with:           │
  │  - Exact SQL schemas                                       │
  │  - Complete API contracts with JSON shapes                 │
  │  - Full error code tables                                  │
  │  - Concrete file paths (new + modify)                      │
  │  - Function signatures with types                          │
  │  - Security threat model per endpoint                      │
  └────────────────────────────────────────────────────────────┘
```

**Per-layer depth templates:**

| Layer Architect | Depth template requires | Example output |
|----------------|------------------------|----------------|
| **Backend** | Route, method, auth, request/response JSON, error table, validation rules, file path, dependencies | `POST /api/v2/payments` with full contract |
| **Database** | CREATE/ALTER SQL, column types+constraints, indexes+rationale, migration name, rollback SQL, seed data if needed | Full `CREATE TABLE` with constraints |
| **Security** | Threat per endpoint, auth model, RBAC matrix, data classification, encryption at rest/transit, rate limits | Endpoint-level threat matrix |
| **Frontend** | Component tree, props interface, state shape, API calls, route config, accessibility requirements | Component hierarchy with typed props |
| **Infrastructure** | Dockerfile changes, env vars, scaling rules, health checks, monitoring alerts, CI pipeline changes | Exact Dockerfile + k8s manifest snippets |

**Files to create/modify:**

| File | Action | Purpose |
|------|--------|---------|
| `.claude/templates/plan.md` | **Rewrite** | New depth-enforced template with per-layer sections |
| `.claude/skills/implementation-depth/SKILL.md` | **Create** | Depth enforcement skill for architects + reviewers |
| `agents/project-architect.md` | **Replace** | Split into layer-specific agents (see Con 1 below) |
| `agents/project-plan-reviewer.md` | **Modify** | Add depth verification checklist |

---

### Con 1: Single-Point-of-Failure on Architect

**Problem:** One agent writes the entire plan. A hallucination in data modeling poisons the API contracts that depend on it. Combined with Con 0, a single agent also can't go deep across all domains — it spreads thin and produces shallow output everywhere.

**Resolution: Layer-based Architect split with cross-validation + depth enforcement**

This resolution builds on Con 0. Each layer architect now has a focused domain AND a depth template for that domain.

```
                    ┌─────────────────┐
                    │  01-spec.md     │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ LAYER DETECTOR  │
                    │ (sonnet)        │
                    │                 │
                    │ Reads spec,     │
                    │ emits:          │
                    │ {               │
                    │   frontend: no, │
                    │   backend: yes, │
                    │   database: yes,│
                    │   security: yes,│
                    │   infra: no     │
                    │ }               │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌──────────────┐ ┌───────────┐ ┌───────────┐
     │ Architect    │ │ Architect │ │ Architect │
     │ (Backend)    │ │ (Database)│ │ (Security)│
     │ opus         │ │ sonnet    │ │ sonnet    │
     │              │ │           │ │           │
     │ Depth:       │ │ Depth:    │ │ Depth:    │
     │ - Routes     │ │ - Full    │ │ - Threat  │
     │ - JSON       │ │   SQL     │ │   per     │
     │   shapes     │ │ - Column  │ │   endpoint│
     │ - Error      │ │   types   │ │ - RBAC    │
     │   codes      │ │ - Index   │ │   matrix  │
     │ - Validation │ │   rationale│ │ - Data    │
     │   rules      │ │ - Rollback│ │   classif.│
     │ - File paths │ │   SQL     │ │ - Rate    │
     │ - Func sigs  │ │ - Migrat. │ │   limits  │
     │              │ │   name    │ │           │
     │ Writes:      │ │           │ │ Writes:   │
     │ 02-plan-     │ │ Writes:   │ │ 02-plan-  │
     │ backend.md   │ │ 02-plan-  │ │ security  │
     └──────┬───────┘ │ data.md   │ │ .md       │
            │         └─────┬─────┘ └─────┬─────┘
            │               │             │
            └───────┬───────┴─────────────┘
                    │  (parallel, isolated)
                    ▼
           ┌────────────────┐
           │ PLAN ASSEMBLER │
           │ (sonnet)       │
           │                │
           │ 1. Merge layer │
           │    outputs     │
           │                │
           │ 2. Cross-      │
           │    validate:   │
           │    - Type      │
           │      consistency│
           │      (userId:  │
           │      int vs    │
           │      UUID?)    │
           │    - Reference │
           │      integrity │
           │      (backend  │
           │      references│
           │      table     │
           │      that DB   │
           │      defined?) │
           │    - Security  │
           │      coverage  │
           │      (every    │
           │      endpoint  │
           │      in backend│
           │      has a     │
           │      security  │
           │      entry?)   │
           │                │
           │ 3. Depth audit:│
           │    - Count     │
           │      forbidden │
           │      phrases   │
           │    - Count     │
           │      incomplete│
           │      contracts │
           │    - Reject if │
           │      depth     │
           │      score < 100%│
           └────────┬───────┘
                    │
                    ▼
           ┌─────────────────┐
           │   02-plan.md    │
           │                 │
           │  Unified,       │
           │  cross-validated│
           │  implementation │
           │  blueprint      │
           │                 │
           │  ~15 pages,     │
           │  not ~2 pages   │
           └─────────────────┘
```

**What changes vs. original Con 1 resolution:**
- Each layer architect now has a **depth template** (from Con 0), not just a domain scope
- Plan Assembler gains a **depth audit** step — it rejects layer outputs that are too shallow before merging
- The assembler checks **cross-layer type consistency** (backend says `userId: int` but database says `UUID` → conflict)
- The assembler checks **reference integrity** (backend references `payments` table → verify database layer defined it)
- The assembler checks **security coverage** (every endpoint in backend has a matching entry in security layer)

**Cross-validation matrix (Plan Assembler):**

```
                  Backend    Database    Security    Frontend    Infra
                  output     output      output      output      output
                  ─────────  ─────────   ─────────   ─────────   ─────────
Backend checks:      —       Types       Auth per    API calls   Deploy
                             match       endpoint    match       endpoints
                             FK refs     defined     routes      exposed

Database checks:  FK refs       —        Data        N/A         Backup
                  used                   classif.                strategy
                                         matches

Security checks:  Every      Encryption  —           CSRF/XSS    Network
                  endpoint   at rest                 per page    policies
                  covered    defined

Frontend checks:  API        N/A         Auth UX     —           CDN
                  contracts              flows                   config
                  match

Infra checks:     Service    Connection  Secrets     Build       —
                  ports      pools       management  pipeline
```

**Conflict resolution protocol:**

```
Plan Assembler finds: Backend says userId is INT, Database says UUID

  1. Assembler does NOT guess which is correct
  2. Assembler sends targeted revision request:

     ┌─────────────────────────────────────────────┐
     │  CONFLICT: userId type mismatch             │
     │                                              │
     │  Backend (02-plan-backend.md, line 47):      │
     │    "userId": "number (integer, required)"    │
     │                                              │
     │  Database (02-plan-data.md, line 23):        │
     │    id UUID PRIMARY KEY DEFAULT gen_random_uuid()│
     │                                              │
     │  Resolution needed from: Database Architect  │
     │  (database defines the source of truth for   │
     │  column types — backend must conform)         │
     │                                              │
     │  → Database Architect confirms UUID           │
     │  → Assembler updates backend section to UUID  │
     └─────────────────────────────────────────────┘

  3. Only the conflicting sections are re-run, not the full phase
```

**Files to create:**
- `agents/project-architect-backend.md` — backend layer architect with depth template
- `agents/project-architect-database.md` — database layer architect with depth template
- `agents/project-architect-security.md` — security layer architect with depth template
- `agents/project-architect-frontend.md` (optional, layer-activated)
- `agents/project-architect-infra.md` (optional, layer-activated)
- `agents/project-plan-assembler.md` — merges + cross-validates + depth audits
- `agents/project-layer-detector.md` — scans spec to activate layers
- `.claude/skills/implementation-depth/SKILL.md` — depth enforcement skill

---

### Con 2: Opus Cost Is High, Scope Is Broad

**Problem:** Opus is used for the entire Architect agent, but much of its work (file scanning, dependency listing, pattern matching) is mechanical and doesn't need Opus-level reasoning.

**Resolution: Opus for decisions, Sonnet for research**

```
              BEFORE (all Opus)              AFTER (selective Opus)
         ┌──────────────────────┐       ┌──────────────────────────┐
         │  Architect (opus)    │       │  Codebase Scout (sonnet) │
         │                      │       │  - File mapping          │
         │  - Scan codebase     │       │  - Dep listing           │
         │  - Map files         │       │  - Pattern detection     │
         │  - List deps         │       │  - Existing conventions  │
         │  - Design APIs       │       └────────────┬─────────────┘
         │  - Model data        │                    │ curated summary
         │  - Assess risks      │                    ▼
         │  - Plan migration    │       ┌──────────────────────────┐
         │  - Write plan        │       │  Architect-Backend (opus)│
         │                      │       │  - Design APIs           │
         │  100% Opus tokens    │       │  - Assess risks          │
         └──────────────────────┘       │  - Architecture decisions│
                                        │                          │
                                        │  ~40% of original tokens │
                                        └──────────────────────────┘
                                        ┌──────────────────────────┐
                                        │  Architect-DB (sonnet)   │
                                        │  - Data models           │
                                        │  - Migration plan        │
                                        └──────────────────────────┘
```

**Cost estimate:**

| Scenario | Opus tokens | Sonnet tokens | Relative cost |
|----------|------------|---------------|---------------|
| Current | ~50k | ~10k (reviewer) | 1.0x |
| Improved | ~20k (backend only) | ~60k (scout + DB + security + assembler + reviewers) | ~0.5x |

**Rule:** Only use Opus when the agent must make judgment calls with trade-offs (API design, risk assessment, architecture decisions). Everything else runs on Sonnet.

---

### Con 3: Reviewer Has No Domain Skills

**Problem:** Plan Reviewer only has `verification-before-completion`. It checks "does FR-003 map to a plan section?" but not "is the API design for FR-003 actually correct?"

**Resolution: Give reviewers the same domain skills as their producers**

```
              BEFORE                              AFTER
    ┌────────────────────────┐         ┌────────────────────────┐
    │  Plan Reviewer         │         │  Plan Reviewer         │
    │                        │         │                        │
    │  Skills:               │         │  Skills:               │
    │  - verification-       │         │  - verification-       │
    │    before-completion   │         │    before-completion   │
    │                        │         │  - api-design          │
    │  Can check:            │         │  - db-migration        │
    │  [x] FR mapping        │         │  - error-handling      │
    │  [x] File paths exist  │         │  - backend-patterns    │
    │  [ ] API correctness   │         │  - project-conventions │
    │  [ ] Migration safety  │         │                        │
    │  [ ] Error coverage    │         │  Can check:            │
    └────────────────────────┘         │  [x] FR mapping        │
                                       │  [x] File paths exist  │
                                       │  [x] API correctness   │
                                       │  [x] Migration safety  │
                                       │  [x] Error coverage    │
                                       └────────────────────────┘
```

**Implementation:** Update `agents/project-plan-reviewer.md` frontmatter — no new agent needed:

```yaml
# BEFORE
name: project-plan-reviewer
tools: [Read, Grep, Glob]
# skills auto-activated: verification-before-completion only

# AFTER — add explicit skill injection in agent prompt
name: project-plan-reviewer
tools: [Read, Grep, Glob]
# Agent prompt now includes:
# "Apply the api-design skill when reviewing API contracts."
# "Apply the db-migration skill when reviewing data models."
# "Apply the error-handling skill when reviewing error strategies."
```

**Effort: Low** — edit one agent file, zero new infrastructure.

---

### Con 4: Max 2 Revision Cycles Is Arbitrary

**Problem:** After 2 cycles, reviewer emits "PASS with caveats" — a known-bad plan reaches the human who may lack context to evaluate the caveats.

**Resolution: Severity-based cycle policy + structured escalation**

```
              Reviewer finds issue
                      │
                      ▼
              ┌───────────────┐
              │  CLASSIFY     │
              │  SEVERITY     │
              └───────┬───────┘
                      │
           ┌──────────┼──────────┐
           │          │          │
           ▼          ▼          ▼
      ┌─────────┐ ┌────────┐ ┌─────────┐
      │ BLOCKER │ │ MAJOR  │ │ MINOR   │
      │         │ │        │ │         │
      │ Missing │ │ Weak   │ │ Naming  │
      │ FR      │ │ migrat.│ │ convent.│
      │ coverage│ │ strat. │ │ Style   │
      │ No auth │ │ Gaps   │ │ issues  │
      │ model   │ │ in API │ │         │
      └────┬────┘ └───┬────┘ └────┬────┘
           │          │           │
           ▼          ▼           ▼
      Never auto-  2 cycles,   Auto-pass,
      pass. Send   then        note in
      to human     escalate    plan as
      with BLOCK   with diff   comment
      signal       report
```

**Escalation report format (replaces vague "caveats"):**

```markdown
## Escalation Report — 02-plan.md

### Unresolved after 2 revision cycles

| # | Severity | Issue | What was requested | What was delivered | Gap |
|---|----------|-------|--------------------|--------------------|-----|
| 1 | MAJOR | Migration strategy | Reversible with rollback script | One-way ALTER TABLE | No rollback path |
| 2 | MAJOR | Auth model | RBAC with role hierarchy | Simple boolean isAdmin | Missing role granularity |

### Resolved in revision cycles
- [x] FR-003 mapping (fixed in cycle 1)
- [x] File path validation (fixed in cycle 2)

### Recommendation
Human should focus on items 1-2. The reviewer verified structural completeness but these design decisions need human judgment.
```

---

### Con 5: No Codebase Exploration Agent

**Problem:** Architect spends Opus-cost tokens on `Grep`/`Glob` exploration instead of design. Coverage depends on what the Architect thinks to search for.

**Resolution: Codebase Scout agent (sonnet) runs before Architect**

```
┌─────────────────────────────────────────────────────────────┐
│  CODEBASE SCOUT (sonnet)                                    │
│  Tools: Read, Grep, Glob                                    │
│                                                             │
│  Input: 01-spec.md (reads FRs to know what to look for)    │
│                                                             │
│  Process:                                                   │
│  1. Extract entities from spec (user, order, payment...)    │
│  2. Search for each entity in codebase                      │
│  3. Map existing file structure for affected areas          │
│  4. Detect tech stack (framework, ORM, test runner)         │
│  5. Find existing patterns (how are APIs defined today?)    │
│  6. Identify tech debt in affected files                    │
│  7. List existing tests that may need updates               │
│                                                             │
│  Output: codebase-context.md                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ## Tech Stack                                         │  │
│  │ - Framework: Express.js                               │  │
│  │ - ORM: Prisma                                         │  │
│  │ - Auth: JWT + middleware in src/auth/guard.ts          │  │
│  │                                                       │  │
│  │ ## Existing Patterns                                  │  │
│  │ - API routes: src/routes/<entity>.routes.ts           │  │
│  │ - Controllers: src/controllers/<entity>.controller.ts │  │
│  │ - Pagination: cursor-based (see src/lib/paginate.ts)  │  │
│  │                                                       │  │
│  │ ## Affected Files (from spec FRs)                     │  │
│  │ - FR-001: src/routes/order.routes.ts (exists)         │  │
│  │ - FR-002: src/models/payment.ts (does NOT exist)      │  │
│  │ - FR-003: src/middleware/auth.ts (exists, needs mod)  │  │
│  │                                                       │  │
│  │ ## Tech Debt in Area                                  │  │
│  │ - order.controller.ts: 450 lines, no error handling   │  │
│  │ - payment.test.ts: only 2 test cases                  │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     Architect receives
                     curated context,
                     not raw grep results
```

**Benefit:** Architect (Opus) spends tokens on design decisions, not exploration. Scout (Sonnet) is ~5x cheaper per token for this mechanical work.

**File to create:** `agents/project-codebase-scout.md`

---

### Con 6: No Validation Against Existing Architecture

**Problem:** Architect might propose patterns inconsistent with the existing codebase (REST in a GraphQL project, Sequelize in a Prisma project).

**Resolution: Codebase Scout (Con 5) + Architecture Constraint Injection**

The Codebase Scout (from Con 5) already detects the tech stack and existing patterns. The key addition is making these **hard constraints** in the Architect's prompt, not just context.

```
┌─────────────────────────────────────────────────────────────┐
│  ARCHITECT PROMPT (enhanced)                                │
│                                                             │
│  ## Hard Constraints (from Codebase Scout)                  │
│  You MUST follow these existing patterns. Do NOT introduce  │
│  alternatives unless the spec explicitly requires it:       │
│                                                             │
│  - API style: GraphQL (NOT REST)                            │
│  - ORM: Prisma (NOT Sequelize, NOT raw SQL)                 │
│  - Auth: JWT middleware at src/auth/guard.ts                 │
│  - Pagination: cursor-based via src/lib/paginate.ts         │
│  - Error format: { code, message, details } from errors.ts  │
│                                                             │
│  If a FR requires deviating from these constraints,         │
│  document the deviation in the "Risks" section with         │
│  justification.                                             │
└─────────────────────────────────────────────────────────────┘
```

**Plan Reviewer check (new):**

```
For each technical choice in 02-plan.md:
  1. Is it consistent with the hard constraints from codebase-context.md?
  2. If not, is the deviation documented in the Risks section?
  3. If not documented → NEEDS REVISION
```

**Effort: Low** — this is a prompt change in the Architect agent + a reviewer check, no new agents.

---

### Con 7: No Security-Focused Review

**Problem:** Security is one bullet among many in the Architect's output. The Plan Reviewer has no security skills to catch auth gaps, injection surfaces, or data exposure.

**Resolution: Dedicated Security Reviewer agent running in parallel with Plan Reviewer**

```
        ┌─────────────────┐
        │   02-plan.md    │
        └────────┬────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
┌────────────┐      ┌────────────────────┐
│ PLAN       │      │ SECURITY REVIEWER  │
│ REVIEWER   │      │ (sonnet)           │
│ (sonnet)   │      │                    │
│            │      │ Skills:            │
│ Checks:    │      │ - security-review  │
│ Structural │      │ - auth-patterns    │
│ + domain   │      │ - input-validation │
│            │      │ - data-privacy     │
│            │      │                    │
│            │      │ Checks:            │
│            │      │ - Auth model       │
│            │      │   complete?        │
│            │      │ - Injection        │
│            │      │   surfaces         │
│            │      │   identified?      │
│            │      │ - Sensitive data    │
│            │      │   encrypted at     │
│            │      │   rest + transit?  │
│            │      │ - RBAC matches     │
│            │      │   spec roles?      │
│            │      │ - Rate limiting    │
│            │      │   on public APIs?  │
│            │      │ - Input validation │
│            │      │   on all inputs?   │
└─────┬──────┘      └──────┬─────────────┘
      │      (parallel)    │
      └──────────┬─────────┘
                 │
          Both must PASS
          for plan to proceed
```

**Security Reviewer checklist:**

| Check | What it verifies | Failure example |
|-------|-----------------|-----------------|
| Auth model completeness | Every endpoint has an auth requirement defined | `POST /orders` has no auth specified |
| Role coverage | Spec roles map to plan RBAC rules | Spec says "admin, manager, user" but plan only has "admin, user" |
| Data classification | Sensitive fields (PII, financial) identified and protected | `creditCardNumber` stored in plaintext |
| Input validation | All user-facing inputs have validation rules | `quantity` field accepts negative numbers |
| Injection surfaces | Dynamic queries/templates identified with mitigation | Raw SQL concatenation in search endpoint |
| Rate limiting | Public and auth endpoints have rate limit strategy | No rate limit on `/login` (brute-force risk) |

**File to create:** `agents/project-security-reviewer.md`

---

### Con 8: No Parallelization Possible

**Problem:** Phase 2 is strictly sequential: Architect → Reviewer → Gate. No part runs in parallel.

**Resolution: Three parallelization opportunities**

```
BEFORE (sequential):

  Scout ──► Architect ──► Reviewer ──► Gate
  ~2min      ~5min         ~2min       human
                                    Total: ~9min + human

AFTER (parallel where possible):

  Layer Detector ──┐
                   ├──► (parallel) ──► Plan Assembler ──┐
  Codebase Scout ──┘                                    │
  ~1min              ~3min              ~1min            │
                                                        ▼
                                            ┌───────────────────┐
                                            │ Plan Reviewer     │
                                            │       +           │──► Gate
                                            │ Security Reviewer │
                                            │   (parallel)      │
                                            └───────────────────┘
                                                   ~2min         human
                                            Total: ~7min + human
```

**Parallelization points:**

| # | What runs in parallel | Dependency |
|---|----------------------|------------|
| 1 | Layer Detector + Codebase Scout | Both only need `01-spec.md` — no dependency on each other |
| 2 | Backend/Database/Security/Frontend/Infra Architects | Each writes an isolated section — no cross-dependency until assembly |
| 3 | Plan Reviewer + Security Reviewer | Both read the same `02-plan.md` — no write conflict |

**Implementation in `/plan` command:**

```markdown
<!-- Phase 2 orchestration -->
1. Spawn Layer Detector and Codebase Scout in parallel (both read 01-spec.md)
2. Wait for both to complete
3. Spawn activated layer Architects in parallel (each gets codebase-context.md + layer config)
4. Wait for all Architects to complete
5. Spawn Plan Assembler (merges layer outputs, resolves conflicts)
6. If conflicts found → send back to conflicting Architects (targeted, not full re-run)
7. Spawn Plan Reviewer + Security Reviewer in parallel
8. If either returns NEEDS REVISION → targeted revision cycle
9. Gate 2: Human reviews
```

---

### Con 9: Human Gate Has No Guided Checklist

**Problem:** Human sees "review 02-plan.md" with no guidance on what to focus on. The AI reviewers already checked structural/domain issues — but the human doesn't know that.

**Resolution: Auto-generated `gate-2-review-guide.md`**

The `/plan` command generates this alongside `02-plan.md`:

```markdown
# Gate 2 Review Guide — [Ticket Title]

## What the AI already verified
- [x] FR → plan section mapping (Plan Reviewer, 5/5 FRs mapped)
- [x] File paths exist in codebase (Plan Reviewer, 8/8 verified)
- [x] API contracts match spec (Plan Reviewer, PASS)
- [x] Migration is reversible (Plan Reviewer, PASS)
- [x] Auth model complete (Security Reviewer, PASS)
- [x] No injection surfaces (Security Reviewer, PASS)
- [x] Cross-layer consistency (Plan Assembler, no conflicts)

## What needs YOUR judgment
These are decisions the AI cannot make:

1. **Business logic correctness**
   - Does the order flow in Section 3.2 match how the business actually works?
   - Are the edge cases in Section 4.1 the right ones to handle?

2. **Team capacity**
   - The plan estimates 3 new services. Does the team have bandwidth?
   - The migration requires a 2-hour downtime window. Is that acceptable?

3. **Organizational constraints**
   - Section 5 proposes a new microservice. Does this need platform team approval?
   - The auth changes in Section 6 — does this need security team sign-off?

4. **Risk appetite**
   - The plan flags 2 MEDIUM risks (Section 7). Are the mitigations sufficient?
   - The fallback strategy in Section 7.2 — is "retry 3x then fail" acceptable?

## Unresolved items from AI review
(Only present if reviewer escalated issues)

| # | Severity | Issue | Reviewer recommendation |
|---|----------|-------|------------------------|
| — | — | None — all items resolved in revision cycles | — |

## Quick actions
- **Approve:** Proceed to Phase 3 (Test + Tasks)
- **Revise:** Send feedback → Architect revises specific sections
- **Edit:** Modify 02-plan.md directly
```

**Effort: Low** — add a generation step at the end of the `/plan` command, no new agents.

---

### Con 10: No Feedback Loop to Phase 1

**Problem:** If the Architect discovers the spec is infeasible (e.g., spec says "modify table X" but table X doesn't exist), there's no mechanism to loop back. The Architect must work around it or produce a plan with known gaps.

**Resolution: `SPEC_REVISION_NEEDED` signal with structured feedback**

```
              ┌─────────────────┐
              │  01-spec.md     │
              └────────┬────────┘
                       │
                       ▼
              ┌────────────────┐
              │  ARCHITECT     │
              │                │
              │  Discovers:    │
              │  "FR-003 says  │
              │  modify table  │
              │  'payments'    │
              │  but it does   │
              │  not exist"    │
              │                │
              │  Emits signal: │
              │  SPEC_REVISION │
              │  _NEEDED       │
              └────────┬───────┘
                       │
              ┌────────┴────────────────────────────────┐
              │                                         │
              ▼                                         ▼
     ┌──────────────────┐                  ┌──────────────────────┐
     │  BLOCKER         │                  │  NON-BLOCKER         │
     │  (halts Phase 2) │                  │  (continues, notes   │
     │                  │                  │   deviation)         │
     │  Spec assumes    │                  │  Spec says "REST"    │
     │  something that  │                  │  but codebase is     │
     │  does not exist  │                  │  GraphQL — Architect │
     │  in the codebase │                  │  can adapt and       │
     │                  │                  │  document why        │
     └────────┬─────────┘                  └──────────────────────┘
              │
              ▼
     ┌───────────────────────────────────────────────────┐
     │  SPEC REVISION REQUEST                            │
     │                                                   │
     │  ## Blocked FRs                                   │
     │                                                   │
     │  | FR | Assumption | Reality | Required action |  │
     │  |----|------------|---------|-----------------|  │
     │  | FR-003 | Table `payments` | Does not exist | Spec must │
     │  |        | exists           |                | define the │
     │  |        |                  |                | table or   │
     │  |        |                  |                | reference  │
     │  |        |                  |                | the right  │
     │  |        |                  |                | one        │
     │  | FR-005 | Auth uses RBAC   | Auth is simple | Spec must  │
     │  |        |                  | boolean        | clarify    │
     │  |        |                  | isAdmin        | scope of   │
     │  |        |                  |                | auth change│
     │                                                   │
     │  ## Impact                                        │
     │  - 2 of 5 FRs blocked                            │
     │  - Remaining 3 FRs can proceed                    │
     │                                                   │
     │  ## Options                                       │
     │  A) Revise spec to fix blocked FRs, re-run Phase 2│
     │  B) Remove blocked FRs from scope, proceed with 3 │
     │  C) Human provides clarification inline           │
     └───────────────────────────────────────────────────┘
              │
              ▼
     ┌──────────────────┐
     │  GATE 1.5        │
     │  (new gate)      │
     │                  │
     │  Human decides:  │
     │  A, B, or C      │
     └──────────────────┘
```

**Implementation in `/plan` command:**

```markdown
<!-- In the Architect agent prompt -->
If you discover that a Functional Requirement assumes something that does not exist
in the codebase (table, service, API, module), you MUST:

1. Check if you can reasonably adapt (e.g., use the correct table name) → do so and document
2. If the gap is fundamental (the FR is based on a wrong assumption) → emit SPEC_REVISION_NEEDED

Format:
```json
{
  "signal": "SPEC_REVISION_NEEDED",
  "severity": "BLOCKER",
  "blocked_frs": ["FR-003", "FR-005"],
  "details": [
    {
      "fr": "FR-003",
      "assumption": "Table 'payments' exists",
      "reality": "No payments table in schema",
      "required_action": "Define payments table or clarify which table to use"
    }
  ]
}
```

<!-- In the /plan orchestrator -->
After Architect completes:
  if output contains SPEC_REVISION_NEEDED with severity BLOCKER:
    pause Phase 2
    present Spec Revision Request to human
    wait for human decision (A/B/C)
    if A: loop back to Phase 1 Analyst with feedback
    if B: remove blocked FRs, continue Phase 2
    if C: inject human clarification, re-run Architect for blocked FRs only
```

---

## Summary: All Cons Resolved

| # | Con | Resolution | New agents | New skills | Effort |
|---|-----|-----------|------------|------------|--------|
| **0** | **Plan is high-level only** | **Depth-enforced templates + forbidden phrases + depth audit in assembler** | **0** | **+1 (implementation-depth)** | **High** |
| **1** | **Single Architect bottleneck** | **Split into layer architects with per-layer depth templates + Plan Assembler with cross-validation** | **+7 (detector, 5 architects, assembler)** | **0** | **High** |
| 2 | Opus cost too broad | Codebase Scout (sonnet) handles research; Opus only for backend architecture decisions | +1 (scout) | 0 | Medium |
| 3 | Reviewer has no domain skills | Add domain skills to Plan Reviewer prompt | 0 | 0 (reuse existing) | **Low** |
| 4 | Arbitrary 2-cycle cap | Severity-based policy: BLOCKER never auto-passes, MAJOR escalates with diff report, MINOR auto-passes | 0 | 0 | **Low** |
| 5 | No codebase exploration | Codebase Scout agent produces curated summary before Architect | +1 (scout, same as #2) | 0 | Medium |
| 6 | No architecture consistency | Scout detects patterns → injected as hard constraints in Architect prompt | 0 (uses scout from #5) | 0 | **Low** |
| 7 | No security review | Dedicated Security Reviewer in parallel with Plan Reviewer | +1 (security reviewer) | +4 (security layer) | Medium |
| 8 | No parallelization | 3 parallelization points: scout+detector, layer architects, dual reviewers | 0 (uses agents from #1) | 0 | Medium |
| 9 | No human review checklist | Auto-generate `gate-2-review-guide.md` at end of Phase 2 | 0 | 0 | **Low** |
| 10 | No feedback loop to Phase 1 | `SPEC_REVISION_NEEDED` signal with structured feedback + Gate 1.5 | 0 | 0 | Medium |

### Net new agents: 10

| Agent | Model | Purpose | Solves Con |
|-------|-------|---------|-----------|
| Layer Detector | sonnet | Scans spec, decides which layers activate | 1, 8 |
| Codebase Scout | sonnet | Maps files, patterns, tech stack before Architect | 2, 5, 6 |
| Architect (Backend) | opus | API contracts with full request/response shapes, error tables, validation rules | **0**, 1 |
| Architect (Database) | sonnet | Full SQL schemas, migrations with rollback, index rationale | **0**, 1 |
| Architect (Security) | sonnet | Per-endpoint threat model, RBAC matrix, data classification | **0**, 1, 7 |
| Architect (Frontend) | sonnet | Component tree with typed props, state shape, route config (if activated) | **0**, 1 |
| Architect (Infra) | sonnet | Dockerfile/k8s snippets, env vars, health checks (if activated) | **0**, 1 |
| Plan Assembler | sonnet | Merges layers, cross-validates types/refs, **depth audit** (rejects shallow output) | **0**, 1, 8 |
| Security Reviewer | sonnet | Dedicated security-focused review | 7 |
| Plan Reviewer | sonnet | **Enhanced** — now has domain skills + depth checklist | 3, **0** |

### Net new skills: 18

| Layer | New skills |
|-------|-----------|
| **Workflow** | **`implementation-depth`** (depth enforcement for all architects + reviewers) |
| Frontend | `frontend-patterns`, `component-design`, `state-management`, `accessibility` |
| Backend | `backend-patterns`, `event-driven-architecture`, `caching-strategy` |
| Database | `postgres-patterns`, `data-modeling` |
| Security | `security-review`, `auth-patterns`, `input-validation`, `data-privacy` |
| Infrastructure | `deployment-patterns`, `docker-patterns`, `observability`, `scaling-strategy` |

(Existing 7 skills retained, total skills: 25)

### Before vs. After: Plan quality comparison

| Metric | Before (current) | After (improved) |
|--------|------------------|-------------------|
| Plan length | ~2 pages (overview) | ~15 pages (blueprint) |
| Endpoint specification | "add a payments endpoint" | Full route, auth, JSON shapes, error table, validation rules |
| Database specification | "add a payments table" | Full CREATE TABLE SQL with types, constraints, indexes, rollback |
| Security specification | "consider auth" | Per-endpoint threat model, RBAC matrix, rate limits |
| Forbidden phrases | Common ("appropriate handling", "relevant fields") | Zero tolerance — auto-reject |
| Implementer needs to guess? | Yes, constantly | No — plan is the single source of truth |
| Phase 3 task quality | Vague (re-derives details) | Precise (maps directly from plan sections) |
| Human review quality | Reviewing a brochure | Reviewing a blueprint with concrete decisions to approve/reject |
