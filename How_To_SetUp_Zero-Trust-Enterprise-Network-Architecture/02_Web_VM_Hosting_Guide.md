# Web Server Hosting Guide (Web VM)

**Host-Only IP:** `192.168.10.10`  
**Subnet Gateway:** `192.168.10.1` (OPNsense Web Interface `vtnet2`)  
**Database Server:** `192.168.20.20:5432`  
**SafeLine WAF DMZ:** `192.168.40.10:80`  
**Services:** Next.js Frontend (port 3000), Express Backend API (port 4000), Prisma Studio (port 5555), Wazuh Agent  

---

## 1. Overview & Architecture Role
The Web VM hosts the core banking portal. It processes customer authentication, account overview, funds transfers, and administrative actions. 

In this multi-tier architecture:
- Next.js runs on port `3000` and Express API runs on port `4000`.
- Nginx reverse-proxies them internally to ports `8080` (Frontend) and `8081` (API).
- Direct inbound HTTP traffic is filtered through the **SafeLine WAF DMZ (`192.168.40.10`)** and protected externally by **Cloudflare Zero Trust (`https://testing.shadsyn.tech`)**.
- The Web VM connects outbound to the Database VM (`192.168.20.20:5432`) across OPNsense firewall routing.

```
+-------------------------------------------------------------+
|                     Web VM (192.168.10.10)                  |
|                                                             |
|  +-----------------------+       +-----------------------+  |
|  |   Next.js Frontend    |       |   Express Backend API |  |
|  |     Port: 3000        |       |     Port: 4000        |  |
|  +-----------^-----------+       +-----------^-----------+  |
|              |                               |              |
|  +-----------+-----------+       +-----------+-----------+  |
|  | Nginx Proxy (:8080)   |       | Nginx Proxy (:8081)   |  |
|  +-----------^-----------+       +-----------^-----------+  |
|              |                               |              |
+--------------|-------------------------------|--------------+
               |                               |
       From SafeLine WAF DMZ          To PostgreSQL DB
       (192.168.40.10)               (192.168.20.20:5432)
```

---

## 2. Network Verification
The Web VM's static IP and gateway must point to OPNsense:

```yaml
# /etc/netplan/00-installer-config.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s1:
      dhcp4: no
      addresses:
        - 192.168.10.10/24
      routes:
        - to: default
          via: 192.168.10.1
      nameservers:
        addresses:
          - 192.168.10.1
          - 1.1.1.1
```

Confirm interface and gateway reachability:
```bash
ip a show enp0s1
ip route show
ping -c 3 192.168.10.1
```

---

## 3. Node.js Runtime & PM2 Setup
Install Node.js 20 LTS and PM2 process supervisor:

```bash
# NodeSource Node.js 20 LTS repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# Verify versions
node -v    # v20.x.x
npm -v     # v10.x.x

# Install PM2 globally
sudo npm install -g pm2
```

---

## 4. Deploying Application Code
Clone the repository and install all dependencies:

```bash
cd /home/chhanun
git clone https://github.com/ChhanunHean/Web_Bank.git
cd /home/chhanun/Web_Bank/banking-website

# Install root, backend, and frontend dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## 5. Environment Variables Configuration

### 5.1 Backend Environment (`backend/.env`)
```bash
cat > /home/chhanun/Web_Bank/banking-website/backend/.env << 'EOF'
DATABASE_URL="postgresql://banking:StrongPassword123@192.168.20.20:5432/banking?schema=public"
CLIENT_ORIGIN="http://192.168.10.10:8080"
PORT=4000
JWT_ACCESS_SECRET="bank-corp-production-jwt-access-secret-key-32bytes-min"
JWT_REFRESH_SECRET="bank-corp-production-jwt-refresh-secret-key-32bytes-min"
NODE_ENV=production
EOF
```

> **Note on Origins:** For public production routing via Cloudflare and SafeLine, set `CLIENT_ORIGIN="https://testing.shadsyn.tech"`. For direct internal lab testing, set `CLIENT_ORIGIN="http://192.168.10.10:8080"`.

### 5.2 Frontend Environment (`frontend/.env.local`)
```bash
cat > /home/chhanun/Web_Bank/banking-website/frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://192.168.10.10:8081/api
EOF
```
> For public routing via Cloudflare Tunnel, set `NEXT_PUBLIC_API_URL=https://testing.shadsyn.tech/api`.

---

## 6. Database Connectivity & Prisma Migrations
Verify the PostgreSQL connection from the Web VM before starting the backend:

```bash
cd /home/chhanun/Web_Bank/banking-website/backend

# Test connectivity to DB VM
nc -vz 192.168.20.20 5432

# Generate Prisma Client & push schema
npx prisma generate
npx prisma db push

# Seed initial bank accounts and demo users
npx prisma db seed
```

**Demo Credentials Seeded:**
- **Customer Account:** `demo@bank.com` / `Password123`
- **Administrator Account:** `admin@bank.com` / `Password123`

---

## 7. Build and Start Services with PM2

### 7.1 Build the Next.js Production Bundle
```bash
cd /home/chhanun/Web_Bank/banking-website/frontend
npm run build
```

### 7.2 Launch and Persist with PM2
```bash
cd /home/chhanun/Web_Bank/banking-website

# Start backend on :4000
pm2 start npm --name "banking-backend" -- run start --prefix backend

# Start frontend on :3000
pm2 start npm --name "banking-frontend" -- run start --prefix frontend

# Optional: Start Prisma Studio on :5555
pm2 start npm --name "banking-studio" -- run studio --prefix backend

# Save process list and enable systemd auto-start
pm2 save
pm2 startup
# (Run the exact sudo env PATH=... line that PM2 outputs)
```

---

## 8. Verification & Local Health Checks
```bash
# Check running PM2 processes
pm2 list

# Test Backend API health endpoint
curl -s http://localhost:4000/api/health | jq .

# Test Frontend HTTP response
curl -I http://localhost:3000

# Test authentication endpoint directly
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://192.168.10.10:8080" \
  -d '{"identifier":"demo@bank.com","password":"Password123"}' | jq .
```

---

## 9. Troubleshooting & Maintenance

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| `nc -vz 192.168.20.20 5432` hangs | OPNsense rule or UFW blocking | Verify OPNsense Web -> DB rule allows port 5432; check DB VM `sudo ufw status`. |
| `P1001: Can't reach database server` | Incorrect `DATABASE_URL` or DB service down | Verify credentials in `backend/.env`; ensure `postgresql` is active on DB VM. |
| `CORS Error` in Browser Console | `CLIENT_ORIGIN` mismatch | Update `CLIENT_ORIGIN` in `backend/.env` to match the exact browser URL and restart backend. |
| Disk space full during `npm run build` | LVM/Partition size reached | Check `df -h`. On UTM Ubuntu VMs, run `sudo growpart /dev/vda 3 && sudo resize2fs /dev/vda3`. |
| Port 3000 or 4000 already bound | Zombie Node processes | Run `sudo kill -9 $(sudo lsof -t -i:3000 -i:4000)` then `pm2 restart all`. |
