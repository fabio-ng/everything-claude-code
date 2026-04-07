---
name: plan
description: "Phase 1: Planning workflow. Fetches ticket data, spawns analyst/architect/planner agents to produce spec, TDD, plan, and task documents."
allowed_tools: ["Agent", "Read", "Write", "Grep", "Glob", "Bash"]
---

# /plan — Phase 1: Planning

Ticket ID: $ARGUMENTS

## Goal

Produce four planning documents for ticket **$ARGUMENTS** in `docs/tickets/$ARGUMENTS/`. These documents will be reviewed by the team before any code is written (Phase 2).

## Workflow

### Step 1: Gather Ticket Info

If an Azure DevOps MCP or CLI is available, fetch the ticket:
```
az boards work-item show --id $ARGUMENTS --output json
```

If no ticket system is available, ask the user to provide:
- Ticket title
- Description
- Acceptance criteria
- Any linked items or context

Store the ticket info for passing to agents.

### Step 1.5: Input Quality Check

Evaluate the ticket information gathered in Step 1. Check for clarity:

**STOP and notify the user if ANY of these are true:**
- Acceptance criteria are missing or vague (e.g., "make it work", "improve performance")
- The ticket describes a goal but not the approach and has no testable criteria
- The scope is ambiguous — it's unclear what is in vs out of scope
- Key terms are undefined or contradictory

If the ticket fails the quality check, tell the user:

> **Input too vague to plan.** The ticket is missing clear acceptance criteria / has ambiguous scope / [specific issue].
>
> Please clarify the following before re-running `/plan`:
> - [list specific gaps]
>
> No agents will be spawned until the input is clear.

**STOP HERE. Do not spawn any agents for vague tickets.**

**If the ticket passes the quality check** (acceptance criteria are specific and testable, scope is well-bounded), continue to Step 2.

### Step 2: Create Output Directory

Create the directory `docs/tickets/$ARGUMENTS/` if it does not exist.

### Step 3: Spawn Analyst Agent

Spawn the **analyst** agent with:
- The ticket information gathered in Step 1
- Output path: `docs/tickets/$ARGUMENTS/01-spec.md`
- Template path: `.claude/templates/spec.md`
- Skills to load: `analyze-requirement`
- **Sizing:** The analyst classifies the request as S/M/L/XL (see `analyze-requirement` skill for thresholds). For S-size requests, the analyst produces a lightweight spec (problem, scope, acceptance criteria, recommendation only). For M/L/XL, the full 6-step analysis runs.
- **Project documentation scan:** The analyst scans project documentation (`high-level-documents/`, `docs/`, previous specs, ADRs — see `analyze-requirement` skill for the full fallback list) to identify which existing features are impacted by the new requirement. This surfaces conflicts, overlaps, and dependencies before solution design begins.

Wait for the agent to complete. Read the output file to confirm it was written.

### Step 3.5: Spawn Spec Reviewer Agent

Spawn the **project-spec-reviewer** agent with:
- Spec document: `docs/tickets/$ARGUMENTS/01-spec.md`
- Original ticket data from Step 1
- Project documentation paths (same as passed to analyst)
- Skills to load: `verification-before-completion`
- **Review focus:** Every FR has testable acceptance criteria. Scope boundaries are explicit (in/out). No vague requirements ("improve performance", "make it better"). Impact on existing features is documented — no blind spots.

Wait for the agent to return its verdict.

**If verdict is NEEDS REVISION:** Re-spawn the analyst agent with the original inputs PLUS the reviewer's feedback. After the analyst rewrites the spec, re-spawn the spec reviewer to verify fixes. **Maximum 2 revision cycles.** If issues remain after 2 cycles, proceed to the approval gate with the unresolved issues listed.

**If verdict is PASS:** Continue to the approval gate.

#### Approval Gate: Spec Document

Present a summary of `01-spec.md` to the user:
- Request size (S/M/L/XL)
- Number of functional requirements (FR-XXX)
- Number of non-functional requirements (NFR-XXX)
- Impact on existing features (from project documentation scan)
- Open questions (if any)
- Key scope boundaries
- Reviewer verdict (PASS, or PASS with caveats if unresolved issues remain)

Then ask:

> **01-spec.md** is ready for review at `docs/tickets/$ARGUMENTS/01-spec.md`.
>
> Please review and respond with:
> - **approve** — proceed to Technical Design
> - **revise** — provide feedback and I'll update the document
> - **edit** — you'll edit the file directly, tell me when done

**If revise:** Re-spawn the analyst agent with the original inputs PLUS the user's feedback. Re-run the spec reviewer after revision. Repeat this gate.

**If edit:** Wait for the user to confirm they are done editing. Re-read the file and proceed.

**If approve:** Continue to Step 4.

### Step 4: Spawn Architect Agent — Technical Design Document

Spawn the **project-architect** agent with:
- Task type: `tdd`
- Input document: `docs/tickets/$ARGUMENTS/01-spec.md`
- Output path: `docs/tickets/$ARGUMENTS/02-tdd.md`
- Template path: `.claude/templates/tdd.md`

Wait for the agent to complete. Read the output file to confirm it was written.

#### Approval Gate: Technical Design Document

Present a summary of `02-tdd.md` to the user:
- Key architecture decisions
- API endpoints defined
- Data model changes
- Migration strategy (if any)

Then ask:

> **02-tdd.md** is ready for review at `docs/tickets/$ARGUMENTS/02-tdd.md`.
>
> Please review and respond with:
> - **approve** — proceed to Solution Design
> - **revise** — provide feedback and I'll update the document
> - **edit** — you'll edit the file directly, tell me when done

**If revise:** Re-spawn the architect agent with the original inputs PLUS the user's feedback. Repeat this gate.

**If edit:** Wait for the user to confirm they are done editing. Re-read the file and proceed.

**If approve:** Continue to Step 5.

### Step 5: Multi-Agent Solution Design (Layer Architecture)

Phase 2 uses multiple specialized architect agents instead of a single architect. This eliminates the single-point-of-failure and enables domain-specific depth.

#### Step 5a: Spawn Layer Detector

Spawn the **layer-detector** agent with:
- Input document: `docs/tickets/$ARGUMENTS/01-spec.md`
- Task: Classify which domain layers are affected by this change

Wait for the agent to return its layer activation map. The map specifies which of these layers are active:
- **Frontend** (only if spec touches UI/UX)
- **Backend** (only if spec touches APIs/services)
- **Database** (only if spec touches data/storage)
- **Security** (always active)
- **Infrastructure** (only if spec touches deploy/CI/CD)

Store the activation map and layer-specific context for the next step.

#### Step 5b: Spawn Layer Architects (in parallel)

For each **active layer**, spawn the corresponding architect agent **in parallel**. All layer architects run concurrently and independently.

**If Backend is active**, spawn the **architect-backend** agent with:
- Input documents: `docs/tickets/$ARGUMENTS/01-spec.md` and `docs/tickets/$ARGUMENTS/02-tdd.md`
- Layer context from the layer-detector
- Output path: `docs/tickets/$ARGUMENTS/03-plan-backend.md`
- Skills to load: `implementation-depth`, `api-design`, `error-handling`, `backend-patterns`
- **Depth rules**: Every endpoint needs exact route, JSON shapes, error table, validation rules, file path. Forbidden vague phrases cause rejection.

**If Database is active**, spawn the **architect-database** agent with:
- Input documents: `docs/tickets/$ARGUMENTS/01-spec.md` and `docs/tickets/$ARGUMENTS/02-tdd.md`
- Layer context from the layer-detector
- Output path: `docs/tickets/$ARGUMENTS/03-plan-database.md`
- Skills to load: `implementation-depth`, `database-migrations`
- **Depth rules**: Every table needs full SQL, column types, indexes with rationale, migration name, rollback SQL.

**Always** spawn the **architect-security** agent with:
- Input documents: `docs/tickets/$ARGUMENTS/01-spec.md` and `docs/tickets/$ARGUMENTS/02-tdd.md`
- Layer context from the layer-detector
- Other layer outputs (if available — pass backend output path so security can reference endpoints)
- Output path: `docs/tickets/$ARGUMENTS/03-plan-security.md`
- Skills to load: `implementation-depth`
- **Depth rules**: Every endpoint needs auth model, threat surface, data classification. No "appropriate security."

**If Frontend is active**, spawn the **architect-frontend** agent with:
- Input documents: `docs/tickets/$ARGUMENTS/01-spec.md` and `docs/tickets/$ARGUMENTS/02-tdd.md`
- Layer context from the layer-detector
- Output path: `docs/tickets/$ARGUMENTS/03-plan-frontend.md`
- Skills to load: `implementation-depth`, `frontend-patterns`
- **Depth rules**: Every component needs typed props, state shape, API calls, accessibility.

**If Infrastructure is active**, spawn the **architect-infra** agent with:
- Input documents: `docs/tickets/$ARGUMENTS/01-spec.md` and `docs/tickets/$ARGUMENTS/02-tdd.md`
- Layer context from the layer-detector
- Output path: `docs/tickets/$ARGUMENTS/03-plan-infra.md`
- Skills to load: `implementation-depth`, `deployment-patterns`
- **Depth rules**: Every config change needs exact file path and content.

Wait for all layer architects to complete. Read each output file to confirm it was written.

#### Step 5b.1: Check for SPEC_REVISION_NEEDED Signals

After all layer architects complete, scan their outputs for `SPEC_REVISION_NEEDED` signals. Any layer architect may emit this signal if it discovers that a Functional Requirement assumes something that does not exist in the codebase.

**If any layer architect emitted SPEC_REVISION_NEEDED with severity BLOCKER:**

Pause Phase 2. Collect all blocked FRs from all layer outputs into a single Spec Revision Request and present it to the user:

> **Spec revision needed.** Layer architects discovered assumptions in the spec that do not hold in the codebase:
>
> | FR | Layer | Assumption in Spec | Reality in Codebase | Required Action |
> |----|-------|--------------------|---------------------|-----------------|
> | (list from all layer outputs) |
>
> **Non-blocked FRs:** (list FRs that can proceed)
>
> **Options:**
> - **A) Revise spec** — update `01-spec.md` to fix blocked FRs, then re-run Phase 2 from Step 5a
> - **B) Remove blocked FRs** — remove them from scope, proceed with remaining FRs
> - **C) Clarify inline** — provide clarification here, I'll re-run only the affected layer architect(s) for the blocked FRs

**If A:** Loop back to Step 3 (Analyst) with the blocked FR feedback. After spec revision and re-approval, restart Phase 2 from Step 5a.

**If B:** Mark the blocked FRs as out-of-scope in the spec. Continue to Step 5c with the non-blocked layer outputs only.

**If C:** Inject the human's clarification into the affected layer architect prompts. Re-spawn only those layer architects for the blocked FRs. Then continue to Step 5c.

**If no SPEC_REVISION_NEEDED signals:** Continue to Step 5c.

#### Step 5c: Spawn Plan Assembler

Spawn the **plan-assembler** agent with:
- Spec document: `docs/tickets/$ARGUMENTS/01-spec.md`
- All layer architect outputs:
  - `docs/tickets/$ARGUMENTS/03-plan-backend.md` (if active)
  - `docs/tickets/$ARGUMENTS/03-plan-database.md` (if active)
  - `docs/tickets/$ARGUMENTS/03-plan-security.md` (always)
  - `docs/tickets/$ARGUMENTS/03-plan-frontend.md` (if active)
  - `docs/tickets/$ARGUMENTS/03-plan-infra.md` (if active)
- Output path: `docs/tickets/$ARGUMENTS/03-plan.md`
- Template path: `.claude/templates/plan.md`
- Skills to load: `implementation-depth`

The assembler will:
1. Cross-validate type consistency across layers (e.g., DB says UUID, backend says INT → conflict)
2. Verify reference integrity (backend references a table → that table must exist in database section)
3. Check security coverage (every backend endpoint must have a security entry)
4. Run depth audit (reject if any forbidden phrase or incomplete section found)
5. Merge all layers into unified `03-plan.md`

Wait for the assembler to return its verdict.

#### If assembler verdict is NEEDS REVISION:

The assembler will specify which layer architect(s) need to revise and what to fix. Re-spawn only the affected layer architect(s) with the assembler's feedback. Then re-run the assembler.

**Maximum 2 revision cycles.** If conflicts remain after 2 cycles, proceed to the plan reviewer with the conflicts documented.

#### Step 5d: Spawn Dual Reviewers (in parallel)

Spawn the **plan-reviewer** and **security-reviewer-plan** agents **in parallel**:

**Plan Reviewer:**
- Plan document: `docs/tickets/$ARGUMENTS/03-plan.md`
- Spec document: `docs/tickets/$ARGUMENTS/01-spec.md`
- Skills to load: `implementation-depth`, `verification-loop`
- **Review focus**: Implementation depth — reject plans with vague phrases, missing JSON shapes, incomplete SQL, or prose-only error handling. See `agents/plan-reviewer.md` for the full review process.

**Security Reviewer:**
- Plan document: `docs/tickets/$ARGUMENTS/03-plan.md`
- Spec document: `docs/tickets/$ARGUMENTS/01-spec.md`
- **Review focus**: Security completeness — reject plans with missing auth, unclassified PII, unmitigated injection surfaces, missing rate limits. See `agents/security-reviewer-plan.md` for the full review process.

Wait for both agents to return their verdicts.

#### If BOTH verdicts are PASS:

Continue to Step 5e (Gate Review Guide generation).

#### If EITHER verdict is NEEDS REVISION:

Combine findings from both reviewers. For each issue:
1. Identify which layer produced the failing section
2. If depth issue (plan-reviewer): re-spawn the affected layer architect with revision feedback
3. If security issue (security-reviewer): re-spawn the **architect-security** agent with specific gaps to fill, then re-run the assembler to merge the updated security section

After revision, re-run the assembler to merge updated sections, then re-run **both** reviewers.

**Maximum 2 revision cycles for MAJOR issues.** Forbidden phrase violations and security BLOCKERs always require revision regardless of cycle count. If issues remain after 2 cycles, escalate to the human gate with both reviewers' detailed findings.

#### Step 5e: Generate Gate Review Guide

After both reviewers PASS, generate `docs/tickets/$ARGUMENTS/gate-2-review-guide.md` with this structure:

```markdown
# Gate 2 Review Guide — $ARGUMENTS

## What the AI already verified

Summarize what each reviewer checked and their scores:
- Plan Reviewer: FR coverage (X/Y), depth score (endpoints, tables, services), forbidden phrases (0)
- Security Reviewer: auth completeness (X/Y), RBAC coverage, injection mitigations, data classification, rate limiting
- Plan Assembler: cross-layer consistency (types, references, security coverage)

## What needs YOUR judgment

These are decisions the AI cannot make:

1. **Business logic correctness** — Does the flow match how the business actually works? Are these the right edge cases?
2. **Team capacity** — Does the team have bandwidth for the proposed scope? Are downtime windows acceptable?
3. **Organizational constraints** — Does this need other team approvals (platform, security, legal)?
4. **Risk appetite** — Are the mitigations for flagged risks sufficient? Is the fallback strategy acceptable?

## Unresolved items from AI review

List any issues that remained after revision cycles, with severity and reviewer recommendation.
If none: "All items resolved in revision cycles."

## Quick actions
- **Approve:** Proceed to Phase 3 (Test + Tasks)
- **Revise:** Send feedback — specify which section(s) need changes
- **Edit:** Modify 03-plan.md directly, tell me when done
```

#### Approval Gate: Solution Design

Present a summary of `03-plan.md` to the user, including:
- **Layers activated:** which layer architects ran (e.g., Backend, Database, Security)
- **Files to create/modify:** count NEW vs MODIFY
- **API endpoints defined:** with depth score (X/Y fully specified)
- **Database tables defined:** with depth score (X/Y with full SQL)
- **Security coverage:** X/Y endpoints with auth + threat model
- **Security review:** PASS or issues found
- **Cross-validation:** PASS or conflicts resolved
- **Forbidden phrases found:** should be 0
- **New dependencies**
- **Risk assessment highlights**

Then tell the user:

> **03-plan.md** is ready for review at `docs/tickets/$ARGUMENTS/03-plan.md`.
> A review guide is available at `docs/tickets/$ARGUMENTS/gate-2-review-guide.md` — it highlights what the AI verified and what needs your judgment.
>
> Please review and respond with:
> - **approve** — proceed to Implementation Planning
> - **revise** — provide feedback and I'll update the document
> - **edit** — you'll edit the file directly, tell me when done

**If revise:** Identify which layer(s) need revision based on user feedback. Re-spawn only the affected layer architect(s), then re-run assembler and both reviewers. Regenerate the gate review guide. Repeat this gate.

**If edit:** Wait for the user to confirm they are done editing. Re-read the file and proceed.

**If approve:** Continue to Step 6.

### Step 6: Spawn Planner Agent

Spawn the **project-planner** agent with:
- Input documents: all three docs from Steps 3-5
- Output path: `docs/tickets/$ARGUMENTS/04-task.md`
- Template path: `.claude/templates/task.md`

Wait for the agent to complete. Read the output file to confirm it was written.

### Step 7: Cross-Document Review

Spawn the **project-doc-reviewer** agent with:
- The original ticket data gathered in Step 1
- All four document paths:
  - `docs/tickets/$ARGUMENTS/01-spec.md`
  - `docs/tickets/$ARGUMENTS/02-tdd.md`
  - `docs/tickets/$ARGUMENTS/03-plan.md`
  - `docs/tickets/$ARGUMENTS/04-task.md`

Wait for the agent to return its verdict.

#### If verdict is PASS:

Continue to Step 8.

#### If verdict is NEEDS REVISION:

Print the reviewer's findings to the user. For each issue:
1. Identify which agent produced the affected document (analyst, architect, or planner)
2. Re-spawn that agent with the original inputs PLUS the reviewer's feedback for that document
3. After the agent rewrites the document, also re-run any downstream agents whose input changed:
   - If `01-spec.md` changed → re-run architect (TDD) → architect (solution design) → planner
   - If `02-tdd.md` changed → re-run architect (solution design) → planner
   - If `03-plan.md` changed → re-run planner
   - If `04-task.md` changed → no downstream re-runs needed

After revisions, re-spawn the **project-doc-reviewer** agent to verify fixes.

**Maximum 2 revision cycles.** If issues remain after 2 cycles, proceed to Step 8 and include the unresolved issues in the summary so the human reviewer is aware.

### Step 8: Summary

Print a summary of all 4 documents:
- **01-spec.md** — number of functional/non-functional requirements, open questions count
- **02-tdd.md** — key architecture decisions, API endpoints defined
- **03-plan.md** — files to change, new dependencies, risk count, depth score (endpoints/tables/services fully specified)
- **04-task.md** — total tasks, complexity breakdown (S/M/L)
- **Review verdict** — PASS, or NEEDS REVISION with unresolved issues listed

Tell the user:

> Documents ready for review in `docs/tickets/$ARGUMENTS/`.
> Review and add "Status: Approved" to each document before running `/project:build $ARGUMENTS`.

If the reviewer found unresolved issues after 2 revision cycles, also tell the user:

> **Note:** The automated reviewer flagged issues that could not be fully resolved:
> [list unresolved issues]
> Please address these during your review.

**STOP HERE. Do not implement anything.**
