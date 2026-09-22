<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-6) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 19: Database Schema Models and Mongoose](../S2%2019%20-%20Database%20Schema%20Models%20and%20Mongoose/Readme.md) |                                             | [Chapter 21: Data Sanitization and Schema Validations](../S2%2021%20-%20Data%20Sanitization%20and%20Schema%20Validations/Readme.md) |

</div>

---

# Chapter 20 — Diving into APIs &nbsp;

> **Season 2** | Part VI - MongoDB & Mongoose
> [🎬 Link](https://namastedev.com/learn/namaste-node/diving-into-the-apis)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [JavaScript Object vs JSON](#topic-1)
> 2. [POST API — Receiving & Saving Data](#topic-2)
> 3. [GET API — Retrieving Users (Feed)](#topic-3)
> 4. [Finding a Single User — `findOne()` & Duplicates](#topic-4)
> 5. [DELETE API — Removing Documents](#topic-5)
> 6. [PATCH vs PUT — Partial vs Full Update](#topic-6)
> 7. [PATCH API — Updating Data with `findByIdAndUpdate()`](#topic-7)

---

<a id="topic-1"></a>

## 1. [JavaScript Object vs JSON](#key-topics)

Understanding the difference between a JS object and JSON is critical — they look similar but behave very differently.

```
JavaScript Object                    JSON String
──────────────────                   ──────────────
{ name: "Harshit",                   '{"name":"Harshit",
  age: 22,                             "age":22}'
  greet: () => "Hi" }
      │                                     │
      │  JSON.stringify()                   │  JSON.parse()
      └──────────────▶             ◀───────┘
```

### Key Differences

| Feature | JavaScript Object | JSON |
|---------|-------------------|------|
| **Definition** | In-memory key-value pairs | Text-based data interchange format |
| **Keys** | Can be unquoted | Must be **double-quoted** |
| **Data Types** | Any JS type (including functions, `undefined`) | Only string, number, boolean, array, object, `null` |
| **Functions** | ✅ Allowed | ❌ Not allowed |
| **Comments** | ✅ Allowed | ❌ Not allowed |
| **Parsing** | Native in JS | Needs `JSON.parse()` |
| **Stringifying** | Needs `JSON.stringify()` | Already a string |

### Why This Matters in Express

```
Client (Postman/Browser)              Express Server
─────────────────────                  ──────────────
  Sends JSON string ──────────▶  express.json() middleware
  in request body                      │
                                       ▼
                                 Parses to JS Object
                                       │
                                       ▼
                                 req.body = { name: "Harshit", ... }
```

> 💡 Without `app.use(express.json())`, `req.body` is `undefined` — Express doesn't parse JSON by default.

---

<a id="topic-2"></a>

## 2. [POST API — Receiving & Saving Data](#key-topics)

The **POST** method is used to send data from the client to the server for creation.

### Signup API Flow

```
Client POST /signup
  { firstname, lastname, email, ... }
        │
        ▼
  express.json() parses body
        │
        ▼
  req.body → JavaScript Object
        │
        ▼
  new User(req.body) → Mongoose instance
        │
        ▼
  user.save() → Validates against schema
        │
  Valid? ──No──▶ catch → res.status(400)
        │
       Yes
        │
        ▼
  MongoDB stores document
        │
        ▼
  res.send("User added successfully")
```

### Code — DevTinder Signup

```js
app.use(express.json()); // ← MUST come before routes

app.post("/signup", async (req, res) => {
  const data = req.body;
  const user = new User(data);

  try {
    await user.save();
    res.send("User added successfully");
  } catch (err) {
    res.status(400).send("Error in saving the user: " + err.message);
  }
});
```

| Step | What Happens |
|------|-------------|
| `express.json()` | Parses raw JSON body → JS object |
| `new User(data)` | Creates a Mongoose document (in memory) |
| `user.save()` | Validates + writes to MongoDB |
| `catch` block | Catches validation errors (required fields, unique, etc.) |

---

<a id="topic-3"></a>

## 3. [GET API — Retrieving Users (Feed)](#key-topics)

The **GET** method retrieves data without modifying it.

### Feed API — Get All Users

```js
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});  // {} = no filter = all documents
    if (users.length === 0) {
      res.send("No user found");
    } else {
      res.send(users);
    }
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});
```

### Common Mongoose Query Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `Model.find({})` | All documents | Array of documents |
| `Model.find({ age: 22 })` | Filtered documents | Array of matches |
| `Model.findOne({ email })` | First matching doc | Single document or `null` |
| `Model.findById(id)` | By `_id` | Single document or `null` |

### Query Flow

```
User.find({})
     │
     ▼
  Mongoose sends find() to MongoDB
     │
     ▼
  MongoDB scans "users" collection
     │
     ▼
  Returns array of matching documents
     │
     ▼
  Mongoose hydrates into model instances
     │
     ▼
  res.send(users)  → auto-converts to JSON
```

> 💡 `res.send(users)` automatically calls `JSON.stringify()` on Mongoose documents — Express handles the conversion.

---

<a id="topic-4"></a>

## 4. [Finding a Single User — `findOne()` & Duplicates](#key-topics)

### How `findOne()` Handles Duplicates

When multiple documents share the same email (if no unique index), `findOne()` returns the **first match** based on insertion order.

```
Collection "users":
──────────────────────────────────
  doc1: { email: "a@b.com", name: "Alice" }    ← findOne returns this
  doc2: { email: "a@b.com", name: "Bob" }      ← ignored
  doc3: { email: "c@d.com", name: "Charlie" }
```

### Code — Find User by Email

```js
app.get("/user", async (req, res) => {
  const userEmail = req.body.emailId;

  try {
    const user = await User.findOne({ emailId: userEmail });
    if (!user) {
      res.status(404).send("User not found");
    } else {
      res.send(user);
    }
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});
```

### Preventing Duplicates — Best Practice

```js
// In your schema:
email: { type: String, required: true, unique: true }
//                                      ^^^^^^
// Creates a unique index in MongoDB — duplicate inserts throw error
```

> 💡 `unique: true` creates a MongoDB **index**, not just Mongoose validation. MongoDB itself rejects duplicates at the database level.

---

<a id="topic-5"></a>

## 5. [DELETE API — Removing Documents](#key-topics)

The **DELETE** method removes a specific document from the database.

### Code — Delete User by ID

```js
app.delete("/user", async (req, res) => {
  const userId = req.body.userId;

  try {
    const user = await User.findByIdAndDelete(userId);
    res.send("User deleted successfully");
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});
```

### Delete Methods Comparison

| Method | Finds By | Returns | Use Case |
|--------|----------|---------|----------|
| `findByIdAndDelete(id)` | `_id` | Deleted doc or `null` | Delete by ID |
| `findOneAndDelete(filter)` | Any field | Deleted doc or `null` | Delete by custom filter |
| `deleteOne(filter)` | Any field | `{ deletedCount: 1 }` | When you don't need the doc back |
| `deleteMany(filter)` | Any field | `{ deletedCount: n }` | Bulk delete |

### Delete Flow

```
app.delete("/user")
     │
     ▼
  req.body.userId → extract _id
     │
     ▼
  User.findByIdAndDelete(userId)
     │
     ▼
  MongoDB removes document
     │
  Found? ──No──▶ returns null (should handle!)
     │
    Yes
     │
     ▼
  Returns deleted document
     │
     ▼
  res.send("User deleted successfully")
```

---

<a id="topic-6"></a>

## 6. [PATCH vs PUT — Partial vs Full Update](#key-topics)

This is a classic interview topic — knowing the difference matters.

```
PATCH (Partial Update)                    PUT (Full Replace)
──────────────────────                    ──────────────────
  Original: { name: "A", age: 22 }       Original: { name: "A", age: 22 }

  Send: { age: 25 }                      Send: { name: "A", age: 25 }

  Result: { name: "A", age: 25 }         Result: { name: "A", age: 25 }
           ↑ name preserved                        ↑ entire doc replaced
```

| Feature | PATCH | PUT |
|---------|-------|-----|
| **Purpose** | Partial update | Full replacement |
| **Data Required** | Only changed fields | All fields (entire document) |
| **Unspecified Fields** | Remain unchanged | Get removed/overwritten |
| **Typical Use** | Update email, bio, single field | Replace entire profile |
| **Idempotent** | Not necessarily | Yes — same request = same result |
| **Status Code** | `200 OK` or `204 No Content` | `200 OK` or `204 No Content` |

> 💡 **Rule of thumb**: Use **PATCH** when updating a few fields, **PUT** when replacing the whole resource.

---

<a id="topic-7"></a>

## 7. [PATCH API — Updating Data with `findByIdAndUpdate()`](#key-topics)

### Code — Update User

```js
app.patch("/user", async (req, res) => {
  const userId = req.body.userId;
  const data = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      { _id: userId },
      data,
      { returnDocument: "before" }
    );
    console.log(user); // logs the OLD document
    res.send("User updated successfully");
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});
```

### `returnDocument` Option

| Value | What You Get Back |
|-------|------------------|
| `"before"` (default) | The document **before** the update |
| `"after"` | The document **after** the update |

### Update Methods Comparison

| Method | Finds By | Returns | Runs Validators |
|--------|----------|---------|-----------------|
| `findByIdAndUpdate(id, data)` | `_id` | Updated doc | No (by default) |
| `findOneAndUpdate(filter, data)` | Any field | Updated doc | No (by default) |
| `updateOne(filter, data)` | Any field | `{ modifiedCount }` | No (by default) |
| `updateMany(filter, data)` | Any field | `{ modifiedCount }` | No (by default) |

> ⚠️ **Important**: Mongoose update methods **skip schema validation by default**. To enable it, pass `{ runValidators: true }` as an option.

```js
// With validation enabled:
await User.findByIdAndUpdate(userId, data, {
  returnDocument: "after",
  runValidators: true   // ← now Mongoose validates the update
});
```

---

### CRUD Operations Summary — DevTinder

```
   CRUD          HTTP Method       Mongoose Method                Route
  ─────────     ────────────      ────────────────               ──────
  Create    →    POST             new User() + .save()           /signup
  Read      →    GET              User.find() / findOne()        /feed, /user
  Update    →    PATCH            findByIdAndUpdate()            /user
  Delete    →    DELETE           findByIdAndDelete()            /user
```

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "Express parses JSON automatically" | ✅ You must use `app.use(express.json())` — without it, `req.body` is `undefined` |
| ❌ "JS objects and JSON are the same thing" | ✅ JS objects are in-memory with any data type. JSON is a text format with strict rules (double quotes, no functions) |
| ❌ "PATCH and PUT do the same thing" | ✅ PATCH sends only changed fields (partial). PUT replaces the entire document (full replacement) |
| ❌ "`findByIdAndUpdate()` runs schema validation" | ✅ Update methods **skip validation by default**. Pass `{ runValidators: true }` to enable it |
| ❌ "`findOne()` with duplicates returns all matches" | ✅ It returns only the **first** matching document. Use `find()` to get all matches |
| ❌ "`res.send(object)` sends raw JS objects" | ✅ Express auto-calls `JSON.stringify()` on objects before sending — the client receives JSON |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: What is the difference between a JavaScript object and JSON?**
  - A: A JavaScript object is an in-memory data structure that can hold any data type including functions and `undefined`. JSON is a **text-based format** with strict syntax — keys must be double-quoted, only supports strings, numbers, booleans, arrays, objects, and `null`. You convert between them using `JSON.parse()` and `JSON.stringify()`.

- **Q2: Why do we need `express.json()` middleware?**
  - A: Express does **not** parse request bodies by default. `express.json()` is built-in middleware that parses incoming JSON payloads and makes the data available on `req.body`. Without it, `req.body` is `undefined` and you can't access POST/PATCH data.

- **Q3: What is the difference between `find()` and `findOne()` in Mongoose?**
  - A: `find()` returns an **array** of all matching documents (empty array if none found). `findOne()` returns the **first** matching document or `null`. Use `find()` for listings/feeds and `findOne()` when you expect a single result (like by email or ID).

- **Q4: How does `findOne()` behave with duplicate documents?**
  - A: It returns the **first matching document** based on MongoDB's internal ordering (typically insertion order). To prevent duplicates, set `unique: true` in your schema — this creates a MongoDB index that rejects duplicate inserts at the database level.

- **Q5: What is the difference between PATCH and PUT?**
  - A: **PATCH** performs a partial update — you send only the fields that changed, and other fields remain untouched. **PUT** performs a full replacement — you send the entire document, and unspecified fields may be removed. Use PATCH for updating a profile field; use PUT for replacing an entire resource.

- **Q6: Does `findByIdAndUpdate()` run schema validation?**
  - A: **No**, by default Mongoose update methods skip schema validation. You must explicitly pass `{ runValidators: true }` as an option to enable validation during updates. This is a common gotcha that can lead to invalid data in the database.

- **Q7: What does the `returnDocument` option do in `findByIdAndUpdate()`?**
  - A: It controls which version of the document is returned. `"before"` (default) returns the document as it was **before** the update. `"after"` returns the document **after** the update. Equivalent to the older `{ new: true }` option.

- **Q8: Explain the complete CRUD flow in a REST API with Mongoose.**
  - A: **Create**: `POST /signup` → `new User(data)` + `user.save()`. **Read**: `GET /feed` → `User.find({})` or `GET /user` → `User.findOne(filter)`. **Update**: `PATCH /user` → `User.findByIdAndUpdate(id, data)`. **Delete**: `DELETE /user` → `User.findByIdAndDelete(id)`.
    </div>
  </details>
  </div>

### Key Takeaways

- Always use `express.json()` before routes — without it, `req.body` is `undefined`
- JS Object ≠ JSON — JSON is a text format with strict rules (double quotes, no functions)
- **POST** creates data, **GET** reads, **PATCH** partially updates, **DELETE** removes
- `findOne()` returns the first match only — enforce `unique: true` in schema to prevent duplicates
- Update methods (`findByIdAndUpdate`) **skip validation by default** — use `{ runValidators: true }`
- Use `returnDocument: "after"` to get the updated document back
- PATCH = partial update (send changed fields only); PUT = full replacement (send everything)

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-6) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 19: Database Schema Models and Mongoose](../S2%2019%20-%20Database%20Schema%20Models%20and%20Mongoose/Readme.md) |                                             | [Chapter 21: Data Sanitization and Schema Validations](../S2%2021%20-%20Data%20Sanitization%20and%20Schema%20Validations/Readme.md) |

</div>
