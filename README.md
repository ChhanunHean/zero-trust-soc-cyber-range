# 🛡️ Zero-Trust Enterprise Network Architecture & SOC Cyber Range

[![Architecture](https://img.shields.io/badge/Architecture-Defense--in--Depth-blue?style=for-the-badge&logo=shield)](https://github.com/ChhanunHean/zero-trust-soc-cyber-range)
[![Firewall](https://img.shields.io/badge/Perimeter-OPNsense-orange?style=for-the-badge&logo=opnsense)](https://opnsense.org/)
[![WAF](https://img.shields.io/badge/WAF-SafeLine%20(Chaitin)-green?style=for-the-badge&logo=nginx)](https://waf-ce.chaitin.cn/)
[![SIEM](https://img.shields.io/badge/SIEM%2FEIDR-Wazuh-blueviolet?style=for-the-badge&logo=wazuh)](https://wazuh.com/)
[![Edge](https://img.shields.io/badge/Zero--Trust%20Ingress-Cloudflare%20Tunnel-yellow?style=for-the-badge&logo=cloudflare)](https://cloudflare.com/)

> A fully virtualized, multi-tiered enterprise defensive network and Security Operations Center (SOC) testbed. Built from the ground up to evaluate network segmentation, automated Layer 7 web threat mitigation, stateful firewall policies, and centralized security telemetry.

---

## 1. Project Overview & Motivation

In modern enterprise and financial computing, flat networks and simple perimeter firewalls are obsolete. Once an attacker breaches an external boundary, unrestricted lateral movement allows immediate compromise of internal databases and identity providers.

### Project Goals:
1. **Network Engineering & Micro-segmentation:** Design and implement a segregated multi-tier virtualized infrastructure using **OPNsense** to enforce strict Access Control Lists (ACLs) between presentation, persistence, and management tiers.
2. **Layer 7 Threat Neutralization:** Deploy **SafeLine WAF** in a dedicated DMZ to inspect incoming HTTP payloads via semantic/Abstract Syntax Tree (AST) analysis, eliminating blind spots that Layer 3/4 firewalls cannot inspect.
3. **Zero-Trust Public Ingress:** Conceal origin IP addresses and eliminate public-facing open ports using **Cloudflare Zero-Trust Tunnels**.
4. **Defensive Telemetry (SOC Operations):** Integrate **Wazuh SIEM/HIDS** to collect centralized security events, file integrity changes, and audit logs.
5. **Red Team Verification:** Validate defensive posture using a custom-engineered multi-module reconnaissance scanner (**`SILKWEB / web_scan.py`**).

---

## ️2. High-Level Architecture Diagram

```
                                [ Public Internet / External Adversaries ]
                                                    │
                                                    ▼
                       ┌────────────────────────────────────────────────────────┐
                       │          Edge Layer: Cloudflare Zero Trust             │
                       │   (Public Hostname: testing.shadsyn.tech | TLS 1.3)   │
                       └────────────────────────────┬───────────────────────────┘
                                                    │ Outbound-only Encrypted Tunnel
                                                    ▼
                       ┌────────────────────────────────────────────────────────┐
                       │          Perimeter Firewall / Router: OPNsense         │
                       │     (Stateful Packet Inspection / Inter-VLAN ACLs)     │
                       └──────┬──────────────────────┬───────────────────┬──────┘
                              │                      │                   │
                  vtnet5: 192.168.40.0/24   vtnet2: 192.168.10.0/24      │
                              │                      │                   │
                              ▼                      ▼                   │
                  ┌──────────────────────┐   ┌──────────────────────┐    │
                  │   WAF DMZ Tier:      │   │   Application Tier:  │    │
                  │   SafeLine WAF       ├──►│  Northwind Bank App  │    │
                  │ (Semantic Analysis)  │   │  (Next.js / Express) │    │
                  └──────────────────────┘   └──────────┬───────────┘    │
                                                        │                │
                                             vtnet3: 192.168.20.0/24     │
                                                        │                │
                                                        ▼                │
                                             ┌──────────────────────┐    │
                                             │   Database Tier:     │    │
                                             │   PostgreSQL + Redis │    │
                                             │ (Cardholder Data/PII)│    │
                                             └──────────────────────┘    │
                                                                         │
                                                              vtnet4: 192.168.30.0/24
                                                                         │
                                                                         ▼
                                                             ┌──────────────────────┐
                                                             │   Security & SOC:    │
                                                             │   Wazuh SIEM / EDR   │
                                                             │ (Event Log Collector)│
                                                             └──────────────────────┘
```

---

## 3. Subnet & Network Allocation Matrix

| Interface | Subnet CIDR | Zone / Tier | Primary Role & Description |
| :--- | :--- | :--- | :--- |
| **`vtnet0`** | `WAN (DHCP)` | Internet Gateway | Connects OPNsense upstream; no public inbound ports exposed. |
| **`vtnet1`** | `192.168.64.0/24` | Management (LAN) | Administrative access for network engineers and OPNsense Web GUI. |
| **`vtnet5`** | `192.168.40.0/24` | WAF DMZ | Houses **SafeLine WAF** reverse proxy node (`192.168.40.10`). |
| **`vtnet2`** | `192.168.10.0/24` | Presentation (Web) | Houses **Northwind Bank** Next.js frontend & API (`192.168.10.10:3000`). |
| **`vtnet3`** | `192.168.20.0/24` | Persistence (DB) | Houses **PostgreSQL 16 & Redis 7** cluster (`192.168.20.20`). |
| **`vtnet4`** | `192.168.30.0/24` | Security Operations | Houses **Wazuh SIEM & HIDS Manager** for centralized log collection. |
| **`tailscale0`** | Virtual Mesh | Remote Tellers & SOC | Encrypted Zero-Trust WireGuard tunnel for hybrid workforce access. |

---

## 4. Core Defensive Components

### 1. Edge Layer: Cloudflare Zero-Trust Tunnel
* **Origin Concealment:** Instead of traditional port forwarding on a physical home/campus router, an outbound-only daemon (`cloudflared`) connects to Cloudflare's global network edge.
* **Attack Surface Elimination:** Zero inbound ports (`80/443`) are opened on the host network, mitigating direct IP discovery and Layer 3/4 SYN floods.
* **Edge TLS 1.3:** Cryptographic termination occurs at the edge utilizing modern cipher suites (`TLS_AES_256_GCM_SHA384`).

### 2. Application Layer: SafeLine WAF (Chaitin Tech)
* **Semantic Analysis Engine:** Unlike traditional regex-based WAFs (such as ModSecurity) which suffer from bypasses and high false-positive rates, SafeLine utilizes Abstract Syntax Tree (AST) parsing to evaluate payload logic.
* **Active Protection Modules:**
  * Automated SQL Injection (SQLi) & Cross-Site Scripting (XSS) suppression.
  * Custom blacklist rules: Blocking sensitive configuration harvesting (`/.env`, `config.json`).
  * Bot & Automated Crawler mitigation (User-Agent enforcement & CC rate-limiting).

### 3. Perimeter & Network Isolation: OPNsense
* **Stateful Packet Filtering:** Enforces strict one-way communication paths:
  * External requests can **only** hit the SafeLine DMZ on port 80.
  * SafeLine can **only** forward inspected requests to the Web Application on port 3000.
  * The Web Application is the **only** entity permitted to query PostgreSQL on port 5432.
  * Direct external traffic to the Database tier is completely dropped, preventing unauthorized data exfiltration.

### 4. Application & Data Tier: Northwind Banking System
* **Frontend:** Next.js 14 App Router, React 18, Tailwind CSS.
* **Backend:** Node.js, Express, TypeScript, Prisma ORM.
* **Data Storage:** PostgreSQL 16 (relational customer balances & transactions) and Redis 7 (session caching).
* **Security Controls:** Bcrypt password hashing, session tokens stored in `httpOnly` and `SameSite` cookies.

---

## 5. Empirical Verification & Attack Testing

Defenses were rigorously validated by simulating real-world adversary behaviors:

### Test 1: SQL Injection (OWASP A03:2021)
```bash
curl -I "https://testing.shadsyn.tech/?id=1%20AND%201=1"
```
* **Result:** `HTTP/2 403 Forbidden`
* **SafeLine Action:** Semantic engine recognized SQL tautology logic and dropped connection before reaching Express/Postgres.

### Test 2: Sensitive Configuration Probing (`.env` Leaks)
```bash
curl -I https://testing.shadsyn.tech/.env
```
* **Result:** `HTTP/2 403 Forbidden`
* **SafeLine Action:** Custom blacklist rule `Block Env Probing` intercepted the probe. Logged attacker IP (`36.37.140.212`), origin (`KH`), and request headers.

### Test 3: Red Team Automated Reconnaissance (`SILKWEB`)
Audited using custom Python penetration testing tool **`SILKWEB (web_scan.py)`**:
* **Before WAF Policy:** Discovered 24 internal routes, crawler harvested static chunks and application endpoints.
* **After WAF Rule Enforcement (`Block Python Bot Scanners`):** 
  * Scanner requests dropped to **`403 Forbidden`**.
  * Crawled links dropped from **24 down to 1** (SafeLine block challenge page).
  * Backend API endpoints remained completely hidden.

---

## 6. Technology Stack & Tools

* **Hypervisor:** QEMU / UTM (Apple Silicon ARM64 & x86_64 virtualization)
* **Operating Systems:** Ubuntu Server 22.04 LTS, Ubuntu Desktop 26.04, FreeBSD (OPNsense)
* **Firewall / Routing:** OPNsense 26.1, Netplan, pf (Packet Filter)
* **Web Security:** SafeLine CE v9.4, Cloudflare Zero Trust
* **Monitoring & SIEM:** Wazuh 4.x, PM2 Process Manager, Docker Engine 29.x
* **Auditing Tool:** Custom Python Security Scanner (`SILKWEB`)

---

## 👨‍💻 Author

**Chhanun Hean**  
*Cybersecurity & Network Engineering Student*  
Cambodia Academy of Digital Technology (CADT)  
GitHub: [@ChhanunHean](https://github.com/ChhanunHean)
