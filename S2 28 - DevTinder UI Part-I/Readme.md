<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-9) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 27: Building Feed API and Pagination](../S2%2027%20-%20Building%20Feed%20API%20and%20Pagination/Readme.md) |                                             | [Chapter 29: DevTinder UI Part-II](../S2%2029%20-%20DevTinder%20UI%20Part-II/Readme.md) |

</div>

---

# Chapter 28 — DevTinder UI Part-I &nbsp;

> **Season 2** | Part IX - DevTinder Frontend
> [🎬 Link](https://namastedev.com/learn/namaste-node/devtinder-ui-part-1)

---

## Code Demonstration Links

- [DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)
- [DevTinder Frontend Repository](https://github.com/harshit2490/devTinder-frontend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Project Setup — Vite + React](#topic-1)
> 2. [Styling — Tailwind CSS v3 + DaisyUI](#topic-2)
> 3. [Component Architecture — Navbar, Body, Footer](#topic-3)
> 4. [Routing — React Router DOM, BrowserRouter & Outlet](#topic-4)

---

<a id="topic-1"></a>

## 1. [Project Setup — Vite + React](#key-topics)

### Why Vite Over Create React App (CRA)?

| | Vite | Create React App |
|--|------|-----------------|
| **Dev Server** | ⚡ Instant (ESBuild) | 🐌 Slow (Webpack) |
| **HMR** | ✅ Near-instant | ⚠️ Slower updates |
| **Build** | Fast (Rollup) | Slower (Webpack) |
| **Bundle Size** | Smaller | Larger |
| **Status** | ✅ Actively maintained | ⚠️ Deprecated |

### Steps Completed

```
Step 1: Initialize Vite + React project
        npm create vite@latest devTinder-frontend -- --template react
        cd devTinder-frontend
        npm install

Step 2: Code Cleanup
        Remove boilerplate from App.jsx, App.css, index.css
        Test run → npm run dev → verify dev server works
```

---

<a id="topic-2"></a>

## 2. [Styling — Tailwind CSS v3 + DaisyUI](#key-topics)

### Tailwind CSS v3 Setup

```
Step 3: Install Tailwind CSS
        npm install -D tailwindcss postcss autoprefixer
        npx tailwindcss init -p
```

Configure `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add Tailwind directives to `index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### DaisyUI Setup

```
Step 4: Install DaisyUI
        npm install -D daisyui@latest
```

Add DaisyUI as a Tailwind plugin:

```js
// tailwind.config.js
plugins: [require("daisyui")],
```

### What is DaisyUI?

| Feature | Description |
|---------|------------|
| **What** | Component library built on Tailwind CSS |
| **Why** | Pre-designed components (navbar, cards, buttons, etc.) — no need to build from scratch |
| **Themes** | Built-in themes (dark, light, cupcake, etc.) — switch with one attribute |
| **Classes** | Semantic class names like `btn`, `card`, `navbar` instead of long Tailwind utility chains |

---

<a id="topic-3"></a>

## 3. [Component Architecture — Navbar, Body, Footer](#key-topics)

### Project Structure

```
devTinder-frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx     ← Navigation bar (logo, links, menu)
│   │   ├── Body.jsx       ← Layout wrapper with Outlet
│   │   └── Footer.jsx     ← Footer component
│   ├── App.jsx            ← Root component with BrowserRouter
│   ├── main.jsx           ← Entry point
│   └── index.css          ← Tailwind directives
├── tailwind.config.js
├── vite.config.js
└── package.json
```

### Component Hierarchy

```
App.jsx
  └── BrowserRouter
        └── Routes
              └── Route path="/" element={<Body />}
                    ├── Navbar        ← Always visible
                    ├── Outlet        ← Renders child routes here
                    │   ├── /         → Feed page
                    │   ├── /profile  → Profile page
                    │   └── /login    → Login page
                    └── Footer        ← Always visible
```

### Step 5: Navbar Component

Created a responsive navigation bar using DaisyUI's `navbar` component:
- Logo / brand name
- Navigation links
- Mobile-friendly dropdown menu
- Uses DaisyUI classes: `navbar`, `btn`, `dropdown`

### Step 9: Footer Component

Added a footer to balance the layout:
- Styled with Tailwind + DaisyUI
- Consistent design with the rest of the app
- Stays at the bottom of the page

---

<a id="topic-4"></a>

## 4. [Routing — React Router DOM, BrowserRouter & Outlet](#key-topics)

### Step 6: React Router DOM Installation

```
npm install react-router-dom
```

### Step 7: BrowserRouter & Nested Routes

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Body from "./components/Body";
import Feed from "./components/Feed";
import Profile from "./components/Profile";
import Login from "./components/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Body />}>
          {/* Nested routes — render inside Body's Outlet */}
          <Route path="/" element={<Feed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### Step 8: Outlet in Body.jsx

The `Outlet` component from React Router acts as a **placeholder** that renders the matched child route.

```jsx
// Body.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Body = () => {
  return (
    <div>
      <Navbar />
      <Outlet />   {/* ← Child route renders HERE */}
      <Footer />
    </div>
  );
};
```

### How Outlet Works

```
URL: /profile

  <Body>
    <Navbar />         ← Always rendered
    <Outlet />         ← React Router injects <Profile /> here
    <Footer />         ← Always rendered
  </Body>

URL: /login

  <Body>
    <Navbar />         ← Same
    <Outlet />         ← Now injects <Login /> here
    <Footer />         ← Same
  </Body>
```

### Routing Concepts Summary

| Concept | Purpose |
|---------|---------|
| `BrowserRouter` | Wraps the app — enables client-side routing with clean URLs |
| `Routes` | Container for all `Route` definitions |
| `Route` | Maps a URL path to a component |
| **Nested Routes** | Child routes render inside the parent's `Outlet` |
| `Outlet` | Placeholder in parent component where child routes render |
| `Link` / `NavLink` | Client-side navigation without full page reload |

---

### Key Takeaways

- **Vite + React** for fast dev server and optimized builds — CRA is deprecated
- **Tailwind CSS v3** for utility-first styling + **DaisyUI** for pre-built component classes
- Component structure: **Navbar** (top) → **Outlet** (dynamic content) → **Footer** (bottom)
- **BrowserRouter** wraps the app; **nested routes** render inside `Outlet` — Navbar and Footer stay constant
- `Outlet` is the key to **layout persistence** — shared layout stays, only the content area changes per route
- React Router DOM handles **client-side navigation** — no full page reloads

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-9) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 27: Building Feed API and Pagination](../S2%2027%20-%20Building%20Feed%20API%20and%20Pagination/Readme.md) |                                             | [Chapter 29: DevTinder UI Part-II](../S2%2029%20-%20DevTinder%20UI%20Part-II/Readme.md) |

</div>
