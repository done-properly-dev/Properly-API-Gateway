# Properly - Property Settlement Platform

## Overview
Full-stack MVP for an API-driven property settlement platform for the Australian market. Supports four user roles (CLIENT, BROKER, CONVEYANCER, ADMIN) with role-specific dashboards. Acts as a "real-time mirror" sitting on top of Smokeball (practice management) and PEXA (settlement platform). Mobile-first for buyers/sellers, web-first for referrers/partners.

## Current State
- Full-stack application with Supabase Auth, PostgreSQL, and API routes
- All four role dashboards functional with demo login buttons
- Sprint 1 complete: onboarding wizard, 5-pillar progress, The Playbook, enhanced empty states
- Australian tone applied throughout client-facing copy

## Architecture

### Frontend (React + Vite)
- **Routing**: wouter
- **State/Data**: TanStack Query for server state, auth hook at `client/src/lib/auth.ts`
- **UI**: shadcn/ui + Tailwind CSS
- **Design System**: Mineral Green (#425b58), Linen (#ffece1), Water (#e7f6f3)
- **Typography**: Plus Jakarta Sans (headings), Inter (UI)
- **Supabase Client**: `client/src/lib/supabase.ts`

### Backend (Express)
- **Auth**: Supabase Auth with JWT Bearer tokens, requireAuth middleware
- **ORM**: Drizzle ORM with PostgreSQL
- **API Prefix**: All routes under `/api/`
- **Demo Login**: Server-side `/api/auth/demo-login` auto-creates Supabase Auth accounts and maps to local DB users

### Database (Supabase PostgreSQL)
- **Provider**: Supabase (pooler connection via SUPABASE_DATABASE_URL secret)
- **Tables**: users, matters, tasks, documents, referrals, notifications, playbook_articles
- **Schema**: `shared/schema.ts`
- **Storage Layer**: `server/storage.ts`
- **Connection**: `server/db.ts` (prefers SUPABASE_DATABASE_URL, falls back to DATABASE_URL)

## Key Files
- `shared/schema.ts` - Database schema and types
- `server/db.ts` - Database connection
- `server/supabase.ts` - Supabase client (server-side)
- `server/storage.ts` - CRUD operations interface
- `server/routes.ts` - API endpoints with Supabase JWT auth
- `client/src/lib/auth.ts` - Auth hook (useAuth) with Supabase session management
- `client/src/lib/supabase.ts` - Supabase client (frontend)
- `client/src/lib/queryClient.ts` - TanStack Query setup (adds Bearer token to requests)
- `client/src/App.tsx` - Router with role-based private routes + onboarding redirect (step 0 only)
- `client/src/components/onboarding-alert.tsx` - Alert bar for incomplete onboarding steps
- `client/src/components/property-map.tsx` - Apple Maps property location card
- `client/src/components/layout.tsx` - Role-specific layouts
- `client/src/components/five-pillars.tsx` - 5-pillar settlement progress component
- `client/src/pages/client/onboarding.tsx` - 4-step client onboarding wizard
- `client/src/pages/client/playbook.tsx` - Educational content section

## Demo Accounts
Demo login buttons on /auth page auto-create Supabase Auth accounts:
- Client: sarah@example.com (mapped to demo-buyer@properly-app.com.au in Supabase)
- Client (Midway): james@buyer.com.au (mapped to demo-buyer2@properly-app.com.au) - Partway through onboarding with a matter, tasks, and property map
- Broker: mike@broker.com.au (mapped to demo-broker@properly-app.com.au)
- Conveyancer: admin@legaleagles.com.au (mapped to demo-conveyancer@properly-app.com.au)
- Admin: admin@properly.com.au (mapped to demo-admin@properly-app.com.au)

## API Routes
- GET `/api/auth/me` - Current user (creates local DB record if needed)
- POST `/api/auth/profile` - Create/update profile
- POST `/api/auth/demo-login` - Demo account login (auto-creates Supabase Auth + local user)
- PATCH `/api/auth/onboarding` - Update onboarding progress (Zod validated)
- GET/POST `/api/matters` - List/create matters (role-filtered)
- GET/PATCH `/api/matters/:id` - Get/update matter
- GET `/api/matters/:matterId/tasks` - Tasks for matter
- POST `/api/tasks` - Create task
- PATCH `/api/tasks/:id` - Update task
- GET `/api/matters/:matterId/documents` - Documents for matter
- POST `/api/documents` - Create document
- DELETE `/api/documents/:id` - Delete document
- GET/POST `/api/referrals` - List/create referrals (supports channel: PORTAL|SMS|QR)
- POST `/api/referrals/sms` - Create SMS referral with Twilio integration
- GET `/api/referrals/qr/:token` - Public QR code referral landing (no auth)
- GET/POST `/api/payments` - List/create payments (broker sees own, admin sees all)
- PATCH `/api/payments/:id` - Update payment status
- GET `/api/organisations/me` - Current user's organisation + members
- GET `/api/notifications` - List notifications
- PATCH `/api/notifications/:id` - Update notification
- GET `/api/playbook` - List playbook articles (public, supports ?category and ?pillar filters)
- GET `/api/playbook/:slug` - Get article by slug (public)

## Sprint 1 Features (Complete)
1. Supabase Auth migration (JWT tokens, Bearer header auth)
2. Extended data model (onboarding/VOI fields, 5-pillar milestones, playbook articles)
3. Client onboarding wizard (4 steps: welcome > personal details > VOI > contract upload)
4. 5-pillar progress bar (Pre-Settlement > Exchange > Conditions > Pre-Completion > Settlement)
5. The Playbook educational content (6 articles, category filtering, search, inline reading)
6. Enhanced empty states with CTAs across all role dashboards
7. Australian tone and voice throughout

## Sprint 2 Features (Complete)
1. Enhanced documents table (fileKey, mimeType, fileUrl fields)
2. Task-document linking (taskDocumentId on tasks table)
3. File upload endpoint (multipart form via multer, disk storage)
4. File download/view endpoint with auth check
5. Auto-complete task when linked document is uploaded
6. File validation (type whitelist: PDF/JPEG/PNG/WebP/HEIC/DOC/DOCX, 20MB max)
7. Drag-and-drop file upload with progress indicator
8. Document vault UI with upload, preview, lock indicators
9. Task completion UX linked to uploads (required uploads section)
10. Document viewer for uploaded files (real image/PDF preview for uploaded files)

## Sprint 3 Features (Complete)
1. Payments table (matterId, referralId, brokerId, amount, properlyFee, netAmount, status)
2. Organisations + organisation_members tables for team management
3. Referrals extended with channel (PORTAL|SMS|QR) and qrToken fields
4. Multi-channel referral creation (portal form, SMS link, QR code generator)
5. Payments CRUD with $100 Properly fee deducted on settlement
6. Organisation-scoped referral listing (managers see team, members see own)
7. QR code public endpoint for walk-in referral submission
8. Broker payments & commission tracking page
9. QR code generation and display with download/copy link
10. SMS referral link sharing UI with Twilio integration
11. Aggregator team pipeline view (hierarchical dashboard)
12. Empty states with "Make a Referral" CTA for new brokers
13. All 13 Sprint 3 items checked off in Notion

## Supabase Configuration
- Email confirmation: DISABLED (required for demo accounts)
- VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set as shared env vars
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_DATABASE_URL set as secrets

## External Services
- **Resend** (email): `server/services/resend.ts` - Welcome emails, milestone notifications, task reminders
  - Requires: RESEND_API_KEY, RESEND_FROM_EMAIL (optional)
  - Routes: POST /api/email/send, POST /api/email/welcome
- **Twilio** (SMS + chat): `server/services/twilio.ts` - SMS notifications, verification codes, in-app chat
  - Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
  - Routes: POST /api/sms/send, POST /api/sms/verification-code, GET/POST /api/chat/:matterId
- **Didit** (identity verification): `server/services/didit.ts` - VOI for property settlement
  - Requires: DIDIT_API_KEY, DIDIT_BASE_URL (optional)
  - Routes: POST /api/verification/start, GET /api/verification/status/:sessionId, POST /api/verification/callback
- **Apple Maps** (mapping): `server/services/apple-maps.ts` - Property location mapping
  - Requires: APPLE_MAPS_TEAM_ID, APPLE_MAPS_KEY_ID, APPLE_MAPS_PRIVATE_KEY
  - Routes: GET /api/maps/token
- **Service Status**: GET /api/services/status - Returns configuration status of all services

## Recent Changes
- 2026-02-16: Sprint 3 complete - Referrer Portal Expansion & Payments (multi-channel referrals, QR codes, SMS, payments tracking, team pipeline)
- 2026-02-16: Sprint 2 complete - Document Vault & Task Completion (file upload, drag-and-drop, auto-complete tasks, document preview)
- 2026-02-16: Sprint 1 and Sprint 2 todos checked off in Notion developer documentation
- 2026-02-16: Onboarding alert bar - shows incomplete steps on dashboard with resume links, checks actual data not onboardingComplete flag
- 2026-02-16: Property map - Apple Maps integration on client dashboard with geocoding and marker
- 2026-02-16: Demo user James Mitchell (midway) - partway through onboarding with matter, 5 tasks, property address
- 2026-02-16: Onboarding redirect only forces step 0 users, midway users can access dashboard freely
- 2026-02-16: Didit VOI integration - v3 API, QR code on desktop / direct redirect on mobile, webhook verification
- 2026-02-16: Resend email updated to use resend.dev testing domain (switch to verified domain for production)
- 2026-02-16: Apple Maps token generation confirmed working
- 2026-02-16: Four external services integrated (Resend, Twilio, Didit, Apple Maps)
- 2026-02-16: Sprint 1 complete - onboarding, 5-pillar, playbook, empty states, Australian tone
- 2026-02-16: Demo login endpoint with auto Supabase Auth account creation and ID migration
- 2026-02-16: Migrated auth from session-based to Supabase Auth (JWT Bearer tokens)
- 2026-02-16: Switched database to Supabase PostgreSQL (pooler connection)
