# Zero-Trust Banking Lab Architecture & Defense-in-Depth Specification

**Author / Maintainer:** Chhanun Hean  
**Scope:** Multi-Tier Banking Cyber Range, Enterprise SOC Monitoring, and Zero-Trust Perimeters  
**Live Target Domain:** `https://testing.shadsyn.tech` (Cloudflare Tunnel: `ef8843b3-2654-4410-9daa-7c1402ce5647`)  

---

## 1. Executive Summary
This architecture provides a fully segmented, enterprise-grade cyber range that simulates a core digital banking environment. Built to bridge the gap between network design and active security operations center (SOC) response, the lab demonstrates defense-in-depth across six distinct layers:
1. **Edge Defense & Encryption:** Cloudflare Zero Trust (DDoS protection, Edge SSL, Tunnel ingress).
2. **Perimeter Firewall & Network Routing:** OPNsense router with strict stateful firewalling and inter-VLAN controls.
3. **DMZ Web Application Firewall:** SafeLine WAF CE v9.4 employing semantic Abstract Syntax Tree (AST) inspection to eliminate false positives.
4. **Application Tier:** Next.js 14 frontend and Express REST API run via PM2 with internal Nginx reverse-proxying.
5. **Data Isolation Tier:** PostgreSQL 16 database completely isolated from internet access with strict host-based firewalling (UFW) and SCRAM-SHA-256 authentication.
6. **Unified SOC & Automated Threat Response:** Centralized Wazuh SIEM ingesting logs from all endpoints with automated active-response IP bans and Suricata IDS/IPS packet inspection.

---

## 2. Global Network Addressing & Topology Map

```
                                [ PUBLIC INTERNET ]
                                         │
                                         ▼
                     Cloudflare Zero Trust (testing.shadsyn.tech)
                     - DDoS Protection & Edge Anycast SSL
                     - Ingress via cloudflared tunnel
                                         │
                                         ▼
   ╔════════════════════════════════════════════════════════════════════════════╗
   ║               OPNsense Gateway / Firewall (192.168.64.2)                   ║
   ║               Suricata IDS/IPS Engine & Tailscale Subnet Router            ║
   ╚═══════╤═════════════════════╤══════════════════════╤═════════════════════╤═╝
           │                     │                      │                     │
           │ (vtnet5 - DMZ)      │ (vtnet2 - Web)       │ (vtnet3 - DB)       │ (vtnet4 - SOC)
           ▼                     ▼                      ▼                     ▼
   ┌───────────────┐     ┌───────────────┐      ┌───────────────┐     ┌───────────────┐
   │ SafeLine WAF  │     │    Web VM     │      │  Database VM  │     │   Wazuh VM    │
   │ 192.168.40.10 │     │ 192.168.10.10 │      │ 192.168.20.20 │     │ 192.168.30.30 │
   ├───────────────┤     ├───────────────┤      ├───────────────┤     ├───────────────┤
   │ Port: 80 WAF  │     │ Next.js :3000 │      │ Postgres:5432 │      │ Dashboard:443 │
   │ Port: 9443 UI │     │ Express :4000 │      │ Redis: 6379   │      │ Manager: 1514 │
   │ AST Semantic  │     │ Nginx:8080/81 │      │ Isolated UFW  │      │ Rule Engine   │
   │ Docker CE     │     │ Wazuh Agent   │      │ Wazuh Agent   │      │ SIEM Manager  │
   └───────┬───────┘     └───────┬───────┘      └───────▲───────┘     └───────▲───────┘
           │                     │                      │                     │
           └─────────────────────┴──────────────────────┴─────────────────────┘
                                  Central Telemetry Ingestion
```

### 2.1 Interface & IP Addressing Matrix

| System / Node | Physical/Virtual Nic | Subnet CIDR | IP Address | Gateway | Role & Exposed Services |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OPNsense Core** | `vtnet0` (WAN) | DHCP | Dynamic | ISP Gateway | Public outbound NAT / Ingress |
| **OPNsense Core** | `vtnet1` (LAN) | `192.168.64.0/24` | `192.168.64.2` | — | Management GUI & Admin network |
| **OPNsense Core** | `vtnet2` (Web) | `192.168.10.0/24` | `192.168.10.1` | — | Web tier gateway |
| **OPNsense Core** | `vtnet3` (DB) | `192.168.20.0/24` | `192.168.20.1` | — | Database tier gateway |
| **OPNsense Core** | `vtnet4` (SOC) | `192.168.30.0/24` | `192.168.30.1` | — | Security monitoring gateway |
| **OPNsense Core** | `vtnet5` (DMZ) | `192.168.40.0/24` | `192.168.40.1` | — | SafeLine WAF perimeter gateway |
| **SafeLine WAF** | `enp0s1` (DMZ) | `192.168.40.0/24` | `192.168.40.10` | `192.168.40.1` | Reverse proxy :80, Admin :9443 |
| **Web VM** | `enp0s1` (Web) | `192.168.10.0/24` | `192.168.10.10` | `192.168.10.1` | Next.js :3000, Express :4000, Nginx :8080/81 |
| **Database VM** | `enp0s1` (DB) | `192.168.20.0/24` | `192.168.20.20` | `192.168.20.1` | PostgreSQL :5432, Redis :6379 |
| **Wazuh Manager**| `enp0s1` (SOC) | `192.168.30.0/24` | `192.168.30.30` | `192.168.30.1` | Manager :1514, API :55000, Dashboard :443 |

---

## 3. Zero-Trust Access Control & Firewall Policy Matrix
To enforce strict microsegmentation, all inter-VLAN routing is blocked by default. Traffic is only permitted across designated interfaces on explicit ports:

```
+---------------------------------------------------------------------------------------------+
| Source Interface      | Dest Interface     | Protocol | Destination Port | Action | Purpose |
+---------------------------------------------------------------------------------------------+
| Any (Tunnel)          | DMZ (SafeLine)     | TCP      | 80               | PASS   | Public  |
| DMZ (192.168.40.10)   | Web (192.168.10.10)| TCP      | 3000, 8080       | PASS   | Proxy   |
| Web (192.168.10.10)   | DB (192.168.20.20) | TCP      | 5432             | PASS   | SQL     |
| All VM Subnets        | SOC (192.168.30.30)| TCP/UDP  | 1514, 1515       | PASS   | SIEM    |
| DB (192.168.20.20)    | WAN (Internet)     | ANY      | ANY              | BLOCK  | Zero-T  |
| WAN (Internet)        | Internal Subnets   | ANY      | ANY              | BLOCK  | Default |
+---------------------------------------------------------------------------------------------+
```

---

## 4. SOC Telemetry, Wazuh SIEM & Active Threat Response

### 4.1 Deployed Wazuh Agents
- **Agent 004 (`database`):** Ingests PostgreSQL connection logs, authentication attempts, UFW drop counters, and SSH audits.
- **Agent 005 (`web`):** Ingests Nginx frontend and API access logs (`/var/log/nginx/*`), PM2 error logs, and system audit logs.
- **Agent 006 (`OPNsense.internal`):** Ingests Suricata IDS/IPS alerts from `/var/log/suricata/eve.json` and packet drop counters.

### 4.2 Custom Behavioral Detection Rules (`local_rules.xml`)
```xml
<group name="banking_app,">
  <!-- Rule 100010: Detect single authentication failure -->
  <rule id="100010" level="5">
    <if_sid>31101</if_sid>
    <url>/api/auth/login</url>
    <description>Banking App: Login attempt or failure detected</description>
    <group>authentication_failed,</group>
  </rule>

  <!-- Rule 100011: Detect Brute Force attack (5 failures in 60s) -->
  <rule id="100011" level="10" frequency="5" timeframe="60">
    <if_matched_sid>100010</if_matched_sid>
    <same_source_ip/>
    <description>Banking App: Brute force credential stuffing attack detected from $(srcip)</description>
    <group>authentication_failures,attack,</group>
  </rule>
</group>
```

### 4.3 Automated Active Response (`ossec.conf`)
When Rule `100011` fires, Wazuh executes an automated active-response script on the Web VM (`agent_id: 005`) executing `firewall-drop` via `iptables` against the attacker's IP for 60 seconds.

---

## 5. Threat Vectors & Defense Verification Table

| Attack Vector | Simulated Command / Payload | Intercepting Control | Resulting Action & Log Evidence |
| :--- | :--- | :--- | :--- |
| **SQL Injection (SQLi)** | `/?id=1 AND 1=1` | SafeLine WAF AST Engine | **403 Forbidden**. Logged in `safeline-detector` with syntax confidence score. |
| **Credential Stuffing** | Rapid POST loop to `/api/auth/login` | Wazuh Rule 100011 + Active Response | **iptables DROP**. `firewall-drop` triggered on Web VM; attacker connection dropped. |
| **Env File Probing** | `GET /.env` or `GET /.git/config` | SafeLine Blacklist Rule | **403 Forbidden**. Matched path prefix blacklist; dropped before hitting Web VM. |
| **Bot Scanning** | `User-Agent: python-requests/2.31.0` | SafeLine Blacklist Rule | **403 Forbidden**. Matched header signature rule. |
| **Network Sniffing** | Promiscuous capture on DMZ/Web | OPNsense Isolated VLANs | Attacker cannot view DB traffic or management traffic across interfaces. |
