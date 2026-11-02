# Database Server Hosting Guide (Database VM)

**Host-Only IP:** `192.168.20.20`  
**Subnet Gateway:** `192.168.20.1` (OPNsense Database Interface `vtnet3`)  
**Allowed Client:** Web VM only (`192.168.10.10`)  
**Service:** PostgreSQL 16 + Redis 7  

---

## 1. Overview & Security Objectives
The Database VM stores customer accounts, transaction ledgers, credential hashes, and audit tables. Under our Zero-Trust architecture, this server has **no direct route to the internet** and does not accept connections from the outside world or general LAN users. **Only the Web Application VM (`192.168.10.10`) is permitted to connect.**

---

## 2. Network Configuration (Netplan)
Ensure static IP assignment and default gateway pointing to OPNsense:

```yaml
# /etc/netplan/00-installer-config.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s1:
      dhcp4: no
      addresses:
        - 192.168.20.20/24
      routes:
        - to: default
          via: 192.168.20.1
      nameservers:
        addresses:
          - 192.168.20.1
          - 1.1.1.1
```

Apply network settings:
```bash
sudo netplan apply
ip a show enp0s1
ping -c 3 192.168.20.1
```

---

## 3. PostgreSQL Installation & Setup

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

### Create Banking Database and User:
```bash
sudo -u postgres psql << 'EOF'
CREATE USER banking WITH PASSWORD 'StrongBankingPass123!';
CREATE DATABASE banking OWNER banking;
GRANT ALL PRIVILEGES ON DATABASE banking TO banking;
\c banking
GRANT ALL ON SCHEMA public TO banking;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO banking;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO banking;
EOF
```

---

## 4. Multi-Layer Access Control (Least Privilege)

### Layer 1: PostgreSQL Listen Configuration
Configure PostgreSQL to listen across the internal network interface:
```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
# Set:
listen_addresses = '*'
```

### Layer 2: Host-Based Authentication (`pg_hba.conf`)
Restrict database login authorization strictly to the Web VM's IP address:
```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Append at the bottom:
host    banking    banking    192.168.10.10/32    scram-sha-256
```
Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Layer 3: Host Firewall (`ufw`)
Ensure local firewall rules on the Database VM drop any non-Web VM traffic:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.10.10 to any port 5432 proto tcp
sudo ufw allow 22/tcp comment 'SSH from Management'
sudo ufw enable
```

---

## 5. OPNsense Firewall Policy (Network Layer)
In the OPNsense Web GUI (`https://192.168.64.2`):
* **Interface:** `Database (vtnet3)`
* **Rule:** `Pass` | Protocol: `TCP` | Source: `192.168.10.10/32` | Destination: `192.168.20.20/32` | Port: `5432`
* Place this rule above the default block rule and click **Apply Changes**.

---

## 6. Verification & Health Checks

### From Database VM:
```bash
PGPASSWORD='StrongBankingPass123!' psql -h localhost -U banking -d banking -c "SELECT 1 AS status;"
```

### From Web VM (`192.168.10.10`):
```bash
nc -vz 192.168.20.20 5432
PGPASSWORD='StrongBankingPass123!' psql -h 192.168.20.20 -U banking -d banking -c "SELECT version();"
```
*(Both tests must return successful connection).*
