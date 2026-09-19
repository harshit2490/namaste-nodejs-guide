<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-8) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 23: Authentication, JWT and Cookies](../S2%2023%20-%20Authentication%2C%20JWT%20and%20Cookies/Readme.md) |                                             | [Chapter 25: Logical DB Query and Compound Indexes](../S2%2025%20-%20Logical%20DB%20Query%20and%20Compound%20Indexes/Readme.md) |

</div>

---

# Chapter 24 — Diving into the APIs & Express Router &nbsp;

> **Season 2** | Part VII - Authentication & Security
> [🎬 Link](https://namastedev.com/learn/namaste-node/diving-into-the-apis-and-express-router)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [DevTinder API Endpoints — Full Route Map](#topic-1)
> 2. [Express Router — Modular Route Organization](#topic-2)
> 3. [Logout API — Clearing the JWT Cookie](#topic-3)
> 4. [Profile/Edit API — Secure Profile Updates](#topic-4)

---

<a id="topic-1"></a>

## 1. [DevTinder API Endpoints — Full Route Map](#key-topics)

DevTinder's backend is organized into **4 routers**, each handling a specific domain of functionality.

### Complete API Map

```
DevTinder Backend API
│
├── 🔐 Auth Router (/auth)
│   ├── POST /signup          → Register new user
│   ├── POST /login           → Authenticate + issue JWT
│   └── POST /logout          → Clear JWT cookie
│
├── 👤 Profile Router (/profile)
│   ├── GET  /profile/view    → Get logged-in user's profile
│   ├── PATCH /profile/edit   → Update profile fields
│   └── PATCH /profile/password → Change password
│
├── 🤝 Connection Request Router (/request)
│   ├── POST /request/send/interested/:userId  → Send interest
│   ├── POST /request/send/ignored/:userId     → Ignore a user
│   ├── POST /request/review/accepted/:requestId → Accept request
│   └── POST /request/review/rejected/:requestId → Reject request
│
└── 👥 User Router (/user)
    ├── GET /user/connections        → List all connections
    ├── GET /user/requests/received  → List received requests
    └── GET /user/feed               → Suggested users feed
```

### Connection Request Status Flow

```
User A sees User B in feed
         │
         ├── "Interested" → POST /request/send/interested/:userId
         │                    Status: "interested"
         │
         └── "Ignore" → POST /request/send/ignored/:userId
                          Status: "ignored"

User B receives request
         │
         ├── "Accept" → POST /request/review/accepted/:requestId
         │                Status: "accepted" → Now connections!
         │
         └── "Reject" → POST /request/review/rejected/:requestId
                          Status: "rejected"
```

### API Endpoints Summary Table

| Router | Method | Endpoint | Auth Required | Purpose |
|--------|--------|----------|:---:|---------|
| Auth | POST | `/signup` | ❌ | Register user |
| Auth | POST | `/login` | ❌ | Login + JWT |
| Auth | POST | `/logout` | ✅ | Clear cookie |
| Profile | GET | `/profile/view` | ✅ | View own profile |
| Profile | PATCH | `/profile/edit` | ✅ | Edit profile fields |
| Profile | PATCH | `/profile/password` | ✅ | Change password |
| Request | POST | `/request/send/interested/:userId` | ✅ | Send interest |
| Request | POST | `/request/send/ignored/:userId` | ✅ | Ignore user |
| Request | POST | `/request/review/accepted/:requestId` | ✅ | Accept request |
| Request | POST | `/request/review/rejected/:requestId` | ✅ | Reject request |
| User | GET | `/user/connections` | ✅ | List connections |
| User | GET | `/user/requests/received` | ✅ | Received requests |
| User | GET | `/user/feed` | ✅ | User feed |

---

<a id="topic-2"></a>

## 2. [Express Router — Modular Route Organization](#key-topics)

Instead of putting all routes in `app.js`, use **Express Router** to split routes into separate files by domain.

### Without vs With Router

```
❌ Without Router (all in app.js):        ✅ With Router (modular):
──────────────────────────────            ────────────────────────
  app.js                                    app.js (clean — just mounts routers)
    ├── app.post("/signup")                   │
    ├── app.post("/login")                    ├── routes/
    ├── app.post("/logout")                   │   ├── auth.js      (signup, login, logout)
    ├── app.get("/profile")                   │   ├── profile.js   (view, edit, password)
    ├── app.patch("/profile/edit")            │   ├── request.js   (send, review)
    ├── app.post("/request/send/...")         │   └── user.js      (connections, feed)
    ├── app.get("/user/feed")                 │
    └── ... (50+ routes = chaos)              └── Middleware/
                                                  └── auth.js      (userAuth)
```

### Creating a Router File

```js
// routes/profile.js
const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middleware/auth");

// GET /profile/view
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  const user = req.user;
  res.send(user);
});

// PATCH /profile/edit
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  // ... edit logic
});

module.exports = profileRouter;
```

### Mounting Routers in app.js

```js
// app.js
const express = require("express");
const app = express();

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

app.use(express.json());
app.use(cookieParser());

// Mount routers
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
```

### How Express Router Works Internally

```
Incoming Request: PATCH /profile/edit
       │
       ▼
  app.js processes middleware stack
  (express.json, cookieParser, etc.)
       │
       ▼
  app.use("/", profileRouter)
       │
       ▼
  profileRouter matches PATCH /profile/edit
       │
       ▼
  userAuth middleware runs → req.user set
       │
       ▼
  Route handler executes
```

### Project Structure — DevTinder Backend

```
devTinder-backend/
├── app.js                    ← Entry point, mounts routers
├── models/
│   └── user.js               ← Mongoose schema + methods
├── routes/
│   ├── auth.js               ← signup, login, logout
│   ├── profile.js            ← view, edit, password
│   ├── request.js            ← send, review connections
│   └── user.js               ← connections, feed
├── middleware/
│   └── auth.js               ← userAuth (JWT verify)
├── utils/
│   └── validation.js         ← validateSignupData, validateEditFields
└── package.json
```

---

<a id="topic-3"></a>

## 3. [Logout API — Clearing the JWT Cookie](#key-topics)

Logout is simple — clear the JWT cookie so the browser stops sending it.

### Implementation

```js
// routes/auth.js
authRouter.post("/logout", async (req, res) => {
  res
    .cookie("token", null, {
      expires: new Date(Date.now())  // ← expire immediately
    })
    .send("User Logged out successfully");
});
```

### How Logout Works

```
Client: POST /logout
       │
       ▼
  Server sets cookie "token" = null
  with expires = now (instant expiry)
       │
       ▼
  Browser receives Set-Cookie header
       │
       ▼
  Browser deletes the expired cookie
       │
       ▼
  Future requests have no token
       │
       ▼
  Auth middleware → "Token not found" → 401
```

### Logout vs Token Revocation

| | Cookie Clearing (DevTinder) | Token Blacklisting |
|--|---------------------------|-------------------|
| **How** | Set cookie to null + expire | Store token in a blacklist DB |
| **Server state** | Stateless — nothing stored | Stateful — must check blacklist |
| **Complexity** | Simple | Complex |
| **Limitation** | Token is still valid if attacker has a copy | Token is truly invalidated |
| **Good for** | Most apps | High-security apps |

> 💡 Cookie clearing is sufficient for most applications. Token blacklisting adds complexity but is needed when you must instantly revoke access (e.g., admin banning a user).

---

<a id="topic-4"></a>

## 4. [Profile/Edit API — Secure Profile Updates](#key-topics)

The profile edit API must validate which fields can be updated and apply changes securely.

### Implementation

```js
// routes/profile.js
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    // Step 1: Validate allowed fields
    if (!validateEditFields(req)) {
      throw new Error("Invalid Edit request");
    }

    // Step 2: Apply updates to the logged-in user document
    const loggedInUser = req.user;
    Object.keys(req.body).forEach(key => (loggedInUser[key] = req.body[key]));

    // Step 3: Save — triggers schema validation
    await loggedInUser.save();

    res.json({
      message: `${loggedInUser.firstName}, your profile updated successfully`,
      data: loggedInUser
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});
```

### How It Works — Step by Step

```
PATCH /profile/edit  { firstName: "Harsh", about: "Developer" }
       │
       ▼
  userAuth middleware → req.user = logged-in user document
       │
       ▼
  validateEditFields(req)
  ┌──────────────────────────────────────────┐
  │  ALLOWED = ["firstName", "lastName",     │
  │             "about", "photoURL",         │
  │             "gender", "skills", "age"]   │
  │                                          │
  │  Object.keys(req.body).every(            │
  │    k => ALLOWED.includes(k)              │
  │  )                                       │
  └──────────────────────────────────────────┘
       │
  Invalid? → 400 "Invalid Edit request"
       │
      Valid
       │
       ▼
  Object.keys(req.body).forEach(
    key => loggedInUser[key] = req.body[key]
  )
       │
       ▼
  loggedInUser.save()
  → Schema validation runs (min, max, validate, etc.)
       │
       ▼
  Response: { message, data: updatedUser }
```

### Why `loggedInUser.save()` Instead of `findByIdAndUpdate()`?

| | `req.user.save()` | `findByIdAndUpdate()` |
|--|------------------|---------------------|
| **Schema validation** | ✅ Runs by default | ❌ Skips by default |
| **Pre/Post hooks** | ✅ Triggers middleware | ❌ Skips middleware |
| **Extra DB query** | ❌ Uses existing doc | ✅ Needs another query |
| **Pattern** | Modify doc → save | Pass update object |

> 💡 Using `req.user` (already fetched by auth middleware) + `.save()` is more efficient — no extra DB query, and schema validation + hooks run automatically.

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "Express Router creates a new Express app" | ✅ `express.Router()` creates a **mini route handler** — it's a middleware itself. It doesn't have its own `listen()` or server. It's mounted onto the main app |
| ❌ "All routes must be in app.js" | ✅ Express Router lets you split routes into **separate files** by domain (auth, profile, user). The main app just mounts them with `app.use()` |
| ❌ "Logout invalidates the JWT on the server" | ✅ JWTs are **stateless** — there's no server-side session to invalidate. Logout just clears the cookie so the browser stops sending it. The token itself remains valid until it expires |
| ❌ "`findByIdAndUpdate` is always better than `.save()`" | ✅ `.save()` runs **schema validation and hooks** by default. `findByIdAndUpdate` skips both unless you explicitly enable them. Use `.save()` when you already have the document in memory |
| ❌ "You can update any field through the edit API" | ✅ The `validateEditFields` whitelist ensures only **approved fields** can be updated. Sensitive fields like `password`, `emailId`, `_id` are explicitly blocked |
| ❌ "You need a separate DELETE endpoint for logout" | ✅ Logout is typically a **POST** request that clears the cookie. No resource is being deleted — the JWT is just being removed from the browser |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: What is Express Router and why use it?**
  - A: `express.Router()` creates a modular, mountable route handler. It lets you split routes into separate files by domain (auth, profile, user), keeping `app.js` clean. Each router file defines its routes and exports the router, which the main app mounts with `app.use()`. This improves modularity, scalability, and code organization.

- **Q2: How do you structure a Node.js Express project with routers?**
  - A: Create a `routes/` folder with separate files per domain: `auth.js` (signup/login/logout), `profile.js` (view/edit), `request.js` (connections), `user.js` (feed/connections). Each file uses `express.Router()`, defines its routes, and exports the router. In `app.js`, import and mount them with `app.use("/", router)`. Also separate middleware (`middleware/auth.js`) and utilities (`utils/validation.js`).

- **Q3: How does the logout API work with JWT?**
  - A: Since JWTs are stateless (no server-side session), logout works by **clearing the cookie** — setting it to `null` with an immediate expiry: `res.cookie("token", null, { expires: new Date(Date.now()) })`. The browser deletes the expired cookie, so subsequent requests have no token and the auth middleware rejects them.

- **Q4: Why is the token still technically valid after logout?**
  - A: JWTs are self-contained and verified by signature — the server doesn't track which tokens exist. Clearing the cookie removes it from the browser, but if an attacker copied the token before logout, it remains valid until `expiresIn`. For true revocation, you need a token blacklist (adds server state).

- **Q5: Why use `req.user.save()` instead of `findByIdAndUpdate()` in the profile edit API?**
  - A: `req.user` is already fetched by the auth middleware — no extra DB query needed. `.save()` runs **schema validation and pre/post hooks** by default, while `findByIdAndUpdate()` skips both unless you pass `{ runValidators: true }`. Using `.save()` is more efficient and safer for this pattern.

- **Q6: How does `Object.keys(req.body).forEach()` update the user document?**
  - A: It iterates over every key in the request body and assigns the value to the corresponding property on the Mongoose document: `loggedInUser[key] = req.body[key]`. This is a dynamic way to apply partial updates without hardcoding each field. The `validateEditFields` check ensures only whitelisted fields are applied.

- **Q7: What are the different connection request statuses in DevTinder?**
  - A: Four statuses: **interested** (User A wants to connect), **ignored** (User A passes on User B), **accepted** (User B accepts the request → now connections), **rejected** (User B declines). The flow mirrors a Tinder-like swipe system — send interest → review → accept/reject.

- **Q8: How do you apply middleware to all routes in a router?**
  - A: Two approaches: (1) Add middleware to each route individually: `router.get("/profile", userAuth, handler)`. (2) Apply to all routes in the router: `router.use(userAuth)` at the top of the file — all routes defined after this line will require authentication.

    </div>
  </details>
  </div>

### Key Takeaways

- Use **Express Router** (`express.Router()`) to split routes into separate files by domain — auth, profile, request, user
- Mount routers in `app.js` with `app.use("/", router)` — keeps the entry point clean
- **Logout** = clear the JWT cookie with `res.cookie("token", null, { expires: now })` — the token itself stays valid until expiry
- **Profile Edit** uses `validateEditFields` whitelist + `Object.keys().forEach()` to apply updates dynamically
- Prefer `req.user.save()` over `findByIdAndUpdate()` when the document is already in memory — runs validation + hooks automatically
- Connection requests follow a 4-status flow: `interested` → `ignored` | `accepted` | `rejected`
- Organize your project: `routes/`, `middleware/`, `models/`, `utils/` — each folder has a clear responsibility

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-8) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 23: Authentication, JWT and Cookies](../S2%2023%20-%20Authentication%2C%20JWT%20and%20Cookies/Readme.md) |                                             | [Chapter 25: Logical DB Query and Compound Indexes](../S2%2025%20-%20Logical%20DB%20Query%20and%20Compound%20Indexes/Readme.md) |

</div>
