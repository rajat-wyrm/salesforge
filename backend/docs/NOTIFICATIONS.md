# Notification System — Architecture & Deployment

## Overview

SalesForge uses a **preference-based notification system** that respects per-user toggles 
across three channels: **In-App**, **Email**, and **Push**.

When a user performs an action (e.g., creates a lead), the system:
1. Looks up that user's notification preferences for the relevant category
2. Only sends notifications on channels the user has enabled
3. Always sends to the **authenticated user's own email** (fetched fresh from the database)

### Core Security Rules
- `userId` always comes from `req.user.id` (verified JWT) — never from request body
- Recipient email is always re-fetched from the database — never from request payload or cache
- `EMAIL_USER` / `EMAIL_PASS` env vars are **sending credentials only** — never used as recipient
- One user's toggles never affect another user's notifications

## How It Works

```
User creates a lead
        │
        ▼
leadController.createLead()
        │
        ▼
dispatchNotification({ userId: req.user.id, category: "lead", ... })
        │
        ├── Check NotificationPreference for (userId, "lead", "in_app")
        │       └── If enabled → Create Notification row + SSE event
        │
        ├── Check NotificationPreference for (userId, "lead", "email")
        │       └── If enabled → Fetch user.email from DB → Send via Nodemailer
        │
        └── Check NotificationPreference for (userId, "lead", "push")
                └── If enabled → Send FCM push notification
```

## Notification Categories

| Category | Trigger Points |
|----------|---------------|
| `lead`   | Lead created, updated, deleted, assigned |
| `deal`   | Deal created, updated, stage changed, won/lost |
| `billing`| Payment received, failed, invoice created |
| `team`   | Member invited, joined, role changed |
| `system` | Login alerts, password changes, maintenance |

## API Endpoints

### Preferences
- `GET /api/notification-preferences` — List all preferences for the authenticated user
- `PUT /api/notification-preferences` — Bulk update preferences (array of `{ category, channel, enabled }`)
- `PATCH /api/notification-preferences` — Toggle a single preference (`{ category, channel, enabled }`)

### Notifications
- `GET /api/notifications` — List notifications (supports `?unreadOnly=true`)
- `PATCH /api/notifications/:id/read` — Mark one notification as read
- `PATCH /api/notifications/read-all` — Mark all as read
- `POST /api/notifications/test-email` — **[DEV ONLY]** Test the email pipeline

### Testing the Email Pipeline
```bash
# 1. Toggle lead email ON
curl -X PATCH https://your-backend.onrender.com/api/notification-preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "lead", "channel": "email", "enabled": true}'

# 2. Fire a test email
curl -X POST https://your-backend.onrender.com/api/notifications/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "lead", "title": "Test", "message": "Hello from SalesForge"}'

# 3. Toggle lead email OFF and repeat — no email should be sent
curl -X PATCH https://your-backend.onrender.com/api/notification-preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "lead", "channel": "email", "enabled": false}'
```

## Render Deployment

### Required Environment Variables

Set these in your **Render Web Service** dashboard under **Environment**:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler URL) |
| `DIRECT_URL` | PostgreSQL direct connection (for Prisma migrations) |
| `JWT_SECRET` | Secret key for signing JWTs |
| `EMAIL_USER` | Gmail address for **sending** emails (e.g., `your-app@gmail.com`) |
| `EMAIL_PASS` | Gmail App Password (NOT your regular Google password) |
| `FRONTEND_URL` | Your Vercel frontend URL (e.g., `https://salesforge-nine.vercel.app`) |
| `NODE_ENV` | Set to `production` |

### Gmail App Password Setup
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled
3. Go to **App passwords** and generate one for "Mail"
4. Use the generated 16-character password as `EMAIL_PASS`

## Future: BullMQ Queue Upgrade

The current system sends emails **inline** (synchronously during the request). 
For higher scale, you can upgrade to a BullMQ queue:

1. Add a Redis instance (e.g., [Upstash](https://upstash.com/) free tier)
2. Set `REDIS_URL` in your Render env vars
3. Create `queues/emailQueue.js` and `workers/emailWorker.js`
4. Deploy the worker as a **separate Render Background Worker** service
5. The `// TODO: BullMQ` comments in `notificationService.js` show exactly where to plug in

This is only needed when you're sending 100+ emails/hour and want to avoid blocking API responses.
