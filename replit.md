# Donezo - AI Data Platform

## Overview

Donezo is a comprehensive AI data annotation and task management platform that connects remote workers with AI training tasks. The platform features a tiered salary system, real-time task management, payment processing, and administrative controls. Users complete tasks on external platforms (YouTube, TikTok, Instagram) and earn payouts based on their tier level, with earnings capped at £650 (Basic), £1,500 (Professional), or £3,000 (Expert) monthly.

## Recent Changes (December 4, 2024)

- **Manual Task Submission Flow**: Tasks now require manual submission - users click Start to open task link, then Submit when done for AI verification before funds are credited
- **Task States**: New task states (In Progress → Verifying → Completed/Failed) with visual feedback in TaskCard
- **AI Task Verification**: OpenAI verifies task completion based on time spent before approving earnings (real API calls)
- **Stripe Mandate System**: Real Stripe SetupIntent integration for payment mandates with Elements UI
- **Type Safety Fixes**: Fixed Number() conversion for PostgreSQL DECIMAL values across Sidebar, Earnings, TaskCard, Admin, and App.tsx
- **Admin Charge Feature**: Admins can charge users via stored payment methods (mandate-based)
- **Backend Infrastructure**: Complete Express.js backend on port 3001 with Supabase, Stripe, and OpenAI integrations
- **API Keys Management**: Admin panel now includes API Keys section for one-click key replacement
- **Stripe Integration**: Real payment processing for tier upgrades via Stripe checkout
- **OpenAI Integration**: AI chat assistant that promotes company benefits and explains upgrade advantages
- **Database Schema**: Complete Supabase schema in `database/supabase_schema.sql`
- **Dual Server Architecture**: Frontend (port 5000) and backend (port 3001) running concurrently

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture (Implemented)

**Server Configuration:**
- Express.js server running on port 3001
- CORS enabled for frontend communication
- Environment variables for API keys (Stripe, Supabase, OpenAI)

**Services:**
- `backend/src/services/stripeService.ts`: Stripe payment processing, checkout sessions, customer management
- `backend/src/services/supabaseService.ts`: Supabase database operations for users, tasks, transactions
- `backend/src/services/openaiService.ts`: OpenAI chat with company-promoting prompts, task verification

**API Endpoints:**
- POST `/api/auth/login`: User authentication
- POST `/api/auth/register`: User registration
- POST `/api/chat`: AI chat with OpenAI
- POST `/api/upgrade`: Stripe checkout session creation
- GET `/api/earnings`: User earnings and transaction history
- GET `/api/admin/users`: Admin user management
- POST `/api/admin/tasks`: Admin task creation
- POST `/api/admin/broadcast`: Admin broadcast messages

### Frontend Architecture

**Framework & Routing:**
- React 19.2 with TypeScript for type safety
- React Router DOM (v7.9.6) with HashRouter for client-side routing
- Vite as the build tool and development server
- Tailwind CSS (via CDN) for styling with custom theme extensions

**API Service Layer:**
- `services/api.ts`: Centralized API calls to backend
- Handles authentication, tasks, earnings, chat, and admin operations

**Component Architecture:**
- Layout components: DashboardLayout (main shell), Sidebar, Topbar
- Page components: Landing, DashboardHome, Tasks, Earnings, Upgrade, Settings, Support, Admin
- Reusable components: TaskCard, ChatOverlay, NotificationPopup, RewardAnimation, CountdownTimer

### Admin Panel Features

**Sections:**
1. **User Management**: View all users, earnings, tier status, mandate status
2. **Broadcast Messages**: Send announcements to all users
3. **Task Pool**: Publish up to 15 custom tasks with platform, payout, URL
4. **API Keys**: One-click replacement for Stripe, OpenAI, Supabase keys

**Admin Credentials:**
- Email: privates786@gmail.com
- Password: Rich@123

### Database Schema

**Tables (Supabase):**
- `users`: Profile, tier, earnings, quality score, Stripe customer ID
- `user_sessions`: JWT tokens, expiry, IP tracking
- `tasks`: Platform, category, URL, payout, target users
- `task_completions`: User task progress, AI verification status
- `transactions`: Earnings, payouts, upgrade fees
- `admin_messages`: Broadcast notifications
- `referrals`: User invitation tracking

### Payment Integration

**Stripe:**
- Checkout sessions for tier upgrades (Professional: £250, Expert: £600)
- Customer creation with platform metadata
- Webhook handling for successful payments

**Tier Benefits:**
- Basic: Free, £650/month cap, monthly payouts
- Professional: £250, £1,500/month cap, 1.5x multiplier, weekly payouts
- Expert: £600, £3,000/month cap, 3x multiplier, daily payouts

### AI Integration

**OpenAI Chat Assistant:**
- Company-promoting system prompt as "Sarah" the Team Leader
- Explains tier benefits and encourages upgrades
- Answers questions about tasks, earnings, and platform

**Task Verification:**
- AI verifies task completion based on time spent
- Confidence scoring for fraud prevention
- Auto-approval for tasks meeting time requirements

## Environment Variables

Required secrets (stored in Replit Secrets):
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe public key
- `OPENAI_API_KEY`: OpenAI API key for chat
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase admin key

## Development

**Running the Application:**
```bash
npm run dev  # Starts both frontend and backend concurrently
```

**Build:**
```bash
npm run build  # Builds frontend for production
```

**Database Setup:**
1. Create a Supabase project
2. Run `database/supabase_schema.sql` in SQL Editor
3. Configure environment variables with Supabase credentials

## File Structure

```
├── backend/
│   └── src/
│       ├── server.ts           # Express server entry point
│       └── services/
│           ├── stripeService.ts
│           ├── supabaseService.ts
│           └── openaiService.ts
├── components/
│   ├── ChatOverlay.tsx        # AI chat with OpenAI
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   └── ...
├── pages/
│   ├── Admin.tsx              # Admin panel with API keys
│   ├── Upgrade.tsx            # Stripe checkout integration
│   ├── Earnings.tsx           # Transaction history
│   └── ...
├── services/
│   └── api.ts                 # Frontend API service
├── database/
│   └── supabase_schema.sql    # Database setup script
├── types.ts
└── App.tsx
```
