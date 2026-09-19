<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-8) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 24: Diving into the APIs and Express Router](../S2%2024%20-%20Diving%20into%20the%20APIs%20and%20Express%20Router/Readme.md) |                                             | [Chapter 26: ref, Populate and Thought Process of Writing API's](../S2%2026%20-%20ref%2C%20Populate%20and%20Thought%20Process%20of%20Writing%20API's/Readme.md) |

</div>

---

# Chapter 25 — Logical DB Query & Compound Indexes &nbsp;

> **Season 2** | Part VIII - Advanced MongoDB & APIs
> [🎬 Link](https://namastedev.com/learn/namaste-node/logical-db-query-compound-indexes)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Connection Request Schema — Design & Validation](#topic-1)
> 2. [Send Connection Request API — Logic & Duplicate Prevention](#topic-2)
> 3. [`.pre` Middleware — Schema-Level Validation](#topic-3)
> 4. [MongoDB Indexing — Speeding Up Queries](#topic-4)
> 5. [Compound Indexes — Multi-Field Indexing](#topic-5)
> 6. [Indexing Trade-offs — When NOT to Index](#topic-6)

---

<a id="topic-1"></a>

## 1. [Connection Request Schema — Design & Validation](#key-topics)

The connection request feature needs its own schema to track who sent what to whom and the current status.

### Schema Design

```js
const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",       // ← references the User collection
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ["ignore", "interested", "accepted", "rejected"],
      message: `{VALUE} is not a valid status`
    }
  }
}, { timestamps: true });
```

### Status Flow Diagram

```
                    Connection Request Statuses
                    ──────────────────────────

  User A → User B:
  ┌──────────────────────────────────────────────┐
  │  "interested"  →  User A likes User B        │
  │  "ignore"      →  User A passes on User B    │
  └──────────────────────────────────────────────┘

  User B reviews (if status = "interested"):
  ┌──────────────────────────────────────────────┐
  │  "accepted"  →  Now they are connections!    │
  │  "rejected"  →  Request declined             │
  └──────────────────────────────────────────────┘
```

### Schema Fields Summary

| Field | Type | Purpose | Validation |
|-------|------|---------|-----------|
| `fromUserId` | ObjectId (ref: User) | Who sent the request | `required: true` |
| `toUserId` | ObjectId (ref: User) | Who receives the request | `required: true` |
| `status` | String | Current status | `enum: ["ignore", "interested", "accepted", "rejected"]` |
| `createdAt` | Date | When request was sent | Auto via `timestamps: true` |
| `updatedAt` | Date | Last status change | Auto via `timestamps: true` |

---

<a id="topic-2"></a>

## 2. [Send Connection Request API — Logic & Duplicate Prevention](#key-topics)

### Endpoint

```
POST /request/send/:status/:toUserId
```

### Key Validations

```
POST /request/send/interested/userId123
       │
       ▼
  1. Is status allowed?
     Only "interested" or "ignore" for sending
       │
  Invalid ──▶ 400 "Invalid status"
       │
      Valid
       │
       ▼
  2. Does toUserId exist?
     User.findById(toUserId)
       │
  Not found ──▶ 404 "User not found"
       │
      Found
       │
       ▼
  3. Does a request already exist?
     Check BOTH directions:
     (fromUserId → toUserId) OR (toUserId → fromUserId)
       │
  Exists ──▶ 400 "Request already sent"
       │
  Doesn't exist
       │
       ▼
  4. Save the connection request
     new ConnectionRequest({ fromUserId, toUserId, status })
       │
       ▼
  Response: "Connection request sent!"
```

### Duplicate Check — Why Check Both Directions?

```
Without bidirectional check:
────────────────────────────
  User A → User B  (interested)  ✅ saved
  User B → User A  (interested)  ✅ saved ← DUPLICATE!

With bidirectional check:
────────────────────────
  User A → User B  (interested)  ✅ saved
  User B → User A  (interested)  ❌ blocked — "Already exists"
```

### Implementation — Duplicate Prevention Query

```js
// Check if connection request already exists in either direction
const existingRequest = await ConnectionRequest.findOne({
  $or: [
    { fromUserId: fromUserId, toUserId: toUserId },
    { fromUserId: toUserId, toUserId: fromUserId }
  ]
});

if (existingRequest) {
  return res.status(400).send("Connection request already exists");
}
```

### `$or` Operator Explained

```
$or: [
  { fromUserId: A, toUserId: B },   ← A sent to B?
  { fromUserId: B, toUserId: A }    ← B sent to A?
]

If EITHER condition matches → request exists → block duplicate
```

---

<a id="topic-3"></a>

## 3. [`.pre` Middleware — Schema-Level Validation](#key-topics)

Mongoose `.pre` middleware runs **before** a specified operation (like `save`). Use it for validations that should always run regardless of which route triggers the save.

### Preventing Self-Requests

```js
connectionRequestSchema.pre("save", function (next) {
  const connectionRequest = this;

  // Can't send a request to yourself
  if (connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
    throw new Error("Cannot send connection request to yourself");
  }

  next();
});
```

### `.pre` Middleware Flow

```
connectionRequest.save()
       │
       ▼
  .pre("save") middleware runs
       │
       ├── fromUserId === toUserId?
       │      │
       │     Yes ──▶ throw Error (save aborted)
       │      │
       │      No
       │      │
       │      ▼
       │   next() → continue to save
       │
       ▼
  Schema validation runs (required, enum, etc.)
       │
       ▼
  Document saved to MongoDB
```

### Why Use `.pre` Instead of API-Level Check?

| | `.pre` Middleware | API-Level Check |
|--|------------------|----------------|
| **Scope** | Runs on **every** save — any route, any context | Only runs in the specific route |
| **Centralized** | ✅ One place, covers all cases | ❌ Must repeat in every route |
| **Schema-level** | ✅ Part of the data model | ❌ Part of HTTP layer |
| **Testable** | ✅ Test with `doc.save()` alone | ❌ Needs HTTP request |

> 💡 Use `.pre` for validations that are **fundamental to the data model** (like "can't request yourself"). Use API-level checks for **business logic** (like "only allow interested/ignore statuses for sending").

### `.pre` vs `.post` Hooks

| | `.pre` (Before) | `.post` (After) |
|--|----------------|-----------------|
| **When** | Before the operation | After the operation |
| **Can abort?** | ✅ Throw error to cancel | ❌ Operation already done |
| **Use cases** | Validation, transformation | Logging, notifications |
| **Example** | Check fromUserId ≠ toUserId | Send email after save |

---

<a id="topic-4"></a>

## 4. [MongoDB Indexing — Speeding Up Queries](#key-topics)

Without indexes, MongoDB performs a **collection scan** — checking every document to find matches. Indexes create a shortcut.

### Without vs With Index

```
Without Index (Collection Scan):
────────────────────────────────
  Query: User.find({ firstName: "Virat" })

  MongoDB checks:
  doc1 → "Harshit"  ✗
  doc2 → "Virat"    ✓  ← found
  doc3 → "Akshad"   ✗
  doc4 → "Virat"    ✓  ← found
  ...
  doc10000 → "Raj"  ✗

  Scanned: 10,000 documents
  Time: ~50ms

With Index on firstName:
────────────────────────
  Query: User.find({ firstName: "Virat" })

  MongoDB uses index:
  "Virat" → [doc2, doc4]  ← instant lookup

  Scanned: 2 documents (index entries)
  Time: ~1ms
```

### How to Create Indexes

```js
// Method 1: In schema definition
firstName: {
  type: String,
  index: true      // ← creates a single-field index
}

// Method 2: unique automatically creates an index
emailId: {
  type: String,
  unique: true     // ← creates a unique index
}

// Method 3: Programmatically
userSchema.index({ firstName: 1 });    // 1 = ascending
userSchema.index({ age: -1 });         // -1 = descending
```

### Index Types in MongoDB

| Type | Created By | Uniqueness | Example |
|------|-----------|:---:|---------|
| **Single-field** | `index: true` or `.index()` | ❌ | `{ firstName: 1 }` |
| **Unique** | `unique: true` | ✅ | `{ emailId: 1 }` |
| **Compound** | `.index({ a: 1, b: 1 })` | ❌ | `{ city: 1, age: 1 }` |
| **Default `_id`** | Automatic | ✅ | `{ _id: 1 }` |

---

<a id="topic-5"></a>

## 5. [Compound Indexes — Multi-Field Indexing](#key-topics)

A compound index covers **multiple fields** — useful when queries filter or sort on more than one field.

### Creating a Compound Index

```js
// Index on fromUserId + toUserId
connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });
```

### Why Compound Indexes for Connection Requests?

```
Query: Find request between User A and User B

Without compound index:
───────────────────────
  Scan entire connectionRequests collection
  Check each document for matching fromUserId AND toUserId
  Time: O(n) — slow with millions of requests

With compound index { fromUserId: 1, toUserId: 1 }:
──────────────────────────────────────────────────
  Direct lookup: fromUserId=A + toUserId=B
  Time: O(log n) — fast even with millions
```

### Compound Index Order Matters

```
Index: { fromUserId: 1, toUserId: 1 }

✅ Supports these queries efficiently:
  - { fromUserId: A }                    ← uses index (left prefix)
  - { fromUserId: A, toUserId: B }       ← uses full index

❌ Does NOT support:
  - { toUserId: B }                      ← can't skip first field
```

> 💡 **Left prefix rule**: A compound index `{ A, B, C }` supports queries on `{ A }`, `{ A, B }`, and `{ A, B, C }` — but NOT `{ B }`, `{ C }`, or `{ B, C }`.

---

<a id="topic-6"></a>

## 6. [Indexing Trade-offs — When NOT to Index](#key-topics)

Indexes speed up reads but come at a cost.

### The Trade-off

```
                     READ Performance    WRITE Performance    Storage
                     ────────────────    ─────────────────    ───────
  No indexes         ❌ Slow (scan all)   ✅ Fast              ✅ Minimal
  Few indexes        ✅ Fast lookups      ⚠️ Slight overhead    ⚠️ Moderate
  Many indexes       ✅ Very fast reads   ❌ Slow writes        ❌ High usage
```

### Why Writes Slow Down

```
INSERT a new document:
       │
       ▼
  Write document to collection
       │
       ▼
  Update index 1 (firstName)
  Update index 2 (emailId)
  Update index 3 (city + age)
  Update index 4 (...)
       │
       ▼
  More indexes = more work per write
```

### Indexing Best Practices

| Do ✅ | Don't ❌ |
|-------|---------|
| Index fields used in `find()` filters | Index every field "just in case" |
| Index fields used in `sort()` | Index fields only used in `select()` |
| Use compound indexes for multi-field queries | Create separate indexes when compound works |
| Index fields with high cardinality (unique-ish values) | Index boolean fields (only 2 values — low cardinality) |
| Monitor with `explain()` | Guess without measuring |

### Checking Index Usage — `explain()`

```js
// See how MongoDB executes a query
const result = await User.find({ firstName: "Virat" }).explain("executionStats");

// Key fields to check:
// - executionStats.nReturned        → documents returned
// - executionStats.totalDocsExamined → documents scanned
// - executionStats.executionTimeMillis → time taken
// - winningPlan.inputStage.indexName → which index was used
```

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "More indexes = always faster" | ✅ Indexes speed up **reads** but slow down **writes** (inserts, updates, deletes). Each index must be updated on every write. Only index what you query frequently |
| ❌ "You only need to check one direction for duplicate requests" | ✅ You must check **both directions**: A→B and B→A. Otherwise, two users can send requests to each other, creating duplicates |
| ❌ "`unique: true` is just a validator" | ✅ `unique: true` creates a **MongoDB index** — it's enforced at the database level, not Mongoose validation. It also speeds up queries on that field |
| ❌ "`.pre` middleware runs after the document is saved" | ✅ `.pre("save")` runs **before** saving. Use `.post("save")` for after-save logic. `.pre` can abort the save by throwing an error |
| ❌ "Compound index `{ A, B }` helps queries on `{ B }` alone" | ✅ Compound indexes follow the **left prefix rule** — `{ A, B }` only supports queries starting with `A`. For `{ B }` alone, you need a separate index on `B` |
| ❌ "Schema validation prevents all invalid data" | ✅ Schema validation catches type/format errors. But logical validations (like "can't request yourself") need `.pre` middleware or API-level checks |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: How do you design a connection request schema in MongoDB?**
  - A: Create a schema with `fromUserId` (ObjectId, ref: User), `toUserId` (ObjectId, ref: User), and `status` (String with enum: ["ignore", "interested", "accepted", "rejected"]). Add `timestamps: true` for tracking. Use `ref` to link to the User collection for `.populate()` support.

- **Q2: How do you prevent duplicate connection requests between two users?**
  - A: Use a `$or` query to check **both directions** before saving: `{ $or: [{ fromUserId: A, toUserId: B }, { fromUserId: B, toUserId: A }] }`. If a match exists, reject the request. Additionally, create a compound index on `{ fromUserId: 1, toUserId: 1 }` for fast lookups.

- **Q3: What is `.pre` middleware in Mongoose and when do you use it?**
  - A: `.pre("save")` is a hook that runs **before** the save operation. It's used for validations fundamental to the data model — like preventing a user from sending a request to themselves. It's centralized (runs on every save regardless of route), testable, and part of the schema layer rather than HTTP layer.

- **Q4: What is the difference between `.pre` and `.post` middleware?**
  - A: `.pre` runs **before** the operation and can **abort** it by throwing an error. `.post` runs **after** the operation completes and cannot cancel it. Use `.pre` for validation/transformation; use `.post` for logging, notifications, or cleanup.

- **Q5: What is a MongoDB index and why is it important?**
  - A: An index is a data structure (B-tree) that speeds up read operations by providing direct pointers to documents instead of scanning the entire collection. Without an index, a query on 10,000 documents checks all 10,000. With an index, it jumps directly to matching entries — reducing O(n) to O(log n).

- **Q6: What is a compound index and when should you use one?**
  - A: A compound index covers multiple fields — e.g., `{ fromUserId: 1, toUserId: 1 }`. Use it when queries frequently filter on multiple fields together. Important: compound indexes follow the **left prefix rule** — `{ A, B }` supports queries on `{ A }` and `{ A, B }` but NOT `{ B }` alone.

- **Q7: What are the trade-offs of creating too many indexes?**
  - A: Indexes speed up reads but slow down writes — every insert/update/delete must update all relevant indexes. They also consume additional storage. Best practice: index only fields used in frequent queries and sorts. Use `explain()` to verify indexes are actually being used.

- **Q8: How does `$or` work in MongoDB queries?**
  - A: `$or` takes an array of conditions and returns documents matching **any** of them. In DevTinder: `$or: [{ fromUserId: A, toUserId: B }, { fromUserId: B, toUserId: A }]` finds requests in either direction between two users. It's essential for bidirectional duplicate checking.

    </div>
  </details>
  </div>

### Key Takeaways

- Connection Request Schema uses `fromUserId`, `toUserId` (ObjectId refs), and `status` (enum: ignore, interested, accepted, rejected)
- Always check **both directions** for duplicate requests using `$or` — A→B and B→A
- Use `.pre("save")` middleware for **fundamental data validations** (e.g., can't request yourself) — runs before every save
- **Indexes** turn O(n) collection scans into O(log n) lookups — massive performance gain for read-heavy queries
- `unique: true` creates a MongoDB index automatically; use `index: true` for non-unique frequently-queried fields
- **Compound indexes** cover multi-field queries — but follow the **left prefix rule** (`{ A, B }` won't help queries on `{ B }` alone)
- **Don't over-index** — each index slows down writes and consumes storage. Index only what you query frequently

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-8) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 24: Diving into the APIs and Express Router](../S2%2024%20-%20Diving%20into%20the%20APIs%20and%20Express%20Router/Readme.md) |                                             | [Chapter 26: ref, Populate and Thought Process of Writing API's](../S2%2026%20-%20ref%2C%20Populate%20and%20Thought%20Process%20of%20Writing%20API's/Readme.md) |

</div>
