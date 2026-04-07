---
name: analyze-requirement
description: "[Planning] Analyze a raw request/requirement — size it, classify it, assess feasibility, define scope, and produce a Requirement Analysis Document (RAD). Use as the first step of the planning workflow — before solution design."
argument-hint: "<raw request or requirement description>"
---

> **[IMPORTANT]** Use `TaskCreate` to break ALL work into small tasks BEFORE starting — including a final review task.

## Quick Summary

**Goal:** Scan system documents against a raw request/requirement, find related docs, identify side effects, analyze implementation risks, and produce a structured RAD.
**Workflow:** Capture request → Classify type → Scan related docs → Identify side effects → Analyze risks → Write RAD
**Key Rules:** RAD focuses on WHAT to build, not HOW. Side effects and risks are mandatory sections. Scope boundaries (in/out) are mandatory. Output feeds into Phase 2 (Spec → Plan) of the planning workflow.

---

## When to Use

- First step of the planning workflow (see `docs/planning-workflow-guide.md`, Phase 1: Idea → Spec)
- When receiving a new request that needs structured analysis before solution design
- When you need to assess feasibility, define scope, and write acceptance criteria before jumping to implementation

### Sizing Thresholds

Not every request needs the full 6-step workflow. Use the sizing from Step 1 to route:

| Size | Examples | Workflow |
|------|----------|----------|
| **Skip entirely** | Typo fix, config value change, dependency bump | No RAD needed — just do it |
| **S** | Single-file bug fix, add a field to existing API, update validation rule | Lightweight RAD (Steps 1 + 6-lite only) |
| **M** | Multi-file feature, new API endpoint, schema migration | Full RAD (all 6 steps) |
| **L/XL** | New service, cross-system integration, architecture change | Full RAD (all 6 steps) |

---

## Input

The user provides a **Raw Request or Requirement** — this can be:

- A feature request or user story
- A bug report
- A technical task or improvement request
- A product requirement document (PRD) excerpt
- A Slack message, email summary, or verbal request transcript
- Free-text description of what needs to be built or fixed

Access via `$ARGUMENTS` or from the user's message.

## Output

A **Requirement Analysis Document (RAD)** written to `docs/tickets/{id}/01-spec.md` containing all sections defined below. When used standalone (outside `/plan`), write to `plans/{slug}/requirement-analysis.md` instead.

---

## Workflow

### 1. Capture & Structure the Request

Normalize the raw request into a structured format.

**Actions:**

- Capture the raw request verbatim (preserve original wording)
- Identify the **requester** and their role (if known)
- Extract the core **problem/need** — separate "what they want" from "what they actually need"
- Record any **constraints** or **deadlines** mentioned
- If the request is ambiguous, use `AskUserQuestion` to clarify before proceeding

> **Autonomous fallback:** If running in batch/autonomous mode (no user available), do NOT block on `AskUserQuestion`. Instead: (1) make reasonable assumptions based on available context, (2) document each assumption explicitly in the "Open Questions" section of the RAD, and (3) mark the RAD status as "Draft — Assumptions Made" instead of "Draft".

**Output:** Structured request summary:

| Field             | Value                                            |
| ----------------- | ------------------------------------------------ |
| **Requester**     | {name, role}                                     |
| **Raw Request**   | {verbatim quote or summary}                      |
| **Core Problem**  | {the actual problem being solved}                |
| **Constraints**   | {deadline, budget, technology, compliance, etc.} |
| **Priority**      | {Critical / High / Medium / Low}                 |
| **Initial Scope** | {rough scope estimate — S/M/L/XL}                |

### Sizing Gate

Based on the **Initial Scope** from Step 1, route the workflow:

- **S (Small):** Skip Steps 2–5. Jump directly to Step 6 using the **Lightweight RAD Template**. This produces a shortened analysis with only: Request Summary, Problem Statement, Scope Definition, Acceptance Criteria, and Recommendation.
- **M / L / XL:** Continue with the full workflow (Steps 2–6) using the full RAD template.

> If unsure about the size, default to **M** and run the full workflow. It is better to over-analyze than to miss a hidden dependency.

### 2. Classify Request Type

Use `AskUserQuestion` to confirm classification.

> **Autonomous fallback:** If user is unavailable, infer the classification from the request text and note the inferred classification with confidence level (High/Medium/Low) in the RAD. Do not block.

| Type               | Indicators                                                    | Analysis Focus                      |
| ------------------ | ------------------------------------------------------------- | ----------------------------------- |
| **New Capability** | No existing implementation, new user flow, new module         | Architecture design, integration    |
| **Improvement**    | Existing feature needs enhancement, refactoring, optimization | Current vs proposed, migration path |
| **Bug Fix**        | Something broken, regression, unexpected behavior             | Root cause, blast radius            |
| **Technical Debt** | Code quality, scalability concern, maintenance burden         | ROI of fixing now vs later          |

### 3. Context Gathering

Collect relevant context before assessing feasibility.

**Actions:**

1. **Business Context** — Revenue impact, user base affected, compliance requirements (ask user if unclear)
2. **Related Requirements** — Check for overlapping or conflicting requirements

> **Where to find business context (check in order):**
> 1. `high-level-documents/` — if the project maintains a high-level docs directory
> 2. `docs/` — project documentation folder
> 3. Previous RADs/specs — `plans/*/requirement-analysis.md` or `docs/tickets/*/01-spec.md`
>
> If none of these exist, note "No project-level documentation found" in the Business Context section and proceed with available information only.

### 4. Technical Feasibility Assessment

Evaluate whether the requirement can be implemented within acceptable constraints.

**Assessment Dimensions:**

**Tier 1 — Code-Assessable (always evaluate):**

| Dimension                  | Key Questions                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| **Architecture Impact**    | Does this fit within existing architecture? New service needed? Cross-service communication? |
| **Data Model Impact**      | Schema changes required? Migration complexity? Data consistency implications?                |
| **Integration Complexity** | External APIs? Third-party dependencies? Cross-team coordination needed?                     |
| **Performance Impact**     | Expected load? Latency requirements? Scalability concerns?                                   |
| **Effort Estimate**        | T-shirt sizing (S/M/L/XL) with confidence level                                              |

**Tier 2 — Requires Human Input (flag for review):**

| Dimension                  | Key Questions                                                | Default if Unknown         |
| -------------------------- | ------------------------------------------------------------ | -------------------------- |
| **Security & Compliance**  | Auth/authz changes? PII handling? Regulatory requirements?   | Flag as "Needs Human Review" |
| **Revenue Impact**         | Revenue-critical path? SLA implications?                     | Flag as "Needs Human Review" |
| **Business Priority**      | Priority confirmed by stakeholder? Deadline validated?       | Use ticket priority as-is  |

> For Tier 2 dimensions, do not guess. Record them as open questions. The RAD is useful even if Tier 2 is incomplete — Tier 1 provides enough signal for technical planning.

**Feasibility Verdict:**

| Verdict              | Criteria                                                                           | Next Step                        |
| -------------------- | ---------------------------------------------------------------------------------- | -------------------------------- |
| ✅ **Feasible**      | Fits architecture, reasonable effort, acceptable risk                              | Proceed to Step 5                |
| ⚠️ **Conditionally** | Feasible with constraints (needs migration, phased rollout, dependency resolution) | Document conditions → Step 5     |
| ❌ **Not Feasible**  | Architecture mismatch, prohibitive effort, unacceptable risk                       | Document rationale → inform user |

> **If Not Feasible:** Write a brief RAD documenting the rejection rationale and alternative suggestions. Do NOT proceed to Step 5.

### 5. Requirement Refinement

Transform the analyzed requirement into a clear, testable, implementation-ready specification.

**Actions:**

1. **Resolve Ambiguity** — Identify and clarify vague terms, implicit assumptions, unstated expectations
2. **Define Scope Boundaries** — Explicitly state what is IN scope and what is OUT of scope
3. **Write Acceptance Criteria** — Each criterion must be:
   - **Specific** — no vague terms like "fast" or "user-friendly"
   - **Testable** — can be verified with a concrete test
   - **Independent** — doesn't depend on other criteria for its truth value
4. **Identify Test Scenarios** — High-level E2E scenarios derived from acceptance criteria
5. **Map Dependencies** — List what must be completed before this requirement can be implemented

### 6. Write Requirement Analysis Document (RAD)

Compile all analysis into a structured document. Write to `docs/tickets/{id}/01-spec.md` (or `plans/{slug}/requirement-analysis.md` when used standalone).

```markdown
# Requirement Analysis: {Title}

## Request Summary

| Field               | Value                                         |
| ------------------- | --------------------------------------------- |
| **Requester**       | {name, role}                                  |
| **Ticket**          | {ticket link or ID}                           |
| **Status**          | {Draft / Approved / Released}                 |
| **Type**            | {Feature / Improvement / Bug Fix / Tech Debt} |
| **Priority**        | {Critical / High / Medium / Low}              |
| **Effort Estimate** | {S / M / L / XL} (Confidence: {H/M/L})        |

## Problem Statement

{What problem are we solving? Why does it matter? Who is affected?}

## Raw Request

> {Original request — quoted verbatim}

## Context

### Architecture Context

{Which services, modules, databases are involved. Reference existing architecture docs.}

### Related Existing Solutions

{List similar implementations already in the system. Note reuse opportunities.}

| Existing Solution | Relevance | Reuse Potential |
| ----------------- | --------- | --------------- |
| ...               | ...       | H/M/L           |

## Feasibility Assessment

| Dimension              | Assessment | Notes     |
| ---------------------- | ---------- | --------- |
| Architecture Impact    | ✅/⚠️/❌   | {details} |
| Data Model Impact      | ✅/⚠️/❌   | {details} |
| Integration Complexity | ✅/⚠️/❌   | {details} |
| Security & Compliance  | ✅/⚠️/❌   | {details} |
| Performance Impact     | ✅/⚠️/❌   | {details} |

**Verdict:** {Feasible / Conditionally Feasible / Not Feasible}

{If conditional, list the conditions that must be met.}

## Scope Definition

### In Scope

- {Explicitly what will be delivered}

### Out of Scope

- {Explicitly what will NOT be delivered in this iteration}

## Acceptance Criteria

- [ ] {Specific, testable criterion}
- [ ] {Specific, testable criterion}

## High-Level Test Scenarios

| #   | Scenario | Expected Outcome | Priority |
| --- | -------- | ---------------- | -------- |
| 1   | ...      | ...              | H/M/L    |

## Dependencies

| Dependency | Type                              | Status               | Owner  | Blocker? |
| ---------- | --------------------------------- | -------------------- | ------ | -------- |
| ...        | {Technical / Business / External} | {Resolved / Pending} | {team} | {Yes/No} |

## Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| ...  | H/M/L      | H/M/L  | ...        |

## Recommendation

{Go / No-Go / Go with conditions. Brief justification.}

## Open Questions

- {Unresolved questions that need stakeholder input}
```

### Lightweight RAD Template (Size S)

For S-size requests, use this shortened template instead of the full RAD:

```markdown
# Requirement Analysis: {Title}

## Request Summary

| Field               | Value                                         |
| ------------------- | --------------------------------------------- |
| **Requester**       | {name, role}                                  |
| **Ticket**          | {ticket link or ID}                           |
| **Status**          | {Draft / Approved / Released}                 |
| **Type**            | {Feature / Improvement / Bug Fix / Tech Debt} |
| **Priority**        | {Critical / High / Medium / Low}              |
| **Effort Estimate** | S (Confidence: {H/M/L})                        |

## Problem Statement

{What problem are we solving? Why does it matter? Who is affected?}

## Scope Definition

### In Scope

- {Explicitly what will be delivered}

### Out of Scope

- {Explicitly what will NOT be delivered in this iteration}

## Acceptance Criteria

- [ ] {Specific, testable criterion}
- [ ] {Specific, testable criterion}

## Recommendation

{Go / No-Go / Go with conditions. Brief justification.}

## Open Questions

- {Unresolved questions — if any}
```

---

## Key Rules

- **WHAT, not HOW** — this skill analyzes the requirement, not the solution. Leave solution design to Phase 2 (Spec → Plan)
- **Evidence-based** — reference existing code with `file:line` when assessing feasibility and context
- **Feasibility before refinement** — assess feasibility (Step 4) before investing time in detailed criteria (Step 5)
- **Scope boundaries are mandatory** — both In Scope and Out of Scope must be explicitly defined
- **Flag unknowns** — list open questions explicitly rather than making silent assumptions
- **YAGNI** — analyze only what the requirement asks for, not speculative future needs

---

## Incremental Update

When requirements change for an existing RAD, do NOT start from scratch. Instead:

1. **Read the existing RAD** at the expected output path
2. **Diff the change** — identify which sections are affected by the new/changed requirement
3. **Update only affected sections:**
   - If scope changed → update Scope Definition, Acceptance Criteria, and re-assess Feasibility
   - If new constraint added → update Feasibility Assessment and Risks
   - If priority changed → update Request Summary only
   - If requirement clarified → update Problem Statement and Acceptance Criteria
4. **Add a changelog entry** at the bottom of the RAD:

   ```markdown
   ## Changelog

   | Date | Change | Sections Updated | Reason |
   |------|--------|-----------------|--------|
   | {date} | {brief description} | {list} | {why} |
   ```

5. **Preserve the original RAD's path** — do not create a new file

**When to use incremental vs. fresh:**
- **Incremental:** the core problem is the same, but details changed (scope adjustment, new constraint, priority shift)
- **Fresh:** the requirement has changed so fundamentally that the original RAD is no longer relevant

---
