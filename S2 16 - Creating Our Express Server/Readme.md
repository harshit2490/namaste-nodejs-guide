<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-5) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 15: Features HLD LLD and Planning](../S2%2015%20-%20Features%20HLD%20LLD%20and%20Planning/Readme.md) |                                             | [Chapter 17: Routing and Request Handlers](../S2%2017%20-%20Routing%20and%20Request%20Handlers/Readme.md) |

</div>

---

# Chapter 16 — Creating Our Express Server &nbsp;

> **Season 2** | Part V - Express & Middleware
> [🎬 Link](https://namastedev.com/learn/namaste-node/creating-our-express-server)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [What is Express.js?](#topic-1)
> 2. [Project Setup — `npm init` & Installing Express](#topic-2)
> 3. [Key Files & Folders in a Node.js Project](#topic-3)
> 4. [Creating a Basic Express Server](#topic-4)
> 5. [Local vs Global npm Install (`-g`)](#topic-5)
> 6. [Express vs Node.js `http` Module](#topic-6)

---

<a id="topic-1"></a>

## 1. [What is Express.js?](#key-topics)

**Express.js** is a minimal, flexible, and robust web application framework for Node.js. It simplifies server-side development by providing clean abstractions over Node.js's built-in `http` module.

```
Where Express Fits:
────────────────────────────────────────────────

  ┌──────────────────────────────────┐
  │         Your Application         │
  │    (Routes, Business Logic)      │
  └──────────────┬───────────────────┘
                 │
  ┌──────────────▼───────────────────┐
  │         Express.js               │
  │   (Framework / Abstraction)      │
  │   • Routing (app.get, app.post)  │
  │   • Middleware pipeline          │
  │   • Request/Response helpers     │
  └──────────────┬───────────────────┘
                 │  Built on top of
  ┌──────────────▼───────────────────┐
  │      Node.js http module         │
  │   (http.createServer)            │
  └──────────────┬───────────────────┘
                 │
  ┌──────────────▼───────────────────┐
  │        Node.js Runtime           │
  │     (V8 + libuv + C++ bindings)  │
  └──────────────────────────────────┘
```

| Feature | Description |
| ------- | ----------- |
| **Minimal** | Doesn't force opinions — you choose your own structure, database, templating engine |
| **Flexible** | Works with any database (MongoDB, PostgreSQL, Redis, etc.) |
| **Robust** | Thousands of middleware packages available for common tasks |
| **Fast** | Thin layer on top of Node.js — minimal overhead |

> 💡 Express is **not** a replacement for Node.js — it's a framework **built on top of** Node.js. Under the hood, `app.listen()` still calls `http.createServer()`. Express just gives you a cleaner, more productive API. Official site: [expressjs.com](https://expressjs.com)

---

<a id="topic-2"></a>

## 2. [Project Setup — `npm init` & Installing Express](#key-topics)

### Initializing the DevTinder Backend

```bash
# Step 1: Create project directory
mkdir devtinder-backend
cd devtinder-backend

# Step 2: Initialize Node.js project (creates package.json)
npm init
# Answer the prompts (name, version, description, entry point, etc.)
# Or use npm init -y to accept all defaults

# Step 3: Install Express
npm install express
```

```
What Happens When You Run These Commands:
────────────────────────────────────────────────

  npm init
  ─────────
    → Creates package.json (project manifest)

  npm install express
  ────────────────────
    → Downloads Express + its dependencies
    → Creates node_modules/ folder
    → Creates package-lock.json
    → Adds "express" to package.json dependencies
```

> 💡 `npm install express` adds Express as a **dependency** (needed at runtime). Use `npm install <pkg> --save-dev` for packages needed only during development (like testing tools). The distinction matters when deploying — dev dependencies aren't installed in production.

---

<a id="topic-3"></a>

## 3. [Key Files & Folders in a Node.js Project](#key-topics)

After initialization and installing Express, your project structure looks like this:

```
devtinder-backend/
├── node_modules/        ← All installed packages
├── package.json         ← Project manifest
├── package-lock.json    ← Exact dependency tree
└── .gitignore           ← Files Git should ignore
```

| File/Folder | Purpose | Commit to Git? |
| ----------- | ------- | -------------- |
| **`node_modules/`** | Contains all installed npm packages and their dependencies. Can be huge (thousands of files). Recreated by `npm install` | ❌ No — add to `.gitignore` |
| **`package.json`** | Project manifest — name, version, scripts, dependencies. The "recipe" for your project | ✅ Yes |
| **`package-lock.json`** | Locks exact versions of every dependency (including sub-dependencies). Ensures consistent installs across machines | ✅ Yes |
| **`.gitignore`** | Lists files/folders Git should ignore (e.g., `node_modules`, `.env`) | ✅ Yes |

### package.json Key Fields

```json
{
  "name": "devtinder-backend",
  "version": "1.0.0",
  "description": "Backend for DevTinder",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

| Field | Description |
| ----- | ----------- |
| `dependencies` | Packages needed at **runtime** (Express, Mongoose, etc.) |
| `devDependencies` | Packages needed only for **development** (nodemon, jest, eslint) |
| `scripts` | Custom commands — `npm start` runs `node app.js`, `npm run dev` runs `nodemon app.js` |

### package.json vs package-lock.json

```
package.json:                 package-lock.json:
─────────────                 ──────────────────
"express": "^4.18.2"         "express": "4.18.2"
                              "accepts": "1.3.8"
Says: "any 4.x.x             "body-parser": "1.20.1"
 version ≥ 4.18.2"           "cookie": "0.5.0"
                              ... (exact versions of ALL
                              sub-dependencies)

package.json = WHAT you want
package-lock.json = EXACTLY what you have
```

> 💡 **Never delete `package-lock.json`** — it ensures that `npm install` installs the exact same versions on every machine. Without it, different developers might get different sub-dependency versions, leading to "works on my machine" bugs.

---

<a id="topic-4"></a>

## 4. [Creating a Basic Express Server](#key-topics)

Here's the minimal Express server for DevTinder:

```js
const express = require("express");
const app = express();
const port = 3000;

app.use("/test", (req, res) => {
  res.send("Server started");
});

app.use("/main", (req, res) => {
  res.send("Another route");
});

app.listen(port, () => {
  console.log("Server started running on port " + port);
});
```

<details>
<summary><strong>How It Works — Step by Step (Click to Expand)</strong></summary>

```
Express Server Execution Flow:
────────────────────────────────────────────────

  1. require("express")
     → Loads the Express module

  2. const app = express()
     → Creates an Express application instance
     → This is the central object — routes,
        middleware, and settings are attached to it

  3. app.use("/test", callback)
     → Registers a route handler
     → When ANY request hits "/test",
        the callback runs
     → app.use() matches ALL HTTP methods
        (GET, POST, PUT, DELETE, etc.)

  4. res.send("Server started")
     → Sends a response to the client
     → Automatically sets Content-Type header
     → Ends the response (no need for res.end())

  5. app.listen(3000, callback)
     → Starts the server on port 3000
     → Under the hood: calls http.createServer()
     → The callback runs once when server is ready
```

</details>

### Running the Server

```bash
# Start the server
node app.js
# Output: Server started running on port 3000

# Visit in browser:
# http://localhost:3000/test  → "Server started"
# http://localhost:3000/main  → "Another route"
```

### Key Methods

| Method | Description | Example |
| ------ | ----------- | ------- |
| `express()` | Creates an Express app instance | `const app = express()` |
| `app.use(path, handler)` | Registers middleware/route for **all** HTTP methods | `app.use("/test", fn)` |
| `app.get(path, handler)` | Handles only **GET** requests | `app.get("/users", fn)` |
| `app.post(path, handler)` | Handles only **POST** requests | `app.post("/signup", fn)` |
| `app.listen(port, cb)` | Starts the server on the given port | `app.listen(3000, fn)` |
| `res.send(data)` | Sends a response (auto-sets Content-Type) | `res.send("Hello")` |
| `res.json(obj)` | Sends a JSON response | `res.json({ status: "ok" })` |

> 💡 `app.use()` matches **all HTTP methods** (GET, POST, PUT, etc.). Use `app.get()`, `app.post()`, etc. when you want to handle only a specific method. In Chapter 17, we'll dive deeper into routing with specific HTTP methods.

---

<a id="topic-5"></a>

## 5. [Local vs Global npm Install (`-g`)](#key-topics)

The `-g` flag in `npm install` changes **where** the package is installed and **how** it's used.

```
Local vs Global Install:
────────────────────────────────────────────────

  npm install express              npm install -g nodemon
  (LOCAL)                          (GLOBAL)

  ┌─────────────────────┐          ┌─────────────────────┐
  │  your-project/      │          │  System-wide        │
  │  └── node_modules/  │          │  (accessible from   │
  │      └── express/   │          │   ANY directory)    │
  └─────────────────────┘          └─────────────────────┘

  ✔ Available ONLY in this project  ✔ Available as CLI tool
  ✔ Listed in package.json          ✗ NOT in package.json
  ✔ Other devs get it via           ✗ Each dev must install
    npm install                       separately
```

| Aspect | Local Install | Global Install (`-g`) |
| ------ | ------------- | --------------------- |
| **Command** | `npm install <pkg>` | `npm install -g <pkg>` |
| **Location** | `./node_modules/` in current project | System-wide directory |
| **Access** | Only in this project (via `require()`) | From any terminal/directory |
| **package.json** | ✅ Added to dependencies | ❌ Not added |
| **Use case** | Libraries your code imports (Express, Mongoose) | CLI tools (nodemon, eslint, create-react-app) |
| **Shared with team?** | ✅ Yes — via `npm install` | ❌ No — each dev installs manually |

### Common Global Packages

```bash
# nodemon — auto-restarts server on file changes
npm install -g nodemon

# Then use it instead of node:
nodemon app.js
# → Watches for file changes and restarts automatically!
```

> 💡 **nodemon** is essential for development — it watches your files and automatically restarts the server when you save changes. Without it, you'd have to manually stop and restart `node app.js` every time you edit code. Install it globally (`npm i -g nodemon`) so you can use it in any project.

---

<a id="topic-6"></a>

## 6. [Express vs Node.js `http` Module](#key-topics)

In Chapter 11, we created servers with the raw `http` module. Here's why Express is preferred:

| Feature | Raw `http` Module | Express.js |
| ------- | ------------------ | ---------- |
| **Routing** | Manual `if/else` on `req.url` | `app.get()`, `app.post()`, etc. |
| **Response** | `res.writeHead()` + `res.end()` | `res.send()`, `res.json()` |
| **Middleware** | Must build from scratch | Built-in middleware pipeline |
| **Body Parsing** | Manual stream handling | `express.json()` one-liner |
| **Static Files** | Manual file reading + serving | `express.static()` one-liner |
| **Error Handling** | Try-catch everywhere | Centralized error middleware |
| **Code Size** | Verbose — 20+ lines for basic routing | Concise — 3-4 lines per route |

```
Same Server — Two Approaches:
────────────────────────────────────────────────

  Raw http Module:                    Express.js:
  ┌──────────────────────────┐       ┌──────────────────────────┐
  │ const http = require     │       │ const express = require  │
  │   ("node:http");         │       │   ("express");           │
  │                          │       │ const app = express();   │
  │ const server = http      │       │                          │
  │   .createServer(         │       │ app.get("/test",         │
  │   (req, res) => {        │       │   (req, res) => {        │
  │   if(req.url==="/test"){ │       │   res.send("Hello!");    │
  │     res.writeHead(200);  │       │ });                      │
  │     res.end("Hello!");   │       │                          │
  │   }                      │       │ app.listen(3000);        │
  │ });                      │       └──────────────────────────┘
  │ server.listen(3000);     │
  └──────────────────────────┘        Cleaner, less code,
                                     built-in features
  Manual everything
```

> 💡 Express is a **convenience wrapper** around `http.createServer()`. When you call `app.listen(3000)`, Express internally calls `http.createServer(app).listen(3000)`. The `app` itself is just a request handler function that Express manages — same foundation, better API.

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "Express replaces Node.js" | ✅ Express is a **framework built on top of** Node.js. It uses `http.createServer()` under the hood. You need Node.js to run Express |
| ❌ "`node_modules` should be committed to Git" | ✅ **Never commit `node_modules`** — it's huge and can be recreated by running `npm install`. Add it to `.gitignore` |
| ❌ "`package-lock.json` is optional and can be deleted" | ✅ It locks exact dependency versions across all machines. **Always commit it** to Git. Deleting it means different devs might get different dependency versions |
| ❌ "`app.use()` only handles GET requests" | ✅ `app.use()` matches **ALL HTTP methods** (GET, POST, PUT, DELETE, PATCH). Use `app.get()`, `app.post()`, etc. for specific methods |
| ❌ "Global packages are better because they work everywhere" | ✅ Global install is only for **CLI tools** (nodemon, eslint). Libraries your code imports (Express, Mongoose) must be installed **locally** so they're in `package.json` and shared with the team |
| ❌ "`res.send()` and `res.end()` are the same" | ✅ `res.send()` (Express) auto-sets `Content-Type`, handles Buffer/JSON/strings, and sets `Content-Length`. `res.end()` (raw http) just sends raw data without these conveniences |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: What is Express.js and why is it used?**
  - A: Express.js is a **minimal, flexible web framework** for Node.js that simplifies server-side development. It provides routing (`app.get`, `app.post`), middleware support, request/response helpers (`res.send`, `res.json`), and a plugin ecosystem. It's used because raw `http.createServer()` is too verbose for real applications — Express abstracts away boilerplate and lets you focus on business logic.

- **Q2: What is the difference between `package.json` and `package-lock.json`?**
  - A: `package.json` is the project manifest — it lists **what** your project needs (dependencies with version ranges like `^4.18.2`). `package-lock.json` locks the **exact** versions of every dependency and sub-dependency installed. Without the lock file, `npm install` might install different patch versions on different machines, causing inconsistencies. Always commit both files.

- **Q3: What does `npm init` do?**
  - A: `npm init` creates a `package.json` file by prompting you for project details (name, version, description, entry point, author, license). Use `npm init -y` to accept all defaults without prompts. This file is required for managing dependencies and defining npm scripts.

- **Q4: What is the difference between `app.use()` and `app.get()` in Express?**
  - A: `app.use(path, handler)` matches **all HTTP methods** (GET, POST, PUT, DELETE, etc.) for the given path. `app.get(path, handler)` matches **only GET** requests. Use `app.use()` for middleware that should run on every request type, and `app.get()` / `app.post()` for specific route handlers.

- **Q5: What is the difference between local and global npm installation?**
  - A: **Local** (`npm install express`) installs in `./node_modules/`, is listed in `package.json`, and is shared with the team via `npm install`. **Global** (`npm install -g nodemon`) installs system-wide, is accessible from any directory as a CLI tool, but is NOT in `package.json` — each developer must install it separately. Use local for libraries your code imports, global for CLI tools.

- **Q6: Why should you never commit `node_modules` to Git?**
  - A: `node_modules` can contain **thousands of files** and be hundreds of MB. It's fully reproducible from `package.json` + `package-lock.json` by running `npm install`. Committing it bloats the repository, slows down Git operations, and creates merge conflicts. Add `node_modules/` to `.gitignore`.

- **Q7: What happens under the hood when you call `app.listen(3000)`?**
  - A: Express internally calls `http.createServer(app).listen(3000)`. The `app` itself is a request handler function. Express wraps Node.js's built-in `http` module — `app.listen()` is a convenience method that creates an HTTP server and starts listening on the specified port.

- **Q8: What is nodemon and why is it useful?**
  - A: **nodemon** is a development tool that **watches** your project files and **automatically restarts** the Node.js server when changes are detected. Without it, you'd manually stop (`Ctrl+C`) and restart (`node app.js`) after every code change. Install globally (`npm i -g nodemon`) and use `nodemon app.js` instead of `node app.js` during development.

    </div>
  </details>
  </div>

### Key Takeaways

- **Express.js** is a minimal web framework built on top of Node.js's `http` module — cleaner routing, middleware, and response helpers
- Project setup: `npm init` → `npm install express` → creates `package.json`, `node_modules/`, and `package-lock.json`
- **Never commit `node_modules`** — add it to `.gitignore`. Recreate with `npm install`
- **Always commit `package-lock.json`** — it locks exact dependency versions across machines
- `app.use(path, handler)` matches **all HTTP methods**; `app.get()`, `app.post()` match specific ones
- `res.send()` auto-handles Content-Type and encoding; raw `res.end()` doesn't
- **Local install** = libraries for your code (`npm install express`); **Global install** = CLI tools (`npm install -g nodemon`)
- `app.listen(3000)` internally calls `http.createServer(app).listen(3000)` — Express wraps the native module

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-5) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 15: Features HLD LLD and Planning](../S2%2015%20-%20Features%20HLD%20LLD%20and%20Planning/Readme.md) |                                             | [Chapter 17: Routing and Request Handlers](../S2%2017%20-%20Routing%20and%20Request%20Handlers/Readme.md) |

</div>
