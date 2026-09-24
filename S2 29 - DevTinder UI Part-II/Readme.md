<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-9) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 28: DevTinder UI Part-I](../S2%2028%20-%20DevTinder%20UI%20Part-I/Readme.md) |                                             | [Chapter 30: DevTinder UI Part-III](../S2%2030%20-%20DevTinder%20UI%20Part-III/Readme.md) |

</div>

---

# Chapter 29 — DevTinder UI Part-II &nbsp;

> **Season 2** | Part IX - DevTinder Frontend
> [🎬 Link](https://namastedev.com/learn/namaste-node/devtinder-ui-part-2)

---

## Code Demonstration Links

- [DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)
- [DevTinder Frontend Repository](https://github.com/harshit2490/devTinder-frontend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Login Page & Axios Setup](#topic-1)
> 2. [CORS Configuration & Credentials](#topic-2)
> 3. [Redux Toolkit — State Management](#topic-3)
> 4. [Login Flow — End-to-End Integration](#topic-4)
> 5. [Dynamic Navbar & Code Refactoring](#topic-5)

---

<a id="topic-1"></a>

## 1. [Login Page & Axios Setup](#key-topics)

### Login Page — Controlled Components

Built a responsive login form using **controlled components** in React — form inputs are bound to state.

```jsx
const [emailId, setEmailId] = useState("");
const [password, setPassword] = useState("");

<input
  type="email"
  value={emailId}
  onChange={(e) => setEmailId(e.target.value)}
/>
<input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
```

### Axios Installation & Configuration

```bash
npm install axios
```

```js
import axios from "axios";
import { BASE_URL } from "../utils/constants";

// Login API call
const handleLogin = async () => {
  try {
    const res = await axios.post(BASE_URL + "/login", {
      emailId,
      password,
    }, { withCredentials: true });
    // Handle success...
  } catch (err) {
    // Handle error...
  }
};
```

### Why Axios Over fetch()?

| | Axios | fetch() |
|--|-------|---------|
| **JSON** | Auto-parses response | Must call `.json()` manually |
| **Error handling** | Rejects on HTTP errors (4xx, 5xx) | Only rejects on network failures |
| **Interceptors** | ✅ Built-in | ❌ Manual wrapper needed |
| **Base URL** | ✅ Global defaults | ❌ Must repeat every call |
| **Credentials** | `{ withCredentials: true }` | `{ credentials: "include" }` |

---

<a id="topic-2"></a>

## 2. [CORS Configuration & Credentials](#key-topics)

### The Problem

Frontend (`localhost:5173`) and Backend (`localhost:7777`) are on **different origins**. Browsers block cross-origin requests by default.

```
Frontend: http://localhost:5173  ──── API Call ────▶  Backend: http://localhost:7777
                                                         │
                                                    ❌ BLOCKED by browser
                                                    "CORS policy error"
```

### The Solution — CORS Middleware

```bash
# In backend
npm install cors
```

```js
// Backend — app.js
const cors = require("cors");

app.use(cors({
  origin: "http://localhost:5173",   // ← only allow frontend origin
  credentials: true                   // ← allow cookies to be sent
}));
```

### `withCredentials: true` — Both Sides Must Agree

```
Frontend (Axios):                    Backend (CORS):
─────────────────                    ───────────────
{ withCredentials: true }            { credentials: true }
      │                                    │
      └──── BOTH must be set ──────────────┘
              otherwise cookies
              won't be sent/received
```

### CORS Settings Explained

| Setting | Value | Purpose |
|---------|-------|---------|
| `origin` | `"http://localhost:5173"` | Only allow requests from this domain |
| `credentials` | `true` | Allow cookies (JWT token) to be sent with requests |
| `withCredentials` (Axios) | `true` | Tell browser to include cookies in the request |

> ⚠️ If `credentials: true`, you **cannot** use `origin: "*"` (wildcard). You must specify the exact origin.

---

<a id="topic-3"></a>

## 3. [Redux Toolkit — State Management](#key-topics)

After login, the user data (name, photo, etc.) needs to be accessible across **many components** (Navbar, Profile, Feed). Instead of prop-drilling, use **Redux** as a global store.

### Installation

```bash
npm install @reduxjs/toolkit react-redux
```

### Redux Architecture in DevTinder

```
                    Redux Store
                    ┌──────────────────────┐
                    │  userSlice           │
                    │  ┌────────────────┐  │
                    │  │ user: null     │  │   ← Before login
                    │  │ user: {        │  │   ← After login
                    │  │   firstName,   │  │
                    │  │   lastName,    │  │
                    │  │   photoURL,    │  │
                    │  │   ...          │  │
                    │  │ }              │  │
                    │  └────────────────┘  │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
          Navbar.jsx      Profile.jsx       Feed.jsx
          (reads user)    (reads user)     (reads user)
```

### Setting Up the Store

```js
// utils/appStore.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";

const appStore = configureStore({
  reducer: {
    user: userReducer,
  },
});

export default appStore;
```

### Creating a Slice

```js
// utils/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: null,
  reducers: {
    addUser: (state, action) => {
      return action.payload;   // ← store user data after login
    },
    removeUser: () => {
      return null;             // ← clear user data on logout
    },
  },
});

export const { addUser, removeUser } = userSlice.actions;
export default userSlice.reducer;
```

### Wrapping App with Provider

```jsx
// App.jsx
import { Provider } from "react-redux";
import appStore from "./utils/appStore";

function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter>
        {/* ... routes */}
      </BrowserRouter>
    </Provider>
  );
}
```

### Redux Toolkit vs Traditional Redux

| | Redux Toolkit | Traditional Redux |
|--|--------------|------------------|
| **Boilerplate** | Minimal — `createSlice` handles everything | Heavy — actions, action types, reducers separately |
| **Immutability** | ✅ Immer built-in (mutate directly) | ❌ Must spread state manually |
| **Store setup** | `configureStore()` — one call | `createStore()` + combineReducers + middleware |
| **DevTools** | ✅ Auto-configured | ❌ Manual setup |

---

<a id="topic-4"></a>

## 4. [Login Flow — End-to-End Integration](#key-topics)

### Complete Login Flow

```
User types email + password → clicks "Login"
       │
       ▼
  axios.post("/login", { emailId, password }, { withCredentials: true })
       │
       ▼
  Backend verifies credentials
  → jwt.sign() → res.cookie("token", jwt)
       │
       ▼
  Response arrives with Set-Cookie header
  Browser stores the cookie automatically
       │
       ▼
  Frontend dispatches: dispatch(addUser(res.data))
       │
       ▼
  Redux store updates: user = { firstName, lastName, photoURL, ... }
       │
       ▼
  Components re-render with new state
  → Navbar shows profile pic + name
  → Navigate to /feed
```

### Dispatching After Login

```jsx
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";

const dispatch = useDispatch();

const handleLogin = async () => {
  try {
    const res = await axios.post(BASE_URL + "/login",
      { emailId, password },
      { withCredentials: true }
    );
    dispatch(addUser(res.data));    // ← store user in Redux
    navigate("/feed");              // ← redirect to feed
  } catch (err) {
    setError(err?.response?.data || "Login failed");
  }
};
```

### Redux DevTools — Debugging State

Install the **Redux DevTools** Chrome extension to:
- Monitor every `dispatch` action in real-time
- Inspect the current Redux state
- Time-travel debug (replay actions)

---

<a id="topic-5"></a>

## 5. [Dynamic Navbar & Code Refactoring](#key-topics)

### Navbar — Reading from Redux State

```jsx
import { useSelector } from "react-redux";

const Navbar = () => {
  const user = useSelector((store) => store.user);

  return (
    <nav className="navbar">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">DevTinder</a>
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <p>Welcome, {user.firstName}</p>
          <img src={user.photoURL} alt="profile" />
        </div>
      )}
    </nav>
  );
};
```

### Before Login vs After Login

```
Before login (user = null):
┌────────────────────────────────────────┐
│  DevTinder                      Login  │
└────────────────────────────────────────┘

After login (user = { firstName, photoURL }):
┌────────────────────────────────────────────────┐
│  DevTinder            Welcome, Harshit  [📷]  │
└────────────────────────────────────────────────┘
```

### Code Organization — Refactored Structure

```
devTinder-frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx         ← reads user from Redux
│   │   ├── Body.jsx           ← layout with Outlet
│   │   ├── Footer.jsx
│   │   ├── Login.jsx          ← login form + API call
│   │   ├── Feed.jsx
│   │   └── Profile.jsx
│   ├── utils/
│   │   ├── appStore.js        ← Redux store config
│   │   ├── userSlice.js       ← user state (addUser, removeUser)
│   │   └── constants.js       ← BASE_URL and other constants
│   ├── App.jsx                ← Provider + BrowserRouter
│   └── main.jsx
└── package.json
```

### Constants File

```js
// utils/constants.js
export const BASE_URL = "http://localhost:7777";
```

> 💡 Centralizing the base URL prevents hardcoding it across multiple files. When deploying, you only change one file.

---

### Key Takeaways

- **Login page** uses controlled components — input values bound to React state
- **Axios** simplifies API calls with auto JSON parsing, error handling, and `withCredentials` support
- **CORS** must be configured on **both sides**: backend (`credentials: true`, explicit `origin`) and frontend (`withCredentials: true`)
- **Redux Toolkit** provides global state management — `createSlice` for reducers, `configureStore` for store, `Provider` to wrap app
- After login: `dispatch(addUser(userData))` → Redux store updates → components re-render automatically
- **Navbar** reads from Redux with `useSelector` — dynamically shows profile pic + name after login
- Organize code: `components/` for UI, `utils/` for store/slices/constants — keeps codebase maintainable
- **Redux DevTools** Chrome extension is essential for debugging state changes

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-9) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 28: DevTinder UI Part-I](../S2%2028%20-%20DevTinder%20UI%20Part-I/Readme.md) |                                             | [Chapter 30: DevTinder UI Part-III](../S2%2030%20-%20DevTinder%20UI%20Part-III/Readme.md) |

</div>
