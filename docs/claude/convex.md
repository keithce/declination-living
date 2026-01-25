# Convex Patterns

Reference: https://docs.convex.dev/database/types

## Validators (`v`)

The validator builder for Convex values. Used in schema definitions and as input validators for functions.

| Validator                    | Usage                      |
| ---------------------------- | -------------------------- |
| `v.id("tableName")`          | Reference to another table |
| `v.string()`                 | String value               |
| `v.number()` / `v.float64()` | Number value               |
| `v.boolean()`                | Boolean value              |
| `v.int64()` / `v.bigint()`   | 64-bit integer             |
| `v.null()`                   | Null value                 |
| `v.bytes()`                  | ArrayBuffer                |
| `v.literal(value)`           | Exact literal value        |
| `v.array(element)`           | Array of elements          |
| `v.object({...})`            | Object with fields         |
| `v.record(keys, values)`     | Record/map type            |
| `v.union(...members)`        | Union of types             |
| `v.optional(value)`          | Optional field             |
| `v.any()`                    | Any value                  |

## System Fields

Every document automatically has:

- `_id`: Document ID (auto-indexed)
- `_creationTime`: Creation timestamp in ms since Unix epoch (auto-indexed)

## Index Patterns

Define indices for query patterns:

```ts
.index("by_field", ["field"])
.index("by_compound", ["field1", "field2"])
```

## Example Schema

```ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    name: v.string(),
  }),

  sessions: defineTable({
    userId: v.id('users'),
    sessionId: v.string(),
  }).index('sessionId', ['sessionId']),

  threads: defineTable({
    uuid: v.string(),
    summary: v.optional(v.string()),
    summarizer: v.optional(v.id('_scheduled_functions')),
  }).index('uuid', ['uuid']),

  messages: defineTable({
    message: v.string(),
    threadId: v.id('threads'),
    author: v.union(
      v.object({
        role: v.literal('system'),
      }),
      v.object({
        role: v.literal('assistant'),
        context: v.array(v.id('messages')),
        model: v.optional(v.string()),
      }),
      v.object({
        role: v.literal('user'),
        userId: v.id('users'),
      }),
    ),
  }).index('threadId', ['threadId']),
})
```
