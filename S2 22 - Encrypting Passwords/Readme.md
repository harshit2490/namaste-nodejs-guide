<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-8) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 21: Data Sanitization and Schema Validations](../S2%2021%20-%20Data%20Sanitization%20and%20Schema%20Validations/Readme.md) |                                             | [Chapter 23: Authentication, JWT and Cookies](../S2%2023%20-%20Authentication%2C%20JWT%20and%20Cookies/Readme.md) |

</div>

---

# Chapter 22 — Encrypting Passwords &nbsp;

> **Season 2** | Part VII - Authentication & Security
> [🎬 Link](https://namastedev.com/learn/namaste-node/encrypting-passwords)

---

## Code Demonstration Link

[DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Signup Data Validation — Helper Functions](#topic-1)
> 2. [Password Encryption — Why & How (bcrypt)](#topic-2)
> 3. [Login Authentication — bcrypt.compare()](#topic-3)

---

<a id="topic-1"></a>

## 1. [Signup Data Validation — Helper Functions](#key-topics)

Before encrypting passwords, the first step is to **validate all signup input** at the API level using reusable helper functions.

### Why Separate Validation into Helpers?

```
Without helpers:                    With helpers:
──────────────────                 ──────────────
  app.post("/signup", ...)            app.post("/signup", ...)
    │                                   │
    ├── validate firstName              ├── validateSignupData(req)
    ├── validate lastName               │   (all checks in one place)
    ├── validate email                  │
    ├── validate password               ▼
    ├── ... (messy, repeated)           Clean, reusable, testable
```

### Implementation — `validateSignupData` Helper

```js
// utils/validation.js
const validator = require("validator");

const validateSignupData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName) {
    throw new Error("Enter a valid first or last name");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Enter a valid Email ID");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Enter a strong password");
  }
};

module.exports = { validateSignupData };
```

### Usage in Signup Route

```js
const { validateSignupData } = require("./utils/validation");

app.post("/signup", async (req, res) => {
  try {
    // Step 1: Validate input
    validateSignupData(req);

    // Step 2: Hash password (next topic)
    // Step 3: Save user
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});
```

### Validation Flow

```
POST /signup  { firstName, lastName, emailId, password }
       │
       ▼
  validateSignupData(req)
       │
       ├── firstName/lastName missing? → throw Error
       ├── !validator.isEmail(emailId)? → throw Error
       └── !validator.isStrongPassword(password)? → throw Error
       │
  All passed
       │
       ▼
  Continue to password hashing...
```

> 💡 **Pattern**: Keep validation logic in a separate `utils/validation.js` file. This keeps routes clean and makes validation reusable and testable.

---

<a id="topic-2"></a>

## 2. [Password Encryption — Why & How (bcrypt)](#key-topics)

**Never store plaintext passwords.** If the database is compromised, every user account is exposed.

### Why Not Store Plaintext?

```
❌ Plaintext Storage:
──────────────────────
  Database breach → Attacker gets:
  { email: "user@a.com", password: "MySecret123!" }
  ↑ Instant access to the account (and any other site with same password)

✅ Hashed Storage:
──────────────────
  Database breach → Attacker gets:
  { email: "user@a.com", password: "$2b$10$K4fG..." }
  ↑ Useless — cannot reverse the hash
```

### Install bcryptjs

```bash
npm install bcrypt
```

### How bcrypt Works

```
Plaintext Password: "MySecret123!"
           │
           ▼
  bcrypt.hash(password, saltRounds)
           │
           ├── 1. Generate random salt (unique per hash)
           ├── 2. Combine salt + password
           └── 3. Run hashing algorithm (N rounds)
           │
           ▼
  Hashed Output: "$2b$10$K4fG7k3J8m..."
                   │   │  │
                   │   │  └── Hash result (31 chars)
                   │   └── Salt (22 chars)
                   └── Cost factor (10 rounds)
```

### Code — Hashing During Signup

```js
const bcrypt = require("bcrypt");

app.post("/signup", async (req, res) => {
  try {
    // Step 1: Validate
    validateSignupData(req);

    const { firstName, lastName, emailId, password } = req.body;

    // Step 2: Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    //                                             ^^
    //                                        salt rounds

    // Step 3: Save user with hashed password
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash  // ← store hash, NOT plaintext
    });

    await user.save();
    res.send("User added successfully");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});
```

### Salt Rounds — What They Mean

| Salt Rounds | Approx. Time | Use Case |
|-------------|-------------|----------|
| 8 | ~40ms | Development/testing |
| 10 | ~100ms | **Recommended for production** |
| 12 | ~300ms | High-security applications |
| 14 | ~1s | Very high security (slower UX) |
| 16+ | ~4s+ | Overkill — impacts user experience |

> 💡 **Salt rounds = 10** is the sweet spot — secure enough to resist brute-force attacks, fast enough not to impact UX.

### What is a Salt?

```
Without Salt:                        With Salt:
──────────────                      ────────────
  "password123" → always same hash   "password123" + random_salt_1 → hash_A
  "password123" → always same hash   "password123" + random_salt_2 → hash_B
                                     ↑ Different hash every time!
```

| | Without Salt | With Salt (bcrypt) |
|--|-------------|-------------------|
| Same password → | Same hash | Different hash every time |
| Rainbow table attack | ✅ Vulnerable | ❌ Immune |
| Generated by | N/A | bcrypt (automatic) |
| Stored | N/A | Embedded in the hash string |

---

<a id="topic-3"></a>

## 3. [Login Authentication — bcrypt.compare()](#key-topics)

During login, you need to verify the user's plaintext password against the stored hash — without ever decrypting the hash.

### Login Flow

```
POST /login  { emailId, password }
       │
       ▼
  Find user by emailId
       │
  Found? ──No──▶ "Invalid credentials"
       │
      Yes
       │
       ▼
  bcrypt.compare(password, user.password)
       │
       ├── 1. Extract salt from stored hash
       ├── 2. Hash the input password with same salt
       └── 3. Compare the two hashes
       │
  Match? ──No──▶ "Invalid credentials"
       │
      Yes
       │
       ▼
  "Login successful!"
```

### Code — Login Route

```js
app.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    // Step 1: Find user by email
    const user = await User.findOne({ emailId });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Step 2: Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    //                                           ^^^^^^^^  ^^^^^^^^^^^^^
    //                                           plaintext   stored hash

    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    res.send("Login successful!");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});
```

### How `bcrypt.compare()` Works Internally

```
Stored hash: "$2b$10$K4fG7k3J8mN..."
                    │    │
                    │    └── Salt (extracted automatically)
                    └── Cost factor

bcrypt.compare("MySecret123!", storedHash)
       │
       ├── Extracts salt from storedHash
       ├── Hashes "MySecret123!" with that exact salt
       └── Compares result with storedHash
       │
       ▼
  Returns true/false (never reveals the original password)
```

### Security Best Practices

| Practice | Why |
|----------|-----|
| Use same error message for wrong email AND wrong password | Prevents attackers from discovering valid emails |
| Never log passwords (even hashed) | Reduces exposure in log files |
| Use `bcrypt` (not MD5/SHA) | bcrypt is designed for passwords — intentionally slow |
| Don't implement your own hashing | Battle-tested libraries prevent subtle vulnerabilities |

### Complete Signup + Login Pipeline

```
SIGNUP:
  Input → Validate → Hash Password → Save to DB
                        │
                   bcrypt.hash()
                   (password → hash)

LOGIN:
  Input → Find User → Compare Password → Respond
                          │
                     bcrypt.compare()
                     (plaintext vs hash)
```

---

### Hashing vs Encryption — Key Difference

| | Hashing (bcrypt) | Encryption (AES, RSA) |
|--|-----------------|----------------------|
| **Reversible?** | ❌ No — one-way function | ✅ Yes — can decrypt with key |
| **Purpose** | Verify data matches | Protect data in transit/storage |
| **Use for passwords?** | ✅ Yes | ❌ No — if key is compromised, all passwords exposed |
| **Output** | Fixed-length hash | Variable-length ciphertext |
| **Example** | `bcrypt.hash()` | `crypto.createCipheriv()` |

---

### Common Misconceptions

| Misconception | Reality |
| ------------- | ------- |
| ❌ "Hashing and encryption are the same thing" | ✅ Hashing is **one-way** (can't reverse). Encryption is **two-way** (can decrypt with a key). Use hashing for passwords, encryption for data you need to read back |
| ❌ "More salt rounds = always better" | ✅ Higher rounds = more secure but **slower**. 10 rounds is the recommended balance. 16+ rounds can make login take seconds, hurting UX |
| ❌ "You need to decrypt the hash to verify passwords" | ✅ `bcrypt.compare()` **never decrypts**. It hashes the input with the same salt and compares the two hashes |
| ❌ "Same password always produces the same hash" | ✅ bcrypt generates a **random salt** each time. Same password → different hash. The salt is embedded in the hash string |
| ❌ "Validation should be done only in the schema" | ✅ You need **both** — API-level validation (helper functions) catches bad input early. Schema validation is the last line of defense |
| ❌ "Use MD5 or SHA256 for password hashing" | ✅ MD5/SHA are **too fast** — designed for speed, not security. bcrypt is intentionally slow, making brute-force attacks impractical |

<div style="font-size: 22px; color: red">
<details>
  <summary><strong>Interview Questions (Click to View)</strong></summary>
  <div style="font-size: 0.9rem; color: black; background:#fff; border:2px solid red; border-radius: 10px;">

- **Q1: Why should you never store plaintext passwords?**
  - A: If the database is breached, attackers get direct access to every user's password. Since many users reuse passwords across sites, a single breach can compromise their accounts everywhere. Hashing ensures passwords are stored as irreversible strings.

- **Q2: What is bcrypt and why use it over MD5/SHA?**
  - A: bcrypt is a password hashing algorithm specifically designed for security. Unlike MD5/SHA which are optimized for **speed** (billions of hashes/second), bcrypt is intentionally **slow** with a configurable cost factor. This makes brute-force attacks impractical — each guess takes ~100ms instead of nanoseconds.

- **Q3: What are salt rounds in bcrypt?**
  - A: Salt rounds (cost factor) determine how many times the hashing algorithm iterates. Higher rounds = more secure but slower. The value is a power of 2 — 10 rounds means 2^10 (1024) iterations. The recommended value is **10** for production, balancing security and performance.

- **Q4: What is a salt and why is it important?**
  - A: A salt is a random string appended to the password before hashing. It ensures that the **same password produces different hashes** each time, defeating rainbow table attacks. bcrypt generates and embeds the salt automatically — you don't manage it manually.

- **Q5: How does `bcrypt.compare()` verify passwords without decrypting?**
  - A: It extracts the **salt** from the stored hash, hashes the input password with that same salt, and compares the two hash strings. It never decrypts — it re-hashes and compares. Returns `true` if they match, `false` otherwise.

- **Q6: What is the difference between hashing and encryption?**
  - A: **Hashing** is one-way — you can't reverse it. Used for passwords. **Encryption** is two-way — you can decrypt with a key. Used for data you need to read back (like credit card numbers in transit). Never use encryption for passwords — if the key is compromised, all passwords are exposed.

- **Q7: Why use helper functions for validation instead of inline code?**
  - A: Helper functions (`validateSignupData`) keep route handlers clean, make validation logic **reusable** across routes, and make it **testable** independently. They follow the Single Responsibility Principle — routes handle HTTP, helpers handle business logic.

- **Q8: Why should the error message be the same for wrong email and wrong password during login?**
  - A: Using a generic "Invalid credentials" message prevents **user enumeration attacks**. If you say "Email not found" vs "Wrong password", an attacker can discover which emails exist in your system and target them specifically.

    </div>
  </details>
  </div>

### Key Takeaways

- **Never store plaintext passwords** — always hash with bcrypt before saving to the database
- Use **helper functions** (`validateSignupData`) to keep validation logic separate, reusable, and testable
- `bcrypt.hash(password, 10)` generates a salted hash — **10 salt rounds** is the recommended production value
- `bcrypt.compare(plaintext, hash)` verifies passwords without decrypting — it re-hashes and compares
- bcrypt generates a **random salt** per hash — same password → different hash every time (defeats rainbow tables)
- **Hashing ≠ Encryption** — hashing is one-way (passwords), encryption is two-way (data in transit)
- Use the **same error message** for wrong email and wrong password to prevent user enumeration attacks
- Use `bcrypt` (intentionally slow) — **not** MD5/SHA (too fast for password security)

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-8) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 21: Data Sanitization and Schema Validations](../S2%2021%20-%20Data%20Sanitization%20and%20Schema%20Validations/Readme.md) |                                             | [Chapter 23: Authentication, JWT and Cookies](../S2%2023%20-%20Authentication%2C%20JWT%20and%20Cookies/Readme.md) |

</div>
