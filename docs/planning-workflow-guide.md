# Planning Workflow Guide

A step-by-step guide to install and use the AI-native planning workflow in any project.

The workflow has five phases — each one narrows the cone of uncertainty before the next begins:

| Phase | Input | Output | Purpose |
|-------|-------|--------|---------|
| **1. Idea → Spec** | Ticket / idea | `01-spec.md` | Clarify the request, tighten scope, identify impact on existing features |
| **2. Spec → Plan** | Approved spec | `02-plan.md` | Investigate the codebase, evaluate approaches, promote technical decisions into a durable plan |
| **3. Plan → Test + Tasks** | Approved plan | `03-test.md` + `04-task.md` | Define test cases, then break into sequenced tasks with dependencies and parallelization |
| **4. Tasks → Implementation** | Approved tasks | Code + passing tests | Agent coding and testing against the task list |
| **5. Implementation → Reconciliation** | Implementation results | Updated specs / ADRs | Inspect what changed, promote back to durable artifacts |

---

## How It Works

The planning workflow turns a ticket ID into structured documents — produced by specialized AI agents, reviewed by humans — then implements, and reconciles what was built back into durable artifacts.

### Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                       /plan <ticket-id>                              │
│                      (Command - Orchestrator)                        │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
  ┌─────────────────────────┼──────────────────────────────────────────┐
  │                                                                    │
  │  ╔════════════════════════════════════════════════════════════════╗ │
  │  ║  PHASE 1: IDEA → SPEC                                        ║ │
  │  ║  Clarify request, tighten scope, identify impact on existing  ║ │
  │  ╚════════════════════════════════════════════════════════════════╝ │
  │                                                                    │
  │  ┌────────────┐                                                    │
  │  │  Gather    │  Ticket info (Azure DevOps / manual)               │
  │  │  ticket    │                                                    │
  │  └──────┬─────┘                                                    │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌────────────┐  Ticket vague?                                     │
  │  │  Quality   │  Yes → STOP. Notify human to clarify input first.  │
  │  │  Check     │  No  → continue                                    │
  │  └──────┬─────┘                                                    │
  │         │ (only if ticket is clear)                                 │
  │         ▼                                                          │
  │  ┌────────────┐  ┌────────────────┐                                │
  │  │  Analyst   │─▶│  01-spec.md    │                                │
  │  │  (sonnet)  │  │  (Requirement) │                                │
  │  └────────────┘  └───────┬────────┘                                │
  │         │                │                                         │
  │         ▼                │                                         │
  │  ┌────────────┐          │  Reviews spec against ticket + hi-docs  │
  │  │  Reviewer  │ ◄────────┘  PASS or NEEDS REVISION (max 2 cycles) │
  │  │  (sonnet)  │                                                    │
  │  └──────┬─────┘                                                    │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌──────────────┐                                                  │
  │  │ 🚦 GATE 1   │  Human reviews 01-spec.md (pre-vetted)           │
  │  └──────┬───────┘                                                  │
  │         │                                                          │
  │  ╔════════════════════════════════════════════════════════════════╗ │
  │  ║  PHASE 2: SPEC → PLAN (Multi-Agent Architecture)             ║ │
  │  ║  Layer detection → parallel architects → assembly → review    ║ │
  │  ╚════════════════════════════════════════════════════════════════╝ │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌────────────┐  Scans spec to determine which domain layers       │
  │  │  Layer     │  are affected: Frontend, Backend, Database,        │
  │  │  Detector  │  Security (always), Infrastructure                 │
  │  │  (sonnet)  │                                                    │
  │  └──────┬─────┘                                                    │
  │         │ activation map                                           │
  │    ┌────┼────────────┬──────────────┐  (parallel, per active       │
  │    │    │            │              │   layer)                      │
  │    ▼    ▼            ▼              ▼                               │
  │  ┌──────┐ ┌────────┐ ┌──────────┐ ┌──────────┐                    │
  │  │Archi-│ │Archi-  │ │Archi-    │ │Archi-    │  Each produces a   │
  │  │tect  │ │tect    │ │tect      │ │tect      │  layer-specific    │
  │  │Back- │ │Data-   │ │Security  │ │Frontend/ │  plan section with │
  │  │end   │ │base    │ │(always)  │ │Infra     │  implementation    │
  │  │(opus)│ │(sonnet)│ │(sonnet)  │ │(sonnet)  │  depth             │
  │  └──┬───┘ └───┬────┘ └────┬─────┘ └────┬─────┘                    │
  │     └────┬────┴───────────┴─────────────┘                          │
  │          │                                                         │
  │          ▼  (check for SPEC_REVISION_NEEDED signals)               │
  │     If any layer found spec infeasible → pause, ask human:         │
  │     A) revise spec  B) remove blocked FRs  C) clarify inline      │
  │          │                                                         │
  │          ▼                                                         │
  │  ┌────────────────┐  Merges layer outputs, cross-validates types,  │
  │  │ Plan Assembler │  reference integrity, security coverage.       │
  │  │ (sonnet)       │  Runs depth audit. Resolves conflicts.         │
  │  └───────┬────────┘                                                │
  │          ▼                                                         │
  │  ┌────────────────┐  ┌────────────────┐                            │
  │  │                │─▶│  02-plan.md    │  Unified, cross-validated  │
  │  │                │  │  (Plan)        │  implementation blueprint  │
  │  └────────────────┘  └───────┬────────┘                            │
  │         │                    │                                     │
  │    ┌────┴────────────────────┤  (parallel reviewers)               │
  │    ▼                         ▼                                     │
  │  ┌────────────┐      ┌──────────────┐  Plan Reviewer: depth +     │
  │  │  Security  │      │  Plan        │  domain correctness.        │
  │  │  Reviewer  │      │  Reviewer    │  Security Reviewer: auth,   │
  │  │  (sonnet)  │      │  (sonnet)    │  threats, data, validation. │
  │  └──────┬─────┘      └──────┬───────┘  Both must PASS.            │
  │         └────────┬──────────┘                                      │
  │                  ▼                                                 │
  │  ┌──────────────────────────────┐                                  │
  │  │ gate-2-review-guide.md       │  Auto-generated: what AI         │
  │  │ (what AI verified vs         │  checked vs what needs           │
  │  │  what needs human judgment)  │  human judgment                  │
  │  └──────────────┬───────────────┘                                  │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌──────────────┐                                                  │
  │  │ 🚦 GATE 2   │  Human reviews 02-plan.md (pre-vetted)           │
  │  └──────┬───────┘                                                  │
  │         │                                                          │
  │  ╔════════════════════════════════════════════════════════════════╗ │
  │  ║  PHASE 3: PLAN → TEST + TASKS                                ║ │
  │  ║  Define test cases, then sequence into tasks                  ║ │
  │  ╚════════════════════════════════════════════════════════════════╝ │
  │         │     reads spec + plan                                    │
  │         ▼                                                          │
  │  ┌────────────┐  ┌────────────────┐                                │
  │  │  Test      │─▶│  03-test.md    │  Test cases derived from       │
  │  │  Designer  │  │  (Test Plan)   │  spec FRs + plan contracts     │
  │  │  (sonnet)  │  └───────┬────────┘                                │
  │  └────────────┘          │                                         │
  │         │                │                                         │
  │         ▼                │                                         │
  │  ┌────────────┐          │  Reviews tests against spec + plan      │
  │  │  Reviewer  │ ◄────────┘  PASS or NEEDS REVISION (max 2 cycles) │
  │  │  (sonnet)  │                                                    │
  │  └──────┬─────┘                                                    │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌──────────────┐                                                  │
  │  │ 🚦 GATE 3   │  Human reviews 03-test.md (pre-vetted)           │
  │  └──────┬───────┘                                                  │
  │         │     reads spec + plan + tests                            │
  │         ▼                                                          │
  │  ┌────────────┐   ┌──────────────┐                                 │
  │  │  Planner   │─▶ │ 04-task.md   │  Ordered tasks, bite-sized     │
  │  │  (sonnet)  │   │ (Tasks)      │  steps, deps, parallelization  │
  │  └────────────┘   └──────────────┘                                 │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌────────────┐   Reviews tasks against all upstream docs          │
  │  │  Reviewer  │─▶ PASS or NEEDS REVISION (max 2 cycles)           │
  │  │  (sonnet)  │                                                    │
  │  └────────────┘                                                    │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌──────────────┐                                                  │
  │  │ 🚦 GATE 4   │  Human reviews 04-task.md (pre-vetted)           │
  │  └──────┬───────┘                                                  │
  │         │                                                          │
  │  ╔════════════════════════════════════════════════════════════════╗ │
  │  ║  PHASE 4: TASKS → IMPLEMENTATION                              ║ │
  │  ║  Agent coding and testing against the task list               ║ │
  │  ╚════════════════════════════════════════════════════════════════╝ │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌────────────┐   Picks up tasks from 04-task.md                   │
  │  │ Implementer│   Writes code, runs tests from 03-test.md          │
  │  │  (sonnet)  │   Checks off task steps as completed               │
  │  └────────────┘                                                    │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌────────────┐   Reviews code against plan + tests                │
  │  │  Code      │─▶ PASS or NEEDS REVISION                          │
  │  │  Reviewer  │                                                    │
  │  │  (sonnet)  │                                                    │
  │  └────────────┘                                                    │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌──────────────┐                                                  │
  │  │ 🚦 GATE 5   │  Human reviews implementation (PR)               │
  │  └──────┬───────┘                                                  │
  │         │                                                          │
  │  ╔════════════════════════════════════════════════════════════════╗ │
  │  ║  PHASE 5: IMPLEMENTATION → RECONCILIATION                     ║ │
  │  ║  Inspect what changed, promote back to durable artifacts      ║ │
  │  ╚════════════════════════════════════════════════════════════════╝ │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌────────────┐   Diffs implementation against plan + spec         │
  │  │ Reconciler │   Identifies deviations, new decisions, surprises  │
  │  │  (sonnet)  │   Proposes updates to:                             │
  │  └────────────┘     • 01-spec.md (if scope changed)                │
  │         │           • 02-plan.md (if design deviated)              │
  │         │           • project documentation (new ADRs)              │
  │         ▼                                                          │
  │  ┌──────────────┐                                                  │
  │  │ 🚦 GATE 6   │  Human approves artifact updates                 │
  │  └──────┬───────┘                                                  │
  │         │                                                          │
  │         ▼                                                          │
  │  ┌───────────────────────┐                                         │
  │  │  DONE                 │                                         │
  │  │  Artifacts reconciled │                                         │
  │  └───────────────────────┘                                         │
  └────────────────────────────────────────────────────────────────────┘

Each document is reviewed by a dedicated reviewer agent BEFORE reaching
the human approval gate. The reviewer catches issues early so the human
sees a pre-vetted document — not a first draft.

Approval gates follow the Harness Engineering pattern: the AI generates,
a reviewer agent verifies, then the human inspects and approves before
the next agent consumes the output. Each gate offers three responses:
approve, revise (with feedback), or edit (modify the file directly).
```

### Agent Roles

Each phase has a **producer** agent that writes a document, followed by a **reviewer** agent that verifies it before the human gate.

| Phase | Role | Agent | Model | Tools | Input | Output |
|-------|------|-------|-------|-------|-------|--------|
| **1. Idea → Spec** | Producer | **Analyst** | sonnet | Read, Write, Grep, Glob | Ticket data + project docs (if available) | `01-spec.md` |
| **1. Idea → Spec** | Reviewer | **Spec Reviewer** | sonnet | Read, Grep, Glob | `01-spec.md` + ticket data + project docs (if available) | PASS / NEEDS REVISION |
| **2. Spec → Plan** | Classifier | **Layer Detector** | sonnet | Read, Grep, Glob | Approved spec | Layer activation map |
| **2. Spec → Plan** | Producer | **Architect (Backend)** | opus | Read, Write, Grep, Glob | Spec + codebase + layer context | `03-plan-backend.md` |
| **2. Spec → Plan** | Producer | **Architect (Database)** | sonnet | Read, Write, Grep, Glob | Spec + codebase + layer context | `03-plan-database.md` |
| **2. Spec → Plan** | Producer | **Architect (Security)** | sonnet | Read, Write, Grep, Glob | Spec + codebase + layer context | `03-plan-security.md` |
| **2. Spec → Plan** | Producer | **Architect (Frontend)** | sonnet | Read, Write, Grep, Glob | Spec + codebase + layer context | `03-plan-frontend.md` (if activated) |
| **2. Spec → Plan** | Producer | **Architect (Infra)** | sonnet | Read, Write, Grep, Glob | Spec + codebase + layer context | `03-plan-infra.md` (if activated) |
| **2. Spec → Plan** | Assembler | **Plan Assembler** | sonnet | Read, Write, Grep, Glob | Layer plan sections + spec | `02-plan.md` (unified) |
| **2. Spec → Plan** | Reviewer | **Plan Reviewer** | sonnet | Read, Grep, Glob | `02-plan.md` + `01-spec.md` + codebase | PASS / NEEDS REVISION |
| **2. Spec → Plan** | Reviewer | **Security Reviewer** | sonnet | Read, Grep, Glob | `02-plan.md` + `01-spec.md` + codebase | PASS / NEEDS REVISION (parallel with Plan Reviewer) |
| **3. Plan → Test** | Producer | **Test Designer** | sonnet | Read, Write, Grep, Glob | Approved spec + plan + codebase | `03-test.md` |
| **3. Plan → Test** | Reviewer | **Test Reviewer** | sonnet | Read, Grep, Glob | `03-test.md` + `01-spec.md` + `02-plan.md` | PASS / NEEDS REVISION |
| **3. Plan → Tasks** | Producer | **Planner** | sonnet | Read, Write, Grep, Glob | Approved spec + plan + tests + codebase | `04-task.md` |
| **3. Plan → Tasks** | Reviewer | **Task Reviewer** | sonnet | Read, Grep, Glob | `04-task.md` + all upstream docs + codebase | PASS / NEEDS REVISION |
| **4. Tasks → Impl** | Producer | **Implementer** | sonnet | Read, Write, Edit, Grep, Glob, Bash | `04-task.md` + `03-test.md` + codebase | Code + passing tests |
| **4. Tasks → Impl** | Reviewer | **Code Reviewer** | sonnet | Read, Grep, Glob, Bash | Implementation diff + plan + tests | PASS / NEEDS REVISION |
| **5. Reconciliation** | Producer | **Reconciler** | sonnet | Read, Write, Grep, Glob | Implementation diff + all planning docs | Updated specs / ADRs |

**Why different models?** Only the Backend Architect uses Opus — it makes complex judgment calls on API design, service architecture, and trade-offs. All other layer architects (Database, Security, Frontend, Infra), the Layer Detector, Plan Assembler, and all reviewers use Sonnet for cost efficiency — their work is more structured and template-driven. Reviewers are read-only (no Write tool) so they cannot accidentally modify documents.

**Why per-document reviewers?** Each reviewer is scoped to the specific document and its upstream inputs. This catches issues *before* the human sees the document — the human reviews a pre-vetted artifact, not a first draft. It also means review feedback is specific and actionable (e.g., "FR-003 has no acceptance criteria" vs. a vague "spec needs work").

See [How Skills Fit In](#how-skills-fit-in) below for details on the domain and workflow skills each agent uses.

### How Skills Fit In

Skills are **passive knowledge** — they don't appear in the command or get called explicitly. Instead, Claude auto-activates them when an agent's conversation matches the skill's `description` field. This means agents get domain-specific guidance injected into their context **automatically**, without any wiring.

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Context                         │
│                                                         │
│  ┌─────────────┐   ┌──────────────────────────────────┐ │
│  │ Agent Prompt │ + │ Auto-injected Skills             │ │
│  │ (explicit)   │   │                                  │ │
│  │              │   │  ┌────────────┐ ┌─────────────┐  │ │
│  │ "Design the  │   │  │ api-design │ │ tdd-workflow │  │ │
│  │  API for..." │   │  │ SKILL.md   │ │ SKILL.md    │  │ │
│  │              │   │  └────────────┘ └─────────────┘  │ │
│  │              │   │  ┌────────────┐ ┌─────────────┐  │ │
│  │              │   │  │error-      │ │ writing-    │  │ │
│  │              │   │  │handling    │ │ plans       │  │ │
│  │              │   │  └────────────┘ └─────────────┘  │ │
│  └─────────────┘   └──────────────────────────────────┘ │
│                                                         │
│  Skills activate based on what the agent is working on. │
│  No explicit wiring needed.                             │
└─────────────────────────────────────────────────────────┘
```

Skills fall into two categories:

- **Domain skills** provide best practices for a technology (e.g., `api-design`, `mongo-schema`). They auto-activate based on conversation context.
- **Workflow skills** enforce process rigor (e.g., `writing-plans`, `verification-before-completion`). Their principles are also baked into the agent prompts, so agents follow them even without the skill file present.

**Without skills**, agents still work — but they rely solely on their own prompt and what they read from the codebase. **With skills**, agents get opinionated best practices injected automatically (e.g., "use cursor-based pagination", "migrations must be reversible", "write tests before code").

#### Skills by Phase

| Phase | Agent | Role | Skills | Type | What It Adds |
|-------|-------|------|--------|------|-------------|
| **1. Idea → Spec** | **Analyst** | Producer | `analyze-requirement` | Workflow | Sizes the request (S/M/L/XL), routes S-size items to a lightweight RAD, runs full 6-step analysis for M/L/XL — scans project documentation to identify existing features impacted, surfaces conflicts, overlaps, and dependencies |
| **1. Idea → Spec** | **Spec Reviewer** | Reviewer | `verification-before-completion` | Workflow | Verifies FRs have acceptance criteria, scope boundaries are explicit, no vague requirements, and impact on existing features is documented |
| **2. Spec → Plan** | **Layer Detector** | Classifier | — | — | Scans spec to activate relevant domain layers |
| **2. Spec → Plan** | **Architect (Backend)** | Producer | `implementation-depth`, `api-design`, `error-handling`, `backend-patterns` | Domain | API contracts with exact routes, JSON shapes, error tables, validation rules, file paths |
| **2. Spec → Plan** | **Architect (Database)** | Producer | `implementation-depth`, `database-migrations` | Domain | Full SQL schemas, column types, indexes with rationale, migration files, rollback SQL |
| **2. Spec → Plan** | **Architect (Security)** | Producer | `implementation-depth` | Domain | Auth model per endpoint, threat surface, data classification, rate limiting |
| **2. Spec → Plan** | **Architect (Frontend)** | Producer | `implementation-depth`, `frontend-patterns` | Domain | Component tree with typed props, state shapes, route configs, accessibility |
| **2. Spec → Plan** | **Architect (Infra)** | Producer | `implementation-depth`, `deployment-patterns` | Domain | Exact config changes, env vars, scaling rules, health checks, CI/CD steps |
| **2. Spec → Plan** | **Plan Assembler** | Assembler | `implementation-depth` | Workflow | Cross-validates types, reference integrity, security coverage; depth audit; merges into unified plan |
| **2. Spec → Plan** | **Plan Reviewer** | Reviewer | `implementation-depth`, `verification-before-completion` | Workflow | Verifies depth (no vague phrases), file paths exist, FR coverage, domain correctness |
| **2. Spec → Plan** | **Security Reviewer** | Reviewer | `implementation-depth` | Domain | Verifies auth completeness, RBAC coverage, injection mitigations, data classification, rate limiting (parallel with Plan Reviewer) |
| **3. Plan → Test** | **Test Designer** | Producer | `tdd-workflow`, `project-conventions` | Domain | Derives test cases from spec FRs + plan contracts, covers happy paths, edge cases, error paths |
| **3. Plan → Test** | **Test Reviewer** | Reviewer | `verification-before-completion` | Workflow | Verifies every FR has test coverage, test cases match plan contracts, no untested paths |
| **3. Plan → Tasks** | **Planner** | Producer | `writing-plans`, `tdd-workflow`, `project-conventions` | Workflow + Domain | Enforces bite-sized checkbox steps with actual code, no placeholders, self-review before saving, file structure mapping, and FR → TASK traceability |
| **3. Plan → Tasks** | **Task Reviewer** | Reviewer | `verification-before-completion` | Workflow | Verifies FR → TASK traceability, no placeholders, dependency ordering is correct, parallelization is sound |
| **4. Implementation** | **Implementer** | Producer | `tdd-workflow`, `project-conventions`, `error-handling` | Domain | Follows task steps, writes code, runs tests from `03-test.md` |
| **4. Implementation** | **Code Reviewer** | Reviewer | `verification-before-completion` | Workflow | Reviews code against plan, verifies tests pass, checks for deviations from design |
| **5. Reconciliation** | **Reconciler** | Producer | `analyze-requirement` | Workflow | Diffs implementation against plan, identifies deviations, proposes updates to specs/ADRs/project documentation |

#### Workflow Skill Details

**`writing-plans`** (Planner agent, `.claude/skills/writing-plans/`)

- **Checkbox steps:** Each task contains `- [ ]` steps for progress tracking (write test → verify fail → implement → verify pass → commit)
- **No placeholders:** "TBD", "add appropriate error handling", "similar to Task N" are plan failures — the agent must provide actual code and commands
- **Self-review:** Before saving, the Planner verifies spec coverage, scans for placeholder violations, checks type consistency across tasks, and validates commands against the codebase
- **File structure mapping:** The plan starts with a file responsibility table before defining tasks
- **Traceability table:** Each FR-XXX maps to one or more TASK-XXX at the end of the plan

**`verification-before-completion`** (All reviewer agents, `.claude/skills/verification-before-completion/`)

Each reviewer applies these checks scoped to the document it is reviewing:

- **Spec Reviewer:** Every FR has testable acceptance criteria. Scope boundaries are explicit. No vague requirements ("improve performance", "make it better"). Impact on existing features (from project documentation) is documented — no blind spots.
- **Plan Reviewer:** Every FR-XXX maps to a plan section. API contracts have exact routes, JSON shapes, and error tables. Database changes have full SQL definitions. Services have typed function signatures. No forbidden vague phrases ("appropriate", "relevant", "etc."). File paths exist in codebase (verified via Grep/Glob, minimum 3). Dependencies justified. Risks have mitigations. Migration strategy is reversible. Depth score reported per category.
- **Security Reviewer (Plan):** Runs in parallel with Plan Reviewer. Every endpoint has auth defined. Spec roles map to plan RBAC rules. All PII fields classified and encrypted. All injection surfaces identified with mitigations. Rate limits defined on write and auth endpoints. Input validation rules specified for all user inputs. Security score reported per category.
- **Test Reviewer:** Every FR has test coverage. Test cases match plan API contracts and data models. Happy paths, edge cases, and error paths are all covered. No FR is left untested.
- **Task Reviewer:** Every FR-XXX maps to a TASK-XXX. No placeholders ("TBD", "add appropriate handling"). Dependency ordering is correct. Parallelizable tasks are identified. Each task references its test cases from `03-test.md`.
- **Code Reviewer:** Implementation matches plan design. All tests from `03-test.md` pass. No undocumented deviations from the plan. Code quality meets project conventions.

Common rules for all reviewers:
- **Evidence-based verdicts:** Every PASS must cite specific traceability mappings, verified file paths, or scan results
- **Verification gate:** Before writing a verdict, the reviewer must answer: How many items traced? How many file paths verified? What violations found?
- **Red flags:** Blocked from writing PASS if using words like "seems", "should be", "appears to" without citing evidence
- **Max 2 cycles:** If the producer doesn't fix issues after 2 revision rounds, the reviewer emits PASS with caveats listing unresolved issues for the human gate

---

## Installation

### Files to Copy

Copy the following files into your target project, preserving the directory structure:

```
your-project/
├── .claude/
│   ├── commands/
│   │   └── plan.md              ← command (orchestrator)
│   ├── templates/
│   │   ├── spec.md              ← template (Phase 1)
│   │   ├── plan.md              ← template (Phase 2)
│   │   ├── test.md              ← template (Phase 3)
│   │   └── task.md              ← template (Phase 3)
│   └── skills/                  ← skills (passive knowledge)
│       ├── analyze-requirement/SKILL.md
│       ├── implementation-depth/SKILL.md ← workflow: depth enforcement for plans
│       ├── tdd-workflow/SKILL.md
│       ├── api-design/SKILL.md
│       ├── error-handling/SKILL.md
│       ├── backend-patterns/SKILL.md     ← if backend layer active
│       ├── frontend-patterns/SKILL.md    ← if frontend layer active
│       ├── deployment-patterns/SKILL.md  ← if infra layer active
│       ├── project-conventions/SKILL.md
│       ├── writing-plans/SKILL.md        ← workflow: bite-sized plans
│       ├── verification-before-completion/SKILL.md ← workflow: evidence-based review
│       ├── database-migrations/SKILL.md  ← if using relational DB
│       ├── mongo-schema/SKILL.md         ← if using MongoDB
│       └── es-indexing/SKILL.md          ← if using Elasticsearch
├── agents/
│   ├── analyst.md                ← agent (Phase 1: producer)
│   ├── layer-detector.md         ← agent (Phase 2: classifier)
│   ├── architect-backend.md      ← agent (Phase 2: backend layer architect, opus)
│   ├── architect-database.md     ← agent (Phase 2: database layer architect)
│   ├── architect-security.md     ← agent (Phase 2: security layer architect, always active)
│   ├── architect-frontend.md     ← agent (Phase 2: frontend layer architect, optional)
│   ├── architect-infra.md        ← agent (Phase 2: infra layer architect, optional)
│   ├── plan-assembler.md         ← agent (Phase 2: merges + cross-validates layers)
│   ├── plan-reviewer.md          ← agent (Phase 2: depth + domain reviewer)
│   ├── security-reviewer-plan.md ← agent (Phase 2: security reviewer, parallel)
│   ├── project-test-designer.md  ← agent (Phase 3: producer — tests)
│   ├── project-planner.md        ← agent (Phase 3: producer — tasks)
│   ├── project-implementer.md    ← agent (Phase 4: producer)
│   ├── project-reconciler.md     ← agent (Phase 5: producer)
│   ├── project-spec-reviewer.md  ← agent (Phase 1: reviewer)
│   ├── project-test-reviewer.md  ← agent (Phase 3: reviewer — tests)
│   ├── project-task-reviewer.md  ← agent (Phase 3: reviewer — tasks)
│   └── project-code-reviewer.md  ← agent (Phase 4: reviewer)
```

### What Each Layer Does

| Layer | Location | Role | Required? |
|-------|----------|------|-----------|
| **Command** | `.claude/commands/` | Orchestrates the workflow steps | Yes |
| **Agents** | `agents/` | Active actors that read, think, and write documents | Yes |
| **Templates** | `.claude/templates/` | Document structure for agents to follow | Yes |
| **Skills** | `.claude/skills/` | Passive domain knowledge auto-injected into agents | Recommended |

**Skills are optional but recommended.** Without them, agents produce correct documents but lack opinionated best practices. With them, agents get guardrails like "migrations must be reversible" or "use cursor-based pagination" injected automatically.

**Note:** Two workflow skills (`writing-plans`, `verification-before-completion`) are available in `.claude/skills/` and their principles are also baked into the agent prompts. They enhance the Planner agent, all four reviewer agents, and the `/plan` command respectively. See [How Skills Fit In](#how-skills-fit-in) above for details.

### Quick Install (Recommended)

Run from **this repository's root**:

```bash
# Full install — commands, templates, agents, all skills
node scripts/install-planning-workflow.js /path/to/your-project

# Preview what will be copied (no changes)
node scripts/install-planning-workflow.js /path/to/your-project --dry-run

# Skip data-layer skills (mongo, es, db-migrations)
node scripts/install-planning-workflow.js /path/to/your-project --skip-data-skills

# Only core files — commands, templates, agents (no skills)
node scripts/install-planning-workflow.js /path/to/your-project --only-core
```

The script copies commands, templates, agents, domain skills, workflow skills, and data-layer skills. It creates directories as needed and reports what was copied.

### Manual Copy (Alternative)

If you prefer to copy files manually, run from **this repository's root**. Replace `<TARGET>` with the absolute path to your project.

```bash
TARGET="/path/to/your-project"

# Commands
mkdir -p "$TARGET/.claude/commands"
cp .claude/commands/plan.md "$TARGET/.claude/commands/"

# Templates
mkdir -p "$TARGET/.claude/templates"
cp .claude/templates/spec.md "$TARGET/.claude/templates/"
cp .claude/templates/plan.md "$TARGET/.claude/templates/"
cp .claude/templates/test.md "$TARGET/.claude/templates/"
cp .claude/templates/task.md "$TARGET/.claude/templates/"

# Agents (Phase 1: spec)
mkdir -p "$TARGET/agents"
cp agents/analyst.md "$TARGET/agents/"
cp agents/project-spec-reviewer.md "$TARGET/agents/"

# Agents (Phase 2: plan — multi-agent architecture)
cp agents/layer-detector.md "$TARGET/agents/"
cp agents/architect-backend.md "$TARGET/agents/"
cp agents/architect-database.md "$TARGET/agents/"
cp agents/architect-security.md "$TARGET/agents/"
cp agents/architect-frontend.md "$TARGET/agents/"
cp agents/architect-infra.md "$TARGET/agents/"
cp agents/plan-assembler.md "$TARGET/agents/"
cp agents/plan-reviewer.md "$TARGET/agents/"
cp agents/security-reviewer-plan.md "$TARGET/agents/"

# Agents (Phase 3-5)
cp agents/project-test-designer.md "$TARGET/agents/"
cp agents/project-planner.md "$TARGET/agents/"
cp agents/project-implementer.md "$TARGET/agents/"
cp agents/project-reconciler.md "$TARGET/agents/"
cp agents/project-test-reviewer.md "$TARGET/agents/"
cp agents/project-task-reviewer.md "$TARGET/agents/"
cp agents/project-code-reviewer.md "$TARGET/agents/"

# Skills (recommended — copy the ones relevant to your stack)
for skill in analyze-requirement implementation-depth tdd-workflow api-design error-handling project-conventions; do
  mkdir -p "$TARGET/.claude/skills/$skill"
  cp "skills/$skill/SKILL.md" "$TARGET/.claude/skills/$skill/"
done

# Workflow skills (enhance planning and review quality)
for skill in writing-plans verification-before-completion; do
  cp -r ".claude/skills/$skill" "$TARGET/.claude/skills/$skill"
done

# Data-layer skills (copy if your project uses these technologies)
for skill in database-migrations; do
  mkdir -p "$TARGET/.claude/skills/$skill"
  cp "skills/$skill/SKILL.md" "$TARGET/.claude/skills/$skill/"
done
```

### Verify Installation

After copying, confirm the files are in place:

```bash
cd "$TARGET"
ls .claude/commands/plan.md
ls .claude/templates/*.md
ls agents/analyst.md agents/project-architect.md agents/project-test-designer.md agents/project-planner.md agents/project-implementer.md agents/project-reconciler.md
ls agents/project-spec-reviewer.md agents/project-plan-reviewer.md agents/project-test-reviewer.md agents/project-task-reviewer.md agents/project-code-reviewer.md
ls .claude/skills/*/SKILL.md    # should list copied skills
```

---

## Usage

### Running the Workflow

In your target project, open Claude Code and run:

```
/plan <ticket-id>
```

For example:

```
/plan 12345
```

### What Happens Next

#### Phase 1: Idea → Spec

Clarify the request, surface assumptions, tighten scope, identify impact on existing features.

1. Claude asks for ticket information (or fetches it from Azure DevOps if configured)
2. **Input quality check** — Claude evaluates the ticket for clarity. If the ticket is vague (missing acceptance criteria, no clear approach, ambiguous scope), the workflow **stops immediately** and notifies you to clarify the input before re-running `/plan`. No agents are spawned for vague tickets.
3. The **analyst** agent reads the clear ticket, classifies the request size (S/M/L/XL), and scans project documentation (e.g., `high-level-documents/`, `docs/`, ADRs — see `analyze-requirement` skill for the full fallback list) to identify which existing features are impacted by the new requirement, surfaces conflicts, overlaps, and dependencies, then writes `docs/tickets/12345/01-spec.md`. For S-size requests, the analyst produces a lightweight spec (problem, scope, acceptance criteria, recommendation only).
4. The **spec reviewer** agent checks: every FR has testable acceptance criteria, scope boundaries are explicit, no vague requirements, and impact on existing features is documented. If NEEDS REVISION → re-spawns analyst with feedback (max 2 cycles).
5. **Gate 1** — Claude presents the pre-vetted spec summary and waits for you to **approve**, **revise** (with feedback), or **edit** the file directly

#### Phase 2: Spec → Plan

Investigate the codebase, evaluate approaches, promote technical decisions into a durable plan. Technical design (data models, API contracts, migration strategy) is part of this plan — not a separate document.

6. The **layer detector** scans the spec to determine which domain layers are affected (frontend, backend, database, security, infra)
7. **Layer architects** run in parallel — each produces a domain-specific plan section with implementation-level depth (exact routes, full SQL, typed signatures, threat models). If any architect discovers the spec assumes something that doesn't exist in the codebase, it emits a `SPEC_REVISION_NEEDED` signal — Phase 2 pauses and you choose: revise spec, remove blocked FRs, or clarify inline
8. The **plan assembler** merges layer outputs into unified `docs/tickets/12345/02-plan.md`, cross-validates type consistency, reference integrity, and security coverage
9. The **plan reviewer** and **security reviewer** run in parallel: plan reviewer checks depth (no vague phrases, exact contracts, full SQL), security reviewer checks auth completeness, threat mitigations, data classification. Both must PASS.
10. **Gate 2** — you review the pre-vetted plan with an auto-generated `gate-2-review-guide.md` that shows what AI verified vs what needs your judgment

#### Phase 3: Plan → Test + Tasks

Define test cases from the plan, then break into sequenced tasks with dependencies and parallelization.

11. The **test designer** agent reads approved spec + plan and writes `docs/tickets/12345/03-test.md` — test cases covering every FR (happy paths, edge cases, error paths), derived from plan API contracts and data models
12. The **test reviewer** agent checks: every FR has test coverage, test cases match plan contracts, no untested paths. If NEEDS REVISION → re-spawns test designer with feedback (max 2 cycles).
13. **Gate 3** — you review the pre-vetted test plan
14. The **planner** agent reads approved spec + plan + tests and writes `docs/tickets/12345/04-task.md` — ordered tasks with dependency chains, parallelization opportunities, bite-sized checkbox steps, actual code in every step, no placeholders, each task references its test cases
15. The **task reviewer** agent checks: every FR maps to a TASK, no placeholders, dependency ordering is correct, parallelizable tasks are identified. If NEEDS REVISION → re-spawns planner with feedback (max 2 cycles).
16. **Gate 4** — you review the pre-vetted task list

#### Phase 4: Tasks → Implementation

Agent coding and testing against the task list.

17. The **implementer** agent picks up tasks from `04-task.md`, writes code, and runs tests from `03-test.md` — checking off task steps as completed
18. The **code reviewer** agent reviews the implementation against the plan and tests. If NEEDS REVISION → re-spawns implementer with feedback.
19. **Gate 5** — you review the implementation (PR)

#### Phase 5: Implementation → Reconciliation

Inspect what changed and decide what must be promoted back into durable artifacts.

20. The **reconciler** agent diffs the actual implementation against the plan and spec, identifies deviations (scope changes, design pivots, new decisions made during coding), and proposes updates to:
    - `01-spec.md` — if scope changed during implementation
    - `02-plan.md` — if design deviated from the original plan
    - Project documentation (e.g., `high-level-documents/`, `docs/`, ADRs) — new ADRs for decisions made during implementation
21. **Gate 6** — you approve which artifact updates to apply
22. Approved updates are written. The planning artifacts now reflect what was actually built — not just what was planned.

**Why reviewer-before-gate?** Each document is reviewed by a dedicated AI reviewer *before* it reaches the human. The reviewer catches mechanical issues (missing traceability, vague requirements, placeholder violations) so the human can focus on judgment calls (is this the right approach? are these the right trade-offs?). This follows the **Harness Engineering** pattern — produce → review → approve — at every stage, not just at the end.

**Why reconciliation?** Plans never survive implementation unchanged. Phase 5 closes the loop — instead of letting planning docs rot, the reconciler identifies what actually changed and promotes those decisions back into specs and ADRs. This keeps project documentation accurate for future `/plan` runs.

### Reviewing the Output

All documents are saved to `docs/tickets/<ticket-id>/`:

```
docs/tickets/12345/
├── 01-spec.md    ← Phase 1: What to build, why, and what it impacts
├── 02-plan.md    ← Phase 2: Technical design + implementation plan
├── 03-test.md    ← Phase 3: Test cases derived from spec + plan
└── 04-task.md    ← Phase 3: Ordered tasks with sequencing + deps
```

Review each document with your team. They are plain Markdown — comment, edit, or request changes as you normally would.

**The plan** (`02-plan.md`) now includes technical design (data models, API contracts, migration strategy) alongside implementation details (files to change, dependencies, risks) — no separate TDD document.

**The test plan** (`03-test.md`) includes:
- Test cases derived from every FR in the spec
- Happy paths, edge cases, and error paths for each API contract in the plan
- Traceability from FR-XXX to TEST-XXX

**The task list** (`04-task.md`) includes:
- A **file structure table** showing every file to create/modify and its responsibility
- **Checkbox steps** within each task (write test → verify fail → implement → verify pass → commit)
- **Actual code** in every code step — no placeholders or "add appropriate handling"
- A **traceability table** mapping every FR-XXX to its TASK-XXX
- References to test cases from `03-test.md` in each task

When satisfied, add `**Status:** Approved` to each document header to signal readiness for Phase 4 (implementation).

### Re-planning (Mid-Flight Changes)

If requirements change after Phase 1 documents are produced:

1. Re-run `/plan <ticket-id>` — the analyst (with `analyze-requirement`) will detect the existing `01-spec.md` and update it incrementally rather than starting from scratch
2. Downstream documents (`02-plan.md`, `03-test.md`, `04-task.md`) will be re-generated against the updated spec
3. Each gate still applies — review the changes before proceeding

For small scope adjustments, you can also edit `01-spec.md` directly and re-run from Phase 2 onward.

---

## Customization

### Project Documentation Location

The workflow scans project documentation for context during Phase 1 (impact analysis) and Phase 5 (reconciliation). The `analyze-requirement` skill checks these locations in order: `high-level-documents/`, `docs/`, `README.md`/`ARCHITECTURE.md`/`ADR/`, previous RADs/specs, then falls back to codebase search. If your project maintains architecture docs, place them in `high-level-documents/` or `docs/architecture/` for best results.

### Adapting Templates

Edit the templates in `.claude/templates/` to match your team's conventions. For example:
- Add company-specific sections (compliance, accessibility)
- Remove sections that don't apply (e.g., migration strategy for a greenfield project)
- Change terminology to match your domain

### Adding or Editing Skills

Skills live in `.claude/skills/<name>/SKILL.md`. Each has a `description` field in its frontmatter — Claude matches this against the current conversation to decide whether to inject the skill.

**To create a new skill** for your domain (e.g., GraphQL, gRPC, Terraform):

```markdown
<!-- .claude/skills/graphql-design/SKILL.md -->
---
name: graphql-design
description: >
  Activates when designing or modifying GraphQL schemas,
  resolvers, or queries.
origin: custom
---

## Rules
- Use input types for mutations
- Always paginate list fields with cursor-based connections
- ...
```

**To edit an existing skill**, modify its `SKILL.md` directly. The changes take effect in the next agent session — no restart needed.

**To disable a skill**, delete or rename its directory. Skills are only activated if the `SKILL.md` file exists and its `description` matches the agent's context.

### Changing Models

Edit the `model:` field in the agent frontmatter:

```yaml
# agents/project-architect.md
model: opus    # change to sonnet for lower cost
```

### Adding a Ticket System

The command supports Azure DevOps out of the box. To use a different system:

1. Edit `.claude/commands/plan.md` Step 1
2. Replace the `az boards` command with your system's CLI or MCP tool
3. Examples:
   - **Jira**: `jira issue view $ARGUMENTS --output json`
   - **GitHub Issues**: `gh issue view $ARGUMENTS --json title,body,labels`
   - **Linear**: Use the Linear MCP server

### Changing Output Location

Edit `.claude/commands/plan.md` and replace all instances of `docs/tickets/$ARGUMENTS/` with your preferred path, such as:
- `.docs/plans/$ARGUMENTS/`
- `design/$ARGUMENTS/`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `/plan` command not found | Ensure `.claude/commands/plan.md` exists and has `name: plan` in frontmatter |
| Agent not spawned | Ensure agent files are in `agents/` at project root with correct frontmatter |
| Empty output documents | Check that the agent has `Write` in its tools list |
| Template not followed | Verify `.claude/templates/` path matches what agents reference |
| Skills not activating | Verify `.claude/skills/<name>/SKILL.md` exists and has a `description` in frontmatter that matches the agent's task |
| Wrong skills activating | Narrow the `description` field — make it more specific to avoid false matches |
| Workflow stops saying ticket is vague | This is intentional — vague tickets produce bad specs. Add specific acceptance criteria, a clear approach, and bounded scope, then re-run `/plan` |
| Ticket is clear but workflow still rejects it | The quality check looks for missing acceptance criteria, no stated approach, or ambiguous scope. Make these explicit in the ticket text |
| Approval gates slow the workflow | This is intentional — Harness Engineering trades speed for correctness. Each gate catches errors before they cascade. For trusted autonomous runs, you can approve quickly or modify the command to skip gates |
| Want to skip a gate | Respond "approve" immediately. The gate only blocks if you want to review or revise |
| Implementation plan has placeholders | The Planner agent's no-placeholder rule should catch these. The task reviewer's placeholder scan will also flag them. Re-run the planner with feedback |
| Implementation plan missing code blocks | The writing-plans integration requires code in every code step. Check that the `project-planner.md` agent has the updated prompt with the "No Placeholders" section |
| A reviewer always passes | Each reviewer requires evidence for every PASS. If it still rubber-stamps, verify the reviewer agent has the Verification Gate and Red Flags sections from `verification-before-completion` |
| A reviewer too strict | Each reviewer runs max 2 revision cycles then emits PASS with caveats. Unresolved issues are listed for the human gate |
| Reviewer triggers too many rewrites | Each reviewer is capped at 2 revision cycles per document. Persistent issues are surfaced as caveats, not blocked |
| Azure DevOps fetch fails | Confirm `az` CLI is installed and authenticated (`az login`) |
