<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-9) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 31: DevTinder UI Part-IV](../S2%2031%20-%20DevTinder%20UI%20Part-IV/Readme.md) |                                             | [Chapter 33: Launching AWS Instance and Deploying Frontend](../S3%2033%20-%20Launching%20AWS%20Instance%20and%20deploying%20frontend/Readme.md) |

</div>

---

# Chapter 32 — DevTinder UI Part-V (Final) &nbsp;

> **Season 2** | Part IX - DevTinder Frontend
> [🎬 Link](https://namastedev.com/learn/namaste-node/devtinder-ui-part-5)

---

## Code Demonstration Links

- [DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)
- [DevTinder Frontend Repository](https://github.com/harshit2490/devTinder-frontend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Sending Connection Requests from Feed](#topic-1)
> 2. [Dynamic Feed Updates](#topic-2)
> 3. [Reusable Login/Signup Form](#topic-3)
> 4. [Post-Signup Flow & Skills Feature](#topic-4)

---

<a id="topic-1"></a>

## 1. [Sending Connection Requests from Feed](#key-topics)

The feed's "Interested" and "Ignore" buttons now call the backend API to send connection requests.

### Send Request Flow

```
User sees a profile card in feed
       │
       ├── Clicks "Interested"
       │      │
       │      ▼
       │   POST /request/send/interested/:userId
       │   (withCredentials: true)
       │      │
       │      ▼
       │   Backend saves: { fromUserId: me, toUserId: them, status: "interested" }
       │
       └── Clicks "Ignore"
              │
              ▼
           POST /request/send/ignored/:userId
           (withCredentials: true)
              │
              ▼
           Backend saves: { fromUserId: me, toUserId: them, status: "ignored" }
```

### Implementation

```jsx
const handleSendRequest = async (status, userId) => {
  try {
    await axios.post(
      BASE_URL + "/request/send/" + status + "/" + userId,
      {},
      { withCredentials: true }
    );
    // Remove user from feed after sending request
    dispatch(removeUserFromFeed(userId));
  } catch (err) {
    console.error(err);
  }
};

// In UserCard
<button
  className="btn btn-primary"
  onClick={() => handleSendRequest("interested", user._id)}
>
  Interested
</button>
<button
  className="btn btn-secondary"
  onClick={() => handleSendRequest("ignored", user._id)}
>
  Ignore
</button>
```

---

<a id="topic-2"></a>

## 2. [Dynamic Feed Updates](#key-topics)

After sending a request, the user should **disappear from the feed instantly** — no page refresh needed.

### Updated feedSlice

```js
// utils/feedSlice.js
const feedSlice = createSlice({
  name: "feed",
  initialState: null,
  reducers: {
    addFeed: (state, action) => action.payload,
    removeUserFromFeed: (state, action) => {
      // Filter out the user who was sent a request
      return state.filter((user) => user._id !== action.payload);
    },
    removeFeed: () => null,
  },
});

export const { addFeed, removeUserFromFeed, removeFeed } = feedSlice.actions;
```

### Feed Update Flow

```
Feed: [User A, User B, User C, User D]
              │
              ▼
  Click "Interested" on User B
              │
              ▼
  API: POST /request/send/interested/userB_id
              │
              ▼
  dispatch(removeUserFromFeed(userB_id))
              │
              ▼
  Feed: [User A, User C, User D]  ← User B gone instantly
              │
              ▼
  Next card slides in automatically
```

> 💡 The `removeUserFromFeed` reducer uses `.filter()` — same pattern as `removeRequest` in S2 31. Filter returns a new array without the matching user.

---

<a id="topic-3"></a>

## 3. [Reusable Login/Signup Form](#key-topics)

Instead of two separate pages for Login and Signup, use a **single dynamic form** that toggles between modes.

### Dynamic Form Pattern

```
┌──────────────────────────────────┐
│                                  │
│  ┌────────────┐                  │
│  │  Login  ◄──┼─── Toggle ──┐    │
│  └────────────┘              │   │
│                              │   │
│  Email:    [____________]    │   │
│  Password: [____________]    │   │
│                              │   │
│  isLogin = true:             │   │
│    → Show "Login" button     │   │
│    → "New User? Signup"      │   │
│                              │   │
│  isLogin = false:            │   │
│    → Show extra fields       │   │
│      (firstName, lastName)   │   │
│    → Show "Signup" button    │   │
│    → "Existing User? Login" ─┘   │
│                                  │
└──────────────────────────────────┘
```

### Implementation

```jsx
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async () => {
    try {
      const endpoint = isLogin ? "/login" : "/signup";
      const body = isLogin
        ? { emailId, password }
        : { firstName, lastName, emailId, password };

      const res = await axios.post(BASE_URL + endpoint, body, {
        withCredentials: true,
      });
      dispatch(addUser(res.data));
      navigate(isLogin ? "/feed" : "/profile"); // ← signup goes to profile
    } catch (err) {
      setError(err?.response?.data || "Something went wrong");
    }
  };

  return (
    <div className="card w-96 bg-base-300 shadow-xl p-8">
      <h2>{isLogin ? "Login" : "Signup"}</h2>

      {!isLogin && (
        <>
          <input placeholder="First Name" value={firstName}
            onChange={(e) => setFirstName(e.target.value)} />
          <input placeholder="Last Name" value={lastName}
            onChange={(e) => setLastName(e.target.value)} />
        </>
      )}

      <input placeholder="Email" value={emailId}
        onChange={(e) => setEmailId(e.target.value)} />
      <input type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleAuth}>{isLogin ? "Login" : "Signup"}</button>

      <p onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "New User? Signup" : "Existing User? Login"}
      </p>
    </div>
  );
};
```

### Login vs Signup Behavior

| | Login | Signup |
|--|-------|--------|
| **Fields shown** | Email, Password | First Name, Last Name, Email, Password |
| **API endpoint** | `POST /login` | `POST /signup` |
| **After success** | Navigate to `/feed` | Navigate to `/profile` (complete profile) |
| **Toggle text** | "New User? Signup" | "Existing User? Login" |

---

<a id="topic-4"></a>

## 4. [Post-Signup Flow & Skills Feature](#key-topics)

### Post-Signup Redirect

```
New user signs up
       │
       ▼
  POST /signup { firstName, lastName, emailId, password }
       │
       ▼
  Backend creates user → sends JWT cookie
       │
       ▼
  dispatch(addUser(res.data))
       │
       ▼
  navigate("/profile")  ← NOT /feed
       │
       ▼
  User sees profile edit page
  → Complete about, photoURL, skills, age, gender
       │
       ▼
  After saving → can access /feed
```

> 💡 Redirecting to `/profile` after signup encourages users to complete their profile before browsing — better onboarding experience.

### Skills in UserCard

```jsx
// In UserCard component
{user.skills && user.skills.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-2">
    {user.skills.map((skill, index) => (
      <span key={index} className="badge badge-primary">{skill}</span>
    ))}
  </div>
)}
```

### Skills Display

```
┌──────────────────────────────────┐
│  [📷]                            │
│  Harshit Kumar                   │
│  25, Male                        │
│  Full-stack MERN developer       │
│                                  │
│  [React] [Node.js] [MongoDB]     │  ← skill badges
│                                  │
│  [Interested]    [Ignore]        │
└──────────────────────────────────┘
```

### Editing Skills in Profile

The profile edit page now includes a skills input where users can add or remove skills:

```jsx
// In EditProfile
<label>Skills (comma-separated)</label>
<input
  value={skills}
  onChange={(e) => setSkills(e.target.value)}
  placeholder="React, Node.js, MongoDB"
/>
```

Skills are stored as an array in the database and displayed as badges in the UserCard.

---

### Complete DevTinder Feature Summary

| Feature | Backend API | Frontend Component | Redux Slice |
|---------|------------|-------------------|-------------|
| **Signup** | `POST /signup` | Login.jsx (toggle) | `userSlice` |
| **Login** | `POST /login` | Login.jsx (toggle) | `userSlice` |
| **Logout** | `POST /logout` | Navbar.jsx | `userSlice` |
| **View Profile** | `GET /profile/view` | Body.jsx (auth check) | `userSlice` |
| **Edit Profile** | `PATCH /profile/edit` | EditProfile.jsx | `userSlice` |
| **Feed** | `GET /user/feed` | Feed.jsx | `feedSlice` |
| **Send Request** | `POST /request/send/:status/:userId` | UserCard.jsx | `feedSlice` |
| **View Connections** | `GET /user/connections` | Connections.jsx | `connectionSlice` |
| **View Requests** | `GET /user/requests/received` | Requests.jsx | `requestSlice` |
| **Review Request** | `POST /request/review/:status/:requestId` | Requests.jsx | `requestSlice` |

---

### Key Takeaways

- **Send requests** from feed using `POST /request/send/:status/:userId` → `removeUserFromFeed(userId)` removes the card instantly
- **Dynamic feed**: `removeUserFromFeed` uses `.filter()` to remove a user after Interested/Ignore — no page refresh
- **Reusable auth form**: single component with `isLogin` toggle — conditionally renders extra signup fields
- **Post-signup redirect** goes to `/profile` (not `/feed`) — encourages profile completion before browsing
- **Skills** stored as an array, displayed as DaisyUI badges in UserCard, editable from profile edit
- DevTinder is now a **complete MERN application** with auth, feed, connections, requests, and profile management

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-9) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 31: DevTinder UI Part-IV](../S2%2031%20-%20DevTinder%20UI%20Part-IV/Readme.md) |                                             | [Chapter 33: Launching AWS Instance and Deploying Frontend](../S3%2033%20-%20Launching%20AWS%20Instance%20and%20deploying%20frontend/Readme.md) |

</div>
