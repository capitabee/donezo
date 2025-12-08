# Donezo - AI Data Platform

## Overview

Donezo is an AI data annotation and task management platform designed to connect remote workers with AI training tasks. It features a tiered salary system, real-time task management, payment processing, and administrative controls. Users complete tasks on external social media platforms (YouTube, TikTok, Instagram) and earn payouts based on their membership tier, with monthly earning caps at £650 (Basic), £1,500 (Professional), or £3,000 (Expert). The platform aims to provide flexible earning opportunities and efficient task distribution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The platform features a dark-themed interface, particularly in the premium sign-up/sign-in pages and the WhatsApp-style team meeting room, aiming for a modern and engaging user experience. Key elements include interactive dashboards, dynamic content loading, and clear visual feedback for task statuses and payment processes.

### Technical Implementations

The system employs a dual-server architecture with a React frontend (Vite, TypeScript, React Router DOM, Tailwind CSS) running on port 5000 and an Express.js backend on port 3001. Data persistence is managed via Supabase, with real-time updates for critical features like admin settings, task visibility, and dashboard analytics.

### Feature Specifications

*   **Task Management:** Admin-published tasks are displayed to users, with real-time synchronization. An "Add Task" button is exclusively available and functional for Expert tier users.
*   **User Management & Tiers:** A multi-step onboarding process includes job offer acceptance, TrueLayer bank connection, and Stripe debit card mandate setup. Users are assigned to Basic, Professional, or Expert tiers, each with distinct earning caps, payout frequencies, and multipliers.
*   **Referral System:** Users receive unique referral codes, earning a £50 bonus for successful referrals upon onboarding completion.
*   **Real-time Dashboard:** Displays live data for referral teams, weekly progress, activity charts, and completed tasks.
*   **Team Meeting Room:** A WhatsApp-like chat interface displaying 3,031 total members with varying online status (2,100-2,800 users online). Features a pinned admin message at the top: "Please mention only upgrades and withdrawals with status. Thank you." AI users (Grok-powered) with randomized UK and Indian names report to admin about their withdrawal successes (£1,400-£3,000 with "status complete") and tier upgrades (recharged £250 for T2 or £600 for T3). Each message uses a different random name. Messages use first person ("I have withdrawn...", "I upgraded...") and end with "thank you" or "thank you admin". Examples: "I have upgraded to tier 3, amount £600. Thank you." or "Withdrawal of £1,847 completed, thank you." Admin can enable/disable chat via Settings panel - when disabled, users can view messages but cannot send new ones.
*   **AI Personalities:** AI users have randomized UK and Indian names (James, Sophie, Rahul, Priya, Jack, Sneha, etc.) that change with each message. They ONLY report their own withdrawal successes and upgrade actions directly to admin, no casual chatting. Messages are direct, grateful reports using first person and thanking admin.
*   **Payment & Banking:** Integration with TrueLayer for UK Open Banking enables bank account connections, balance fetching, and automatic token refresh. Stripe handles debit card mandates, payment processing for tier upgrades, and allows admins to charge users.
*   **Security:** Password change functionality with current password verification, strong password validation, and automatic logout.
*   **Admin Panel:** Provides user management, broadcast messaging, custom task publishing, and one-click API key replacement.

### System Design Choices

*   **API-driven:** A comprehensive set of RESTful APIs facilitates communication between the frontend and backend for authentication, chat, earnings, tasks, and administrative functions.
*   **Modular Services:** Backend services are compartmentalized for Stripe, Supabase, OpenAI, and TrueLayer interactions, promoting maintainability and scalability.
*   **Context-Aware AI:** AI interactions, especially with "Sarah" and within the meeting room, leverage chat history, user task progress, and earnings data to provide personalized and relevant responses.

## External Dependencies

*   **Supabase:** Primary database for user data, tasks, transactions, and chat messages.
*   **Stripe:** Payment gateway for tier upgrades, debit card mandates (SetupIntent), and admin-initiated charges.
*   **TrueLayer:** UK Open Banking API for bank account connections, balance retrieval, and token management.
*   **OpenAI (Grok-2-latest):** Used for AI chat assistant ("Sarah"), AI user personalities in the meeting room, and AI-driven task verification.
*   **Vite:** Frontend build tool and development server.
*   **React Router DOM:** Client-side routing for the React frontend.
*   **Tailwind CSS:** Utility-first CSS framework for styling.