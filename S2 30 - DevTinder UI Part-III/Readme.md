<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-9) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 29: DevTinder UI Part-II](../S2%2029%20-%20DevTinder%20UI%20Part-II/Readme.md) |                                             | [Chapter 31: DevTinder UI Part-IV](../S2%2031%20-%20DevTinder%20UI%20Part-IV/Readme.md) |

</div>

---

# Chapter 30 — DevTinder UI Part-III &nbsp;

> **Season 2** | Part IX - DevTinder Frontend
> [🎬 Link](https://namastedev.com/learn/namaste-node/devtinder-ui-part-3)

---

## Code Demonstration Links

- [DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)
- [DevTinder Frontend Repository](https://github.com/harshit2490/devTinder-frontend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Route Protection — Auth Guards](#topic-1)
> 2. [Logout — Clearing Session & State](#topic-2)
> 3. [Feed — Fetching & Storing Profiles](#topic-3)
> 4. [Profile Edit — Form, API & Live Preview](#topic-4)

---

<a id="topic-1"></a>

## 1. [Route Protection — Auth Guards](#key-topics)

Unauthenticated users should NOT be able to access pages like `/feed` or `/profile`. If the JWT token is missing, redirect them to `/login`.

### How Route Protection Works

```
User visits /feed
       │
       ▼
  Body.jsx loads → calls GET /profile/view (with cookie)
       │
  ┌────┴────┐
  │         │
 401       200
  │         │
  ▼         ▼
Redirect   Set user in Redux
to /login   Show feed
```

### Implementation Pattern

```jsx
// Body.jsx
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";

const Body = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);

  const fetchUser = async () => {
    if (user) return; // Already logged in — don't refetch

    try {
      const res = await axios.get(BASE_URL + "/profile/view", {
        withCredentials: true,
      });
      dispatch(addUser(res.data));
    } catch (err) {
      if (err.status === 401) {
        navigate("/login"); // ← redirect if not authenticated
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div>
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
};
```

### Auth Guard Flow

```
                 Every page load
                      │
                      ▼
              Is user in Redux?
                 │          │
                Yes         No
                 │          │
                 ▼          ▼
            Render page   Call GET /profile/view
                              │
                         ┌────┴────┐
                        401       200
                         │         │
                         ▼         ▼
                    Navigate    dispatch(addUser)
                    to /login   Render page
```

> 💡 The check happens in `Body.jsx` (the layout component) so it runs for **every nested route** — no need to add guards to individual pages.

---

<a id="topic-2"></a>

## 2. [Logout — Clearing Session & State](#key-topics)

### Logout Flow

```
User clicks "Logout"
       │
       ▼
  POST /logout (withCredentials: true)
  → Backend clears cookie (token = null, expires = now)
       │
       ▼
  dispatch(removeUser())
  → Redux store: user = null
       │
       ▼
  navigate("/login")
  → User sees login page
       │
       ▼
  Navbar re-renders → shows "Login" button instead of profile
```

### Implementation

```jsx
import { useDispatch } from "react-redux";
import { removeUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";

const handleLogout = async () => {
  try {
    await axios.post(BASE_URL + "/logout", {}, { withCredentials: true });
    dispatch(removeUser());    // ← clear Redux state
    navigate("/login");        // ← redirect to login
  } catch (err) {
    console.error(err);
  }
};

// In Navbar
<button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
```

### What Happens on Logout

| Step | Action | Where |
|------|--------|-------|
| 1 | `POST /logout` | Backend clears JWT cookie |
| 2 | `dispatch(removeUser())` | Redux store → `user = null` |
| 3 | `navigate("/login")` | React Router redirects |
| 4 | Navbar re-renders | `useSelector` reads `null` → shows login button |

---

<a id="topic-3"></a>

## 3. [Feed — Fetching & Storing Profiles](#key-topics)

### Feed Redux Slice

```js
// utils/feedSlice.js
import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
  name: "feed",
  initialState: null,
  reducers: {
    addFeed: (state, action) => action.payload,
    removeFeed: () => null,
  },
});

export const { addFeed, removeFeed } = feedSlice.actions;
export default feedSlice.reducer;
```

Add to store:

```js
// utils/appStore.js
import feedReducer from "./feedSlice";

const appStore = configureStore({
  reducer: {
    user: userReducer,
    feed: feedReducer,     // ← add feed slice
  },
});
```

### Fetching Feed Data

```jsx
// Feed.jsx
const Feed = () => {
  const feed = useSelector((store) => store.feed);
  const dispatch = useDispatch();

  const getFeed = async () => {
    if (feed) return; // Don't refetch if already loaded

    try {
      const res = await axios.get(BASE_URL + "/user/feed", {
        withCredentials: true,
      });
      dispatch(addFeed(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getFeed();
  }, []);

  return (
    <div className="flex justify-center my-10">
      {feed && feed.map((user) => (
        <UserCard key={user._id} user={user} />
      ))}
    </div>
  );
};
```

### Feed Data Flow

```
Feed.jsx mounts
       │
       ▼
  GET /user/feed (withCredentials: true)
       │
       ▼
  Backend: filters out logged-in user,
  connections, ignored → returns profiles
       │
       ▼
  dispatch(addFeed(profiles))
       │
       ▼
  Redux store: feed = [{ firstName, lastName, photoURL, ... }, ...]
       │
       ▼
  Feed.jsx re-renders → maps over profiles → renders UserCards
```

### UserCard Component

```jsx
const UserCard = ({ user }) => {
  const { firstName, lastName, photoURL, about, skills, age, gender } = user;

  return (
    <div className="card w-96 bg-base-300 shadow-xl">
      <figure>
        <img src={photoURL} alt="profile" />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{firstName + " " + lastName}</h2>
        {age && gender && <p>{age + ", " + gender}</p>}
        <p>{about}</p>
        {skills && <p>Skills: {skills.join(", ")}</p>}
        <div className="card-actions justify-center my-4">
          <button className="btn btn-primary">Interested</button>
          <button className="btn btn-secondary">Ignore</button>
        </div>
      </div>
    </div>
  );
};
```

---

<a id="topic-4"></a>

## 4. [Profile Edit — Form, API & Live Preview](#key-topics)

### Edit Profile Page Layout

```
┌────────────────────────────────────────────────────┐
│                                                    │
│   Edit Form (left)          Live Preview (right)   │
│   ┌──────────────┐          ┌──────────────────┐   │
│   │ First Name   │          │   [UserCard]     │   │
│   │ [________]   │          │                  │   │
│   │ Last Name    │          │   Shows changes  │   │
│   │ [________]   │          │   in real-time   │   │
│   │ Age          │          │   as you type    │   │
│   │ [________]   │          │                  │   │
│   │ About        │          │                  │   │
│   │ [________]   │          │                  │   │
│   │ Photo URL    │          │                  │   │
│   │ [________]   │          │                  │   │
│   │              │          │                  │   │
│   │ [Save]       │          │                  │   │
│   └──────────────┘          └──────────────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Implementation

```jsx
const EditProfile = ({ user }) => {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [age, setAge] = useState(user.age || "");
  const [about, setAbout] = useState(user.about || "");
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");

  const saveProfile = async () => {
    try {
      const res = await axios.patch(
        BASE_URL + "/profile/edit",
        { firstName, lastName, age, about, photoURL },
        { withCredentials: true }
      );
      dispatch(addUser(res.data.data)); // ← update Redux with new data
      // Show success toast
    } catch (err) {
      // Show error toast
    }
  };

  return (
    <div className="flex justify-center gap-10">
      {/* Edit Form */}
      <div className="card bg-base-300 w-96 shadow-xl p-8">
        <label>First Name</label>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        {/* ... other fields */}
        <button onClick={saveProfile}>Save Profile</button>
      </div>

      {/* Live Preview — uses same UserCard component */}
      <UserCard user={{ firstName, lastName, age, about, photoURL }} />
    </div>
  );
};
```

### Live Preview — How It Works

```
User types in "First Name" input
       │
       ▼
  setFirstName("Harshit")
       │
       ▼
  React re-renders EditProfile
       │
       ▼
  UserCard receives { firstName: "Harshit", ... }
       │
       ▼
  Card preview updates instantly — no API call needed
```

> 💡 The live preview works because both the form and `UserCard` read from the **same state variables**. When state changes, both re-render automatically.

### Save Profile Flow

```
User clicks "Save Profile"
       │
       ▼
  PATCH /profile/edit { firstName, lastName, age, about, photoURL }
  (withCredentials: true)
       │
       ▼
  Backend: validateEditFields → save → respond with updated user
       │
       ▼
  dispatch(addUser(res.data.data))
  → Redux store: user = updated data
       │
       ▼
  Navbar re-renders with new name/photo
  Toast: "Profile updated successfully"
```

---

### Updated Redux Store Architecture

```
Redux Store
┌─────────────────────────────────────────┐
│                                         │
│  userSlice                feedSlice     │
│  ┌─────────────┐         ┌───────────┐  │
│  │ user: {     │         │ feed: [   │  │
│  │  firstName, │         │  user1,   │  │
│  │  lastName,  │         │  user2,   │  │
│  │  photoURL,  │         │  ...      │  │
│  │  ...        │         │ ]         │  │
│  │ }           │         │           │  │
│  └─────┬───────┘         └─────┬─────┘  │
│        │                       │        │
└────────┼───────────────────────┼────────┘
         │                       │
    ┌────┴────┐             ┌────┴────┐
    ▼         ▼             ▼         ▼
 Navbar   EditProfile    Feed.jsx  UserCard
```

---

### Key Takeaways

- **Route protection** happens in `Body.jsx` — call `/profile/view` on mount; redirect to `/login` on 401
- **Logout** = `POST /logout` (clear cookie) + `dispatch(removeUser())` + `navigate("/login")`
- **Feed data** stored in a separate `feedSlice` in Redux — prevents unnecessary re-fetches
- **UserCard** is a reusable component — used in both the Feed page and as a live preview in Edit Profile
- **Live preview** works by passing form state directly to `UserCard` — both read the same state, so changes reflect instantly
- **Profile save**: `PATCH /profile/edit` → `dispatch(addUser(updatedData))` → Navbar and all components update

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-9) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 29: DevTinder UI Part-II](../S2%2029%20-%20DevTinder%20UI%20Part-II/Readme.md) |                                             | [Chapter 31: DevTinder UI Part-IV](../S2%2031%20-%20DevTinder%20UI%20Part-IV/Readme.md) |

</div>
