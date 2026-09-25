<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-10) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 33: Launching AWS Instance and Deploying Frontend](../S3%2033%20-%20Launching%20AWS%20Instance%20and%20deploying%20frontend/Readme.md) |                                             | [Chapter 35: Adding a Custom Domain Name](../S3%2035%20-%20Adding%20a%20Custom%20Domain%20Name/Readme.md) |

</div>

---

# Chapter 34 — Nginx & Backend Node App Deployment &nbsp;

> **Season 3** | Part X - Deployment & DevOps
> [🎬 Link](https://namastedev.com/learn/namaste-node/nginx-backend-node-app-deployment)

---

## Code Demonstration Links

- [DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)
- [DevTinder Frontend Repository](https://github.com/harshit2490/devTinder-frontend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Backend Setup on EC2 & MongoDB Atlas](#topic-1)
> 2. [PM2 — Process Manager for Node.js](#topic-2)
> 3. [Nginx Reverse Proxy — Routing API Requests](#topic-3)
> 4. [Frontend Integration & Full Deployment](#topic-4)
> 5. [Command Reference](#topic-5)

---

<a id="topic-1"></a>

## 1. [Backend Setup on EC2 & MongoDB Atlas](#key-topics)

### Backend Deployment Overview

```
EC2 Instance (Ubuntu)
┌──────────────────────────────────────────────┐
│                                              │
│  Nginx (port 80)                             │
│  ┌────────────────────────────────────────┐  │
│  │  /           → serves React dist/      │  │
│  │  /api/*      → proxy to port 3000      │  │
│  └────────────────────────────────────────┘  │
│                      │                       │
│                      ▼                       │
│  Node.js Backend (port 3000)                 │
│  ┌────────────────────────────────────────┐  │
│  │  Express app running via PM2           │  │
│  │  Handles: /login, /signup, /feed, etc. │  │
│  └────────────────────────────────────────┘  │
│                      │                       │
└──────────────────────┼───────────────────────┘
                       │
                       ▼
              MongoDB Atlas (Cloud DB)
              ┌──────────────────────┐
              │  DevTinder Database  │
              │  (whitelisted IP)    │
              └──────────────────────┘
```

### Step 1: Install Backend Dependencies

```bash
cd devTinder-backend
npm install
```

### Step 2: Add Start Script

```json
// package.json
{
  "scripts": {
    "start": "node app.js"
  }
}
```

### Step 3: Whitelist EC2 IP in MongoDB Atlas

```
MongoDB Atlas Dashboard
       │
       ▼
  Network Access > Add IP Address
       │
       ▼
  Enter EC2 instance public IP
       │
       ▼
  Save → Backend can now connect to MongoDB
```

> ⚠️ Without whitelisting the EC2 IP, the backend will fail with a MongoDB connection error. Atlas blocks all IPs by default.

### Step 4: Open Port 3000 in Security Group

```
AWS Console > EC2 > Security Groups
       │
       ▼
  Edit Inbound Rules → Add Rule:
  ┌────────────────────────────────────┐
  │  Type: Custom TCP                  │
  │  Port: 3000                        │
  │  Source: Anywhere (0.0.0.0/0)      │
  └────────────────────────────────────┘
```

> 💡 Port 3000 is needed temporarily for testing. After Nginx reverse proxy is configured, API traffic goes through port 80 and port 3000 can be closed.

---

<a id="topic-2"></a>

## 2. [PM2 — Process Manager for Node.js](#key-topics)

### Why PM2?

If you run `npm start` directly on EC2 and close your SSH session, the Node.js process **dies**. PM2 keeps it running 24/7.

```
Without PM2:
─────────────
  SSH in → npm start → backend running
  Close SSH terminal → backend STOPS ❌

With PM2:
─────────
  SSH in → pm2 start → backend running
  Close SSH terminal → backend STILL RUNNING ✅
  Server crashes → PM2 auto-restarts ✅
```

### PM2 Installation & Usage

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the backend with PM2
pm2 start npm -- start
```

### Essential PM2 Commands

| Command | Purpose |
|---------|---------|
| `pm2 start npm -- start` | Start the app using npm start |
| `pm2 list` | Show all running processes |
| `pm2 logs` | View real-time logs |
| `pm2 logs --lines 100` | View last 100 log lines |
| `pm2 restart all` | Restart all processes |
| `pm2 stop all` | Stop all processes |
| `pm2 delete all` | Remove all processes from PM2 |
| `pm2 monit` | Real-time monitoring dashboard |

### PM2 Process Lifecycle

```
pm2 start npm -- start
       │
       ▼
  PM2 spawns Node.js process
       │
       ▼
  Backend running on port 3000
       │
       ├── SSH session closed → PM2 keeps it alive
       ├── Process crashes     → PM2 auto-restarts
       └── Server reboots      → pm2 startup + pm2 save
```

---

<a id="topic-3"></a>

## 3. [Nginx Reverse Proxy — Routing API Requests](#key-topics)

### What is a Reverse Proxy?

Instead of exposing the Node.js backend directly on port 3000, Nginx sits in front and routes traffic.

```
Without Reverse Proxy:
──────────────────────
  Frontend: http://ec2-ip         (port 80, Nginx)
  Backend:  http://ec2-ip:3000    (port 3000, Node.js)
  ↑ Different ports = CORS issues, exposed backend

With Reverse Proxy:
───────────────────
  Frontend: http://ec2-ip/        (Nginx serves React)
  Backend:  http://ec2-ip/api/*   (Nginx forwards to Node.js)
  ↑ Same port 80 = no CORS, clean URLs, backend hidden
```

### Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/default
```

Add the reverse proxy block:

```nginx
server {
    listen 80;

    # Serve frontend (React build)
    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }

    # Reverse proxy for backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### How the Reverse Proxy Works

```
Browser request: GET http://ec2-ip/api/user/feed
       │
       ▼
  Nginx receives on port 80
       │
       ▼
  URL starts with /api/ ?
       │
  ┌────┴────┐
  No        Yes
  │         │
  ▼         ▼
  Serve     proxy_pass to http://localhost:3000/user/feed
  React     (strips /api prefix)
  dist/           │
                  ▼
            Node.js backend processes request
                  │
                  ▼
            Response flows back through Nginx to browser
```

### `try_files $uri /index.html` — Why?

```
React uses client-side routing.
If user navigates to /profile, there's no /profile file on disk.

Without try_files:
  GET /profile → Nginx looks for /var/www/html/profile → 404 ❌

With try_files:
  GET /profile → Nginx looks for /var/www/html/profile → not found
                → Falls back to /index.html → React handles routing ✅
```

### Restart Nginx

```bash
sudo systemctl restart nginx
```

---

<a id="topic-4"></a>

## 4. [Frontend Integration & Full Deployment](#key-topics)

### Update Frontend BASE_URL

The frontend no longer needs to call `http://localhost:3000`. Since Nginx proxies `/api` to the backend, just use `/api`.

```js
// utils/constants.js

// Before (development):
export const BASE_URL = "http://localhost:3000";

// After (production):
export const BASE_URL = "/api";
```

### Why `/api` Instead of Full URL?

| | `http://localhost:3000` | `/api` |
|--|----------------------|-------|
| **Works on** | Local dev only | Both dev and production |
| **CORS** | ❌ Cross-origin (different ports) | ✅ Same origin (Nginx handles) |
| **Security** | ❌ Exposes backend port | ✅ Backend port hidden |
| **Deployment** | ❌ Hardcoded to localhost | ✅ Relative URL works anywhere |

### Full Deployment Architecture

```
User's Browser
       │
       ▼
  http://ec2-public-ip
       │
       ▼
┌──── Nginx (port 80) ─────────────────────┐
│                                           │
│  GET /              → /var/www/html/      │
│  GET /profile       → /var/www/html/      │
│                       index.html          │
│                       (React SPA)         │
│                                           │
│  POST /api/login    → localhost:3000      │
│  GET  /api/feed     → localhost:3000      │
│  POST /api/logout   → localhost:3000      │
│                       (Node.js + PM2)     │
│                                           │
└───────────────────────────────────────────┘
                       │
                       ▼
              MongoDB Atlas (Cloud)
```

### Rebuild & Redeploy After Changes

```bash
# On EC2 instance
cd devTinder-frontend
git pull                          # Get latest changes
npm install                       # Install any new deps
npm run build                     # Rebuild dist/
sudo cp -r dist/* /var/www/html/  # Deploy to Nginx
sudo systemctl restart nginx      # Restart Nginx
```

---

<a id="topic-5"></a>

## 5. [Command Reference](#key-topics)

### Complete Backend Deployment Commands

```bash
# 1. SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# 2. Install backend dependencies
cd devTinder-backend
npm install

# 3. Add start script to package.json
nano package.json
# Add: "start": "node app.js"

# 4. Whitelist EC2 IP in MongoDB Atlas
# → MongoDB Atlas > Network Access > Add IP

# 5. Open port 3000 in AWS Security Group
# → AWS Console > EC2 > Security Groups > Add inbound rule

# 6. Install & start PM2
sudo npm install -g pm2
pm2 start npm -- start
pm2 logs      # Check for errors
pm2 list      # Verify process is running

# 7. Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/default
# Add: location /api/ { proxy_pass http://localhost:3000/; }

# 8. Restart Nginx
sudo systemctl restart nginx

# 9. Update frontend BASE_URL
# constants.js: BASE_URL = "/api"

# 10. Rebuild & redeploy frontend
cd ~/devTinder-frontend
npm run build
sudo cp -r dist/* /var/www/html/
sudo systemctl restart nginx
```

---

### Key Takeaways

- **Backend on EC2**: Install deps, add start script, whitelist EC2 IP in MongoDB Atlas
- **PM2** keeps the Node.js backend alive 24/7 — survives SSH disconnection and auto-restarts on crash
- **Nginx reverse proxy** routes `/api/*` to `localhost:3000` — keeps everything on port 80, eliminates CORS
- `try_files $uri /index.html` ensures React Router works on production (client-side routes don't 404)
- **Update `BASE_URL`** from `http://localhost:3000` to `/api` for production
- Full stack on one EC2: Nginx serves React + proxies to Node.js + PM2 manages the process
- **Rebuild flow**: `git pull` → `npm run build` → copy to `/var/www/html/` → restart Nginx

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-10) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 33: Launching AWS Instance and Deploying Frontend](../S3%2033%20-%20Launching%20AWS%20Instance%20and%20deploying%20frontend/Readme.md) |                                             | [Chapter 35: Adding a Custom Domain Name](../S3%2035%20-%20Adding%20a%20Custom%20Domain%20Name/Readme.md) |

</div>
