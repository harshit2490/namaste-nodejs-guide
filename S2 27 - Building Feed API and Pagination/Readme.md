<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-8) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 26: ref, Populate and Thought Process of Writing API's](../S2%2026%20-%20ref%2C%20Populate%20and%20Thought%20Process%20of%20Writing%20API's/Readme.md) |                                             | [Chapter 28: DevTinder UI Part-I](../S2%2028%20-%20DevTinder%20UI%20Part-I/Readme.md) |

</div>

---

# Chapter 27 — Building Feed API & Pagination &nbsp;

> **Season 2** | Part VIII - Advanced MongoDB & APIs
> [🎬 Link](https://namastedev.com/learn/namaste-node/building-feed-api-pagination)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Feed API Logic — Filtering Unwanted Users](#topic-1)
> 2. [Set Data Structure & MongoDB Operators](#topic-2)
> 3. [Pagination — Concept & Implementation](#topic-3)

---

<a id="topic-1"></a>

## 1. [Feed API Logic — Filtering Unwanted Users](#key-topics)

The Feed API is responsible for showing potential matches to the user. To make the feed relevant, we must exclude certain users from the results.

### Users to Exclude from Feed
1. **The Logged-in User** (You shouldn't see yourself).
2. **Existing Connections** (Users you are already connected with).
3. **Ignored Users** (Users you swiped left on).
4. **Pending Requests** (Users you have already sent a request to, or who sent one to you).

### Feed API Exclusion Flow

```
GET /user/feed
       │
       ▼
  Fetch ALL ConnectionRequests involving loggedInUser
  (either as fromUserId OR toUserId)
       │
       ▼
  Extract all unique user IDs from these requests
       │
       ▼
  Query the User collection:
  Find all users EXCEPT:
    - The extracted unique IDs (connections/requests/ignored)
    - The loggedInUser's own ID
       │
       ▼
  Return filtered users
```

---

<a id="topic-2"></a>

## 2. [Set Data Structure & MongoDB Operators](#key-topics)

To efficiently filter out users, we combine JavaScript's `Set` data structure with MongoDB query operators.

### Using a Set for Unique IDs

A connection request involves two users. To avoid adding the same user ID multiple times to our exclusion list, we use a `Set`.

```javascript
const hideUsersFromFeed = new Set();

connectionRequest.forEach((req) => {
  hideUsersFromFeed.add(req.fromUserId.toString());
  hideUsersFromFeed.add(req.toUserId.toString());
});
```

> 💡 **Why `toString()`?** Mongoose `ObjectId` objects might look identical but are distinct objects in memory. Converting them to strings ensures the `Set` correctly identifies and removes duplicates.

### MongoDB Query Operators

| Operator | Meaning | How it's used in Feed API |
|----------|---------|---------------------------|
| `$or` | Match any condition in an array | Find requests where user is `fromUserId` OR `toUserId` |
| `$and` | Match all conditions in an array | User must NOT be in hidden list AND NOT be the logged-in user |
| `$nin` | Not In array | Exclude users whose IDs are in the `hideUsersFromFeed` array |
| `$ne` | Not Equal | Exclude the logged-in user's own `_id` |

### MongoDB Query Example

```javascript
const users = await User.find({
  $and: [
    { _id: { $nin: Array.from(hideUsersFromFeed) } }, // Not in hidden list
    { _id: { $ne: loggedInUser._id } },               // Not the logged-in user
  ],
})
```

---

<a id="topic-3"></a>

## 3. [Pagination — Concept & Implementation](#key-topics)

If our app has millions of users, fetching them all at once will crash the server or take forever to load. We solve this with **Pagination**.

### The Math Behind Pagination

We need two parameters from the client:
1. `page`: Which page number the user is on (default: 1).
2. `limit`: How many records to fetch per page (default: 10).

We use these to calculate **`skip`** — the number of records to bypass.

```
Formula: skip = (page - 1) * limit

Example (limit = 10):
- Page 1: skip = (1 - 1) * 10 = 0   (Gets items 1-10)
- Page 2: skip = (2 - 1) * 10 = 10  (Gets items 11-20)
- Page 3: skip = (3 - 1) * 10 = 20  (Gets items 21-30)
```

### Enforcing Limits

Never trust the client to send a reasonable limit. If a malicious user sends `limit=1000000`, it could bring down your database. Always cap the limit on the backend.

```javascript
let limit = parseInt(req.query.limit || 10);
limit = limit > 50 ? 50 : limit; // Cap at 50 max
```

### Full Feed API Implementation

```javascript
userRouter.get("/user/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // 1. Pagination Setup
    const page = parseInt(req.query.page || 1);
    let limit = parseInt(req.query.limit || 10);
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    // 2. Find all connection requests involving the user
    const connectionRequest = await ConnectionRequestModel.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId"); // Only fetch needed fields

    // 3. Add all involved IDs to a Set for uniqueness
    const hideUsersFromFeed = new Set();
    connectionRequest.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    // 4. Find users not in the hidden list, applying skip & limit
    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select(USER_SAFE_DATA) // Don't send passwords!
      .skip(skip)
      .limit(limit);

    res.send(users);
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});
```

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "You can just load all users on the frontend and filter them there." | ✅ Fetching all users places a massive load on the database and consumes huge network bandwidth. Always filter and paginate on the **backend**. |
| ❌ "You can add Mongoose ObjectIds directly to a Set to find unique values." | ✅ Two ObjectIds might have the same value but are distinct objects in memory. You must convert them to strings `.toString()` before adding them to a JavaScript `Set`. |
| ❌ "Pagination is just for UI organization." | ✅ Pagination is critical for **backend performance and scalability**. It prevents excessive RAM usage and slow DB queries. |
| ❌ "Whatever `limit` the client sends is fine." | ✅ A malicious client could send `limit=10000000` to execute a Denial of Service (DoS) attack. Always sanitize and **cap limits** on the server side (e.g., `max 50`). |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: Why do we use a `Set` instead of an Array for collecting user IDs to hide?**
  - A: A user might appear in multiple connection requests (e.g., if we queried broader connections). Even if they don't, extracting `fromUserId` and `toUserId` will inherently include the logged-in user's ID repeatedly. A `Set` automatically guarantees uniqueness, keeping the `$nin` array as small and optimized as possible.

- **Q2: Explain the `$nin` and `$ne` operators in MongoDB.**
  - A: `$nin` (Not In) matches documents where the value of a field is *not* in the specified array. `$ne` (Not Equal) matches documents where the value of a field is not equal to the specified value.

- **Q3: How is the `skip` value calculated for pagination?**
  - A: The formula is `skip = (page - 1) * limit`. If you are on page 3 and limit is 10, skip is `(3 - 1) * 10 = 20`. The DB will bypass the first 20 records and return records 21-30.

- **Q4: Why is it important to cap the `limit` parameter on the backend?**
  - A: It prevents resource exhaustion attacks. If a user maliciously requests 1 million records in a single API call, the database might lock up and the server could run out of memory. Capping it ensures predictable performance.

- **Q5: In the Mongoose query `.skip(skip).limit(limit)`, does the order matter?**
  - A: No, Mongoose and MongoDB internally optimize the query execution plan. Regardless of whether you write `.skip().limit()` or `.limit().skip()`, MongoDB will always apply the skip *before* the limit.

    </div>
  </details>
  </div>

### Key Takeaways

- **Feed Filtering**: The feed must exclude the user themselves, their connections, ignored users, and pending requests.
- **Set Data Structure**: Use `Set` with `.toString()` on ObjectIds to efficiently build a list of unique users to exclude.
- **MongoDB Operators**: Use `$nin` (Not In) array and `$ne` (Not Equal) to filter out unwanted IDs.
- **Pagination Math**: `skip = (page - 1) * limit`.
- **Performance & Security**: Always implement pagination for large datasets and **cap the maximum limit** a client can request to prevent server overload.

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-8) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 26: ref, Populate and Thought Process of Writing API's](../S2%2026%20-%20ref%2C%20Populate%20and%20Thought%20Process%20of%20Writing%20API's/Readme.md) |                                             | [Chapter 28: DevTinder UI Part-I](../S2%2028%20-%20DevTinder%20UI%20Part-I/Readme.md) |

</div>
