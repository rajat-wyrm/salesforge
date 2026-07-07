# SalesForge — B2B SaaS Sales Platform

[![Backend CI](https://github.com/rajat-wyrm/salesforge/actions/workflows/backend.yml/badge.svg)](https://github.com/rajat-wyrm/salesforge/actions/workflows/backend.yml)
[![Frontend CI](https://github.com/rajat-wyrm/salesforge/actions/workflows/frontend.yml/badge.svg)](https://github.com/rajat-wyrm/salesforge/actions/workflows/frontend.yml)
[![Full Stack CI](https://github.com/rajat-wyrm/salesforge/actions/workflows/ci.yml/badge.svg)](https://github.com/rajat-wyrm/salesforge/actions/workflows/ci.yml)

A complete B2B SaaS platform for sales teams — CRM, deal pipelines, activities, calendar, email sequences, workflow automations, custom fields, forecasting, reports, integrations marketplace, and more.

## Stack

- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL
- **Frontend**: React, Vite, TailwindCSS, Lucide icons
- **Auth**: JWT + sessions, 2FA TOTP, account lockout
- **Real-time**: Server-Sent Events
- **Integrations**: 12 pre-built (Slack, Gmail, Stripe, Zoom, etc.)

## Quick start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Docker (recommended for the database)

### Run from the project root
Use `npm.cmd` in PowerShell if your execution policy blocks `npm.ps1`.

```bash
npm.cmd run install:all
npm.cmd run prisma:generate
npm.cmd run dev:backend
npm.cmd run dev:frontend
```

Run backend and frontend in two terminals. Backend runs on `http://localhost:3000`; frontend runs on `http://localhost:5173`.

### 1. Database (Docker)
```bash
docker run -d --name salesforge-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres1234 \
  -e POSTGRES_DB=salesforge \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Backend
```bash
cd backend
cp .env.example .env       # edit DATABASE_URL if needed
npm install
npx prisma generate
npx prisma db push         # or `npx prisma migrate deploy` in production
node server.js             # or `npm run dev` for nodemon
```

Backend runs on `http://localhost:3000`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Default credentials

After running the seed or creating a workspace, log in at `/login`:

| Role  | Email                     | Password    |
|-------|---------------------------|-------------|
| Owner | demo@salesforge.com       | Demo1234!   |
| Admin | realvetran@gmail.com      | Demo1234!   |

## Features

- **CRM**: Leads, deals (Kanban), activities, calendar
- **Automation**: Email templates, sequences, workflow rules
- **Customization**: Custom fields, tags, notes, tasks per lead
- **Team**: Invites, roles (OWNER/ADMIN/MEMBER/VIEWER), session management
- **Billing**: Plans, subscriptions, usage tracking
- **Developer**: API keys, webhooks, integrations marketplace
- **Security**: 2FA TOTP, account lockout, session tracking, audit logs
- **Reports**: Forecasts, custom reports, real-time analytics
- **Productivity**: Command palette (Cmd+K), saved searches, CSV import/export

## Architecture

Multi-tenant SaaS with:
- Organization-scoped resources
- Role-based access control (RBAC)
- Plan-based usage limits
- Standardized API responses (`{success, data, meta, error}`)
- Request ID tracing and structured JSON logging
- Real-time SSE streams for live updates
- Webhook delivery with HMAC signing and retries
- GDPR-compliant data export

## License

Proprietary — All rights reserved.
