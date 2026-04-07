# Plan: {{TICKET_ID}} — {{FEATURE_NAME}}

> **Depth rule:** Every section must pass the "can an implementer code this without guessing?" test. If a section says *what* without *how*, it fails. See `skills/implementation-depth/SKILL.md` for the full checklist.

## 1. Overview

**Ticket:** {{TICKET_ID}}
**Spec:** `docs/tickets/{{TICKET_ID}}/01-spec.md`
**Status:** Draft | Reviewed | Approved

### 1.1 Summary

<!-- 2-3 sentences: what this change does and why -->

### 1.2 Functional Requirements Coverage

<!-- Map every FR from the spec to a plan section. Every FR must appear at least once. -->

| FR ID | Description | Plan Section |
|-------|-------------|--------------|
| FR-001 | ... | Section X.Y |
| FR-002 | ... | Section X.Y |

### 1.3 Non-Functional Requirements Coverage

| NFR ID | Description | How Addressed |
|--------|-------------|---------------|
| NFR-001 | ... | ... |

---

## 2. File & Dependency Map

### 2.1 Files to Create

| File Path | Purpose | Depends On |
|-----------|---------|------------|
| `path/to/new-file.ts` (NEW) | ... | ... |

### 2.2 Files to Modify

| File Path | Change Description | Backward Compatible? |
|-----------|--------------------|---------------------|
| `path/to/existing.ts` (MODIFY) | ... | Yes / No — migration note |

### 2.3 New Dependencies

| Package | Version | Justification |
|---------|---------|---------------|
| ... | ... | Why this package, why not alternatives |

### 2.4 Dependency Graph

<!-- Show which new/modified files depend on which. Text or ASCII diagram. -->

```
new-file.ts
  ├── existing-service.ts (no changes)
  ├── new-model.ts (NEW)
  └── existing-middleware.ts (no changes)
```

---

## 3. API Design

<!-- Repeat this section for EVERY new or modified endpoint. -->

### 3.X {{METHOD}} {{ROUTE_PATH}}

**File:** `path/to/route.ts` (NEW | MODIFY)
**Controller:** `path/to/controller.ts` (NEW | MODIFY)
**Auth:** {{auth requirements — JWT, API key, public, roles}}
**Rate limit:** {{rate limit or "none"}}

**Request body:**
```json
{
  "fieldName": "type (constraints, required/optional, default)"
}
```

**Request headers (non-standard):**
<!-- Only list custom headers, not Authorization/Content-Type -->

| Header | Required | Description |
|--------|----------|-------------|
| ... | ... | ... |

**Query parameters (if GET/DELETE):**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| ... | ... | ... | ... | ... |

**Response {{STATUS_CODE}}:**
```json
{
  "field": "type"
}
```

**Error responses:**

| Code | Condition | Response Body |
|------|-----------|---------------|
| 400 | {{condition}} | `{ "code": "ERROR_CODE", "message": "..." }` |
| 404 | {{condition}} | `{ "code": "ERROR_CODE", "message": "..." }` |
| 409 | {{condition}} | `{ "code": "ERROR_CODE", "message": "..." }` |
| 422 | {{condition}} | `{ "code": "ERROR_CODE", "message": "..." }` |

**Validation rules:**

- `fieldName`: {{exact validation rule}}

**Depends on:**

- `path/to/module.ts` (existing, {{change description or "no changes"}})

---

## 4. Database Design

<!-- Repeat this section for EVERY new or modified table/collection. -->

### 4.X {{NEW TABLE | MODIFY TABLE}}: {{table_name}}

**Migration file:** `migrations/{{YYYYMMDD}}_{{description}}`
**Rollback:** {{exact SQL or description of rollback}}

```sql
CREATE TABLE {{table_name}} (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- list every column with type, constraints, defaults
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- indexes with rationale
CREATE INDEX idx_{{table}}_{{column}} ON {{table}}({{column}});
-- why: {{rationale for this index}}
```

**Column rationale (non-obvious choices):**

- `{{column}}`: {{why this type/constraint/default}}

**Enum/status values:**

- `{{column}}`: {{value1}}, {{value2}}, {{value3}}

**Relationships:**

- `{{column}}` → `{{other_table}}({{column}})` (FK, CASCADE | SET NULL | RESTRICT)

---

## 5. Service & Module Design

<!-- Repeat for every new or significantly modified service/module. -->

### 5.X {{Service/Module Name}}

**File:** `path/to/service.ts` (NEW | MODIFY)
**Purpose:** {{one-line purpose}}

**Public interface:**

```typescript
// List every public function with full signature
function processPayment(
  orderId: UUID,
  amount: Decimal,
  currency: string
): Promise<PaymentResult>

// Types referenced
interface PaymentResult {
  id: UUID
  status: PaymentStatus
  createdAt: Date
}

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
```

**Error cases:**

| Error | Condition | Propagation |
|-------|-----------|-------------|
| `OrderNotFoundError` | orderId not in DB | Throws → controller returns 404 |
| `DuplicatePaymentError` | payment already exists for order | Throws → controller returns 409 |

**Dependencies:**

- `path/to/repository.ts` — {{what it uses from this module}}

---

## 6. Security Considerations

### 6.1 Auth Model

<!-- How does auth work for the new/changed surfaces? -->

| Endpoint / Surface | Auth Method | Roles | Notes |
|-------------------|-------------|-------|-------|
| POST /api/v2/payments | JWT | admin, manager | ... |

### 6.2 Data Classification

| Data Field | Classification | Handling |
|-----------|---------------|----------|
| payment.amount | PII-financial | Encrypt at rest, audit log access |

### 6.3 Threat Surface

| Threat | Endpoint/Component | Mitigation |
|--------|-------------------|------------|
| SQL injection | POST /api/v2/payments | Parameterized queries via ORM |
| IDOR | GET /api/v2/payments/:id | Ownership check in middleware |
| Rate abuse | POST /api/v2/payments | Rate limit: 10/min per user |

### 6.4 Input Validation Summary

<!-- Consolidate all validation rules across endpoints -->

| Field | Endpoint | Rules |
|-------|----------|-------|
| orderId | POST /payments | UUID format, exists in DB, order.status != paid |
| amount | POST /payments | positive, max 999999.99, matches order.totalAmount |

---

## 7. Migration Strategy

### 7.1 Migration Order

<!-- Ordered list of migrations to run -->

1. `migrations/{{YYYYMMDD}}_{{name}}` — {{description}}
2. ...

### 7.2 Rollback Plan

| Step | Action | Verification |
|------|--------|-------------|
| 1 | Run `migrations/{{YYYYMMDD}}_{{name}}_rollback` | Verify table dropped/reverted |
| 2 | Deploy previous version tag | Health check passes |

### 7.3 Data Migration (if applicable)

<!-- If existing data needs transformation -->

| Source | Destination | Transformation | Estimated Rows |
|--------|-------------|----------------|----------------|
| ... | ... | ... | ... |

### 7.4 Backward Compatibility

<!-- Can old clients/code work during rollout? -->

| Change | Backward Compatible? | Migration Note |
|--------|---------------------|----------------|
| New `payment` field on GET /orders/:id | Yes | Returns `null` for unpaid orders |

---

## 8. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| {{risk description}} | High/Medium/Low | High/Medium/Low | {{specific mitigation}} |

---

## 9. Testing Strategy

### 9.1 Unit Tests

| Test | File | What It Verifies |
|------|------|-----------------|
| Payment validation | `tests/unit/payment.test.ts` | All validation rules from Section 3 |

### 9.2 Integration Tests

| Test | File | What It Verifies |
|------|------|-----------------|
| Payment flow | `tests/integration/payment.test.ts` | Create payment → verify DB state |

### 9.3 E2E Tests (if applicable)

| Test | What It Verifies |
|------|-----------------|
| Full checkout | User creates order → pays → receives confirmation |

---

## 10. Implementation Order

<!-- Ordered sequence of tasks, each mapping to a plan section. -->

| Order | Task | Plan Section | Depends On | Complexity |
|-------|------|-------------|------------|------------|
| 1 | Create payments table migration | 4.1 | None | S |
| 2 | Create payment service | 5.1 | Task 1 | M |
| 3 | Create POST /payments endpoint | 3.1 | Tasks 1, 2 | M |
| 4 | Add payment field to GET /orders | 3.2 | Task 1 | S |
| 5 | Write unit tests | 9.1 | Tasks 2, 3 | S |
| 6 | Write integration tests | 9.2 | Tasks 1-4 | M |

---

## Appendix: Depth Self-Check

Before submitting this plan for review, verify:

- [ ] Every FR from the spec is mapped to at least one plan section (Section 1.2)
- [ ] Every endpoint has exact route, JSON shapes, error table, validation rules, and file path (Section 3)
- [ ] Every database change has full SQL, column types, indexes, migration name, and rollback (Section 4)
- [ ] Every service has file path, typed function signatures, and error case table (Section 5)
- [ ] Security section covers auth per endpoint, data classification, and threat surface (Section 6)
- [ ] No forbidden phrases: "appropriate", "relevant", "proper", "similar to", "as needed", "etc.", "standard", "will be implemented", "TBD" (see `implementation-depth` skill)
- [ ] All file paths reference existing files or are marked NEW
- [ ] Implementation order has no circular dependencies
