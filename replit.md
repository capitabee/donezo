# Donezo - AI Data Platform

## Overview

Donezo is a comprehensive AI data annotation and task management platform that connects remote workers with AI training tasks. The platform features a tiered salary system, real-time task management, payment processing, and administrative controls. Users complete tasks on external platforms (YouTube, TikTok, Instagram) and earn payouts based on their tier level, with earnings capped at £650 (Basic), £1,500 (Professional), or £3,000 (Expert) monthly.

## Recent Changes (December 6, 2024)

### TrueLayer Open Banking Upgrade
- **Modern OAuth Flow**: Updated from mock provider to real UK Open Banking (`uk-ob-all`)
- **Bank Selection Screen**: Users now see a list of real UK banks (Monzo, Barclays, Lloyds, etc.)
- **Bank App/Website Auth**: Users authenticate directly with their bank, not via credentials
- **Query Response Mode**: Changed from `form_post` to `query` for proper redirect handling
- **GET Callback Handler**: Updated backend to handle OAuth codes via GET request

### Chat Memory System & AI Improvements
- **Persistent Chat Memory**: All conversations with Sarah (Team Leader AI) are now stored in `chat_messages` table
- **Context-Aware Responses**: AI remembers previous conversations, user's task progress, and earnings
- **Human-Like Personality**: Sarah acts as a real Team Leader, never reveals she's AI, promotes upgrades naturally
- **Chat History Loading**: Frontend loads chat history from server when chat is opened
- **User Context in AI**: Includes completed tasks, earnings, recent activity, and days remaining to upgrade

### Earnings Activity Tracking
- **Real Activity Data**: Earnings page shows actual completed tasks from database
- **Combined Data Sources**: Pulls from both transactions and task completions
- **Chart Data**: Built from real transaction history

### Backend Improvements
- **GET `/api/chat/history`**: Returns user's chat history from database
- **GET `/api/earnings/activity`**: Returns recent task completions with details
- **`chatWithMemory` Function**: Includes last 8 messages + user context for AI responses

## Previous Changes (December 5, 2024)

### Premium Authentication & Onboarding Flow
- **Premium Sign Up Page**: Dark theme with two-step signup (personal info → password), password strength indicator, referral code support
- **Premium Sign In Page**: Matching dark theme with remember me option and forgot password link
- **Multi-Step Onboarding Flow**: 
  1. Job Offer Letter with candidate's name, detailed position info, and terms acceptance
  2. TrueLayer bank connection step (Open Banking integration)
  3. Stripe debit card mandate setup step
  - Proper callback handling from TrueLayer and Stripe back to onboarding
  - Onboarding completion unlocks dashboard access
- **Referral System**:
  - Each user gets a unique 8-character referral code on signup
  - Referral links: `/#/signup?ref=CODE`
  - £50 bonus awarded to both referrer and referred user on onboarding completion
  - Referral section in Settings with copy-to-clipboard functionality
  - `/api/referral/info` and `/api/referral/stats` endpoints

### Previous Changes (December 4, 2024)
- **TrueLayer UK Bank Integration**: Users can connect UK banks via Open Banking for balance verification
- **Manual Task Submission Flow**: Tasks now require manual submission with AI verification
- **Task States**: In Progress → Verifying → Completed/Failed with visual feedback
- **AI Task Verification**: OpenAI verifies task completion based on time spent
- **Stripe Mandate System**: Real Stripe SetupIntent integration for payment mandates
- **Admin Charge Feature**: Admins can charge users via stored payment methods
- **Live Bank Balance**: Dual support for US (Stripe) and UK (TrueLayer) accounts
- **Backend Infrastructure**: Express.js on port 3001 with full integrations
- **API Keys Management**: Admin panel with one-click key replacement
- **Dual Server Architecture**: Frontend (5000) and backend (3001) concurrently

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
- `backend/src/services/truelayerService.ts`: TrueLayer Open Banking OAuth2 flow, token management, balance fetching

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
- `TRUELAYER_CLIENT_ID`: TrueLayer sandbox client ID for Open Banking
- `TRUELAYER_CLIENT_SECRET`: TrueLayer sandbox client secret

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
│   ├── Admin.tsx              # Admin panel with API keys, bank balances
│   ├── Upgrade.tsx            # Stripe checkout integration
│   ├── Earnings.tsx           # Transaction history
│   ├── Settings.tsx           # User settings, UK bank connection
│   ├── TrueLayerCallback.tsx  # TrueLayer OAuth callback handler
│   └── ...
├── services/
│   └── api.ts                 # Frontend API service
├── database/
│   └── supabase_schema.sql    # Database setup script
├── types.ts
└── App.tsx
```
