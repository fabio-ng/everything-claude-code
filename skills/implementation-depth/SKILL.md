---
name: implementation-depth
description: "Enforces implementation-level specificity in plan documents (02-plan.md, 03-plan.md). Rejects vague summaries — every technical decision must be concrete enough to implement without guessing."
origin: ECC
---

# Implementation Depth Skill

Enforces that plan documents contain implementation-level detail, not architecture overviews. A plan that says "add an endpoint" without specifying the route, request/response shape, validation rules, error codes, and file path is a wish list, not a plan.

## When to Use

- When any agent is **writing** a plan document (02-tdd.md, 03-plan.md, 02-plan.md)
- When any agent is **reviewing** a plan document
- Loaded automatically by architect and plan-reviewer agents during the planning workflow

## Core Principle

> If you removed the spec entirely, could someone implement from the plan alone?
> If not, the plan is too shallow.

Each plan section maps 1:1 to a task in the next phase. If the plan section is vague, the task will be vague, and the implementation will diverge from the architect's intent.

---

## Depth Requirements by Domain

### API Endpoints

Every endpoint in the plan MUST include:

| Field | Required | Example |
|-------|----------|---------|
| Exact route path | Yes | `POST /api/v2/payments` |
| HTTP method | Yes | `POST` |
| File path | Yes | `src/routes/payment.routes.ts` (NEW) |
| Controller/handler file | Yes | `src/controllers/payment.controller.ts` |
| Auth requirements | Yes | JWT required, roles: [admin, manager] |
| Rate limit | If applicable | 10 req/min per user |
| Request body JSON shape | Yes | Full JSON with field types and constraints |
| Response JSON shape (per status code) | Yes | 201, 400, 404, 409, 422 responses |
| Error response table | Yes | Code, condition, response body |
| Validation rules per input field | Yes | `orderId`: must exist in orders table, status != paid |
| Dependencies on other files/modules | Yes | `src/middleware/auth.ts` (existing, no changes) |

### Database Changes

Every table change in the plan MUST include:

| Field | Required | Example |
|-------|----------|---------|
| Exact SQL (CREATE TABLE / ALTER TABLE) | Yes | Full DDL with column types |
| Column types, constraints, defaults | Yes | `DECIMAL(10,2) NOT NULL CHECK (amount > 0)` |
| Indexes with rationale | Yes | `CREATE INDEX idx_payments_status ON payments(status)` |
| Migration file name | Yes | `migrations/20260408_create_payments` |
| Rollback strategy (exact SQL) | Yes | `DROP TABLE payments` |
| Column rationale for non-obvious choices | Yes | `uq_payment_order`: prevents duplicate payments (FR-003) |
| Enum/status values listed explicitly | Yes | pending, processing, completed, failed, refunded |

### Services and Modules

Every new or modified service/module MUST include:

| Field | Required | Example |
|-------|----------|---------|
| File path (NEW or MODIFY) | Yes | `src/services/payment.service.ts` (NEW) |
| Public function signatures | Yes | `processPayment(orderId: UUID, amount: Decimal, currency: string): Promise<PaymentResult>` |
| Parameter types and return types | Yes | Typed signatures, not prose descriptions |
| Error cases and propagation | Yes | Throws `OrderNotFoundError`, `DuplicatePaymentError` |
| Dependencies (imports) | Yes | `import { OrderRepository } from '../repositories/order.repository'` |

### Frontend Components (if applicable)

Every component MUST include:

| Field | Required | Example |
|-------|----------|---------|
| File path | Yes | `src/components/PaymentForm.tsx` (NEW) |
| Props interface | Yes | `{ orderId: string; onSuccess: (paymentId: string) => void }` |
| State shape | Yes | `{ loading: boolean; error: string | null }` |
| API calls made | Yes | `POST /api/v2/payments` on form submit |
| Route config (if routed) | If applicable | `/checkout/:orderId` |

### Infrastructure (if applicable)

Every infra change MUST include:

| Field | Required | Example |
|-------|----------|---------|
| Exact config changes | Yes | Dockerfile line, env var name + description |
| Scaling rules | If applicable | Min 2 / max 10 replicas, scale at 70% CPU |
| Health check endpoint | If applicable | `GET /health` returns 200 |
| CI pipeline changes | If applicable | New step in `.github/workflows/deploy.yml` |

---

## Forbidden Phrases

A plan FAILS depth review if it contains any of these vague phrases. Each has a required replacement:

| Forbidden Phrase | Required Replacement |
|-----------------|---------------------|
| "appropriate error handling" | Specify every error code, condition, and response body |
| "relevant fields" | List every field with its type and constraints |
| "proper validation" | Specify every validation rule for every input field |
| "similar to X" | Write the actual code, schema, or contract |
| "as needed" | Define exactly what is needed |
| "etc." | List every item explicitly |
| "standard approach" | Describe the specific approach chosen |
| "will be implemented" | Describe HOW it will be implemented |
| "appropriate security" | Specify auth model, roles, and threat mitigations |
| "handle edge cases" | List every edge case and its handling |
| "TBD" / "to be determined" | Decide now or flag as an explicit open question with a deadline |
| "will be added later" | Either include it now or explicitly scope it out with rationale |

---

## Depth Verification Checklist

Use this checklist when reviewing a plan for depth compliance.

### API Sections — REJECT if:

- [ ] Any endpoint lacks an exact route path (method + URL)
- [ ] Any endpoint has no request/response JSON shape
- [ ] Any endpoint missing error response table
- [ ] Any endpoint has no file path (new or modify)
- [ ] Validation rules say "validate input" without listing each rule
- [ ] Auth requirements not specified per endpoint

### Database Sections — REJECT if:

- [ ] Any table change has no SQL definition
- [ ] Any column lacks an explicit type
- [ ] Migration has no rollback strategy
- [ ] Indexes not listed or not justified
- [ ] Enum/status values not enumerated

### Service Sections — REJECT if:

- [ ] Any service/module has no file path
- [ ] Function signatures missing parameter types or return types
- [ ] Error cases described in prose ("handles errors") instead of listing each error

### General — REJECT if:

- [ ] Contains ANY forbidden phrase from the table above
- [ ] File paths reference files that don't exist and are not marked as NEW
- [ ] Any section says "will be determined" or "TBD" without a resolution deadline

### Depth Score (include in every review verdict):

```
Depth Score:
  Endpoints fully specified: X / Y total
  Tables with full SQL:      X / Y total
  Services with signatures:  X / Y total
  Forbidden phrases found:   X (list each)

Verdict: PASS | NEEDS REVISION
```

If forbidden phrases > 0: **always NEEDS REVISION**, regardless of revision cycle count.

---

## Examples

### Bad (fails depth check)

```markdown
## API Design

We will add a payments endpoint that accepts payment details and
processes them. The endpoint will validate input and return
appropriate error responses.

## Database

A new payments table will store payment records with relevant
fields for tracking payment status.
```

Problems: "appropriate error responses" (forbidden), "relevant fields" (forbidden), no route path, no JSON shape, no SQL, no file paths.

### Good (passes depth check)

```markdown
## API Design

### POST /api/v2/payments

**File:** `src/routes/payment.routes.ts` (NEW)
**Controller:** `src/controllers/payment.controller.ts` (NEW)
**Auth:** JWT required, roles: [admin, manager]
**Rate limit:** 10 req/min per user

**Request body:**
\`\`\`json
{
  "orderId": "string (UUID, required)",
  "amount": "number (positive, max 999999.99, required)",
  "currency": "string (ISO 4217, default: USD)",
  "method": "enum: credit_card | bank_transfer | wallet"
}
\`\`\`

**Response 201:**
\`\`\`json
{
  "id": "string (UUID)",
  "status": "pending",
  "createdAt": "ISO 8601"
}
\`\`\`

**Error responses:**
| Code | Condition | Body |
|------|-----------|------|
| 400  | Invalid amount | `{ "code": "INVALID_AMOUNT" }` |
| 404  | Order not found | `{ "code": "ORDER_NOT_FOUND" }` |
| 409  | Duplicate payment | `{ "code": "DUPLICATE" }` |
| 422  | Order already paid | `{ "code": "ALREADY_PAID" }` |

**Validation rules:**
- `orderId`: must exist in `orders` table, status != paid
- `amount`: must match `orders.totalAmount`
- `currency`: must match `orders.currency`

**Depends on:**
- `src/middleware/auth.ts` (existing, no changes)
- `src/lib/validate.ts` (existing, add amount validator)
- `src/models/payment.model.ts` (NEW, see Database section)
```
