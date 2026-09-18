<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-5) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 20: Diving into APIs](../S2%2020%20-%20Diving%20into%20APIs/Readme.md) |                                             | [Chapter 22: Encrypting Passwords](../S2%2022%20-%20Encrypting%20Passwords/Readme.md) |

</div>

---

# Chapter 21 — Data Sanitization & Schema Validations &nbsp;

> **Season 2** | Part VI - MongoDB & Mongoose
> [🎬 Link](https://namastedev.com/learn/namaste-node/data-sanitization-schema-validations)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Schema Validation Properties — Built-in Validators](#topic-1)
> 2. [Custom Validators — `validate()` Function](#topic-2)
> 3. [Schema Timestamps — `createdAt` & `updatedAt`](#topic-3)
> 4. [API-Level Validation — ALLOWED_UPDATES Whitelist](#topic-4)
> 5. [Validator.js — External Validation Library](#topic-5)

---

<a id="topic-1"></a>

## 1. [Schema Validation Properties — Built-in Validators](#key-topics)

Mongoose provides **built-in validators** and **sanitizers** at the schema level to enforce data integrity before documents hit MongoDB.

```
User Input (req.body)
       │
       ▼
  express.json() → parses body
       │
       ▼
  new User(data) → Mongoose instance
       │
       ▼
  ┌─────────────────────────────────┐
  │     SCHEMA VALIDATION LAYER     │
  │                                 │
  │  required  → field must exist   │
  │  unique    → no duplicates      │
  │  trim      → strip whitespace   │
  │  lowercase → convert to lower   │
  │  minLength → min string length  │
  │  min/max   → number range       │
  │  enum      → allowed values     │
  │  default   → fallback value     │
  │  validate  → custom logic       │
  └─────────────────────────────────┘
       │
  Valid? ──No──▶ ValidationError thrown
       │
      Yes
       │
       ▼
  MongoDB stores document
```

### Complete DevTinder User Schema

```js
const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 50
  },
  lastName: {
    type: String,
    required: true
  },
  emailId: {
    type: String,
    lowercase: true,
    required: true,
    unique: true,
    trim: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid Email: " + value);
      }
    }
  },
  password: {
    type: String,
    required: true,
    validate(value) {
      if (!validator.isStrongPassword(value)) {
        throw new Error("Enter a strong password: " + value);
      }
    }
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },
  gender: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (!["male", "female", "others"].includes(value)) {
        throw new Error("Not a valid gender (male, female, others)");
      }
    }
  },
  photoURL: {
    type: String,
    default: "https://example.com/default-avatar.png",
    validate(value) {
      if (!validator.isURL(value)) {
        throw new Error("Invalid URL: " + value);
      }
    }
  },
  about: {
    type: String,
    default: "Dev is in search for someone here"
  },
  skills: {
    type: [String]
  }
}, { timestamps: true });
```

### Built-in Validators & Sanitizers Reference

| Property | Applies To | Type | What It Does |
|----------|-----------|------|-------------|
| `required` | All types | Validator | Field must be present — rejects if missing |
| `unique` | All types | Index | Creates a MongoDB unique index — prevents duplicates |
| `default` | All types | Default | Provides fallback value if field is omitted |
| `lowercase` | String | Sanitizer | Converts value to lowercase before saving |
| `trim` | String | Sanitizer | Strips leading/trailing whitespace |
| `minLength` | String | Validator | Minimum string length |
| `maxLength` | String | Validator | Maximum string length |
| `min` | Number/Date | Validator | Minimum numeric value |
| `max` | Number/Date | Validator | Maximum numeric value |
| `enum` | String | Validator | Restricts to a list of allowed values |
| `match` | String | Validator | Tests against a RegExp pattern |

### Validators vs Sanitizers

```
Validators → CHECK data, reject if invalid
             (required, min, maxLength, enum, validate)

Sanitizers → TRANSFORM data before saving
             (trim, lowercase)
```

| | Validators | Sanitizers |
|--|-----------|-----------|
| **Action** | Reject invalid data | Transform data |
| **On failure** | Throws `ValidationError` | N/A — always succeeds |
| **Examples** | `required`, `min`, `enum` | `trim`, `lowercase` |

---

<a id="topic-2"></a>

## 2. [Custom Validators — `validate()` Function](#key-topics)

When built-in validators aren't enough, Mongoose supports **custom validator functions** via the `validate` property.

### Syntax

```js
fieldName: {
  type: String,
  validate(value) {
    if (/* condition fails */) {
      throw new Error("Custom error message");
    }
  }
}
```

### Example — Gender Validation

```js
gender: {
  type: String,
  required: true,
  trim: true,
  validate(value) {
    if (!["male", "female", "others"].includes(value)) {
      throw new Error("Not a valid gender (male, female, others)");
    }
  }
}
```

### Custom Validator Flow

```
user.save() / User.create()
       │
       ▼
  Built-in validators run first
  (required, min, maxLength, etc.)
       │
       ▼
  Custom validate() runs
       │
  Throws Error? ──Yes──▶ ValidationError (save rejected)
       │
       No
       │
       ▼
  Document saved to MongoDB
```

### `validate` vs `enum` — When to Use Which

| | `enum` | Custom `validate()` |
|--|--------|-------------------|
| **Complexity** | Simple — list of allowed values | Any logic (regex, external checks, async) |
| **Syntax** | `enum: ['a', 'b', 'c']` | `validate(value) { ... }` |
| **Error Message** | Auto-generated | Custom via `throw new Error()` |
| **Use Case** | Fixed options (gender, status) | Complex rules (password strength, URL format) |

> 💡 Use `enum` for simple lists. Use `validate()` when you need conditional logic, external libraries, or custom error messages.

---

<a id="topic-3"></a>

## 3. [Schema Timestamps — `createdAt` & `updatedAt`](#key-topics)

Mongoose can automatically track **when documents are created and modified** via the `timestamps` option.

### Enabling Timestamps

```js
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  // ... other fields
}, {
  timestamps: true  // ← pass as schema options (2nd argument)
});
```

### What Gets Added

```json
{
  "_id": "ObjectId(...)",
  "firstName": "Harshit",
  "createdAt": "2024-11-15T10:30:00.000Z",
  "updatedAt": "2024-11-16T14:22:00.000Z",
  "__v": 0
}
```

| Field | Type | When Updated |
|-------|------|-------------|
| `createdAt` | Date | Set once on document creation — never changes |
| `updatedAt` | Date | Updated automatically on every `.save()` or `findOneAndUpdate()` |

### `timestamps` vs `__v`

| | `timestamps` | `__v` |
|--|-------------|------|
| **Added by** | Mongoose (schema option) | Mongoose (automatic) |
| **Purpose** | Track creation/modification time | Track document version |
| **Fields** | `createdAt`, `updatedAt` | `__v` |
| **Updates on** | Every save/update | Array operations only |
| **Disable** | `timestamps: false` (default) | `versionKey: false` |

---

<a id="topic-4"></a>

## 4. [API-Level Validation — ALLOWED_UPDATES Whitelist](#key-topics)

Schema validation protects the database. But **API-level validation** protects the application — ensuring only approved fields can be updated via PATCH requests.

### Why You Need This

```
Without API validation:
──────────────────────
  PATCH /user → { role: "admin", emailId: "hacker@evil.com" }
                  ↑ user can escalate privileges!

With API validation:
──────────────────
  PATCH /user → { role: "admin" }
                  ↑ REJECTED — "role" not in ALLOWED_UPDATES
```

### Implementation — Whitelist Pattern

```js
app.patch("/user/:userId", async (req, res) => {
  const data = req.body;

  // Define which fields can be updated
  const ALLOWED_UPDATES = [
    "photoURL",
    "about",
    "gender",
    "skills",
    "firstName",
    "lastName",
    "age"
  ];

  // Check if ALL keys in the request are allowed
  const isUpdateAllowed = Object.keys(data).every((k) =>
    ALLOWED_UPDATES.includes(k)
  );

  if (!isUpdateAllowed) {
    throw new Error("Update Not Allowed");
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.userId, data, {
      returnDocument: "after",
      runValidators: true
    });
    res.send(user);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});
```

### How `Object.keys().every()` Works

```
Request body: { firstName: "Harsh", role: "admin" }

Object.keys(data) → ["firstName", "role"]

.every(k => ALLOWED_UPDATES.includes(k))
  "firstName" → ✅ in list
  "role"      → ❌ NOT in list

Result: false → "Update Not Allowed"
```

### Two Layers of Validation

```
Client PATCH /user
       │
       ▼
  Layer 1: API-Level Validation
  ┌──────────────────────────────┐
  │  Is every field in           │
  │  ALLOWED_UPDATES?            │
  │  ───────────────             │
  │  No  → 400 "Not Allowed"    │
  │  Yes → continue              │
  └──────────────────────────────┘
       │
       ▼
  Layer 2: Schema Validation
  ┌──────────────────────────────┐
  │  Does data pass schema       │
  │  rules? (required, min,      │
  │  validate, enum, etc.)       │
  │  ───────────────             │
  │  No  → ValidationError       │
  │  Yes → save to MongoDB       │
  └──────────────────────────────┘
```

> 💡 **API validation** = what fields can be updated. **Schema validation** = what values are valid. You need **both**.

---

<a id="topic-5"></a>

## 5. [Validator.js — External Validation Library](#key-topics)

For complex validations (email format, URL structure, password strength), use the **validator.js** library instead of writing regex manually.

### Install

```bash
npm install validator
```

### Key Methods Used in DevTinder

| Method | Purpose | Example |
|--------|---------|---------|
| `validator.isEmail(str)` | Validates email format | `"user@example.com"` → `true` |
| `validator.isURL(str)` | Validates URL format | `"https://img.com/pic.jpg"` → `true` |
| `validator.isStrongPassword(str)` | Checks password strength | Must have upper, lower, number, symbol, min 8 chars |

### Usage in Schema

```js
const validator = require('validator');

// Email validation
emailId: {
  type: String,
  validate(value) {
    if (!validator.isEmail(value)) {
      throw new Error("Invalid Email: " + value);
    }
  }
}

// Photo URL validation
photoURL: {
  type: String,
  validate(value) {
    if (!validator.isURL(value)) {
      throw new Error("Invalid URL: " + value);
    }
  }
}

// Password strength validation
password: {
  type: String,
  validate(value) {
    if (!validator.isStrongPassword(value)) {
      throw new Error("Enter a strong password: " + value);
    }
  }
}
```

### `isStrongPassword` Default Criteria

| Criterion | Default Requirement |
|-----------|-------------------|
| Minimum length | 8 characters |
| Lowercase letters | At least 1 |
| Uppercase letters | At least 1 |
| Numbers | At least 1 |
| Symbols | At least 1 |

### Why Use Validator.js Over Custom Regex?

| | Custom Regex | Validator.js |
|--|-------------|-------------|
| **Email validation** | Complex, error-prone regex | `validator.isEmail()` — battle-tested |
| **URL validation** | Edge cases everywhere | `validator.isURL()` — handles all formats |
| **Password rules** | Manual checks for each criterion | `validator.isStrongPassword()` — configurable |
| **Maintenance** | You maintain the regex | Library maintains it |
| **npm downloads** | N/A | 10M+/week — widely trusted |

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "Schema validation and API validation are the same" | ✅ Schema validation checks **data values** (type, range, format). API validation checks **which fields** can be modified. You need both layers |
| ❌ "`unique: true` is a validator" | ✅ `unique` creates a **MongoDB index**, not a Mongoose validator. It doesn't run during `validate()` — it's enforced at the database level |
| ❌ "`trim` and `lowercase` validate the data" | ✅ They are **sanitizers**, not validators. They transform data silently — they never reject or throw errors |
| ❌ "`findByIdAndUpdate()` runs schema validation by default" | ✅ Update methods **skip validation** by default. Pass `{ runValidators: true }` to enable it |
| ❌ "Custom regex is better than validator.js for email" | ✅ Email regex is notoriously hard to get right. `validator.isEmail()` handles edge cases and is battle-tested with 10M+ weekly downloads |
| ❌ "`timestamps: true` adds a `__v` field" | ✅ `timestamps` adds `createdAt` and `updatedAt`. The `__v` field is added separately by Mongoose for version tracking |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: What is data sanitization in Mongoose?**
  - A: Data sanitization is the process of **transforming** input data before saving it to the database. Mongoose provides built-in sanitizers like `trim` (removes whitespace) and `lowercase` (converts to lowercase). Unlike validators, sanitizers never reject data — they silently clean it.

- **Q2: What is the difference between validators and sanitizers in Mongoose?**
  - A: **Validators** check if data meets certain criteria and reject it if it doesn't (e.g., `required`, `min`, `enum`). **Sanitizers** transform data silently without rejecting (e.g., `trim`, `lowercase`). Validators throw `ValidationError`; sanitizers always succeed.

- **Q3: How do you write a custom validator in Mongoose?**
  - A: Use the `validate` property in the schema field definition. It's a function that receives the field value and throws an `Error` if validation fails: `validate(value) { if (condition) throw new Error("message"); }`. Custom validators run after built-in validators.

- **Q4: What is the ALLOWED_UPDATES pattern and why is it important?**
  - A: It's an **API-level whitelist** that defines which fields a client can update via PATCH. You use `Object.keys(req.body).every(k => ALLOWED_UPDATES.includes(k))` to ensure no unauthorized fields (like `role` or `password`) are modified. This prevents privilege escalation attacks.

- **Q5: Why do you need both API-level and schema-level validation?**
  - A: **API validation** controls *what fields* can be modified — preventing unauthorized updates. **Schema validation** controls *what values* are acceptable — enforcing data integrity. API validation stops `{ role: "admin" }` from being sent. Schema validation stops `{ age: -5 }` from being saved.

- **Q6: What does `timestamps: true` do in a Mongoose schema?**
  - A: It automatically adds `createdAt` and `updatedAt` fields to every document. `createdAt` is set once on document creation and never changes. `updatedAt` is updated automatically on every `.save()` or `findOneAndUpdate()` call.

- **Q7: What is validator.js and why use it in Mongoose?**
  - A: Validator.js is an npm library with 10M+ weekly downloads that provides battle-tested validation methods like `isEmail()`, `isURL()`, and `isStrongPassword()`. It's preferred over custom regex because it handles edge cases, is well-maintained, and reduces the chance of validation bugs.

- **Q8: Is `unique: true` a Mongoose validator?**
  - A: **No**. `unique: true` creates a **MongoDB index**, not a Mongoose validator. It's enforced at the database level, not during Mongoose's `validate()` phase. This means it won't be caught by `runValidators: true` in update operations — duplicate key errors come directly from MongoDB.

    </div>
  </details>
  </div>

### Key Takeaways

- Mongoose provides two types of schema-level tools: **validators** (reject invalid data) and **sanitizers** (transform data)
- Use `required`, `min`, `max`, `enum`, `minLength`, `maxLength` for built-in validation
- Use `trim` and `lowercase` for automatic data cleaning before save
- Write **custom validators** with `validate(value) {}` for complex logic (gender, email, password)
- `timestamps: true` auto-adds `createdAt` and `updatedAt` — pass as schema options
- Use the **ALLOWED_UPDATES whitelist** pattern to prevent unauthorized field modifications in PATCH APIs
- Use **validator.js** (`isEmail`, `isURL`, `isStrongPassword`) instead of writing custom regex
- Always use `{ runValidators: true }` with update methods — they skip validation by default

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-5) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 20: Diving into APIs](../S2%2020%20-%20Diving%20into%20APIs/Readme.md) |                                             | [Chapter 22: Encrypting Passwords](../S2%2022%20-%20Encrypting%20Passwords/Readme.md) |

</div>
