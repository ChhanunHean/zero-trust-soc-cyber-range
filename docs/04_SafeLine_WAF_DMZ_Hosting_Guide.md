# SafeLine WAF DMZ Hosting & Deployment Guide

**Host-Only IP:** `192.168.40.10`  
**Subnet Gateway:** `192.168.40.1` (OPNsense DMZ Interface `vtnet5`)  
**WAF Proxy Port:** `80` (HTTP) -> Upstream Web VM (`192.168.10.10:3000`)  
**WAF Admin Console:** `https://192.168.40.10:9443`  
**Public Ingress:** Cloudflare Tunnel (`https://testing.shadsyn.tech`)  
**Technology:** SafeLine WAF CE v9.4 (Chaitin Tech) Semantic Analysis Engine  

---

## 1. Overview & Security Objectives
SafeLine WAF Community Edition operates inside a dedicated **DMZ subnet (`192.168.40.0/24`)**. Rather than relying purely on brittle regular expressions (which are easily bypassed by obfuscated payloads), SafeLine parses HTTP requests into **Abstract Syntax Trees (AST)** using an intelligent semantic analysis engine.

Key defenses enforced at the DMZ layer:
- **Zero False-Positive SQL Injection (SQLi) & XSS Detection** via semantic code parsing.
- **Custom Blacklist Rules** blocking reconnaissance bots (`User-Agent: python-requests`) and sensitive environment probing (`/.env`).
- **Isolation Boundary:** Compromises on the Web VM cannot compromise the perimeter WAF, and attackers cannot reach internal services without traversing the WAF proxy.

```
       [ Public Internet / Attackers ]
                      │
                      ▼
        Cloudflare Zero Trust Edge
             (testing.shadsyn.tech)
                      │  (Cloudflare Tunnel)
                      ▼
          OPNsense Router / Firewall
                      │  (vtnet5 DMZ)
                      ▼
         SafeLine WAF VM (192.168.40.10)
    ┌─────────────────────────────────────────┐
    │  SafeLine CE Reverse Proxy (:80)        │
    │  Semantic Engine + AST Inspection       │
    │  Admin Dashboard (:9443)                │
    └────────────────────┬────────────────────┘
                         │ (Proxy to Upstream)
                         ▼
        Web Application VM (192.168.10.10:3000)
```

---

## 2. DMZ Network Configuration (Netplan)
Configure the SafeLine VM with static IP `192.168.40.10` and default gateway `192.168.40.1`:

```yaml
# /etc/netplan/00-installer-config.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s1:
      dhcp4: no
      addresses:
        - 192.168.40.10/24
      routes:
        - to: default
          via: 192.168.40.1
      nameservers:
        addresses:
          - 192.168.40.1
          - 1.1.1.1
```

Apply and verify:
```bash
sudo netplan apply
ip a show enp0s1
ping -c 3 192.168.40.1
```

---

## 3. Docker & SafeLine WAF Installation
Install Docker CE and deploy SafeLine CE using the automated installation pipeline:

```bash
# 1. Install prerequisites and Docker
sudo apt update && sudo apt install -y curl wget git net-tools
curl -fsSL https://get.docker.com | sudo bash -
sudo systemctl enable --now docker

# 2. Deploy SafeLine Community Edition
bash -c "$(curl -fsSLk https://waf.chaitin.com/release/latest/setup.sh)"
```

The script configures Docker Compose services under `/data/safeline/`.

Verify all SafeLine containers are running healthy:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected containers:
- `safeline-mgt`: Management console and REST API.
- `safeline-detector`: Semantic AST analysis engine.
- `safeline-tengine`: High-performance proxy engine.
- `safeline-pg`: Internal configuration database.
- `safeline-redis`: Session tracking and state cache.

---

## 4. Initial Admin Setup
1. Reset the initial administrator password:
   ```bash
   sudo docker exec -it safeline-mgt resetadmin
   ```
2. Open the SafeLine Web Console in your browser:
   ```
   https://192.168.40.10:9443
   ```
3. Log in with `admin` and the generated credentials.

---

## 5. Protected Website Configuration
In the SafeLine console, navigate to **Protected Websites** > **Add Website**:

- **Listening Port:** `80`
- **Domain / Hostname:** `*` or `testing.shadsyn.tech`
- **Upstream Server Address:** `http://192.168.10.10:3000` (or `http://192.168.10.10:8080`)
- **Proxy Protocol:** Keep default (HTTP/1.1)
- **Protection Mode:** `Block` (Full active prevention)

Click **Submit** to commit the upstream proxy rule.

---

## 6. Custom Blacklist Rules

Navigate to **Security Config** > **Blacklist / Whitelist** > **Custom Rules**:

### Rule 1: Block Sensitive File Probing (`.env`)
- **Rule Name:** `Block Env Probing`
- **Matching Condition:** `Path` starts with `/.env` or contains `/.git`
- **Action:** `Block (403 Forbidden)`

### Rule 2: Block Automated Python Scanners
- **Rule Name:** `Block Python Bot Scanners`
- **Matching Condition:** `Header: User-Agent` contains `python-requests`
- **Action:** `Block (403 Forbidden)`

---

## 7. Cloudflare Tunnel Integration
The Cloudflare Tunnel connects the public internet directly to SafeLine WAF port 80 without port forwarding.

On the host running `cloudflared` (Web VM or Gateway):
```yaml
# /etc/cloudflared/config.yml
tunnel: ef8843b3-2654-4410-9daa-7c1402ce5647
credentials-file: /root/.cloudflared/ef8843b3-2654-4410-9daa-7c1402ce5647.json

ingress:
  - hostname: testing.shadsyn.tech
    service: http://192.168.40.10:80
  - service: http_status:404
```

Restart cloudflared:
```bash
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
```

---

## 8. Verification & Attack Simulation

### 8.1 Legitimate Request
```bash
curl -I -H "User-Agent: Mozilla/5.0" https://testing.shadsyn.tech/
# Expected: HTTP/2 200 OK
```

### 8.2 SQL Injection Payload Test
```bash
curl -i "https://testing.shadsyn.tech/?id=1%20AND%201=1"
# Expected: HTTP/2 403 Forbidden (Blocked by SafeLine Semantic Engine)
```

### 8.3 Environment File Probe Test
```bash
curl -i "https://testing.shadsyn.tech/.env"
# Expected: HTTP/2 403 Forbidden (Blocked by Custom Blacklist Rule)
```

### 8.4 Automated Bot Scanner Test
```bash
curl -i -A "python-requests/2.31.0" "https://testing.shadsyn.tech/"
# Expected: HTTP/2 403 Forbidden (Blocked by User-Agent rule)
```

---

## 9. SafeLine Log Inspection
To view blocked events and forensic payloads in real-time:
```bash
# View WAF detection engine logs
docker logs -f safeline-detector

# View WAF proxy access logs
docker logs -f safeline-tengine
```
All intercepted requests are recorded with full attack details, client IP, payload breakdown, and confidence scores inside the SafeLine web dashboard.
