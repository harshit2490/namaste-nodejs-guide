<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-5) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 18: Middlewares and Error Handlers](../S2%2018%20-%20Middlewares%20and%20Error%20Handlers/Readme.md) |                                             | [Chapter 20: Diving into APIs](../S2%2020%20-%20Diving%20into%20APIs/Readme.md) |

</div>

---

# Chapter 19 — Database, Schema, Models & Mongoose &nbsp;

> **Season 2** | Part VI - MongoDB & Mongoose
> [🎬 Link](https://namastedev.com/learn/namaste-node/database-schema-models-mongoose)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Connecting to MongoDB with Mongoose](#topic-1)
> 2. [Defining a Schema in Mongoose](#topic-2)
> 3. [Creating Models & Saving Documents](#topic-3)
> 4. [Auto-Generated Fields — `_id` & `__v`](#topic-4)

---

<a id="topic-1"></a>

## 1. [Connecting to MongoDB with Mongoose](#key-topics)

**Mongoose** is an ODM (Object Document Mapper) that wraps MongoDB''s native driver and adds schema-based structure, validation, and hooks on top.

```
Where Mongoose Sits:
────────────────────────────────────────────────

  Your Express App
        │
        ▼
  ┌──────────────┐
  │   Mongoose   │  ← Schema, validation, hooks, models
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  MongoDB     │  ← Stores actual documents (BSON)
  │  (Atlas /    │
  │   local)     │
  └──────────────┘
```

### Install Mongoose

```bash
npm install mongoose
```

### Connection Code

```js
const mongoose = require('mongoose');
const express = require('express');
const app = express();

const databaseUrl = 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/devTinder';

mongoose.connect(databaseUrl)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // ✅ Start server ONLY after DB is ready
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
  })
  .catch((err) => {
    console.error('❌ DB connection failed:', err);
  });
```

### Why Start the Server Inside `.then()`?

```
mongoose.connect()
        │
        ▼
  DB Connected? ──No──▶ Log error, do NOT start server
        │
       Yes
        │
        ▼
  app.listen()  ← server starts ONLY when DB is ready
```

> 💡 **Pattern**: Always guard `app.listen()` inside the `.then()` of `mongoose.connect()`. If DB fails, requests would arrive and fail silently.

### ⚠️ Security Note

| Environment | Approach |
|-------------|----------|
| Development | Hardcode URL for quick testing |
| Production | Use `.env` + `dotenv` package — **never expose credentials** |

---

<a id="topic-2"></a>

## 2. [Defining a Schema in Mongoose](#key-topics)

A **Schema** defines the shape and rules for documents in a MongoDB collection. Think of it as a contract every document must follow.

```
Schema → Blueprint
Model  → Factory using that blueprint
Document → Actual instance stored in MongoDB
```

### Schema Definition — DevTinder User Example

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  age:       { type: Number, min: 0 },
  gender:    { type: String, enum: ['Male', 'Female', 'Other'] }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
```

### Common Schema Field Options

| Option | Type | Purpose | Example |
|--------|------|---------|---------|
| `type` | Any | Declares data type | `type: String` |
| `required` | Boolean | Must be present | `required: true` |
| `unique` | Boolean | No duplicates in collection | `unique: true` |
| `default` | Any | Value if not provided | `default: Date.now` |
| `min` / `max` | Number | Range validation for Numbers | `min: 0, max: 120` |
| `minlength` / `maxlength` | Number | Length validation for Strings | `minlength: 3` |
| `enum` | Array | Restricts to allowed values | `enum: ['Male', 'Female']` |
| `trim` | Boolean | Removes whitespace | `trim: true` |

### How Schema Connects to Collection

```
mongoose.model('User', userSchema)
         │
         │  Mongoose pluralizes & lowercases the name
         ▼
  MongoDB Collection: "users"
```

> 💡 Mongoose automatically maps `'User'` → `users` collection. You can override with `{ collection: 'myUsers' }` as the 3rd option.

---

<a id="topic-3"></a>

## 3. [Creating Models & Saving Documents](#key-topics)

Once you have a schema and model, creating and persisting a document is a two-step process:

```
Step 1: new User({...})   → creates an in-memory instance
Step 2: user.save()       → validates + writes to MongoDB
```

### Example — Saving a User

```js
const User = require('./models/User');

mongoose.connect(databaseUrl)
  .then(() => {
    console.log('Connected to MongoDB');

    // Step 1: Create instance
    const user = new User({
      firstname: 'Akshad',
      lastname:  'Jaiswal',
      email:     'akshad@example.com',
      age:       22,
      gender:    'Male'
    });

    // Step 2: Save to DB
    return user.save();
  })
  .then(doc => console.log('✅ Document inserted:', doc))
  .catch(err => console.error('❌ Error:', err))
  .finally(() => mongoose.disconnect());
```

### What Happens Internally on `.save()`

```
user.save()
     │
     ▼
  Mongoose validates against schema
     │
  Valid? ──No──▶ throws ValidationError (caught by .catch)
     │
    Yes
     │
     ▼
  Mongoose sends insertOne() to MongoDB
     │
     ▼
  MongoDB stores document + adds _id & __v
     │
     ▼
  Promise resolves with the saved document
```

### `.save()` vs `Model.create()`

| Method | What It Does | When to Use |
|--------|-------------|-------------|
| `new Model() + .save()` | Two-step; allows pre-save hooks | When you need to set fields before saving |
| `Model.create({...})` | One-step shorthand | Quick inserts, no pre-mutation needed |

```js
// Equivalent shorthand
const doc = await User.create({ firstname: 'Akshad', ... });
```

---

<a id="topic-4"></a>

## 4. [Auto-Generated Fields — `_id` & `__v`](#key-topics)

When Mongoose saves a document, MongoDB and Mongoose each add their own automatic fields.

### `_id` — Primary Key

| Property | Detail |
|----------|--------|
| **Type** | `ObjectId` (12-byte BSON type) |
| **Unique** | Yes — guaranteed unique across the collection |
| **Auto-generated** | Yes, if you don't provide one |
| **Can override** | Yes — but rarely recommended |

```json
{
  "_id": "ObjectId(60d5b6f0d89a3c52a8d7c331)",
  "name": "John Doe"
}
```

#### Anatomy of an ObjectId

```
ObjectId("60d5b6f0  d89a3c  52a8  d7c331")
            │          │      │      │
            │          │      │      └── Random counter
            │          │      └── Process ID
            │          └── Machine identifier
            └── Unix timestamp (4 bytes = seconds since epoch)
```

> 💡 You can extract the creation time from `_id`: `doc._id.getTimestamp()`

---

### `__v` — Version Key

| Property | Detail |
|----------|--------|
| **Type** | `Number` |
| **Purpose** | Document version tracking (optimistic concurrency) |
| **Initial value** | `0` on first insert |
| **Increments** | When Mongoose updates array fields with `$push`, `$pull` |

```json
{
  "_id": "ObjectId(60d5b6f0d89a3c52a8d7c331)",
  "name": "John Doe",
  "__v": 0
}
```

#### Disabling `__v`

```js
const userSchema = new mongoose.Schema({ ... }, { versionKey: false });
```

### `_id` vs `__v` — Quick Comparison

| | `_id` | `__v` |
|--|-------|-------|
| Added by | MongoDB | Mongoose |
| Type | ObjectId | Number |
| Purpose | Unique identifier / PK | Version tracking |
| Can disable | No (primary key) | Yes: `versionKey: false` |
| Useful for | Querying, relationships | Concurrency control |

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "Mongoose and MongoDB are the same thing" | ✅ Mongoose is an ODM *on top of* MongoDB's native driver — it adds schemas, validation, and hooks. MongoDB is the database itself |
| ❌ "Schema is enforced by MongoDB" | ✅ Schema is enforced by **Mongoose** — MongoDB itself is schemaless. You can insert anything directly via the Mongo shell |
| ❌ "`app.listen()` can go anywhere" | ✅ It should always go inside `.then()` of `mongoose.connect()`. If DB fails, requests would arrive at a broken state |
| ❌ "`_id` is added by Mongoose" | ✅ `_id` is added by **MongoDB**; Mongoose generates the ObjectId *before* sending, but MongoDB is what enforces uniqueness |
| ❌ "`__v` increments on every `.save()`" | ✅ It only increments when specific array operators (`$push`, `$pull`, `$addToSet`) are used — not on regular field updates |
| ❌ "`unique: true` replaces `required: true`" | ✅ They are independent — a field can be unique but still optional (MongoDB allows one `null` for unique fields) |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: What is Mongoose and why use it over the native MongoDB driver?**
  - A: Mongoose is an ODM (Object Document Mapper) that provides schema-based structure, built-in validation, middleware/hooks, and a cleaner query API on top of MongoDB's native driver. It brings discipline to a schemaless database by enforcing structure at the application level.

- **Q2: Why should `app.listen()` be called inside `mongoose.connect().then()`?**
  - A: To ensure the server only starts accepting requests once the database is ready. If the DB connection fails, the server won't start and requests won't arrive at a broken state. This is the "connect first, listen second" pattern.

- **Q3: What is the difference between a Schema and a Model in Mongoose?**
  - A: A **Schema** defines the structure, types, and validation rules for a document — it's the blueprint. A **Model** is a compiled class built from a schema — it provides the interface to interact with the MongoDB collection (CRUD operations). You create documents from Models, not Schemas.

- **Q4: What does `mongoose.model('User', userSchema)` do internally?**
  - A: It compiles the schema into a Model class and maps it to the `users` collection in MongoDB (automatically pluralizes and lowercases the name). Every instance of `User` is a Mongoose document with schema validation built in. You can override the collection name with a 3rd argument.

- **Q5: What is the difference between `new User() + .save()` and `User.create()`?**
  - A: Both ultimately do the same thing. `new User() + .save()` is a two-step approach useful when you need to manipulate the instance before saving or when using pre-save hooks. `User.create()` is a one-step shorthand that creates and saves in one call.

- **Q6: What is `_id` and how is an ObjectId structured?**
  - A: `_id` is MongoDB's primary key, stored as an `ObjectId` — a 12-byte BSON value encoding: 4-byte Unix timestamp, 5-byte machine+process identifier, 3-byte random counter. It's unique across the collection and you can extract the creation time via `doc._id.getTimestamp()`.

- **Q7: What is `__v` and when does it increment?**
  - A: `__v` is Mongoose's **version key** for optimistic concurrency control. It starts at `0` on document creation and **increments only** when specific array update operators (`$push`, `$pull`, `$pullAll`, `$addToSet`) are used. It does **not** increment on every `.save()` or regular field updates.

- **Q8: How do you disable the `__v` field?**
  - A: Pass `{ versionKey: false }` as the second argument to `new mongoose.Schema()`: `const schema = new mongoose.Schema({ ... }, { versionKey: false });`. This prevents Mongoose from adding the version key to new documents.

    </div>
  </details>
  </div>

### Key Takeaways

- `mongoose.connect()` returns a Promise — always chain `.then()` for `app.listen()`
- A **Schema** = structure + validation rules; a **Model** = the class to interact with a collection
- `user.save()` runs Mongoose validation *before* hitting MongoDB
- `_id` (ObjectId) is MongoDB's primary key — encodes timestamp, machine, PID, counter
- `__v` is Mongoose's version key for optimistic concurrency — disable with `versionKey: false`

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-5) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 18: Middlewares and Error Handlers](../S2%2018%20-%20Middlewares%20and%20Error%20Handlers/Readme.md) |                                             | [Chapter 20: Diving into APIs](../S2%2020%20-%20Diving%20into%20APIs/Readme.md) |

</div>
