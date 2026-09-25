<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-10) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 34: Nginx and Backend Node App Deployment](../S3%2034%20-%20Nginx%20and%20backend%20Node%20App%20Development/Readme.md) |                                             | END |

</div>

---

# Chapter 35 — Adding a Custom Domain Name &nbsp;

> **Season 3** | Part X - Deployment & DevOps
> [🎬 Link](https://namastedev.com/learn/namaste-node/adding-a-custom-domain-name)

---

## Code Demonstration Links

- [DevTinder Backend Repository](https://github.com/harshit2490/devTinder-backend)
- [DevTinder Frontend Repository](https://github.com/harshit2490/devTinder-frontend)

---

> ⚠️ **Note**: This chapter covers the **first half** of domain mapping. DNS record configuration (A/CNAME records), HTTPS setup, and Nginx domain config are pending.

---

<a id="key-topics"></a>

### Topics Covering

> 1. [Domain Purchase & DNS Overview](#topic-1)
> 2. [GoDaddy DNS Management](#topic-2)
> 3. [Cloudflare Setup & Name Server Migration](#topic-3)
> 4. [Pending Steps — What's Next](#topic-4)

---

<a id="topic-1"></a>

## 1. [Domain Purchase & DNS Overview](#key-topics)

### Why a Custom Domain?

| | EC2 Public IP | Custom Domain |
|--|--------------|--------------|
| **URL** | `http://54.123.45.67` | `http://devtinder.com` |
| **Professional** | ❌ Looks like a dev server | ✅ Branded and memorable |
| **Stable** | ❌ IP may change on restart | ✅ Domain stays the same |
| **SEO** | ❌ No search ranking | ✅ Indexable by search engines |

### How DNS Works — The Big Picture

```
User types: devtinder.com
       │
       ▼
  Browser asks DNS: "What IP is devtinder.com?"
       │
       ▼
  DNS lookup chain:
  Browser Cache → OS Cache → ISP DNS → Root DNS
       │                                    │
       │                                    ▼
       │                            Name Servers
       │                            (Cloudflare)
       │                                    │
       │                                    ▼
       │                            DNS Records
       │                            A: devtinder.com → 54.123.45.67
       │                                    │
       ◄────────────────────────────────────┘
       │
       ▼
  Browser connects to 54.123.45.67 (EC2 instance)
       │
       ▼
  Nginx serves DevTinder app
```

### Key DNS Concepts

| Term | What It Is |
|------|-----------|
| **Domain** | Human-readable address (e.g., `devtinder.com`) |
| **DNS** | Domain Name System — translates domains to IP addresses |
| **Name Servers (NS)** | Servers that hold DNS records for your domain |
| **A Record** | Maps domain → IP address (e.g., `devtinder.com → 54.123.45.67`) |
| **CNAME Record** | Maps domain → another domain (e.g., `www.devtinder.com → devtinder.com`) |
| **DNS Propagation** | Time for DNS changes to spread globally (minutes to hours) |

---

<a id="topic-2"></a>

## 2. [GoDaddy DNS Management](#key-topics)

### Step 1: Purchase a Domain

Buy a domain from **GoDaddy** (or any domain registrar like Namecheap, Google Domains, etc.).

### Step 2: Access DNS Settings

```
GoDaddy Dashboard
       │
       ▼
  My Products → Find your domain
       │
       ▼
  DNS Management
       │
       ▼
  View current DNS records & Name Servers
```

> 💡 By default, GoDaddy uses its own name servers. We'll change these to Cloudflare's for better DNS management, free SSL, and CDN.

---

<a id="topic-3"></a>

## 3. [Cloudflare Setup & Name Server Migration](#key-topics)

### Why Cloudflare Instead of GoDaddy DNS?

| Feature | GoDaddy DNS | Cloudflare DNS |
|---------|------------|---------------|
| **DNS Management** | Basic | Advanced + analytics |
| **Free SSL** | ❌ Paid | ✅ Free |
| **CDN** | ❌ No | ✅ Global CDN included |
| **DDoS Protection** | ❌ Limited | ✅ Built-in |
| **Speed** | Standard | ⚡ Faster DNS resolution |
| **Price** | Varies | Free tier available |

### Step 3: Add Domain to Cloudflare

```
Cloudflare Dashboard
       │
       ▼
  "Add a Site" → Enter your domain
       │
       ▼
  Cloudflare scans existing DNS records
       │
       ▼
  Select plan (Free tier works fine)
       │
       ▼
  Cloudflare provides 2 Name Servers:
  ┌──────────────────────────────────┐
  │  e.g., joel.ns.cloudflare.com   │
  │  e.g., lisa.ns.cloudflare.com   │
  └──────────────────────────────────┘
```

### Step 4: Update Name Servers in GoDaddy

```
GoDaddy Dashboard → DNS Management → Nameservers
       │
       ▼
  Change from: GoDaddy default NS
  Change to:   Cloudflare NS
  ┌───────────────────────────────────────┐
  │  NS 1: joel.ns.cloudflare.com        │
  │  NS 2: lisa.ns.cloudflare.com        │
  └───────────────────────────────────────┘
       │
       ▼
  Save → Wait for DNS propagation
  (can take a few minutes to a few hours)
```

### Name Server Migration Flow

```
Before:
  devtinder.com → GoDaddy NS → GoDaddy DNS records

After:
  devtinder.com → Cloudflare NS → Cloudflare DNS records
                                        │
                                        ▼
                                  (you manage DNS here now)
```

> ⚠️ After changing name servers, **all DNS management moves to Cloudflare**. Any changes to DNS records must be made in Cloudflare, not GoDaddy.

---

<a id="topic-4"></a>

## 4. [Pending Steps — What's Next](#key-topics)

The domain is now pointing to Cloudflare, but the following steps are still needed to complete the setup:

### Remaining Configuration

```
Current State:
  ✅ Domain purchased (GoDaddy)
  ✅ Cloudflare account created
  ✅ Name servers updated to Cloudflare
  ⬜ A record pointing to EC2 IP        ← next
  ⬜ HTTPS / SSL certificate             ← next
  ⬜ Nginx config for custom domain      ← next
  ⬜ www → non-www redirect              ← next
```

### What Each Pending Step Does

| Step | What | Why |
|------|------|-----|
| **A Record** | `devtinder.com → EC2 public IP` | Maps domain to your server |
| **SSL/HTTPS** | Cloudflare SSL or Let's Encrypt | Secure, encrypted connections |
| **Nginx Config** | `server_name devtinder.com` | Tell Nginx to respond to the domain |
| **www Redirect** | `www.devtinder.com → devtinder.com` | Consistent URL for users |

---

### Key Takeaways

- **Custom domains** make your app professional, memorable, and SEO-friendly — `devtinder.com` vs `54.123.45.67`
- **DNS** translates human-readable domains into IP addresses — the internet's phonebook
- **GoDaddy** for domain purchase; **Cloudflare** for DNS management (free SSL, CDN, DDoS protection)
- **Name Server migration**: Change GoDaddy NS → Cloudflare NS → manage all DNS from Cloudflare
- **DNS propagation** can take minutes to hours — be patient after making NS changes
- **Still pending**: A record (domain → IP), SSL/HTTPS, Nginx domain config, www redirect

---

<div align="center">

|                                                   ← Previous                                                    | [📑 Table of Contents](../README.md#part-10) |                                                        Next →                                                         |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [Chapter 34: Nginx and Backend Node App Deployment](../S3%2034%20-%20Nginx%20and%20backend%20Node%20App%20Development/Readme.md) |                                             | END |

</div>
