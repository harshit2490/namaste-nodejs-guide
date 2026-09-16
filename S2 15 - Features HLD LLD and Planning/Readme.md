<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-4) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 14: Microservices vs Monolith - How to build a Project](../S2%2014%20-%20Microservices%20vs%20Monolith%20-%20How%20to%20build%20a%20Project/Readme.md) |                                             | [Chapter 16: Creating Our Express Server](../S2%2016%20-%20Creating%20Our%20Express%20Server/Readme.md) |

</div>

---

# Chapter 15 — Features, HLD, LLD and Planning &nbsp;

> **Season 2** | Part IV - Project Setup & Architecture
> [🎬 Link](https://namastedev.com/learn/namaste-node/features-hld-lld-planning)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [The Development Workflow — How Companies Build Products](#topic-1)
> 2. [Requirements Gathering — DevTinder Features](#topic-2)
> 3. [High-Level Design (HLD)](#topic-3)
> 4. [Low-Level Design (LLD) — Database Schema](#topic-4)
> 5. [REST API Fundamentals](#topic-5)
> 6. [API Design for DevTinder](#topic-6)
> 7. [PUT vs PATCH — The Key Difference](#topic-7)

---

<a id="topic-1"></a>

## 1. [The Development Workflow — How Companies Build Products](#key-topics)

Before writing a single line of code, professional teams follow a **structured development cycle**. This chapter walks through the entire process using the **DevTinder** project as a real example.

```
The Development Lifecycle:
────────────────────────────────────────────────

  Phase 1                Phase 2              Phase 3              Phase 4
  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
  │ Requirements │ ──▶ │  High-Level   │ ──▶ │  Low-Level   │ ──▶ │   Implement   │
  │  Gathering   │      │  Design(HLD) │      │  Design(LLD) │      │   & Code     │
  │              │      │              │      │              │      │              │
  │ WHAT to      │      │ HOW it       │      │ The DETAILS  │      │ Write the    │
  │ build?       │      │ looks at     │      │ — schemas,   │      │ actual code  │
  │              │      │ 10,000 feet? │      │ APIs, models │      │              │
  └──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘

       │                      │                    │                      │
       ▼                      ▼                    ▼                      ▼
  List features          Pick tech stack      Design database        Build APIs,
  Define scope           Choose architecture  Define API contracts   frontend, tests
  User stories           Plan components      Schema + fields        Deploy & iterate
```

| Phase | Who's Involved | Output |
| ----- | -------------- | ------ |
| **Requirements Gathering** | Product Manager, Business team | Feature list, user stories, scope |
| **High-Level Design (HLD)** | Tech Lead, Architect | Architecture diagram, tech stack, component overview |
| **Low-Level Design (LLD)** | SDE1, SDE2, Backend/Frontend teams | Database schemas, API contracts, class diagrams |
| **Implementation** | Full development team | Working code, tests, deployed application |

> 💡 **"Proper planning makes coding easier."** In companies, developers rarely start coding right away. The process is: understand the product → design the system → plan the details → then code. Skipping planning leads to rewrites, bugs, and wasted time.

---

<a id="topic-2"></a>

## 2. [Requirements Gathering — DevTinder Features](#key-topics)

**DevTinder** is a platform similar to Tinder, but designed specifically for **developers** to connect and collaborate. Before designing anything, we first list out **every feature** the app needs.

### Feature Breakdown

```
DevTinder — Feature Map:
────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────┐
  │                    DevTinder App                     │
  ├──────────────────┬──────────────────┬────────────────┤
  │  User Account    │  Explore & Feed  │  Connections   │
  │  Management      │                  │  Management    │
  ├──────────────────┼──────────────────┼────────────────┤
  │ • Create Account │ • Feed page with │ • View matches │
  │ • Signup/Login   │   developer      │   (mutual      │
  │ • Update profile │   profiles       │   connections) │
  │ • View profile   │ • Swipe/Browse   │ • Sent requests│
  │ • Delete profile │ • Send connection│ • Received     │
  │                  │   requests       │   requests     │
  │                  │ • Ignore/        │ • Accept/Reject│
  │                  │   Interested     │   requests     │
  └──────────────────┴──────────────────┴────────────────┘
```

### Feature List

| Module | Feature | Description |
| ------ | ------- | ----------- |
| **User Account** | Create Account | Register with email, name, and password |
| **User Account** | Login | Authenticate with credentials |
| **User Account** | View Profile | See your own profile details |
| **User Account** | Update Profile | Edit name, bio, skills, photo, etc. |
| **User Account** | Delete Profile | Remove account permanently |
| **Explore** | Feed Page | Browse developer profiles one by one |
| **Explore** | Send Connection Request | Express "Interested" or "Ignore" on a profile |
| **Connections** | View Matches | See mutual connections (both sides accepted) |
| **Connections** | Sent Requests | Track outgoing requests and their status |
| **Connections** | Received Requests | See incoming requests to accept/reject |

```
User Flow — How DevTinder Works:
────────────────────────────────────────────────

  User A (Rohit)                          User B (Virat)
  ┌──────────────┐                        ┌──────────────┐
  │  1. Signup   │                        │  1. Signup   │
  │  2. Login    │                        │  2. Login    │
  │  3. Browse   │                        │  3. Browse   │
  │     Feed     │                        │     Feed     │
  └──────┬───────┘                        └──────┬───────┘
         │                                       │
         │  Sees Virat's profile                 │
         │  Clicks "Interested" ──────────▶      │
         │                                       │
         │                  Sees Rohit's request │
         │      ◀───────────── Clicks "Accept"  │
         │                                       │
         ▼                                       ▼
  ┌──────────────┐                        ┌──────────────┐
  │  🎉 MATCH!   │                       │  🎉 MATCH!   │
  │  Both appear │                        │  Both appear │
  │  in each     │                        │  in each     │
  │  other's     │                        │  other's     │
  │  connections │                        │  connections │
  └──────────────┘                        └──────────────┘
```

> 💡 This is exactly how product teams work — before any code, you document **what** the product does. This becomes the foundation for all design and development decisions that follow.

---

<a id="topic-3"></a>

## 3. [High-Level Design (HLD)](#key-topics)

HLD answers the question: **"How does the system look at 10,000 feet?"** It defines the architecture, tech stack, and how components interact — without diving into implementation details.

### DevTinder Architecture

```
DevTinder — High-Level Architecture:
────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────┐
  │                         CLIENT                              │
  │                                                             │
  │  ┌───────────────────────────────────────────────────────┐  │
  │  │              React.js Frontend                        │  │
  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
  │  │  │  Login   │ │  Feed    │ │  Profile │ │  Matches │  │  │
  │  │  │  Page    │ │  Page    │ │  Page    │ │  Page    │  │  │
  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
  │  └───────────────────────┬───────────────────────────────┘  │
  └──────────────────────────┼──────────────────────────────────┘
                             │
                             │ HTTP Requests (REST APIs)
                             │
  ┌──────────────────────────┼──────────────────────────────────┐
  │                   SERVER │                                  │
  │                          ▼                                  │
  │  ┌───────────────────────────────────────────────────────┐  │
  │  │              Node.js Backend                          │  │
  │  │                                                       │  │
  │  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │  │
  │  │  │  Auth      │ │  Profile   │ │  Connection        │ │  │
  │  │  │  Routes    │ │  Routes    │ │  Routes            │ │  │
  │  │  └────────────┘ └────────────┘ └────────────────────┘ │  │
  │  └───────────────────────┬───────────────────────────────┘  │
  │                          │                                  │
  │                          │ Database Queries                 │
  │                          ▼                                  │
  │  ┌───────────────────────────────────────────────────────┐  │
  │  │              MongoDB (Database)                       │  │
  │  │  ┌────────────────┐ ┌─────────────────────────┐       │  │
  │  │  │ User           │ │ ConnectionRequest       │       │  │
  │  │  │ Collection     │ │ Collection              │       │  │
  │  │  └────────────────┘ └─────────────────────────┘       │  │
  │  └───────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────┘
```

### Tech Stack Decision

| Layer | Technology | Why This Choice |
| ----- | ---------- | --------------- |
| **Frontend** | React.js | Component-based, huge ecosystem, industry standard for SPAs |
| **Backend** | Node.js + Express | JavaScript everywhere, non-blocking I/O, great for real-time apps |
| **Database** | MongoDB | Flexible schema for user profiles, easy horizontal scaling, MERN stack synergy |
| **Architecture** | Monolith (for now) | Simpler for learning; can migrate to microservices later if needed |

### What HLD Covers vs Doesn't Cover

| HLD Covers ✅ | HLD Does NOT Cover ❌ |
| -------------- | ---------------------- |
| Overall architecture diagram | Individual function implementations |
| Tech stack decisions | Line-by-line code logic |
| Component responsibilities | Database field types & validation rules |
| Communication patterns (REST, WebSocket) | Error handling strategies |
| Team structure & roles | Variable naming conventions |

> 💡 HLD is what you present in a **system design interview** or a **tech lead meeting**. It gives everyone the big picture without getting lost in details. The details come in LLD.

---

<a id="topic-4"></a>

## 4. [Low-Level Design (LLD) — Database Schema](#key-topics)

LLD answers: **"What are the exact details?"** — database schemas, API contracts, field types, validation rules, and data relationships.

### DevTinder Database Schema

```
Database: DevTinder — Collection Design:
────────────────────────────────────────────────

  Collection: "User"
  ┌───────────────────────────────────────────────────┐
  │                                                   │
  │  {                                                │
  │    "_id": ObjectId("..."),         // auto-gen    │
  │    "firstname": "Rohit",           // String      │
  │    "lastname": "Sharma",           // String      │
  │    "email": "rohit@mail.com",      // String      │
  │    "password": "$2b$10$hashed..",  // String      │
  │    "age": 36,                      // Number      │
  │    "gender": "male",               // String      │
  │    "skills": ["batting", "captaincy"],  // Array  │
  │    "bio": "Opening batsman",       // String      │
  │    "photoUrl": "https://..."       // String      │
  │  }                                                │
  │                                                   │
  └───────────────────────────────────────────────────┘

  Collection: "ConnectionRequest"
  ┌───────────────────────────────────────────────────┐
  │                                                   │
  │  {                                                │
  │    "_id": ObjectId("..."),         // auto-gen    │
  │    "fromUserId": ObjectId("..."),  // ref → User  │
  │    "toUserId": ObjectId("..."),    // ref → User  │
  │    "status": "interested"          // enum        │
  │  }                                                │
  │                                                   │
  │  Status values:                                   │
  │    • "ignored"    → User A skipped User B         │
  │    • "interested" → User A liked User B           │
  │    • "accepted"   → User B accepted the request   │
  │    • "rejected"   → User B declined the request   │
  │                                                   │
  └───────────────────────────────────────────────────┘
```

### Schema Details

#### User Collection

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `_id` | ObjectId | Auto | Auto-generated unique identifier |
| `firstname` | String | Yes | User's first name |
| `lastname` | String | Yes | User's last name |
| `email` | String | Yes (Unique) | Login email — must be unique |
| `password` | String | Yes | Hashed password (never store plain text!) |
| `age` | Number | No | User's age |
| `gender` | String | No | "male", "female", or "other" |
| `skills` | Array | No | List of skills (e.g., ["React", "Node.js"]) |
| `bio` | String | No | Short description about the user |
| `photoUrl` | String | No | Profile picture URL |

#### ConnectionRequest Collection

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `_id` | ObjectId | Auto | Auto-generated unique identifier |
| `fromUserId` | ObjectId | Yes | Reference to the User who **sent** the request |
| `toUserId` | ObjectId | Yes | Reference to the User who **receives** the request |
| `status` | String (enum) | Yes | One of: `"ignored"`, `"interested"`, `"accepted"`, `"rejected"` |

### How Connection Requests Flow

```
Connection Request State Machine:
────────────────────────────────────────────────

  User A browses User B's profile
           │
      ┌────┴────┐
      │ Action? │
      └────┬────┘
           │
    ┌──────┴──────┐
    ▼              ▼
  "Ignore"      "Interested"
    │              │
    ▼              ▼
  ┌──────────┐  ┌──────────────┐
  │ status:  │  │ status:      │
  │"ignored" │  │"interested"  │──── Notification to User B
  └──────────┘  └──────┬───────┘
                       │
                  User B sees request
                       │
                ┌──────┴──────┐
                ▼              ▼
            "Accept"        "Reject"
                │              │
                ▼              ▼
          ┌──────────┐  ┌──────────┐
          │ status:  │  │ status:  │
          │"accepted"│  │"rejected"│
          └────┬─────┘  └──────────┘
               │
               ▼
          🎉 MATCH!
          Both appear in
          each other's
          connections list
```

> 💡 The `ConnectionRequest` collection tracks **who** sent a request to **whom** and the current **status**. This is the core data model that powers the feed, matching, and connections features. Notice that a single connection between two users results in only **one document** — not two.

---

<a id="topic-5"></a>

## 5. [REST API Fundamentals](#key-topics)

**REST (Representational State Transfer)** is an architectural style for designing APIs. It uses standard **HTTP methods** and **stateless communication** to interact with resources on a server.

### HTTP Methods

```
HTTP Methods — CRUD Mapping:
────────────────────────────────────────────────

  ┌──────────┐     ┌────────────────────────────┐
  │   GET    │───▶│  RETRIEVE data              │  Read
  └──────────┘     │  GET /users → all users     │
                   └────────────────────────────┘

  ┌──────────┐     ┌────────────────────────────┐
  │   POST   │───▶│  CREATE new data            │  Create
  └──────────┘     │  POST /signup → new user    │
                   └────────────────────────────┘

  ┌──────────┐     ┌────────────────────────────┐
  │   PUT    │───▶│  REPLACE entire resource    │  Full Update
  └──────────┘     │  PUT /user/1 → replace all  │
                   └────────────────────────────┘

  ┌──────────┐     ┌────────────────────────────┐
  │  PATCH   │───▶│  PARTIAL update             │  Partial Update
  └──────────┘     │  PATCH /user/1 → update    │
                   │  only specified fields     │
                   └────────────────────────────┘

  ┌──────────┐     ┌────────────────────────────┐
  │  DELETE  │───▶│  REMOVE data                │  Delete
  └──────────┘     │  DELETE /user/1 → remove   │
                   └────────────────────────────┘
```

| Method | Purpose | Idempotent? | Request Body? |
| ------ | ------- | ----------- | ------------- |
| **GET** | Retrieve/Read a resource | ✅ Yes | ❌ No |
| **POST** | Create a new resource | ❌ No | ✅ Yes |
| **PUT** | Replace an entire resource | ✅ Yes | ✅ Yes |
| **PATCH** | Partially update a resource | ❌ No | ✅ Yes |
| **DELETE** | Remove a resource | ✅ Yes | ❌ Usually no |

### REST Principles

```
REST Communication — Stateless:
────────────────────────────────────────────────

  Client                                Server
  ┌──────────┐                          ┌───────────┐
  │          │ ── GET /profile ──────▶ │            │
  │          │   (+ Auth Token)         │           │
  │          │                          │ Processes │
  │          │ ◀── 200 OK + JSON ────  │ request    │
  │          │                          │           │
  │          │ ── PATCH /profile ───▶  │            │
  │          │   (+ Auth Token)         │ Processes │
  │          │   (+ Updated data)       │ request   │
  │          │                          │           │
  │          │ ◀── 200 OK + JSON ────  │            │
  └──────────┘                          └───────────┘

  STATELESS = The server does NOT remember
  previous requests. Each request must contain
  ALL information needed (auth token, data, etc.)
```

| Principle | Description |
| --------- | ----------- |
| **Stateless** | Each request contains all info needed — server doesn't store session state between requests |
| **Client-Server** | Frontend (client) and backend (server) are separate and communicate over HTTP |
| **Uniform Interface** | Use standard HTTP methods and consistent URL patterns |
| **Resource-Based** | Every URL represents a resource (e.g., `/users`, `/profile`, `/connections`) |

### Status Codes

| Code Range | Category | Common Codes |
| ---------- | -------- | ------------ |
| **2xx** | Success | `200 OK`, `201 Created`, `204 No Content` |
| **3xx** | Redirect | `301 Moved Permanently`, `304 Not Modified` |
| **4xx** | Client Error | `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |
| **5xx** | Server Error | `500 Internal Server Error`, `503 Service Unavailable` |

> 💡 **Stateless** means the server treats every request as completely independent. If User A sends a `GET /profile` request, the server doesn't "remember" that User A just logged in — the auth token in the request header proves identity every time. This is why REST APIs scale well — any server in a cluster can handle any request.

---

<a id="topic-6"></a>

## 6. [API Design for DevTinder](#key-topics)

Based on the features and database schema, here are all the REST APIs needed for DevTinder:

### User Management APIs

```
User Management API Flow:
────────────────────────────────────────────────

  New User                Existing User
     │                        │
     ▼                        ▼
  POST /signup            POST /login
  (Create account)        (Get auth token)
     │                        │
     └────────┬───────────────┘
              │
              ▼ (Authenticated)
     ┌────────┴────────┐
     │  User Profile   │
     ├─────────────────┤
     │ GET /profile    │ → View profile
     │ PATCH /profile  │ → Update profile
     │ DELETE /profile │ → Delete account
     └─────────────────┘
```

| Method | Endpoint | Description | Auth Required? |
| ------ | -------- | ----------- | -------------- |
| `POST` | `/signup` | Register a new user (name, email, password) | ❌ No |
| `POST` | `/login` | Authenticate user, return JWT token | ❌ No |
| `GET` | `/profile` | Retrieve the logged-in user's profile | ✅ Yes |
| `PATCH` | `/profile` | Update specific profile fields (bio, skills, etc.) | ✅ Yes |
| `DELETE` | `/profile` | Permanently delete user account | ✅ Yes |

### Connection Management APIs

```
Connection API Flow:
────────────────────────────────────────────────

  User A browsing feed
       │
       ▼
  POST /sendRequest
  { toUserId, status: "interested" | "ignored" }
       │
       │  If "interested" → creates ConnectionRequest doc
       │  If "ignored" → creates ConnectionRequest with ignored status
       ▼
  User B receives notification
       │
       ▼
  POST /reviewRequest
  { requestId, status: "accepted" | "rejected" }
       │
       │  If "accepted" → MATCH! Both in connections
       │  If "rejected" → Request declined
       ▼
  GET /connections  → List all matches (accepted requests)
  GET /request      → List pending requests (sent/received)
```

| Method | Endpoint | Description | Auth Required? |
| ------ | -------- | ----------- | -------------- |
| `POST` | `/sendRequest` | Send a connection request (status: "interested" / "ignored") | ✅ Yes |
| `POST` | `/reviewRequest` | Accept or reject an incoming request | ✅ Yes |
| `GET` | `/request` | Get list of pending requests (sent and received) | ✅ Yes |
| `GET` | `/connections` | Get list of established connections (matches) | ✅ Yes |

### Complete API Map

```
DevTinder — Full API Map:
────────────────────────────────────────────────

  Auth (No Login Required)
  ┌─────────────────────────────────────────┐
  │  POST /signup    → Create new account   │
  │  POST /login     → Get auth token       │
  └─────────────────────────────────────────┘

  Profile (Login Required)
  ┌─────────────────────────────────────────┐
  │  GET    /profile  → View my profile     │
  │  PATCH  /profile  → Update my profile   │
  │  DELETE /profile  → Delete my account   │
  └─────────────────────────────────────────┘

  Connections (Login Required)
  ┌─────────────────────────────────────────┐
  │  POST /sendRequest   → Like or Ignore   │
  │  POST /reviewRequest → Accept or Reject │
  │  GET  /request       → My requests      │
  │  GET  /connections   → My matches       │
  └─────────────────────────────────────────┘

  Feed (Login Required)
  ┌─────────────────────────────────────────┐
  │  GET /feed  → Browse developer profiles │
  └─────────────────────────────────────────┘
```

> 💡 Notice that `/signup` and `/login` don't require authentication (you can't log in to create an account!), but all other endpoints require a valid **JWT token** in the request header. This is the security boundary — unauthorized users can only sign up or log in.

---

<a id="topic-7"></a>

## 7. [PUT vs PATCH — The Key Difference](#key-topics)

This is a commonly confused topic and a frequent interview question. Both update data, but in fundamentally different ways.

```
PUT vs PATCH — Visual Comparison:
────────────────────────────────────────────────

  Original Document:
  ┌──────────────────────────────────────────┐
  │ { "name": "Rohit",                       │
  │   "email": "rohit@mail.com",             │
  │   "age": 36,                             │
  │   "city": "Mumbai" }                     │
  └──────────────────────────────────────────┘

  PUT /profile  { "name": "Hitman", "email": "rohit@mail.com" }
  ─────────────────────────────────────────────
  Result:
  ┌──────────────────────────────────────────┐
  │ { "name": "Hitman",                      │
  │   "email": "rohit@mail.com" }            │
  │                                          │
  │   ⚠️ age and city are GONE!              │
  │   PUT REPLACED the entire resource       │
  └──────────────────────────────────────────┘

  PATCH /profile  { "name": "Hitman" }
  ─────────────────────────────────────────────
  Result:
  ┌──────────────────────────────────────────┐
  │ { "name": "Hitman",                      │
  │   "email": "rohit@mail.com",             │
  │   "age": 36,                             │
  │   "city": "Mumbai" }                     │
  │                                          │
  │   ✅ Only "name" changed!                │
  │   PATCH updated only the specified field │
  └──────────────────────────────────────────┘
```

| Aspect | PUT | PATCH |
| ------ | --- | ----- |
| **What it does** | **Replaces** the entire resource with new data | **Updates** only the specified fields |
| **Missing fields** | Fields not included are **removed/reset** | Fields not included are **left unchanged** |
| **Use case** | When you want to overwrite everything | When you want to update 1-2 fields |
| **Idempotent?** | ✅ Yes — same PUT always gives same result | ❌ No — depends on current state |
| **Request body** | Must contain **all** fields | Contains **only** the fields to change |
| **DevTinder example** | Replace entire profile | Update just the bio or skills |

> 💡 In DevTinder, we use **PATCH** for profile updates because users typically change one field at a time (like updating their bio or adding a skill). Using PUT would require sending the **entire profile** every time — wasteful and error-prone. **PATCH is the standard for partial updates in modern APIs.**

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "HLD and LLD are only for system design interviews" | ✅ HLD and LLD are done in **every company** before building a product. They prevent wasted effort, align the team, and serve as documentation. Interviews test whether you can do what you'll actually do on the job |
| ❌ "You should start coding immediately to move fast" | ✅ Skipping planning leads to **rewrites and technical debt**. Professional teams spend 30–40% of project time on planning. "Weeks of coding can save hours of planning" (ironic but true) |
| ❌ "PUT and PATCH do the same thing" | ✅ **PUT replaces** the entire resource (missing fields are removed). **PATCH updates** only the specified fields (others stay unchanged). For partial updates like editing a profile field, always use PATCH |
| ❌ "REST APIs are stateful — the server remembers you" | ✅ REST is **stateless by design**. Each request must include all information needed (like the auth token). The server doesn't remember previous requests — this is what makes REST APIs scalable |
| ❌ "You need a separate table/collection for matches" | ✅ In DevTinder, a "match" is simply a `ConnectionRequest` with `status: "accepted"`. No separate collection needed — just query `ConnectionRequest` where status is `"accepted"` and the user is either `fromUserId` or `toUserId` |
| ❌ "GET requests can have a request body" | ✅ While HTTP technically allows it, **GET requests should NOT have a body** in practice. Use query parameters (`?key=value`) or URL parameters (`/users/:id`) instead. Most frameworks and proxies ignore or reject GET bodies |
| ❌ "Every feature needs its own API endpoint" | ✅ REST APIs are **resource-based**, not feature-based. Multiple features can share the same endpoint with different HTTP methods (e.g., `GET /profile` reads, `PATCH /profile` updates, `DELETE /profile` removes) |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: What is the difference between HLD and LLD?**
  - A: **HLD (High-Level Design)** defines the system at a macro level — architecture, tech stack, component interactions, and data flow between services. **LLD (Low-Level Design)** defines the details — database schemas, API contracts, class/function designs, validation rules, and error handling. HLD is for architects and tech leads; LLD is for the developers who implement it.

- **Q2: What are REST APIs? What makes an API "RESTful"?**
  - A: **REST (Representational State Transfer)** is an architectural style for designing web APIs. A RESTful API follows these principles: (1) **Stateless** — each request contains all needed info, (2) **Client-Server** separation, (3) **Uniform Interface** — standard HTTP methods (GET, POST, PUT, PATCH, DELETE), (4) **Resource-Based** — URLs represent resources (`/users`, `/profile`), (5) Responses use standard status codes and typically return JSON.

- **Q3: What is the difference between PUT and PATCH?**
  - A: **PUT** replaces the **entire resource** — if you omit a field, it's removed. **PATCH** updates **only the specified fields** — omitted fields remain unchanged. For example, if a user profile has `{name, email, age}` and you send `PUT {name: "New"}`, the result is `{name: "New"}` (email and age are gone). With `PATCH {name: "New"}`, the result is `{name: "New", email: "old@mail.com", age: 25}`. Use PATCH for partial updates.

- **Q4: What does "stateless" mean in REST APIs?**
  - A: **Stateless** means the server doesn't store any information about previous requests. Each request must carry all the data the server needs to process it — including authentication (e.g., JWT token in the header). This makes REST APIs highly scalable because any server in a cluster can handle any request without needing to know the client's history.

- **Q5: How would you design the database schema for a matching/connection feature?**
  - A: Create a `ConnectionRequest` collection with: `fromUserId` (who sent it), `toUserId` (who receives it), and `status` (enum: "ignored", "interested", "accepted", "rejected"). A "match" is a document where status is "accepted". To find all matches for a user, query where (`fromUserId = userId` AND `status = "accepted"`) OR (`toUserId = userId` AND `status = "accepted"`). This avoids duplicate entries — one document per connection, not two.

- **Q6: Why is requirements gathering important before coding?**
  - A: Requirements gathering defines **what to build** before deciding **how to build it**. Without clear requirements: (1) developers build the wrong features, (2) scope creep causes delays, (3) ambiguous requirements lead to bugs and rewrites, (4) team members work on conflicting implementations. A clear feature list, HLD, and LLD save weeks of development time by preventing misunderstandings.

- **Q7: What HTTP status codes should you use in a REST API?**
  - A: Common status codes: **200 OK** (success), **201 Created** (new resource created), **204 No Content** (success but no body), **400 Bad Request** (invalid input), **401 Unauthorized** (no/invalid auth), **403 Forbidden** (authenticated but not allowed), **404 Not Found** (resource doesn't exist), **500 Internal Server Error** (server-side bug). Always return meaningful status codes — don't use 200 for errors.

- **Q8: What is the MERN stack and why was it chosen for DevTinder?**
  - A: **MERN** stands for **MongoDB** (database), **Express** (backend framework), **React** (frontend library), and **Node.js** (runtime). It was chosen because: (1) **JavaScript everywhere** — same language on frontend and backend, (2) MongoDB's flexible schema suits evolving user profiles, (3) React's component model fits the card-swipe UI, (4) Node.js handles concurrent connections well for real-time features. It's the most popular full-stack JavaScript stack.

- **Q9: Explain idempotency in REST APIs. Which methods are idempotent?**
  - A: An **idempotent** operation produces the same result regardless of how many times it's called. **GET** is idempotent (fetching the same resource multiple times gives the same result). **PUT** is idempotent (replacing a resource with the same data gives the same result). **DELETE** is idempotent (deleting the same resource twice — first deletes it, second returns 404, but the end state is the same). **POST** is NOT idempotent (sending the same POST twice creates two resources). **PATCH** is generally NOT idempotent (depends on the operation).

- **Q10: Why use a single `ConnectionRequest` document instead of two (one per user)?**
  - A: Using a single document with `fromUserId` and `toUserId` prevents duplicate and conflicting data. If we stored two documents (one for each direction), we'd need to keep them in sync — if one says "accepted" and the other says "pending", the data is inconsistent. A single document is the **single source of truth**. To check if a connection exists between User A and User B, query: `(fromUserId = A AND toUserId = B) OR (fromUserId = B AND toUserId = A)`.

    </div>
  </details>
  </div>

### Key Takeaways

- Professional development follows: **Requirements → HLD → LLD → Implementation** — never skip planning
- **Requirements Gathering** defines WHAT to build — feature lists, user stories, scope
- **HLD (High-Level Design)** defines HOW the system looks at 10,000 feet — architecture, tech stack, component diagram
- **LLD (Low-Level Design)** defines the DETAILS — database schemas, API contracts, field validations
- **DevTinder** uses the **MERN stack** (MongoDB, Express, React, Node.js) with two main collections: `User` and `ConnectionRequest`
- **REST APIs** use standard HTTP methods: GET (read), POST (create), PUT (full replace), PATCH (partial update), DELETE (remove)
- **Stateless** means each request carries all needed information — the server doesn't remember previous requests
- **PUT replaces** the entire resource; **PATCH updates** only specified fields — use PATCH for profile updates
- Connection requests use a **status enum** (`ignored`, `interested`, `accepted`, `rejected`) — a "match" is just `status: "accepted"`
- A single `ConnectionRequest` document per pair of users is the single source of truth — never store duplicates

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-4) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 14: Microservices vs Monolith - How to build a Project](../S2%2014%20-%20Microservices%20vs%20Monolith%20-%20How%20to%20build%20a%20Project/Readme.md) |                                             | [Chapter 16: Creating Our Express Server](../S2%2016%20-%20Creating%20Our%20Express%20Server/Readme.md) |

</div>
