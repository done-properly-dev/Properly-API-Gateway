# Properly - Property Settlement Platform

## Overview
Full-stack MVP for an API-driven property settlement platform. Supports four user roles (CLIENT, BROKER, CONVEYANCER, ADMIN) with role-specific dashboards. Built with React + Express + PostgreSQL.

## Current State
- Full-stack application with real database, session auth, and API routes
- All four role dashboards functional with real data
- Demo seed data pre-loaded for testing

## Architecture

### Frontend (React + Vite)
- **Routing**: wouter
- **State/Data**: TanStack Query for server state, auth hook at `client/src/lib/auth.ts`
- **UI**: shadcn/ui + Tailwind CSS
- **Design System**: Mineral Green (#425b58), Linen (#ffece1), Water (#e7f6f3)
- **Typography**: Plus Jakarta Sans (headings), Inter (UI)

### Backend (Express)
- **Auth**: Session-based with bcryptjs hashing, connect-pg-simple session store
- **ORM**: Drizzle ORM with PostgreSQL
- **API Prefix**: All routes under `/api/`

### Database (PostgreSQL)
- **Tables**: users, matters, tasks, documents, referrals, notifications
- **Schema**: `shared/schema.ts`
- **Storage Layer**: `server/storage.ts`

## Key Files
- `shared/schema.ts` - Database schema and types
- `server/db.ts` - Database connection
- `server/storage.ts` - CRUD operations interface
- `server/routes.ts` - API endpoints with session auth
- `client/src/lib/auth.ts` - Auth hook (useAuth)
- `client/src/lib/queryClient.ts` - TanStack Query setup
- `client/src/App.tsx` - Router with role-based private routes
- `client/src/components/layout.tsx` - Role-specific layouts

## Demo Accounts
- Client: sarah@example.com / password
- Broker: mike@broker.com.au / password
- Conveyancer: admin@legaleagles.com.au / password
- Admin: admin@properly.com.au / password

## API Routes
- POST `/api/auth/signup` - Register
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Current user
- GET/POST `/api/matters` - List/create matters
- GET/PATCH `/api/matters/:id` - Get/update matter
- GET `/api/matters/:matterId/tasks` - Tasks for matter
- POST `/api/tasks` - Create task
- PATCH `/api/tasks/:id` - Update task
- GET `/api/matters/:matterId/documents` - Documents for matter
- POST `/api/documents` - Create document
- DELETE `/api/documents/:id` - Delete document
- GET/POST `/api/referrals` - List/create referrals
- GET `/api/notifications` - List notifications
- PATCH `/api/notifications/:id` - Update notification

## Recent Changes
- 2026-02-16: Converted from frontend prototype to full-stack with PostgreSQL, session auth, and real API calls
