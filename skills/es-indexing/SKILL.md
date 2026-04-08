---
name: es-indexing
description: Elasticsearch indexing patterns including mapping design, field types, aliases, bulk operations, search queries, and zero-downtime reindexing strategies.
origin: ECC
---

# Elasticsearch Indexing Patterns

Mapping design, indexing strategies, and search conventions for Elasticsearch.

## When to Activate

- Creating or modifying Elasticsearch index mappings
- Choosing between `keyword` and `text` field types
- Implementing bulk indexing or reindexing
- Building search queries (match, bool, aggregations)
- Planning zero-downtime index changes
- Tuning `refresh_interval` or performance settings

## Core Principles

1. **Explicit mappings only** — never use dynamic mapping in production
2. **Aliases for everything** — never query an index by its real name
3. **`keyword` for exact match, `text` for full-text** — choosing wrong breaks queries
4. **Bulk API for volume** — single-document indexing is an anti-pattern above 100 docs
5. **Index naming is versioned** — enables zero-downtime reindexing

## Field Type Selection

| Use Case | Field Type | Why |
|----------|-----------|-----|
| Filter, sort, aggregate | `keyword` | Exact match, no analysis |
| Full-text search | `text` | Tokenized, analyzed |
| Both filter and search | Multi-field (`text` + `keyword`) | Covers both use cases |
| Numeric filter/range | `integer`, `long`, `float` | Efficient range queries |
| Date filter/range | `date` | Native date math |
| Boolean flag | `boolean` | Filter only |
| Nested objects queried independently | `nested` | Prevents cross-object matching |
| Flat key-value pairs | `object` (default) | No independent querying needed |

### Multi-Field Example

```json
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      }
    }
  }
}
```

- Search: `match` on `title`
- Sort/aggregate: use `title.keyword`

## Mapping Design

### Explicit Mapping Template

```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "refresh_interval": "1s",
    "analysis": {
      "analyzer": {
        "custom_text": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "id": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "custom_text",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "category": { "type": "keyword" },
      "price": { "type": "float" },
      "createdAt": { "type": "date", "format": "strict_date_optional_time||epoch_millis" },
      "tags": { "type": "keyword" },
      "active": { "type": "boolean" }
    }
  }
}
```

Rules:
- Set `"dynamic": "strict"` — unknown fields are rejected, not silently indexed
- Define every field explicitly
- Use custom analyzers when the default `standard` doesn't fit your language

## Index Naming and Aliases

### Naming Convention

```
<app>-<entity>-v<version>

Examples:
  myapp-products-v1
  myapp-products-v2
  myapp-orders-v1
```

### Alias Setup

```json
POST /_aliases
{
  "actions": [
    { "add": { "index": "myapp-products-v1", "alias": "myapp-products" } },
    { "add": { "index": "myapp-products-v1", "alias": "myapp-products-write" } }
  ]
}
```

- **Read alias** (`myapp-products`): application queries use this
- **Write alias** (`myapp-products-write`): application writes use this
- Both point to the same index, but during reindexing they diverge temporarily

## Bulk Indexing

### When to Use

- Indexing more than 100 documents
- Initial data load or backfill
- Reindexing from one index to another

### Bulk API Pattern

```javascript
const body = documents.flatMap(doc => [
  { index: { _index: 'myapp-products-write', _id: doc.id } },
  doc,
]);

const { body: result } = await client.bulk({ body, refresh: false });

if (result.errors) {
  const failed = result.items.filter(item => item.index?.error);
  logger.error({ failedCount: failed.length, errors: failed.slice(0, 5) });
}
```

### Batch Size Guidelines

| Document Size | Batch Size | Rationale |
|---|---|---|
| < 1 KB | 5,000 - 10,000 | Small docs, maximize throughput |
| 1 - 10 KB | 1,000 - 5,000 | Balanced |
| 10 - 100 KB | 100 - 500 | Avoid large request bodies |
| > 100 KB | 10 - 50 | Minimize memory pressure |

### Refresh Strategy

| Scenario | `refresh_interval` | Rationale |
|----------|-------------------|-----------|
| Normal operation | `1s` (default) | Near-real-time search |
| Bulk indexing | `-1` (disabled) | Maximum throughput |
| After bulk complete | Explicit refresh | Make all docs searchable |

```javascript
// Disable refresh during bulk load
await client.indices.putSettings({ index: 'myapp-products-v2', body: { 'refresh_interval': '-1' } });

// ... bulk index ...

// Re-enable and force refresh
await client.indices.putSettings({ index: 'myapp-products-v2', body: { 'refresh_interval': '1s' } });
await client.indices.refresh({ index: 'myapp-products-v2' });
```

## Zero-Downtime Reindexing

When mappings change (field type change, new analyzer), you cannot update in place. Reindex into a new versioned index, then swap the alias.

### Steps

```
1. Create new index:        myapp-products-v2 (with new mapping)
2. Reindex:                 myapp-products-v1 → myapp-products-v2
3. Verify document count:   v1 count == v2 count
4. Swap aliases atomically:
   - Remove: myapp-products      → v1
   - Remove: myapp-products-write → v1
   - Add:    myapp-products      → v2
   - Add:    myapp-products-write → v2
5. Delete old index:        myapp-products-v1 (after verification period)
```

### Atomic Alias Swap

```json
POST /_aliases
{
  "actions": [
    { "remove": { "index": "myapp-products-v1", "alias": "myapp-products" } },
    { "remove": { "index": "myapp-products-v1", "alias": "myapp-products-write" } },
    { "add":    { "index": "myapp-products-v2", "alias": "myapp-products" } },
    { "add":    { "index": "myapp-products-v2", "alias": "myapp-products-write" } }
  ]
}
```

All actions execute in a single atomic operation — no downtime.

## Search Query Patterns

### Bool Query (Most Common)

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "wireless headphones" } }
      ],
      "filter": [
        { "term": { "category": "electronics" } },
        { "range": { "price": { "gte": 50, "lte": 200 } } },
        { "term": { "active": true } }
      ]
    }
  },
  "sort": [
    { "_score": "desc" },
    { "createdAt": "desc" }
  ],
  "size": 20,
  "from": 0
}
```

- `must` affects relevance score — use for full-text search
- `filter` does not affect score — use for exact matches, ranges, booleans (cached, faster)

### Verify with Explain API

Always test queries before deploying:

```json
GET /myapp-products/_search
{
  "explain": true,
  "query": { ... }
}
```

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Dynamic mapping in production | Unknown fields indexed with wrong types | Set `"dynamic": "strict"` |
| Querying index by real name | Cannot reindex without downtime | Always use aliases |
| Single-document indexing in loops | Extremely slow at scale | Use Bulk API |
| `keyword` for full-text search | No tokenization, only exact match | Use `text` type |
| `text` for sorting/aggregation | Analyzed text cannot sort | Use multi-field with `.keyword` |
| Missing `refresh: false` on bulk | Refresh after every batch kills throughput | Disable during bulk, refresh after |
| Unbounded `from` pagination | Deep pagination is O(n) | Use `search_after` for deep pages |

## Checklist

- [ ] All mappings are explicit (`"dynamic": "strict"`)
- [ ] Every index has a read alias and a write alias
- [ ] Index naming follows `<app>-<entity>-v<version>` convention
- [ ] `keyword` for filter/sort/aggregate, `text` for search
- [ ] Bulk API used for > 100 documents
- [ ] `refresh_interval` tuned for use case
- [ ] Reindexing plan uses atomic alias swap
- [ ] Queries verified with Explain API
