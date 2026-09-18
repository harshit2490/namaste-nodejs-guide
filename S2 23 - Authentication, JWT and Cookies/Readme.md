<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-7) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 22: Encrypting Passwords](../S2%2022%20-%20Encrypting%20Passwords/Readme.md) |                                             | [Chapter 24: Diving into the APIs and Express Router](../S2%2024%20-%20Diving%20into%20the%20APIs%20and%20Express%20Router/Readme.md) |

</div>

---

# Chapter 23 — Authentication, JWT & Cookies &nbsp;

> **Season 2** | Part VII - Authentication & Security
> [🎬 Link](https://namastedev.com/learn/namaste-node/authentication-jwt-cookies)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Authentication Flow — The Big Picture](#topic-1)
> 2. [JWT (JSON Web Tokens) — Structure & Creation](#topic-2)
> 3. [Cookies — Storing & Sending Tokens](#topic-3)
> 4. [Auth Middleware — Protecting Routes](#topic-4)
> 5. [Schema.methods — Instance Methods in Mongoose](#topic-5)
> 6. [Security Best Practices — Cookie & Token Safety](#topic-6)

---

<a id="topic-1"></a>

## 1. [Authentication Flow — The Big Picture](#key-topics)

Authentication verifies **who the user is**. In DevTinder, the flow works like this:

```
SIGNUP (Chapter 22):
  Input → Validate → Hash Password → Save to DB

LOGIN:
  Input → Find User → Compare Password → Generate JWT → Send in Cookie

SUBSEQUENT REQUESTS:
  Cookie (JWT) → Auth Middleware → Verify Token → Allow/Deny
```

### Complete Auth Flow Diagram

```
Client                                    Server
──────                                    ──────

1. POST /login { email, password }
         ──────────────▶
                                    Find user by email
                                    bcrypt.compare(password, hash)
                                    ✅ Match → jwt.sign({ _id })
         ◀──────────────
2. Response + Set-Cookie: token=eyJhb...

3. GET /profile (Cookie: token=eyJhb...)
         ──────────────▶
                                    Auth Middleware:
                                    jwt.verify(token, secret)
                                    User.findById(decoded._id)
                                    req.user = user
         ◀──────────────
4. Response: { user profile data }

5. GET /feed (Cookie: token=eyJhb...)
         ──────────────▶
                                    Same middleware → req.user
         ◀──────────────
6. Response: { feed data }
```

> 💡 The cookie is sent **automatically** by the browser with every request to the same domain — the client doesn't need to manually attach it.

---

<a id="topic-2"></a>

## 2. [JWT (JSON Web Tokens) — Structure & Creation](#key-topics)

A JWT is a compact, self-contained token that carries user information and a signature to prove it hasn't been tampered with.

### JWT Structure — Three Parts

```
eyJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI2NzM...In0.K4fG7k3J8mN...
│                      │                     │
│                      │                     └── Signature (Blue)
│                      └── Payload (Purple)
└── Header (Red)

Separated by dots (.)
```

| Part | Contains | Encoded As |
|------|----------|-----------|
| **Header** | `{ alg: "HS256", typ: "JWT" }` | Base64URL |
| **Payload** | `{ _id: "user123", iat: ..., exp: ... }` | Base64URL |
| **Signature** | `HMACSHA256(header + payload, secret)` | Hash |

### Creating a JWT — `jwt.sign()`

```js
const jwt = require("jsonwebtoken");

// After successful password verification:
const token = jwt.sign(
  { _id: user._id },           // Payload — what to encode
  "YOUR_SECRET_KEY",            // Secret — for signing
  { expiresIn: "1d" }          // Options — token lifespan
);
```

### What Goes in the Payload?

| ✅ Put in Payload | ❌ Never Put in Payload |
|-------------------|----------------------|
| User ID (`_id`) | Password (even hashed) |
| Role (`admin`, `user`) | Credit card numbers |
| Token expiry (`exp`) | Full user object |

> ⚠️ **JWT payload is NOT encrypted** — it's only Base64-encoded. Anyone can decode it. The signature only ensures it hasn't been tampered with.

### Install jsonwebtoken

```bash
npm install jsonwebtoken
```

---

<a id="topic-3"></a>

## 3. [Cookies — Storing & Sending Tokens](#key-topics)

After generating a JWT, the server sends it to the client as a **cookie**.

### Why Cookies Over localStorage?

| | Cookies | localStorage |
|--|---------|-------------|
| **Sent with requests** | ✅ Automatically | ❌ Must attach manually |
| **httpOnly** | ✅ Can block JS access | ❌ Accessible via JS |
| **XSS protection** | ✅ httpOnly prevents theft | ❌ Vulnerable to XSS |
| **CSRF protection** | ⚠️ Needs SameSite/CSRF tokens | ✅ Not auto-sent |
| **Best for** | Server-side auth (JWT) | Client-side state |

### Setting a Cookie — `res.cookie()`

```js
// Install cookie-parser first:
// npm install cookie-parser

const cookieParser = require("cookie-parser");
app.use(cookieParser());  // ← parse cookies from req.cookies

// In login route — send token as cookie:
res.cookie("token", token, {
  expires: new Date(Date.now() + 8 * 3600000),  // 8 hours
  httpOnly: true   // ← JS can't access this cookie
});
```

### Cookie Lifecycle

```
Login Success
     │
     ▼
  res.cookie("token", jwt, { expires, httpOnly })
     │
     ▼
  Browser stores cookie
     │
     ▼
  Every subsequent request to same domain:
  ┌───────────────────────────────────┐
  │  GET /profile                     │
  │  Cookie: token=eyJhbGciOi...      │  ← auto-attached by browser
  └───────────────────────────────────┘
     │
     ▼
  Server reads: req.cookies.token
     │
     ▼
  jwt.verify() → decoded user data
```

### Cookie Options

| Option | Type | Purpose |
|--------|------|---------|
| `expires` | Date | When the cookie expires |
| `maxAge` | Number (ms) | Alternative to `expires` — duration in ms |
| `httpOnly` | Boolean | Blocks `document.cookie` access (prevents XSS theft) |
| `secure` | Boolean | Cookie sent only over HTTPS |
| `sameSite` | String | CSRF protection: `"strict"`, `"lax"`, `"none"` |

---

<a id="topic-4"></a>

## 4. [Auth Middleware — Protecting Routes](#key-topics)

The auth middleware runs **before** protected route handlers, verifying the JWT from the cookie.

### Implementation — `userAuth` Middleware

```js
// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    // Step 1: Extract token from cookies
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Token not found");
    }

    // Step 2: Verify token
    const decodedObj = jwt.verify(token, "YOUR_SECRET_KEY");
    const { _id } = decodedObj;

    // Step 3: Find user by decoded ID
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User not found");
    }

    // Step 4: Attach user to request
    req.user = user;
    next();  // ← proceed to route handler
  } catch (err) {
    res.status(401).send("ERROR: " + err.message);
  }
};

module.exports = { userAuth };
```

### Middleware Flow

```
Incoming Request (with cookie)
       │
       ▼
  req.cookies.token exists?
       │
  No ──▶ 401 "Token not found"
       │
      Yes
       │
       ▼
  jwt.verify(token, secret)
       │
  Invalid/Expired ──▶ 401 "Invalid token"
       │
      Valid
       │
       ▼
  User.findById(decoded._id)
       │
  Not found ──▶ 401 "User not found"
       │
      Found
       │
       ▼
  req.user = user
  next() → Route handler runs
```

### Using the Middleware

```js
const { userAuth } = require("./middleware/auth");

// Protected routes — middleware runs first
app.get("/profile", userAuth, async (req, res) => {
  res.send(req.user);  // ← user attached by middleware
});

app.get("/feed", userAuth, async (req, res) => {
  // req.user is available here
});
```

---

<a id="topic-5"></a>

## 5. [Schema.methods — Instance Methods in Mongoose](#key-topics)

Instead of writing JWT and password logic in routes, attach them as **instance methods** on the schema — cleaner, reusable, and encapsulated.

### What are Schema.methods?

```
Schema.methods = custom functions available on every document instance

                         Schema
                           │
                    methods attached
                           │
                     ┌─────┴─────┐
                     ▼           ▼
              user.getJWT()  user.validatePassword()
              (any document)  (any document)
```

### Implementation

```js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// JWT generation — as instance method
userSchema.methods.getJWT = async function () {
  const user = this;  // ← 'this' refers to the document instance
  const token = jwt.sign({ _id: user._id }, "YOUR_SECRET_KEY", {
    expiresIn: "1d"
  });
  return token;
};

// Password comparison — as instance method
userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const passwordHash = user.password;
  const isValidPassword = await bcrypt.compare(passwordInputByUser, passwordHash);
  return isValidPassword;
};
```

### Usage in Login Route (Before vs After)

```js
// ❌ BEFORE — logic scattered in route
app.post("/login", async (req, res) => {
  const user = await User.findOne({ emailId });
  const isValid = await bcrypt.compare(password, user.password);
  const token = jwt.sign({ _id: user._id }, secret, { expiresIn: "1d" });
  // ...
});

// ✅ AFTER — clean route, logic in schema
app.post("/login", async (req, res) => {
  const user = await User.findOne({ emailId });
  const isValid = await user.validatePassword(password);
  const token = await user.getJWT();
  // ...
});
```

### Why Use Schema.methods?

| Benefit | Explanation |
|---------|------------|
| **Encapsulation** | JWT/password logic lives with the User schema — not scattered across routes |
| **Reusability** | Call `user.getJWT()` from any route — login, refresh token, etc. |
| **Testability** | Test methods independently without HTTP layer |
| **Single Responsibility** | Routes handle HTTP; schema handles business logic |

> ⚠️ **Important**: Use `function()` — NOT arrow functions — for schema methods. Arrow functions don't bind `this` to the document instance.

---

<a id="topic-6"></a>

## 6. [Security Best Practices — Cookie & Token Safety](#key-topics)

### Cookie Hijacking — How Attackers Steal Tokens

```
Attack Vectors:
───────────────
  1. XSS (Cross-Site Scripting)
     → Inject JS → document.cookie → steal token
     → Mitigation: httpOnly: true (blocks JS access)

  2. Network Sniffing (Man-in-the-Middle)
     → Intercept HTTP traffic → read cookie
     → Mitigation: secure: true + HTTPS

  3. CSRF (Cross-Site Request Forgery)
     → Trick browser into sending cookie to attacker's site
     → Mitigation: sameSite: "strict" + CSRF tokens
```

### Security Checklist

| Setting | Value | What It Prevents |
|---------|-------|-----------------|
| `httpOnly` | `true` | XSS — JS can't read `document.cookie` |
| `secure` | `true` | MITM — cookie only sent over HTTPS |
| `sameSite` | `"strict"` | CSRF — cookie not sent on cross-site requests |
| `expiresIn` (JWT) | `"1d"` or less | Limits exposure if token is stolen |
| Secret key | Long, random string | Prevents signature forgery |

### Secure Cookie Example

```js
res.cookie("token", token, {
  httpOnly: true,                              // ← blocks XSS
  secure: true,                                // ← HTTPS only
  sameSite: "strict",                          // ← blocks CSRF
  expires: new Date(Date.now() + 8 * 3600000)  // ← 8 hours
});
```

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "JWT payload is encrypted and secure" | ✅ JWT payload is only **Base64-encoded** — anyone can decode it. Never put sensitive data (passwords, credit cards) in the payload. The signature only prevents tampering |
| ❌ "Cookies are inherently insecure" | ✅ Cookies with `httpOnly`, `secure`, and `sameSite` are **more secure** than localStorage for auth tokens. localStorage is fully accessible via JavaScript |
| ❌ "You can use arrow functions for schema.methods" | ✅ Arrow functions don't bind `this` to the document instance. Always use `function()` syntax — `this` must refer to the document to access `this._id`, `this.password`, etc. |
| ❌ "JWT replaces sessions entirely" | ✅ JWT is **stateless** (no server-side storage), but you lose the ability to revoke individual tokens. Sessions allow server-side revocation. Choose based on your needs |
| ❌ "Setting token expiry in the cookie is enough" | ✅ You need expiry in **both** the JWT (`expiresIn`) AND the cookie (`expires`). The JWT expiry is the real security control — cookie expiry is just for browser cleanup |
| ❌ "Auth middleware should return 403 for missing tokens" | ✅ Use **401 Unauthorized** for missing/invalid tokens (not authenticated). Use **403 Forbidden** only when the user IS authenticated but lacks permissions |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: What is JWT and how does it work?**
  - A: JWT (JSON Web Token) is a compact, self-contained token with three parts: **Header** (algorithm, type), **Payload** (user data, expiry), and **Signature** (HMAC of header+payload with secret). The server creates it on login with `jwt.sign()`, sends it in a cookie, and verifies it on subsequent requests with `jwt.verify()`. It's stateless — no server-side session storage needed.

- **Q2: What are the three parts of a JWT?**
  - A: **Header**: Contains token type (`JWT`) and signing algorithm (`HS256`). **Payload**: Contains claims — user data like `_id`, issued-at (`iat`), and expiry (`exp`). **Signature**: Created by HMAC-SHA256 of the encoded header + payload using a secret key. All three are Base64URL-encoded and separated by dots.

- **Q3: Why store JWT in cookies instead of localStorage?**
  - A: Cookies with `httpOnly: true` are **not accessible via JavaScript**, protecting against XSS attacks. localStorage is fully accessible via `document.cookie` and any injected script can steal the token. Cookies are also auto-sent with every request to the same domain — no manual attachment needed.

- **Q4: What does the `httpOnly` cookie flag do?**
  - A: It prevents client-side JavaScript from accessing the cookie via `document.cookie`. This protects the JWT from being stolen through XSS (Cross-Site Scripting) attacks. The cookie is still sent with HTTP requests — it's just invisible to browser JS.

- **Q5: How does auth middleware work in Express?**
  - A: Auth middleware extracts the JWT from `req.cookies`, verifies it with `jwt.verify(token, secret)`, finds the user by the decoded `_id`, and attaches the user to `req.user`. If any step fails, it returns `401`. If successful, it calls `next()` to proceed to the route handler.

- **Q6: What are Mongoose schema.methods and why use them?**
  - A: `schema.methods` lets you define custom instance methods on documents. In DevTinder, we attach `getJWT()` and `validatePassword()` to the user schema. This encapsulates business logic within the model, keeps routes clean, and makes the logic reusable and testable. Must use `function()` — not arrow functions — so `this` binds to the document.

- **Q7: Why can't you use arrow functions for schema.methods?**
  - A: Arrow functions lexically bind `this` — meaning `this` refers to the surrounding scope, not the document instance. In schema methods, you need `this` to refer to the specific document (to access `this._id`, `this.password`). Regular `function()` syntax correctly binds `this` to the document.

- **Q8: How do you prevent cookie hijacking?**
  - A: Use multiple layers: `httpOnly: true` (blocks XSS theft), `secure: true` (HTTPS only — prevents network sniffing), `sameSite: "strict"` (prevents CSRF), short token expiry (`expiresIn: "1d"`), and a strong secret key. No single flag is enough — use all of them together.

    </div>
  </details>
  </div>

### Key Takeaways

- **Authentication flow**: Login → Generate JWT → Send in cookie → Verify on subsequent requests
- JWT has 3 parts: **Header** (algorithm), **Payload** (user data), **Signature** (integrity check)
- JWT payload is **NOT encrypted** — it's Base64-encoded. Never put sensitive data in it
- Use **cookies** (not localStorage) for JWT storage — `httpOnly` blocks XSS attacks
- Install `cookie-parser` middleware to read cookies from `req.cookies`
- Auth middleware: extract token → `jwt.verify()` → find user → `req.user = user` → `next()`
- Use **`schema.methods`** for `getJWT()` and `validatePassword()` — keeps routes clean
- Always use `function()` (not arrow functions) for schema methods — `this` must bind to the document
- Set all cookie security flags: `httpOnly`, `secure`, `sameSite`, and token `expiresIn`

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-7) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 22: Encrypting Passwords](../S2%2022%20-%20Encrypting%20Passwords/Readme.md) |                                             | [Chapter 24: Diving into the APIs and Express Router](../S2%2024%20-%20Diving%20into%20the%20APIs%20and%20Express%20Router/Readme.md) |

</div>
