<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-5) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 16: Creating Our Express Server](../S2%2016%20-%20Creating%20Our%20Express%20Server/Readme.md) |                                             | [Chapter 18: Middlewares and Error Handlers](../S2%2018%20-%20Middlewares%20and%20Error%20Handlers/Readme.md) |

</div>

---

# Chapter 17 — Routing and Request Handlers &nbsp;

> **Season 2** | Part V - Express & Middleware
> [🎬 Link](https://namastedev.com/learn/namaste-node/routing-and-request-handlers)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [HTTP Methods in Express](#topic-1)
> 2. [Route Matching — `app.use()` vs `app.get()`](#topic-2)
> 3. [Route Parameters & Query Strings](#topic-3)
> 4. [Advanced Routing — Pattern Matching](#topic-4)
> 5. [API Testing with Postman](#topic-5)

---

<a id="topic-1"></a>

## 1. [HTTP Methods in Express](#key-topics)

Express provides dedicated methods for each HTTP verb, mapping directly to CRUD operations:

```
HTTP Methods → CRUD → Express Methods:
────────────────────────────────────────────────

  HTTP Method    CRUD        Express
  ───────────    ────        ───────
  POST      →   Create  →   app.post(path, handler)
  GET       →   Read    →   app.get(path, handler)
  PUT       →   Replace →   app.put(path, handler)
  PATCH     →   Update  →   app.patch(path, handler)
  DELETE    →   Delete  →   app.delete(path, handler)
```

| Method | Purpose | Request Body? | Example |
| ------ | ------- | ------------- | ------- |
| `app.get()` | Retrieve a resource | ❌ No | `app.get("/users", handler)` |
| `app.post()` | Create a new resource | ✅ Yes | `app.post("/signup", handler)` |
| `app.put()` | Replace entire resource | ✅ Yes | `app.put("/user/1", handler)` |
| `app.patch()` | Partially update resource | ✅ Yes | `app.patch("/profile", handler)` |
| `app.delete()` | Remove a resource | ❌ Usually no | `app.delete("/user/1", handler)` |

```js
const express = require("express");
const app = express();

// GET — retrieve user profile
app.get("/profile", (req, res) => {
  res.send({ name: "Rohit", city: "Mumbai" });
});

// POST — create new user
app.post("/signup", (req, res) => {
  res.send("User created successfully");
});

// PATCH — update specific fields
app.patch("/profile", (req, res) => {
  res.send("Profile updated");
});

// DELETE — remove user
app.delete("/user", (req, res) => {
  res.send("User deleted");
});

app.listen(3000);
```

> 💡 Each method only responds to its specific HTTP verb. `app.get("/profile")` will **not** handle a POST request to `/profile`. This separation is what makes REST APIs clean — same URL, different actions based on the HTTP method.

---

<a id="topic-2"></a>

## 2. [Route Matching — `app.use()` vs `app.get()`](#key-topics)

Understanding how Express matches routes is crucial:

```
app.use() vs app.get() vs app.all():
────────────────────────────────────────────────

  app.use("/test", handler)
  → Matches ALL methods: GET, POST, PUT, PATCH, DELETE
  → Also matches sub-paths: /test, /test/abc, /test/x/y/z

  app.get("/test", handler)
  → Matches ONLY GET requests
  → Matches ONLY exact path: /test

  app.all("/test", handler)
  → Matches ALL methods: GET, POST, PUT, PATCH, DELETE
  → Matches ONLY exact path: /test
```

| Method | Matches HTTP Methods | Matches Sub-paths? | Use Case |
| ------ | -------------------- | ------------------- | -------- |
| `app.use("/test")` | ALL (GET, POST, etc.) | ✅ Yes (`/test/abc` matches) | Middleware, route prefixes |
| `app.get("/test")` | Only GET | ❌ No (exact match) | Specific route handlers |
| `app.all("/test")` | ALL (GET, POST, etc.) | ❌ No (exact match) | Catch-all for a specific path |

```js
// app.use matches sub-paths too
app.use("/api", (req, res) => {
  // Matches: /api, /api/users, /api/users/123
  res.send("Matched via app.use");
});

// app.get matches exact path only
app.get("/api", (req, res) => {
  // Matches: /api ONLY
  // Does NOT match: /api/users
  res.send("Matched via app.get");
});
```

> 💡 `app.use()` is primarily for **middleware** (functions that run before route handlers). `app.get()`, `app.post()`, etc. are for **route handlers** (functions that send the final response). We'll dive deep into middleware in Chapter 18.

---

<a id="topic-3"></a>

## 3. [Route Parameters & Query Strings](#key-topics)

Two ways to pass data through URLs:

### Route Parameters (`req.params`)

Dynamic URL segments prefixed with `:` that capture values from the URL path.

```js
// Route parameter — dynamic segment in the URL
app.get("/user/:userId", (req, res) => {
  console.log(req.params); // { userId: "123" }
  res.send("User ID: " + req.params.userId);
});

// Multiple parameters
app.get("/user/:userId/post/:postId", (req, res) => {
  console.log(req.params); // { userId: "5", postId: "42" }
  res.send(`User ${req.params.userId}, Post ${req.params.postId}`);
});
```

```
Route Parameters:
────────────────────────────────────────────────

  Route:   app.get("/user/:userId")

  Request: GET /user/123
                     ───
                      └─ req.params.userId = "123"

  Request: GET /user/456
                     ───
                      └─ req.params.userId = "456"
```

### Query Strings (`req.query`)

Key-value pairs appended to the URL after `?`.

```js
// Query string — key=value pairs after ?
app.get("/search", (req, res) => {
  console.log(req.query);
  // GET /search?city=Mumbai&age=25
  // → { city: "Mumbai", age: "25" }
  res.send(`Searching in ${req.query.city}`);
});
```

```
Query Strings:
────────────────────────────────────────────────

  Request: GET /search?city=Mumbai&age=25
                       ─────────────────
                        └─ req.query = { city: "Mumbai", age: "25" }
```

### When to Use Which?

| Aspect | Route Parameters (`:id`) | Query Strings (`?key=val`) |
| ------ | ------------------------ | -------------------------- |
| **Syntax** | `/users/:id` → `/users/123` | `/users?role=admin` |
| **Access** | `req.params.id` | `req.query.role` |
| **Use case** | **Identifying** a specific resource | **Filtering/sorting** results |
| **Required?** | Yes — route won't match without it | No — optional by default |
| **Example** | `GET /user/5` → get user #5 | `GET /users?sort=name&limit=10` |

> 💡 Use **route parameters** when the value is required to identify the resource (`/user/:id`). Use **query strings** when the values are optional filters or modifiers (`/users?page=2&limit=20`).

---

<a id="topic-4"></a>

## 4. [Advanced Routing — Pattern Matching](#key-topics)

Express supports special characters and regex in route paths for flexible matching:

### Special Characters

| Character | Meaning | Route | Matches |
| --------- | ------- | ----- | ------- |
| `+` | One or more of preceding char | `/ab+c` | `/abc`, `/abbc`, `/abbbc` |
| `?` | Preceding char is optional | `/ab?c` | `/abc`, `/ac` |
| `*` | Any sequence of characters | `/a*cd` | `/acd`, `/abcd`, `/axyzcd` |

```js
// + : one or more of preceding character
app.get("/ab+c", (req, res) => {
  res.send("Matched: /ab+c");
});
// Matches: /abc, /abbc, /abbbc, /abbbbc...
// Does NOT match: /ac (needs at least one 'b')

// ? : preceding character is optional
app.get("/ab?c", (req, res) => {
  res.send("Matched: /ab?c");
});
// Matches: /abc, /ac
// The 'b' is optional

// * : any characters in between
app.get("/a*cd", (req, res) => {
  res.send("Matched: /a*cd");
});
// Matches: /acd, /abcd, /axyzcd, /a123cd
```

### Regular Expressions

```js
// Regex: match any path containing "a"
app.get(/a/, (req, res) => {
  res.send("Path contains 'a'");
});
// Matches: /abc, /a123, /banana, /123a

// Regex: match paths ending with "fly"
app.get(/.*fly$/, (req, res) => {
  res.send("Ends with 'fly'");
});
// Matches: /butterfly, /dragonfly
// Does NOT match: /flying
```

> 💡 Pattern matching is useful for catching multiple related routes with a single handler. But use it sparingly — explicit routes like `app.get("/users/:id")` are more readable and maintainable than regex-based routes.

---

<a id="topic-5"></a>

## 5. [API Testing with Postman](#key-topics)

**Postman** is the industry-standard tool for testing and debugging REST APIs. You can't test POST, PATCH, PUT, or DELETE requests from a browser URL bar — you need Postman.

```
Why Postman?
────────────────────────────────────────────────

  Browser URL Bar:
  ┌──────────────────────────────┐
  │  Can ONLY send GET requests  │
  │  Cannot set headers or body  │
  │  Limited for API development │
  └──────────────────────────────┘

  Postman:
  ┌──────────────────────────────┐
  │  ✔ ALL HTTP methods          │
  │  ✔ Custom headers            │
  │  ✔ Request body (JSON, etc.) │
  │  ✔ Environment variables     │
  │  ✔ Save & organize requests  │
  │  ✔ View formatted responses  │
  └──────────────────────────────┘
```

### Quick Start

| Step | Action |
| ---- | ------ |
| 1 | Download from [postman.com](https://www.postman.com/downloads/) |
| 2 | Create a new request |
| 3 | Select HTTP method (GET, POST, etc.) |
| 4 | Enter URL (e.g., `http://localhost:3000/profile`) |
| 5 | Add headers / body if needed |
| 6 | Click **Send** → view the response |

### Testing DevTinder APIs

```
Postman Testing Flow:
────────────────────────────────────────────────

  ┌─ GET    http://localhost:3000/profile ─────────┐
  │  Response: { "name": "Rohit", "city": "..." }  │
  └────────────────────────────────────────────────┘

  ┌─ POST   http://localhost:3000/signup ──────────┐
  │  Body: { "name": "Virat", "email": "..." }     │
  │  Response: "User created successfully"         │
  └────────────────────────────────────────────────┘

  ┌─ PATCH  http://localhost:3000/profile ─────────┐
  │  Body: { "city": "Delhi" }                     │
  │  Response: "Profile updated"                   │
  └────────────────────────────────────────────────┘

  ┌─ DELETE http://localhost:3000/user ────────────┐
  │  Response: "User deleted"                      │
  └────────────────────────────────────────────────┘
```

> 💡 Create a **Postman Collection** called "DevTinder" and save all your API requests there. This way you can re-run tests quickly without re-entering URLs and body data every time. Share collections with your team for consistent testing.

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "`app.use()` and `app.get()` work the same way" | ✅ `app.use()` matches **all HTTP methods** and **sub-paths**. `app.get()` matches **only GET** requests on **exact paths**. They serve different purposes — middleware vs route handlers |
| ❌ "You can test POST requests from the browser URL bar" | ✅ The browser URL bar only sends **GET** requests. To test POST, PUT, PATCH, DELETE — use **Postman**, **cURL**, or a frontend form |
| ❌ "Route parameters and query strings are the same" | ✅ Route params (`:id`) are **required** path segments for identifying resources. Query strings (`?key=val`) are **optional** key-value pairs for filtering/sorting |
| ❌ "The order of routes doesn't matter in Express" | ✅ Express matches routes **top to bottom** — the first matching route handles the request. If you put a catch-all (`app.use("/")`) before specific routes, it will intercept everything |
| ❌ "PUT and PATCH are interchangeable" | ✅ **PUT** replaces the entire resource (missing fields are removed). **PATCH** updates only specified fields (others stay untouched). Use PATCH for partial updates |
| ❌ "Regex routes are better because they're more flexible" | ✅ Regex routes are **harder to read and maintain**. Use explicit routes (`/users/:id`) for most cases. Only use regex for genuinely complex pattern matching |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: What is routing in Express.js?**
  - A: Routing defines how an application responds to client requests at specific **endpoints** (URL + HTTP method). Express provides methods like `app.get()`, `app.post()`, `app.put()`, `app.patch()`, and `app.delete()` to handle different HTTP verbs. Each route takes a path and a callback function (request handler) that executes when the route is matched.

- **Q2: What is the difference between `app.use()`, `app.get()`, and `app.all()`?**
  - A: `app.use(path, handler)` matches **all HTTP methods** and **sub-paths** (e.g., `/api` matches `/api/users`). `app.get(path, handler)` matches **only GET** on the **exact path**. `app.all(path, handler)` matches **all HTTP methods** on the **exact path** only. Use `app.use()` for middleware, `app.get/post/etc.` for specific routes, and `app.all()` for catch-all handlers on a specific path.

- **Q3: What are route parameters? How do you access them?**
  - A: Route parameters are **named URL segments** prefixed with `:`. They capture dynamic values from the URL. Access them via `req.params`. Example: route `app.get("/user/:id")` with request `GET /user/42` gives `req.params.id === "42"`. You can have multiple params: `/user/:userId/post/:postId`.

- **Q4: What is the difference between `req.params` and `req.query`?**
  - A: `req.params` captures **named segments** from the URL path (required, defined in the route). `req.query` captures **key-value pairs** from the query string after `?` (optional, not defined in the route). Example: `GET /user/5?sort=name` → `req.params = { id: "5" }`, `req.query = { sort: "name" }`. Params identify resources; queries filter/sort them.

- **Q5: How does route pattern matching work with `+`, `?`, and `*`?**
  - A: `+` matches **one or more** of the preceding character (`/ab+c` → `/abc`, `/abbc`). `?` makes the preceding character **optional** (`/ab?c` → `/abc`, `/ac`). `*` matches **any sequence** of characters (`/a*cd` → `/acd`, `/abcd`, `/axyzcd`). These are useful for flexible route matching but should be used sparingly for readability.

- **Q6: Can you use regular expressions for routes in Express?**
  - A: Yes. Instead of a string path, pass a **regex** to Express routing methods: `app.get(/.*fly$/, handler)` matches any path ending with "fly". Regex routes are powerful for complex pattern matching but harder to read and debug. Prefer named route parameters for most use cases.

- **Q7: Why does route order matter in Express?**
  - A: Express evaluates routes **sequentially from top to bottom**. The first route that matches the request's path and method handles it. If you define `app.use("/")` before `app.get("/users")`, all requests will be caught by the first handler and never reach `/users`. Always define **specific routes before general/catch-all** routes.

- **Q8: What is Postman and why is it essential for backend development?**
  - A: Postman is an API testing tool that lets you send HTTP requests (GET, POST, PUT, PATCH, DELETE) with custom headers, body data, and query parameters. It's essential because browsers can only send GET requests from the URL bar. Postman lets you test all API endpoints, view formatted responses, save requests in collections, and share them with your team.

    </div>
  </details>
  </div>

### Key Takeaways

- Express provides **dedicated methods** for each HTTP verb: `app.get()`, `app.post()`, `app.put()`, `app.patch()`, `app.delete()`
- `app.use()` matches **all methods + sub-paths**; `app.get()` matches **only GET + exact path** — different purposes
- **Route parameters** (`:id`) are required path segments accessed via `req.params` — for identifying resources
- **Query strings** (`?key=val`) are optional filters accessed via `req.query` — for sorting, filtering, pagination
- Express supports **pattern matching** with `+` (one or more), `?` (optional), `*` (wildcard), and regex
- Routes are evaluated **top to bottom** — define specific routes before catch-all routes
- Use **Postman** to test all HTTP methods — the browser URL bar only sends GET requests
- Create **Postman Collections** to organize and reuse API tests

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-5) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 16: Creating Our Express Server](../S2%2016%20-%20Creating%20Our%20Express%20Server/Readme.md) |                                             | [Chapter 18: Middlewares and Error Handlers](../S2%2018%20-%20Middlewares%20and%20Error%20Handlers/Readme.md) |

</div>
