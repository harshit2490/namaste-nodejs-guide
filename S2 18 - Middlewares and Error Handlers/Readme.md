<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-5) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 17: Routing and Request Handlers](../S2%2017%20-%20Routing%20and%20Request%20Handlers/Readme.md) |                                             | [Chapter 19: Database Schema Models and Mongoose](../S2%2019%20-%20Database%20Schema%20Models%20and%20Mongoose/Readme.md) |

</div>

---

# Chapter 18 — Middlewares and Error Handlers &nbsp;

> **Season 2** | Part V - Express & Middleware
> [🎬 Link](https://namastedev.com/learn/namaste-node/middlewares-error-handlers)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Multiple Route Handlers & `next()`](#topic-1)
> 2. [Skipping Handlers with `next('route')`](#topic-2)
> 3. [What is Middleware?](#topic-3)
> 4. [How Express Handles Middleware Behind the Scenes](#topic-4)
> 5. [Auth Middleware — Real-World Example](#topic-5)
> 6. [`app.use()` vs `app.all()` — Key Differences](#topic-6)
> 7. [Error-Handling Middleware](#topic-7)
> 8. [HTTP Status Codes Reference](#topic-8)

---

<a id="topic-1"></a>

## 1. [Multiple Route Handlers & `next()`](#key-topics)

Express allows **multiple handler functions** for a single route. The `next()` function passes control from one handler to the next.

```js
app.get("/profile", (req, res, next) => {
  console.log("Handler 1: Logging request");
  next(); // Pass control to the next handler
}, (req, res) => {
  res.send("Handler 2: Sending response");
});
```

```
How next() Works:
────────────────────────────────────────────────

  Request: GET /profile
       │
       ▼
  ┌──────────────────────┐
  │  Handler 1           │
  │  console.log(...)    │
  │  next() ─────────────┼──▶ Passes control
  └──────────────────────┘
                                │
                                ▼
                         ┌──────────────────────┐
                         │  Handler 2           │
                         │  res.send(...)       │
                         │  (Response sent!)    │
                         └──────────────────────┘
```

| Scenario | What Happens |
| -------- | ------------ |
| `next()` is called | Control passes to the next handler/middleware |
| `next()` is NOT called | Request **hangs** — no response is sent, client times out |
| `res.send()` is called | Response is sent — no more handlers should run |

> 💡 If you don't call `next()` and don't send a response, the request **hangs forever** — the client will eventually time out. Every middleware must either call `next()` or send a response with `res.send()` / `res.json()` / `res.end()`.

---

<a id="topic-2"></a>

## 2. [Skipping Handlers with `next('route')`](#key-topics)

Passing `'route'` as an argument to `next()` **skips all remaining handlers** for the current route and jumps to the next matching route.

```js
// Route 1: Two handlers
app.get("/skip", (req, res, next) => {
  console.log("Handler 1 runs");
  next("route"); // Skip Handler 2, go to next matching route
}, (req, res) => {
  // ❌ This NEVER runs!
  res.send("Handler 2 — skipped!");
});

// Route 2: Next matching route for /skip
app.get("/skip", (req, res) => {
  // ✅ This runs!
  res.send("Jumped to this handler via next('route')");
});
```

```
next() vs next('route'):
────────────────────────────────────────────────

  next()           next('route')
  ──────           ──────────────
  Go to NEXT       SKIP remaining handlers
  handler in       in THIS route, go to
  SAME route       NEXT MATCHING route

  Route 1:         Route 1:
  [H1] → [H2]     [H1] ──╳── [H2]
                      │
                      └──▶ Route 2: [H3] ✓
```

> 💡 `next('route')` only works with route handlers defined via `app.get()`, `app.post()`, etc. — **not** with `app.use()` middleware. It's useful for conditional routing: check a condition in the first handler, and skip to an alternative handler if the condition isn't met.

---

<a id="topic-3"></a>

## 3. [What is Middleware?](#key-topics)

A **middleware** is a function that sits **between** the incoming request and the final route handler. It has access to `req`, `res`, and `next()`.

```
Middleware = The "Middle" Layer:
────────────────────────────────────────────────

  Client Request
       │
       ▼
  ┌──────────────────┐
  │  Middleware 1    │  ← Logging
  │  (req, res, next)│
  └────────┬─────────┘
           │ next()
           ▼
  ┌──────────────────┐
  │  Middleware 2    │  ← Authentication
  │  (req, res, next)│
  └────────┬─────────┘
           │ next()
           ▼
  ┌──────────────────┐
  │  Middleware 3    │  ← Body Parsing
  │  (req, res, next)│
  └────────┬─────────┘
           │ next()
           ▼
  ┌──────────────────┐
  │  Route Handler   │  ← Final response
  │  res.send(...)   │
  └──────────────────┘
```

### What Middleware Can Do

| Capability | Example |
| ---------- | ------- |
| Execute any code | Log request details, measure response time |
| Modify `req` and `res` objects | Add `req.user` after authentication |
| End the request-response cycle | Send `401 Unauthorized` if auth fails |
| Call `next()` to continue | Pass to next middleware or route handler |

### Why We Need Middleware

| Use Case | Description |
| -------- | ----------- |
| **Logging** | Log every request (method, URL, timestamp) for debugging |
| **Authentication** | Verify JWT tokens, check if user is logged in |
| **Authorization** | Check if user has permission to access a resource |
| **Body Parsing** | Parse JSON request bodies (`express.json()`) |
| **Validation** | Validate request data before it reaches the handler |
| **Error Handling** | Catch and handle errors gracefully |
| **CORS** | Set cross-origin headers for frontend access |

> 💡 Middleware is what makes Express powerful. Without it, you'd need to copy-paste auth checks, logging, and validation into **every single route handler**. Middleware lets you write it once and apply it everywhere.

---

<a id="topic-4"></a>

## 4. [How Express Handles Middleware Behind the Scenes](#key-topics)

Express maintains a **middleware stack** — an ordered list of functions. When a request arrives, Express walks through this stack sequentially.

```
Express Middleware Stack:
────────────────────────────────────────────────

  Request arrives at Express
       │
       ▼
  ┌──────────────────────────────────────────┐
  │  MIDDLEWARE STACK (processed in order)   │
  │                                          │
  │  1. app.use(logger)           → next()   │
  │  2. app.use(express.json())   → next()   │
  │  3. app.use("/admin", auth)   → next()   │
  │  4. app.get("/admin/data", handler)      │
  │                                          │
  │  Each calls next() to continue,          │
  │  OR sends a response to STOP.            │
  └──────────────────────────────────────────┘

  Rule: If next() is NOT called and no
  response is sent → request HANGS!
```

### Three Possible Outcomes Per Middleware

```
What Each Middleware Can Do:
────────────────────────────────────────────────

  Option 1: Call next()
  ┌─────────────┐ next()     ┌─────────────┐
  │ Middleware  │ ────────▶ │   Next MW    │
  └─────────────┘            └─────────────┘
  (Continue the chain)

  Option 2: Send a response
  ┌────────────┐          ┌────────┐
  │ Middleware │ ─────▶  │ Client  │
  │ res.send() │          │        │
  └────────────┘          └────────┘
  (End the chain — no more middleware runs)

  Option 3: Neither (BUG!)
  ┌─────────────┐
  │ Middleware  │ → ??? → Client times out ⏳
  └─────────────┘
  (Request hangs forever)
```

---

<a id="topic-5"></a>

## 5. [Auth Middleware — Real-World Example](#key-topics)

Here's how middleware is used in DevTinder to protect admin routes:

```js
const express = require("express");
const app = express();

// Middleware: Request Logger (runs on ALL routes)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware: Admin Auth (runs only on /admin/* routes)
app.use("/admin", (req, res, next) => {
  const token = "999";
  const isAuthorizedAdmin = token === "999";
  if (!isAuthorizedAdmin) {
    res.status(401).send("Unauthorized Admin");
    // ❌ Do NOT call next() — response already sent
  } else {
    next(); // ✅ Authorized — continue to route handler
  }
});

// These routes are PROTECTED by the admin middleware above
app.get("/admin/getAllData", (req, res) => {
  res.send("All data generated");
});

app.get("/admin/deleteData", (req, res) => {
  res.send("Data deleted");
});

// This route is NOT protected (no /admin prefix)
app.get("/public", (req, res) => {
  res.send("Anyone can access this");
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

```
Middleware Scope — Path-Based:
────────────────────────────────────────────────

  app.use(logger)            → Runs on EVERY route
  app.use("/admin", auth)    → Runs ONLY on /admin/*

  GET /public
  → logger ✓ → auth ✗ (path doesn't match) → handler ✓

  GET /admin/getAllData
  → logger ✓ → auth ✓ (path matches /admin) → handler ✓

  GET /admin/deleteData
  → logger ✓ → auth ✓ → handler ✓
```

> 💡 Path-based middleware (`app.use("/admin", handler)`) only runs when the request path **starts with** that prefix. This is how you protect groups of routes without adding auth checks to each handler individually.

---

<a id="topic-6"></a>

## 6. [`app.use()` vs `app.all()` — Key Differences](#key-topics)

| Feature | `app.use()` | `app.all()` |
| ------- | ----------- | ----------- |
| **Purpose** | Mount middleware or sub-routers | Handle all HTTP methods on one route |
| **Path matching** | Matches path **prefix** (`/admin` matches `/admin/xyz`) | Matches **exact** path only |
| **Path required?** | No — can omit for global middleware | Yes — always needs a path |
| **Common use case** | Auth middleware, logging, body parsing | Catch-all handler for a specific endpoint |

```js
// app.use — matches prefix (and sub-paths)
app.use("/admin", (req, res, next) => {
  // Runs for: /admin, /admin/users, /admin/data/xyz
  next();
});

// app.all — matches exact path only
app.all("/about", (req, res) => {
  // Runs for: GET /about, POST /about, PUT /about
  // Does NOT run for: /about/team, /about/contact
  res.send("Handles all methods on /about");
});
```

> 💡 Use `app.use()` for **middleware** (logging, auth, parsing). Use `app.all()` when you want one handler to respond to **every HTTP method** on a **single endpoint** (like a catch-all for 405 Method Not Allowed).

---

<a id="topic-7"></a>

## 7. [Error-Handling Middleware](#key-topics)

Error-handling middleware has **four parameters**: `(err, req, res, next)`. Express identifies it as an error handler because of the `err` parameter.

```js
// Regular route that might throw an error
app.get("/profile", (req, res) => {
  throw new Error("Something went wrong!");
});

// Error-handling middleware (MUST have 4 parameters)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});
```

```
Error-Handling Flow:
────────────────────────────────────────────────

  Normal Flow:
  [MW 1] → next() → [MW 2] → next() → [Handler] → res.send()

  Error Flow:
  [MW 1] → next() → [Handler] → THROWS ERROR!
                                     │
                                     ▼
                              [Error Middleware]
                              (err, req, res, next)
                                     │
                                     ▼
                              res.status(500).send("Error!")
```

### Key Rules

| Rule | Details |
| ---- | ------- |
| Must have **4 parameters** | `(err, req, res, next)` — Express uses the param count to identify error handlers |
| Must be defined **last** | After all other `app.use()` and route definitions |
| Triggered by `throw` or `next(err)` | Either throw an error in a handler, or call `next(err)` to pass it |
| Async errors need `try/catch` | Express doesn't auto-catch async errors — use `try { } catch(err) { next(err) }` |

> 💡 The **4-parameter signature** is what makes Express treat it as an error handler — if you accidentally omit `next`, Express treats it as a regular middleware and error handling breaks. Always include all four parameters even if you don't use `next`.

---

<a id="topic-8"></a>

## 8. [HTTP Status Codes Reference](#key-topics)

| Category | Range | Meaning |
| -------- | ----- | ------- |
| **1xx** Informational | 100–199 | Request received, continuing process |
| **2xx** Success | 200–299 | Request successful |
| **3xx** Redirection | 300–399 | Further action needed |
| **4xx** Client Error | 400–499 | Client sent a bad request |
| **5xx** Server Error | 500–599 | Server failed to process |

### Most Common Codes

| Code | Name | When to Use |
| ---- | ---- | ----------- |
| `200` | OK | Successful GET, PATCH request |
| `201` | Created | Successful POST (new resource created) |
| `204` | No Content | Successful DELETE (nothing to return) |
| `301` | Moved Permanently | Resource URL has permanently changed |
| `304` | Not Modified | Client cache is still valid |
| `400` | Bad Request | Invalid input, validation failed |
| `401` | Unauthorized | No auth token or invalid token |
| `403` | Forbidden | Authenticated but no permission |
| `404` | Not Found | Resource doesn't exist |
| `500` | Internal Server Error | Server-side bug |
| `502` | Bad Gateway | Upstream server returned invalid response |
| `503` | Service Unavailable | Server is overloaded or down for maintenance |

```js
// Using status codes in Express
app.get("/success", (req, res) => {
  res.status(200).send("Success");
});

app.post("/user", (req, res) => {
  // After creating a user
  res.status(201).json({ message: "User created" });
});

app.get("/notfound", (req, res) => {
  res.status(404).send("Not Found");
});
```

> 💡 **401 vs 403**: `401 Unauthorized` means "I don't know who you are" (no/invalid auth). `403 Forbidden` means "I know who you are, but you don't have permission." A logged-in regular user hitting an admin-only route gets 403, not 401.

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "Middleware and route handlers are different things" | ✅ Route handlers **are** middleware — they're just the last middleware in the chain that sends the response. Every `(req, res, next)` function is middleware |
| ❌ "If I don't call `next()`, Express moves on automatically" | ✅ If you don't call `next()` and don't send a response, the request **hangs forever**. The client will time out. Every middleware must do one or the other |
| ❌ "Error-handling middleware has 3 parameters like regular middleware" | ✅ Error middleware has **4 parameters**: `(err, req, res, next)`. Express uses the parameter count to distinguish it — omitting any parameter breaks error handling |
| ❌ "`next('route')` and `next()` are the same" | ✅ `next()` goes to the **next handler in the same route**. `next('route')` **skips all remaining handlers** in the current route and jumps to the next matching route |
| ❌ "`app.use()` and `app.all()` do the same thing" | ✅ `app.use()` matches **path prefixes** (`/admin` matches `/admin/xyz`). `app.all()` matches the **exact path** only. Different scoping behavior |
| ❌ "401 and 403 mean the same thing" | ✅ `401` = "Who are you?" (not authenticated). `403` = "I know who you are, but you can't do this" (not authorized). Different meanings, different responses |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: What is middleware in Express.js?**
  - A: Middleware is a function with access to `req`, `res`, and `next()` that sits between the incoming request and the final route handler. It can execute code, modify request/response objects, end the cycle by sending a response, or call `next()` to pass control to the next middleware. Examples: logging, authentication, body parsing, error handling.

- **Q2: What happens if you don't call `next()` in a middleware?**
  - A: The request **hangs** — no response is sent, and the client eventually times out. Express doesn't automatically move to the next middleware. Every middleware function must either call `next()` to continue the chain or send a response with `res.send()` / `res.json()` to end it.

- **Q3: What is the difference between `next()` and `next('route')`?**
  - A: `next()` passes control to the **next handler in the same route** definition. `next('route')` **skips all remaining handlers** in the current route and jumps to the **next matching route** for the same path. `next('route')` only works with `app.get()`, `app.post()`, etc. — not with `app.use()`.

- **Q4: How does error-handling middleware work in Express?**
  - A: Error-handling middleware has **4 parameters**: `(err, req, res, next)`. Express identifies it by the parameter count. It's triggered when a route handler throws an error or when `next(err)` is called with an error object. It must be defined **after** all routes and regular middleware. For async errors, you need `try/catch` with `next(err)`.

- **Q5: What is the difference between `app.use()` and `app.all()`?**
  - A: `app.use(path, handler)` matches the path as a **prefix** — `/admin` matches `/admin`, `/admin/users`, `/admin/data/xyz`. `app.all(path, handler)` matches the **exact path** only — `/admin` matches only `/admin`, not `/admin/users`. Use `app.use()` for middleware; use `app.all()` for catch-all route handlers.

- **Q6: How would you implement authentication middleware for protected routes?**
  - A: Use path-based middleware with `app.use()`. Example: `app.use("/admin", authMiddleware)` runs the auth check only for routes starting with `/admin`. Inside the middleware, verify the auth token — if valid, call `next()`; if invalid, send `res.status(401).send("Unauthorized")` and do NOT call `next()`. All `/admin/*` routes are now protected without adding auth checks to each handler.

- **Q7: What is the difference between 401 and 403 status codes?**
  - A: `401 Unauthorized` means the client hasn't authenticated — no token, expired token, or invalid credentials. The fix is to log in. `403 Forbidden` means the client is authenticated but **doesn't have permission** — a regular user trying to access an admin-only resource. The fix is to get the right role/permissions.

- **Q8: In what order should middleware and error handlers be defined?**
  - A: Order matters in Express: (1) Global middleware first (`app.use(express.json())`, logging), (2) Path-specific middleware (`app.use("/admin", auth)`), (3) Route handlers (`app.get()`, `app.post()`), (4) Error-handling middleware last (`app.use((err, req, res, next) => {...})`). Express processes them top-to-bottom, so defining order = execution order.

    </div>
  </details>
  </div>

### Key Takeaways

- **Middleware** is any function with `(req, res, next)` that sits between request and response — route handlers are just the final middleware
- `next()` passes control to the **next handler**; not calling it causes the request to **hang forever**
- `next('route')` **skips remaining handlers** in the current route and jumps to the next matching route
- Express maintains a **middleware stack** — functions execute in the **order they're defined** (top to bottom)
- Path-based middleware (`app.use("/admin", fn)`) protects **groups of routes** without repeating code
- `app.use()` matches path **prefixes**; `app.all()` matches **exact paths** — different scoping behavior
- Error middleware has **4 parameters** `(err, req, res, next)` — Express uses param count to identify it
- Define error middleware **last**, after all routes — it catches errors thrown by handlers above it
- `401` = not authenticated ("who are you?"); `403` = not authorized ("you can't do this")
- Always use meaningful **HTTP status codes** — don't send 200 for errors

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-5) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 17: Routing and Request Handlers](../S2%2017%20-%20Routing%20and%20Request%20Handlers/Readme.md) |                                             | [Chapter 19: Database Schema Models and Mongoose](../S2%2019%20-%20Database%20Schema%20Models%20and%20Mongoose/Readme.md) |

</div>
