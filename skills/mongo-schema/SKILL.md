---
name: mongo-schema
description: MongoDB schema design patterns including embedding vs referencing, indexing strategies, schema validation, unbounded array prevention, and Mongoose model conventions.
origin: ECC
---

# MongoDB Schema Design Patterns

Data modeling and schema conventions for MongoDB and Mongoose.

## When to Activate

- Designing new MongoDB collections
- Deciding between embedding and referencing
- Creating or modifying Mongoose models
- Adding indexes for query performance
- Working with schema validation
- Dealing with large or growing arrays in documents

## Core Principles

1. **Design for your queries** — schema follows access patterns, not relational normalization
2. **Embed by default, reference when necessary** — reads are cheaper than joins
3. **Avoid unbounded arrays** — arrays that grow without limit degrade performance
4. **Validate at the database level** — application-level validation is not enough
5. **Index every query pattern** — use `explain()` to verify index usage

## Embedding vs Referencing

### When to Embed

- Data is always read together (e.g., user + their profile)
- One-to-few relationship (< ~100 items)
- Child data does not change independently
- Child data is not shared across parents

```javascript
// GOOD: Embed — address is always read with user
const userSchema = new Schema({
  name: String,
  email: String,
  address: {
    street: String,
    city: String,
    country: String,
    zip: String,
  },
});
```

### When to Reference

- Data is shared across multiple documents
- One-to-many relationship (hundreds+)
- Child data changes independently
- Child data is queried separately

```javascript
// GOOD: Reference — orders are many and queried independently
const userSchema = new Schema({
  name: String,
  email: String,
});

const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [{ productId: Schema.Types.ObjectId, quantity: Number, price: Number }],
  total: Number,
  status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'] },
  createdAt: { type: Date, default: Date.now },
});
```

### Decision Matrix

| Factor | Embed | Reference |
|--------|-------|-----------|
| Read together? | Always | Sometimes / Never |
| Relationship size | Few (< 100) | Many (100+) |
| Changes independently? | No | Yes |
| Shared across parents? | No | Yes |
| Document size growth | Bounded | Unbounded |

## Unbounded Array Prevention

Arrays that grow without limit are the most common MongoDB performance problem.

```javascript
// BAD: Unbounded array — grows forever
const userSchema = new Schema({
  name: String,
  activityLog: [{ action: String, timestamp: Date }],  // will grow unbounded
});

// GOOD: Separate collection with reference
const activitySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: String,
  timestamp: { type: Date, default: Date.now, index: true },
});
```

### Bucketing Pattern

For time-series or high-volume data, bucket into fixed-size documents:

```javascript
const activityBucketSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  date: { type: String, index: true },  // "2026-04-06"
  count: Number,
  activities: [{ action: String, timestamp: Date }],  // bounded by day
});
```

## Indexing Strategy

### Rules

- Create an index for every query pattern your application uses
- Use compound indexes that match query + sort order
- Put high-cardinality fields first in compound indexes
- Use partial indexes for queries that filter on a condition
- Use `{ unique: true }` to enforce uniqueness at the database level
- Always verify with `explain()` that queries use the intended index

### Common Index Patterns

```javascript
// Single field — exact match queries
orderSchema.index({ userId: 1 });

// Compound — query + sort
orderSchema.index({ userId: 1, createdAt: -1 });

// Unique — enforce uniqueness
userSchema.index({ email: 1 }, { unique: true });

// Partial — index only active documents
userSchema.index({ email: 1 }, { partialFilterExpression: { active: true } });

// TTL — auto-delete expired documents
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Text — full-text search
productSchema.index({ name: 'text', description: 'text' });
```

## Schema Validation

Define validation at the database level, not only in Mongoose:

```javascript
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  age: { type: Number, min: 0, max: 150 },
  createdAt: { type: Date, default: Date.now, immutable: true },
});
```

### MongoDB-Native Validation

For collections not managed by Mongoose, set `$jsonSchema` validation:

```javascript
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'role'],
      properties: {
        name: { bsonType: 'string', maxLength: 100 },
        email: { bsonType: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
        role: { enum: ['user', 'admin', 'moderator'] },
      },
    },
  },
});
```

## Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Collections | plural, lowercase, camelCase | `users`, `orderItems` |
| Fields | camelCase | `firstName`, `createdAt` |
| Boolean fields | `is`/`has` prefix | `isActive`, `hasVerifiedEmail` |
| Reference fields | singular + `Id` suffix | `userId`, `orderId` |
| Enum values | lowercase or kebab-case | `pending`, `in-progress` |

## Mongoose Model Conventions

```javascript
// Define schema separately from model
const userSchema = new Schema({ /* ... */ }, {
  timestamps: true,        // adds createdAt, updatedAt
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true },
});

// Add indexes on the schema, not inline
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, createdAt: -1 });

// Add instance methods
userSchema.methods.isAdmin = function () {
  return this.role === 'admin';
};

// Add static methods
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Export model
const User = model('User', userSchema);
module.exports = { User };
```

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Unbounded arrays | Document grows past 16MB limit, degrades performance | Separate collection or bucketing |
| Dynamic field names | Cannot index, cannot validate | Use fixed field names with an array of key-value pairs |
| Using `$where` or regex on large collections | Full collection scan | Use proper indexes and `$text` search |
| No indexes on query fields | Every query is a collection scan | Add indexes for every access pattern |
| Storing large blobs in documents | Bloats working set, hits 16MB limit | Use GridFS or external object storage |
| Using ObjectId.toString() for joins | String comparison is slower | Keep ObjectId type for references |

## Checklist

- [ ] Schema follows query access patterns (not relational normalization)
- [ ] No unbounded arrays
- [ ] Every query pattern has a matching index
- [ ] Indexes verified with `explain()`
- [ ] Schema validation at database level (not just application)
- [ ] Naming follows conventions (plural collections, camelCase fields)
- [ ] `timestamps: true` on schemas that need audit trail
- [ ] Unique constraints enforced by database index
