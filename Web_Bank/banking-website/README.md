# 🏦 Northwind Bank — Full-Stack Banking Website

A modern, secure, full-stack banking web application built from the
[Banking Website Structure Plan](../Banking_Website_Structure_Plan.md).

> **Educational demo only.** This is not a real bank and must not be used with real
> financial data.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT (access + refresh) in httpOnly cookies, bcrypt hashing, sessions |
| **Security** | Helmet, CORS, rate limiting, Zod validation, RBAC, audit logging |

---

## Features

**Public site**
- Homepage with hero, products, trust/security, and CTAs
- Products & Services catalog (savings, checking, cards, loans)
- About, News & Insights, Contact (form + FAQ), Apply Online (+ tracker)
- Legal pages (privacy, terms, security, accessibility)

**Online banking portal (authenticated)**
- Register / login / logout with MFA toggle and password change
- Dashboard: account cards, quick actions, recent transactions, spending insights, alerts
- Accounts list + account detail with CSV statement export
- Transfers: internal, domestic, and international (with fees) + scheduling
- Transaction history with search, filters, and pagination
- Bill Pay: manage billers and pay bills with payment history
- Beneficiary management (domestic + international)
- Notifications center
- Settings: profile, MFA, password

---

## Project Structure

```
banking-website/
├── backend/                 # Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Demo data
│   └── src/
│       ├── config/           # Env config
│       ├── lib/              # Prisma client
│       ├── middleware/       # Auth, validation, errors, rate limiting
│       ├── routes/           # API endpoints
│       ├── services/         # Audit logging
│       ├── utils/            # JWT, password, helpers, serializers
│       ├── app.ts            # Express app
│       └── index.ts          # Server entry
├── frontend/                # Next.js app
│   └── src/
│       ├── app/
│       │   ├── (site)/       # Public marketing pages
│       │   ├── (auth)/       # Login / register
│       │   └── (portal)/     # Authenticated banking portal
│       ├── components/       # Shared UI
│       └── lib/              # API client, auth context, types, formatters
├── docker-compose.yml       # PostgreSQL + Redis
└── package.json             # Root scripts
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL) — or a local PostgreSQL instance

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Start the database

```bash
npm run db:up        # starts PostgreSQL + Redis via Docker
```

> No Docker? Install PostgreSQL locally and update `backend/.env`'s `DATABASE_URL`.

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

The defaults already match the Docker setup, so no edits are needed for local dev.

### 4. Set up the schema and seed demo data

```bash
npm run db:setup     # runs Prisma migrations + seeds demo data
```

### 5. Run the app

```bash
npm run dev          # starts backend (:4000) and frontend (:3000)
```

Open **http://localhost:3000**.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | `demo@bank.com` | `Password123` |
| Admin | `admin@bank.com` | `Password123` |

The customer account comes pre-loaded with funded accounts, ~40 transactions,
beneficiaries, billers, and notifications.

---

## API Overview

Base URL: `http://localhost:4000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account (auto-creates checking + savings) |
| POST | `/auth/login` | Log in |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Log out |
| GET | `/auth/me` | Current user |
| POST | `/auth/change-password` | Change password |
| GET | `/accounts` | List accounts |
| GET | `/accounts/:id` | Account detail |
| GET | `/accounts/:id/transactions` | Account statement |
| GET | `/accounts/insights/spending` | 30-day spending by category |
| GET | `/transactions` | Filterable transaction history |
| GET/POST | `/transfers` | List / create transfers |
| GET/POST/DELETE | `/beneficiaries` | Manage beneficiaries |
| GET/POST/DELETE | `/billers` | Manage billers |
| POST | `/billers/pay` | Pay a bill |
| GET | `/billers/payments` | Payment history |
| GET/POST | `/notifications` | Notifications |
| GET/POST | `/applications` | Applications (+ `/track/:ref`) |
| PATCH | `/profile` | Update profile |

---

## Security Notes

This demo implements many of the controls from the plan: encryption in transit,
hashed passwords, JWT sessions with refresh rotation, RBAC, server-side validation,
CSRF-resistant cookie settings, rate limiting, and immutable audit logs. For a real
production banking system you would additionally need TLS termination, a WAF, real MFA
(OTP/authenticator), PCI-DSS-compliant infrastructure, penetration testing, and more.

## Useful scripts

```bash
npm run dev                       # run both apps
npm --prefix backend run prisma:studio   # browse the database
npm run db:down                   # stop the database
```
