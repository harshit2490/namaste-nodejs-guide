<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-9) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 30: DevTinder UI Part-III](../S2%2030%20-%20DevTinder%20UI%20Part-III/Readme.md) |                                             | [Chapter 32: DevTinder UI Part-V](../S2%2032%20-%20DevTinder%20UI%20Part-V/Readme.md) |

</div>

---

# Chapter 31 — DevTinder UI Part-IV &nbsp;

> **Season 2** | Part IX - DevTinder Frontend
> [🎬 Link](https://namastedev.com/learn/namaste-node/devtinder-ui-part-4)

---

## Code Demonstration Links

- [DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)
- [DevTinder Frontend Repository](https://github.com/harshit2490/devTinder-frontend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Connections Page — Displaying Accepted Connections](#topic-1)
> 2. [Connection Requests Page — Pending Reviews](#topic-2)
> 3. [Accept/Reject — Dynamic Request Handling](#topic-3)
> 4. [Redux Architecture — New Slices](#topic-4)

---

<a id="topic-1"></a>

## 1. [Connections Page — Displaying Accepted Connections](#key-topics)

### Connections Page Flow

```
User navigates to /connections
       │
       ▼
  GET /user/connections (withCredentials: true)
       │
       ▼
  Backend returns all accepted connections
  (uses $or to check both fromUserId and toUserId)
       │
       ▼
  dispatch(addConnections(res.data))
       │
       ▼
  Redux store: connections = [user1, user2, ...]
       │
       ▼
  Connections.jsx renders connection cards
```

### connectionSlice — Redux State

```js
// utils/connectionSlice.js
import { createSlice } from "@reduxjs/toolkit";

const connectionSlice = createSlice({
  name: "connection",
  initialState: null,
  reducers: {
    addConnections: (state, action) => action.payload,
    removeConnections: () => null,
  },
});

export const { addConnections, removeConnections } = connectionSlice.actions;
export default connectionSlice.reducer;
```

### Connections Component

```jsx
const Connections = () => {
  const connections = useSelector((store) => store.connection);
  const dispatch = useDispatch();

  const fetchConnections = async () => {
    try {
      const res = await axios.get(BASE_URL + "/user/connections", {
        withCredentials: true,
      });
      dispatch(addConnections(res.data.data));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  if (!connections) return null;
  if (connections.length === 0) return <h1>No Connections Found</h1>;

  return (
    <div className="text-center my-10">
      <h1 className="text-bold text-2xl">Connections</h1>
      {connections.map((connection) => {
        const { _id, firstName, lastName, photoURL, about } = connection;
        return (
          <div key={_id} className="flex items-center m-4 p-4 bg-base-300 rounded-lg">
            <img className="w-20 h-20 rounded-full" src={photoURL} />
            <div className="ml-4">
              <h2 className="font-bold">{firstName + " " + lastName}</h2>
              <p>{about}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

### Connection Card Layout

```
┌──────────────────────────────────────────┐
│  [📷]  Virat Kohli                       │
│        Full-stack developer who loves... │
├──────────────────────────────────────────┤
│  [📷]  Rohit Sharma                      │
│        Backend specialist working on...  │
├──────────────────────────────────────────┤
│  [📷]  MS Dhoni                          │
│        DevOps engineer passionate...     │
└──────────────────────────────────────────┘
```

---

<a id="topic-2"></a>

## 2. [Connection Requests Page — Pending Reviews](#key-topics)

### Requests Page Flow

```
User navigates to /requests
       │
       ▼
  GET /user/requests/received (withCredentials: true)
       │
       ▼
  Backend returns pending requests
  (toUserId = me, status = "interested")
       │
       ▼
  dispatch(addRequests(res.data.connectionRequests))
       │
       ▼
  Redux store: requests = [{ fromUserId: { name, photo }, ... }, ...]
       │
       ▼
  Requests.jsx renders request cards with Accept/Reject buttons
```

### requestSlice — Redux State

```js
// utils/requestSlice.js
import { createSlice } from "@reduxjs/toolkit";

const requestSlice = createSlice({
  name: "request",
  initialState: null,
  reducers: {
    addRequests: (state, action) => action.payload,
    removeRequest: (state, action) => {
      // Remove a specific request after accept/reject
      return state.filter((req) => req._id !== action.payload);
    },
    removeAllRequests: () => null,
  },
});

export const { addRequests, removeRequest, removeAllRequests } = requestSlice.actions;
export default requestSlice.reducer;
```

### Request Card Layout

```
┌──────────────────────────────────────────────────────┐
│  [📷]  Sachin Tendulkar                              │
│        React developer looking for collaborators     │
│                                                      │
│                    [✅ Accept]    [❌ Reject]       │
├──────────────────────────────────────────────────────┤
│  [📷]  Hardik Pandya                                 │
│        Full-stack MERN developer                     │
│                                                      │
│                    [✅ Accept]    [❌ Reject]       │
└──────────────────────────────────────────────────────┘
```

---

<a id="topic-3"></a>

## 3. [Accept/Reject — Dynamic Request Handling](#key-topics)

### Accept/Reject Flow

```
User clicks "Accept" on a request
       │
       ▼
  POST /request/review/accepted/:requestId
  (withCredentials: true)
       │
       ▼
  Backend: updates status to "accepted"
       │
       ▼
  dispatch(removeRequest(requestId))
  → Request disappears from UI instantly
       │
       ▼
  User visits /connections → sees the new connection
```

### Implementation

```jsx
const reviewRequest = async (status, requestId) => {
  try {
    await axios.post(
      BASE_URL + "/request/review/" + status + "/" + requestId,
      {},
      { withCredentials: true }
    );
    dispatch(removeRequest(requestId)); // ← remove from UI immediately
  } catch (err) {
    console.error(err);
  }
};

// In request card
<button
  className="btn btn-primary"
  onClick={() => reviewRequest("accepted", request._id)}
>
  Accept
</button>
<button
  className="btn btn-secondary"
  onClick={() => reviewRequest("rejected", request._id)}
>
  Reject
</button>
```

### What Happens After Accept vs Reject

| Action | API Call | Redux Update | UI Effect |
|--------|----------|-------------|-----------|
| **Accept** | `POST /request/review/accepted/:id` | `removeRequest(id)` from requests | Card disappears; user appears in Connections page |
| **Reject** | `POST /request/review/rejected/:id` | `removeRequest(id)` from requests | Card disappears; user does NOT appear in Connections |

> 💡 Both actions remove the request from the UI immediately using `removeRequest`. The difference is only on the backend — `accepted` creates a connection, `rejected` just closes the request.

---

<a id="topic-4"></a>

## 4. [Redux Architecture — New Slices](#key-topics)

### Updated Redux Store

```
Redux Store
┌──────────────────────────────────────────────────────┐
│                                                      │
│  userSlice        feedSlice       connectionSlice    │
│  ┌───────────┐   ┌───────────┐   ┌────────────────┐  │
│  │ user: {   │   │ feed: [   │   │ connection: [  │  │
│  │  name,    │   │  user1,   │   │  user1,        │  │
│  │  photo,   │   │  user2,   │   │  user2,        │  │
│  │  ...      │   │  ...      │   │  ...           │  │
│  │ }         │   │ ]         │   │ ]              │  │
│  └─────┬─────┘   └─────┬─────┘   └──────┬─────────┘  │
│        │               │                │            │
│                                                      │
│  requestSlice                                        │
│  ┌────────────────────┐                              │
│  │ request: [         │                              │
│  │  { fromUserId,     │                              │
│  │    status, ... },  │                              │
│  │  ...               │                              │
│  │ ]                  │                              │
│  └──────┬─────────────┘                              │
│         │                                            │
└─────────┼────────────────────────────────────────────┘
          │
    ┌─────┼──────────────┐
    ▼     ▼              ▼
 Navbar  Connections   Requests
         Page          Page
```

### Store Configuration

```js
// utils/appStore.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import feedReducer from "./feedSlice";
import connectionReducer from "./connectionSlice";
import requestReducer from "./requestSlice";

const appStore = configureStore({
  reducer: {
    user: userReducer,
    feed: feedReducer,
    connection: connectionReducer,
    request: requestReducer,
  },
});

export default appStore;
```

### Slice Summary

| Slice | State | Key Actions | Used By |
|-------|-------|-------------|---------|
| `userSlice` | Logged-in user data | `addUser`, `removeUser` | Navbar, Profile |
| `feedSlice` | Developer profiles for feed | `addFeed`, `removeFeed` | Feed page |
| `connectionSlice` | Accepted connections | `addConnections`, `removeConnections` | Connections page |
| `requestSlice` | Pending requests | `addRequests`, `removeRequest` | Requests page |

---

### Key Takeaways

- **Connections page** fetches accepted connections via `GET /user/connections` and stores them in `connectionSlice`
- **Requests page** fetches pending requests via `GET /user/requests/received` and stores them in `requestSlice`
- **Accept/Reject** calls `POST /request/review/:status/:requestId` then uses `removeRequest(id)` to instantly remove the card from UI
- Each feature domain gets its own **Redux slice** — `userSlice`, `feedSlice`, `connectionSlice`, `requestSlice`
- The `removeRequest` reducer uses `.filter()` to remove a specific request by `_id` — keeping the rest intact
- Both accept and reject remove the request card; the difference is backend-side (accepted = connection, rejected = closed)

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-9) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 30: DevTinder UI Part-III](../S2%2030%20-%20DevTinder%20UI%20Part-III/Readme.md) |                                             | [Chapter 32: DevTinder UI Part-V](../S2%2032%20-%20DevTinder%20UI%20Part-V/Readme.md) |

</div>
