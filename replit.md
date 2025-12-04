# Donezo - AI Data Platform

## Overview

Donezo is a comprehensive AI data annotation and task management platform that connects remote workers with AI training tasks. The platform features a tiered salary system, real-time task management, payment processing, and administrative controls. Users complete tasks on external platforms (YouTube, TikTok, Instagram) and earn payouts based on their tier level, with earnings capped at £650 (Basic), £1,500 (Professional), or £3,000 (Expert) monthly.

The application is built as a single-page application (SPA) using React with TypeScript, featuring a mock authentication system and localStorage-based persistence. The frontend is fully functional with placeholder backend structure ready for implementation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing:**
- React 19.2 with TypeScript for type safety
- React Router DOM (v7.9.6) with HashRouter for client-side routing
- Vite as the build tool and development server
- Tailwind CSS (via CDN) for styling with custom theme extensions

**State Management:**
- React hooks (useState, useEffect, useCallback, useRef) for local state
- Lifted state pattern in App.tsx for shared data between routes
- localStorage for persistence of user data, tasks, and admin messages
- No external state management library (Redux, Zustand) - relies on React Context via Outlet

**Component Architecture:**
- Layout components: DashboardLayout (main shell), Sidebar, Topbar
- Page components: Landing, DashboardHome, Tasks, Earnings, Upgrade, Settings, Support, Admin
- Reusable components: TaskCard, ChatOverlay, NotificationPopup, RewardAnimation, CountdownTimer
- Uses React Router's Outlet pattern to pass context down to nested routes

**Key Design Patterns:**
- **Compound Components:** DashboardLayout wraps all dashboard pages with consistent sidebar/topbar
- **Render Props via Context:** useOutletContext() provides shared state (user, tasks, functions) to child routes
- **Custom Hooks:** useCountUp for animated number counting in Sidebar
- **Mock Data Strategy:** All data starts as mock/default but persists to localStorage for session continuity

### Data Flow & State Lifting

**Centralized State in App.tsx:**
- User profile (tier, earnings, quality score)
- Tasks array with status tracking (Pending, In Progress, Completed, Failed, Locked)
- Admin messages for notifications
- Chat and notification overlay visibility

**Key Functions Passed via Context:**
- `addEarnings(amount)`: Updates user earnings with animation trigger
- `startTask(id, url)`: Marks task as in-progress, opens external window, starts countdown
- `completeTask(id)`: Updates task status, adds earnings, triggers reward animation
- `failTask(id)`: Marks task as failed if time expires
- `setIsChatOpen`, `setIsNotificationsOpen`: Toggle overlay visibility

**Task Lifecycle:**
1. Tasks are either published by admin via Task Pool or fall back to 15 default tasks (10 Day + 5 Night)
2. Admin can publish tasks with platform (TikTok/YouTube/Instagram), link, payout, and target users (all or specific)
3. User clicks "Start Task" → Opens external URL in new window
4. Countdown begins (2 min for Day tasks, 30 min for Night tasks)
5. User manually completes or countdown expires → Auto-fail
6. Completed tasks add payout to user earnings and are saved to localStorage

**Admin Task Pool (pages/Admin.tsx):**
- Admin can publish up to 15 tasks with custom platform, link, payout, and target users
- Tasks are stored in localStorage under 'donezoAdminTasks'
- Users see admin-published tasks; if none exist, they see 15 default fallback tasks
- Completed task IDs stored in 'donezoCompletedTasks' for persistence

### Authentication & Authorization

**Current Implementation (Mock):**
- No real authentication - uses mock user object
- Admin panel has hardcoded credentials (privates786@gmail.com / Rich@123)
- User data loaded from localStorage or defaults to mock user

**Planned Backend Integration:**
- JWT-based authentication (backend/src/utils/jwt.ts placeholder exists)
- Password hashing (backend/src/utils/password.ts placeholder)
- Auth middleware (backend/src/middleware/authMiddleware.ts)
- Session management (backend/src/models/userSessionModel.ts)

### UI/UX Patterns

**Animation & Feedback:**
- Reward animation on task completion (coins flying to sidebar balance)
- Count-up animations for earnings display
- Pulse/glow effects for notifications and active states
- Countdown timers for tasks in progress

**Responsive Design:**
- Mobile-first Tailwind classes with md/lg breakpoints
- Hidden elements on mobile (search bar, some stats)
- Collapsible sidebar concept (not fully implemented)

**Color System:**
- Primary green (#10b981) for earnings, success states
- Night mode tasks use dark theme (gray-900 backgrounds)
- Platform-specific colors (YouTube red, TikTok black, Instagram pink)

### Backend Structure (Placeholder)

**Planned MVC Architecture:**
- Controllers: Handle business logic (auth, tasks, earnings, admin, files, notifications, stripe)
- Models: Database interaction layer (users, tasks, files, messages, sessions, referrals)
- Routes: Express route definitions (auth, admin, earnings, tasks, users, files, webhooks)
- Middleware: Auth validation, error handling
- Services: Third-party integrations (Gemini AI, Stripe, Supabase, OpenAI)

**Database Design (Not Yet Implemented):**
- Users table: Profile, tier, earnings, signup date, mandate status
- Tasks table: Platform, category, URL, payout, status, timestamps
- Admin messages: Type, content, read status, targeting
- User sessions: Auth tokens, expiry
- Referrals: Tracking user invites

## External Dependencies

### Frontend Libraries

**Core:**
- `react` & `react-dom` (v19.2): UI framework
- `react-router-dom` (v7.9.6): Client-side routing
- `typescript` (v5.8.2): Type safety
- `vite` (v6.2.0): Build tool and dev server

**UI & Icons:**
- `lucide-react` (v0.555.0): Icon library
- `recharts` (v3.5.1): Charts for earnings/analytics visualization
- Tailwind CSS (via CDN): Utility-first styling

**AI Integration:**
- `@google/genai` (v1.30.0): Google Gemini API for AI task generation (services/geminiService.ts)

### Planned Backend Dependencies

**Payment Processing:**
- Stripe API: Payment mandate creation, subscription charging, webhooks (backend/src/services/stripeService.ts)
- GoCardless (mentioned but not scaffolded): Bank mandate verification

**Database & Storage:**
- Supabase: PostgreSQL database and authentication (backend/src/services/supabaseService.ts)
- Note: Current app uses localStorage; migration to Supabase required

**AI Services:**
- OpenAI API: Task generation, content moderation (backend/src/services/openaiService.ts)
- Google Gemini API: Already integrated on frontend, planned for backend validation

### Configuration & Environment

**Environment Variables:**
- `GEMINI_API_KEY`: Google Gemini API key (defined in vite.config.ts)
- Exposed to frontend as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`

**Build Configuration:**
- Vite server: Port 5000, allows all hosts
- TypeScript: ES2022 target, JSX transform, path aliases (`@/*`)
- Dev server: Hot module replacement, react-refresh

### Third-Party Integrations

**Social Platforms (Task URLs):**
- YouTube, TikTok, Instagram: Tasks require users to visit external URLs
- New tab/window opened for task completion tracking

**Payment Gateways (Planned):**
- Stripe: Subscription payments for tier upgrades, mandate-based auto-charging
- GoCardless: Bank mandate verification for UK direct debit

**Communication:**
- WhatsApp support integration (mentioned in Support page, not implemented)
- Admin broadcast messaging system (stored in localStorage, needs backend persistence)