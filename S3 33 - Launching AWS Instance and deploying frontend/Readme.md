<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-10) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 32: DevTinder UI Part-V](../S2%2032%20-%20DevTinder%20UI%20Part-V/Readme.md) |                                             | [Chapter 34: Nginx and Backend Node App Deployment](../S3%2034%20-%20Nginx%20and%20backend%20Node%20App%20Development/Readme.md) |

</div>

---

# Chapter 33 — Launching AWS Instance & Deploying Frontend &nbsp;

> **Season 3** | Part X - Deployment & DevOps
> [🎬 Link](https://namastedev.com/learn/namaste-node/launching-a-aws-instance-and-deploying-frontend)

---

## Code Demonstration Links

- [DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)
- [DevTinder Frontend Repository](https://github.com/harshit2490/devTinder-frontend)

---

<a id="key-topics"></a>

### Topics Covering

> 1. [AWS EC2 Setup — Instance & SSH](#topic-1)
> 2. [Server Environment — Node.js & Git](#topic-2)
> 3. [Frontend Build & Nginx Deployment](#topic-3)
> 4. [Security Groups — Public Access](#topic-4)
> 5. [Command Reference](#topic-5)

---

<a id="topic-1"></a>

## 1. [AWS EC2 Setup — Instance & SSH](#key-topics)

### What is EC2?

**EC2 (Elastic Compute Cloud)** is a virtual server in the AWS cloud. Think of it as renting a computer in the cloud where you can deploy your application.

### Deployment Overview

```
Local Machine                          AWS Cloud
┌──────────────┐                      ┌────────────────────────┐
│  React App   │                      │  EC2 Instance (Ubuntu) │
│  (dev)       │    Deploy ─────▶▶   │  ┌──────────────────┐  │
│              │                      │  │  Nginx           │  │
│  npm run dev │                      │  │  (web server)    │  │
│  localhost:  │                      │  │  serves dist/    │  │
│  5173        │                      │  │  on port 80      │  │
└──────────────┘                      │  └──────────────────┘  │
                                      │  Public IP: x.x.x.x    |
                                      └────────────────────────┘
                                              │
                                              ▼
                                      Users access via
                                      http://x.x.x.x
```

### Step 1: Create AWS Account & Launch EC2

```
AWS Console > EC2 > Launch Instance
       │
       ▼
  Name: "DevTinder"
  OS: Ubuntu (free tier eligible)
  Instance type: t2.micro (free tier)
  Key pair: Create new → download .pem file
       │
       ▼
  Click "Launch Instance"
       │
       ▼
  Wait for status: "Running" + "2/2 checks passed"
```

### Step 2: Key Pair for SSH Access

| Item | Purpose |
|------|---------|
| **Key Pair** | Pair of cryptographic keys (public + private) for secure login |
| **`.pem` file** | Your private key — download once, store securely |
| **Public key** | Stored on EC2 instance automatically |
| **SSH** | Secure Shell — encrypted terminal access to remote server |

> ⚠️ The `.pem` file is shown **only once** during creation. If you lose it, you cannot SSH into your instance.

### Step 3: Connect via SSH

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

```
Local Terminal
       │
       ▼
  ssh -i devtinder.pem ubuntu@54.123.45.67
       │
       ▼
  Authenticates using private key
       │
       ▼
  Connected to EC2 instance (Ubuntu shell)
  ubuntu@ip-172-31-xx-xx:~$
```

---

<a id="topic-2"></a>

## 2. [Server Environment — Node.js & Git](#key-topics)

Once connected to the EC2 instance, set up the environment.

### Install Node.js

```bash
# Install Node.js 20.x (match your local version)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node -v   # → v20.x.x
npm -v    # → 10.x.x
```

### Clone Repositories

```bash
git clone https://github.com/harshit2490/devTinder-frontend.git
git clone https://github.com/harshit2490/devTinder-backend.git
cd devTinder-frontend
```

### Build the Frontend

```bash
npm install       # Install all dependencies
npm run build     # Creates the dist/ folder (production build)
```

### What is `dist/`?

```
npm run build
       │
       ▼
  Vite compiles React JSX → optimized HTML, CSS, JS
       │
       ▼
  Output: dist/
  ├── index.html          ← entry point
  ├── assets/
  │   ├── index-abc123.js  ← bundled + minified JS
  │   └── index-def456.css ← bundled + minified CSS
  └── ...

  These are static files — no Node.js needed to serve them
  → Nginx can serve them directly
```

---

<a id="topic-3"></a>

## 3. [Frontend Build & Nginx Deployment](#key-topics)

### What is Nginx?

| | Nginx | Node.js (dev server) |
|--|-------|---------------------|
| **Purpose** | Production web server | Development server |
| **Performance** | ⚡ Highly optimized for static files | 🐌 Not designed for production |
| **Concurrency** | Handles thousands of connections | Limited |
| **Use case** | Serve built files, reverse proxy | Local development |

### Install & Start Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx    # Auto-start on reboot
```

### Deploy Frontend to Nginx

```bash
# Copy built files to Nginx's web directory
sudo cp -r dist/* /var/www/html/

# Restart Nginx to serve new files
sudo systemctl restart nginx
```

### Deployment Flow

```
dist/ folder (built React app)
       │
       ▼
  sudo cp -r dist/* /var/www/html/
       │
       ▼
  Nginx serves /var/www/html/index.html
       │
       ▼
  User visits http://ec2-public-ip
       │
       ▼
  Nginx returns index.html + JS + CSS
       │
       ▼
  React app loads in browser ✅
```

### Nginx Directory Structure

```
/var/www/html/              ← Nginx default web root
├── index.html               ← Your React app entry
├── assets/
│   ├── index-abc123.js      ← Bundled React code
│   └── index-def456.css     ← Bundled styles
└── ...
```

---

<a id="topic-4"></a>

## 4. [Security Groups — Public Access](#key-topics)

By default, EC2 blocks all incoming traffic except SSH (port 22). You need to open port 80 for HTTP access.

### Configuring Security Group

```
AWS Console > EC2 > Security Groups
       │
       ▼
  Select your instance's security group
       │
       ▼
  Edit Inbound Rules → Add Rule:
  ┌──────────────────────────────────────────┐
  │  Type: HTTP                              │
  │  Port: 80                                │
  │  Source: Anywhere (0.0.0.0/0)            │
  └──────────────────────────────────────────┘
       │
       ▼
  Save → Frontend now accessible via public IP
```

### Security Group Rules Summary

| Rule | Port | Source | Purpose |
|------|------|--------|---------|
| **SSH** | 22 | Your IP (recommended) | Terminal access |
| **HTTP** | 80 | 0.0.0.0/0 (Anywhere) | Frontend access |
| **HTTPS** | 443 | 0.0.0.0/0 (Anywhere) | Secure access (future) |

---

<a id="topic-5"></a>

## 5. [Command Reference](#key-topics)

### Complete Deployment Commands (In Order)

```bash
# 1. Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && npm -v

# 3. Clone repositories
git clone https://github.com/harshit2490/devTinder-frontend.git
git clone https://github.com/harshit2490/devTinder-backend.git
cd devTinder-frontend

# 4. Build frontend
npm install
npm run build

# 5. Install & start Nginx
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# 6. Deploy to Nginx
sudo cp -r dist/* /var/www/html/
sudo systemctl restart nginx

# 7. Enable port 80 in AWS Security Groups (via AWS Console)
```

---

### Key Takeaways

- **EC2** is a virtual server in AWS cloud — use Ubuntu + t2.micro for free tier
- **Key Pair** (`.pem` file) is required for SSH access — download once, keep it safe
- **Node.js** must be installed on the server to run `npm install` and `npm run build`
- `npm run build` creates a `dist/` folder with optimized static files — no Node.js needed to serve them
- **Nginx** is a production web server that serves static files efficiently — replaces the dev server
- Copy `dist/*` to `/var/www/html/` and restart Nginx to deploy
- **Security Groups** control inbound traffic — open port 80 for HTTP to make the app publicly accessible
- The frontend is now live at `http://your-ec2-public-ip`

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-10) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 32: DevTinder UI Part-V](../S2%2032%20-%20DevTinder%20UI%20Part-V/Readme.md) |                                             | [Chapter 34: Nginx and Backend Node App Deployment](../S3%2034%20-%20Nginx%20and%20backend%20Node%20App%20Development/Readme.md) |

</div>
