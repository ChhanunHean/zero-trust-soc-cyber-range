# Nginx Internal Reverse Proxy & Logging Guide (Web VM)

**Host-Only IP:** `192.168.10.10`  
**Internal Frontend Proxy:** Port `8080` -> Next.js (`127.0.0.1:3000`)  
**Internal API Proxy:** Port `8081` -> Express (`127.0.0.1:4000`)  
**Security Role:** Upstream gateway, header normalization, access log forwarding for SIEM (Wazuh)  

---

## 1. Overview & Architectural Role
Within the Web VM (`192.168.10.10`), Nginx functions as the host-level reverse proxy. Rather than directly exposing the Node.js development runtimes to external callers or WAF relays, Nginx:
1. Listens on distinct ports (`8080` for the Web UI, `8081` for the Backend REST API).
2. Sets proper proxy headers (`CF-Connecting-IP`, `X-Real-IP`, `X-Forwarded-For`).
3. Writes structured access logs to `/var/log/nginx/` which are actively ingested by the host's Wazuh Agent for intrusion detection and brute-force triggering.

```
       Inbound HTTP from SafeLine WAF DMZ (192.168.40.10)
                               |
                +--------------+--------------+
                |                             |
      Port 8080 (Frontend)          Port 8081 (Backend API)
                |                             |
     [ Nginx Proxy Server ]        [ Nginx Proxy Server ]
                |                             |
        Logs: frontend-access.log     Logs: api-access.log
                |                             |
      127.0.0.1:3000 (Next.js)      127.0.0.1:4000 (Express)
```

---

## 2. Installation & Baseline Service Setup
Install Nginx on the Web VM and verify the service status:

```bash
sudo apt update && sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo systemctl status nginx
```

---

## 3. Configuring the Banking Proxy Sites
Create the custom Nginx server configuration:

```bash
sudo nano /etc/nginx/sites-available/banking
```

Insert the following virtual host blocks:

```nginx
# =========================================================================
# 1. FRONTEND REVERSE PROXY (Port 8080 -> Next.js 3000)
# =========================================================================
server {
    listen 8080;
    server_name _;

    access_log /var/log/nginx/banking-frontend-access.log;
    error_log  /var/log/nginx/banking-frontend-error.log warn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket & connection upgrade support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Client IP header forwarding
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# =========================================================================
# 2. BACKEND API REVERSE PROXY (Port 8081 -> Express 4000)
# =========================================================================
server {
    listen 8081;
    server_name _;

    access_log /var/log/nginx/banking-api-access.log;
    error_log  /var/log/nginx/banking-api-error.log warn;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;

        # Client IP header forwarding
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;

        # Buffer settings for larger payloads
        client_max_body_size 10M;
    }
}
```

Enable the configuration and disable the default site:
```bash
sudo ln -sf /etc/nginx/sites-available/banking /etc/nginx/sites-enabled/banking
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. OPNsense Firewall Access Rules
To allow traffic from the DMZ WAF (`192.168.40.10`) or direct testing clients across the OPNsense Web interface:

1. Log into OPNsense at `https://192.168.64.2`
2. Navigate to **Firewall** > **Rules** > **Web (vtnet2)**
3. Add an inbound rule:
   - **Action:** Pass
   - **Interface:** Web
   - **Direction:** in
   - **Protocol:** TCP
   - **Source:** DMZ Net or Any
   - **Destination:** `192.168.10.10`
   - **Destination Port Range:** `8080` - `8081`
   - **Description:** Allow Web and API Reverse Proxy Ports
4. Click **Save** and **Apply Changes**.

---

## 5. Verification & Log Streaming
Confirm both reverse proxies forward traffic properly to the underlying Node processes:

```bash
# Verify Frontend HTTP 200
curl -I http://localhost:8080

# Verify Backend API health check
curl -s http://localhost:8081/api/health

# Verify real-time access log ingestion
sudo tail -f /var/log/nginx/banking-api-access.log
```

---

## 6. Wazuh SIEM Log Integration
To feed these access logs into the central SOC monitoring engine, ensure the `/var/ossec/etc/ossec.conf` file on the Web VM includes the following log blocks:

```xml
<localfile>
  <log_format>apache</log_format>
  <location>/var/log/nginx/banking-frontend-access.log</location>
</localfile>

<localfile>
  <log_format>apache</log_format>
  <location>/var/log/nginx/banking-api-access.log</location>
</localfile>

<localfile>
  <log_format>apache</log_format>
  <location>/var/log/nginx/banking-api-error.log</location>
</localfile>
```

Restart the agent after modifying configuration:
```bash
sudo systemctl restart wazuh-agent
```
