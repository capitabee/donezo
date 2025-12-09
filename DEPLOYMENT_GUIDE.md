# DONEZO Production Deployment Guide

This document provides comprehensive instructions for deploying the DONEZO project to production using Render (backend) and Vercel (frontend).

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Files Changed](#files-changed)
3. [Environment Variables](#environment-variables)
4. [Backend Deployment (Render)](#backend-deployment-render)
5. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
6. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Project Overview

**Backend Framework:** Node.js/Express with TypeScript  
**Frontend Framework:** React with Vite  
**Backend Port:** 3001 (configurable via PORT env var)  
**Frontend Port:** 5000 (dev), Vercel (production)

---

## Files Changed

### Backend Files Modified:
1. **`backend/src/config/index.ts`** - Created new config file with BASE_URL helper and CORS configuration
2. **`backend/src/server.ts`** - Updated to:
   - Use centralized config for BASE_URL
   - Replace all localhost/replit URLs with BASE_URL
   - Configure CORS for production domains
   - Bind to 0.0.0.0 for Render compatibility
   - Use process.env.PORT

### Frontend Files Modified:
1. **`services/api.ts`** - Updated to use `VITE_BACKEND_URL` environment variable
2. **`vite.config.ts`** - Updated proxy to use environment variable for backend URL

### New Files Created:
1. **`backend/env.template`** - Backend environment variables template
2. **`frontend.env.template`** - Frontend environment variables template
3. **`render.yaml`** - Render deployment configuration
4. **`vercel.json`** - Vercel deployment configuration
5. **`DEPLOYMENT_GUIDE.md`** - This file

---

## Environment Variables

### Backend Environment Variables (Render)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3001` | Yes |
| `BASE_URL` | Backend base URL | `https://your-backend.onrender.com` | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.vercel.app` | Yes |
| `SESSION_SECRET` | JWT secret key | `your-secret-key` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` | Yes* |
| `SUPABASE_URL` | Supabase project URL | `https://...supabase.co` | No* |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` | No* |
| `SUPABASE_SERVICE_KEY` | Supabase service key | `eyJ...` | No* |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_...` | Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_...` | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` | No |
| `TRUELAYER_CLIENT_ID` | TrueLayer client ID | `...` | No |
| `TRUELAYER_CLIENT_SECRET` | TrueLayer client secret | `...` | No |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` | Yes |
| `XAI_API_KEY` | X.AI API key | `...` | No |

*Either DATABASE_URL (PostgreSQL) or SUPABASE_* variables required

### Frontend Environment Variables (Vercel)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_BACKEND_URL` | Backend API URL | `https://your-backend.onrender.com` | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_...` | Yes |
| `VITE_GEMINI_API_KEY` | Gemini API key | `...` | No |

**Note:** All Vite environment variables must be prefixed with `VITE_` to be exposed to the client.

---

## Backend Deployment (Render)

### Step 1: Prepare Your Repository

1. Ensure all changes are committed and pushed to your Git repository
2. Verify that `render.yaml` is in the root directory

### Step 2: Create Render Account and Service

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Blueprint"
3. Connect your Git repository
4. Render will automatically detect `render.yaml`

### Step 3: Configure Environment Variables

In the Render dashboard, go to your service → Environment:

**Required Variables:**
```bash
PORT=3001
BASE_URL=https://your-backend-service-name.onrender.com
FRONTEND_URL=https://your-vercel-app.vercel.app
SESSION_SECRET=<generate-a-strong-random-string>
DATABASE_URL=<your-postgresql-connection-string>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
OPENAI_API_KEY=<your-openai-api-key>
```

**Optional Variables:**
```bash
STRIPE_WEBHOOK_SECRET=<if-using-webhooks>
TRUELAYER_CLIENT_ID=<if-using-truelayer>
TRUELAYER_CLIENT_SECRET=<if-using-truelayer>
XAI_API_KEY=<if-using-xai>
SUPABASE_URL=<if-using-supabase>
SUPABASE_ANON_KEY=<if-using-supabase>
SUPABASE_SERVICE_KEY=<if-using-supabase>
```

### Step 4: Create PostgreSQL Database (if needed)

1. In Render dashboard, click "New +" → "PostgreSQL"
2. Choose a plan (Starter is fine for development)
3. Copy the **Internal Database URL** (for Render services) or **External Database URL** (for external access)
4. Set this as `DATABASE_URL` in your backend service

### Step 5: Deploy

1. Render will automatically deploy when you push to your repository
2. Or click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete (usually 2-5 minutes)

### Step 6: Verify Deployment

1. Check the logs for: `Backend server running on port 3001 (0.0.0.0)`
2. Test the health endpoint: `https://your-backend.onrender.com/api/stripe/config`
3. Copy your backend URL (e.g., `https://your-backend.onrender.com`)

### Build Command:
```bash
npm install && npm run build
```

### Start Command:
```bash
npx tsx backend/src/server.ts
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Your Repository

1. Ensure all changes are committed and pushed
2. Verify that `vercel.json` is in the root directory

### Step 2: Create Vercel Account and Project

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Vercel will auto-detect Vite

### Step 3: Configure Build Settings

Vercel should auto-detect these settings:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 4: Configure Environment Variables

In Vercel dashboard → Your Project → Settings → Environment Variables:

**Required Variables:**
```bash
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
```

**Optional Variables:**
```bash
VITE_GEMINI_API_KEY=<if-using-gemini>
```

**Important:** 
- Add these for **Production**, **Preview**, and **Development** environments
- After adding variables, you may need to redeploy

### Step 5: Deploy

1. Click "Deploy"
2. Vercel will build and deploy automatically
3. Wait for deployment (usually 1-3 minutes)

### Step 6: Verify Deployment

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Test the application functionality
3. Check browser console for any CORS errors
4. Copy your frontend URL

### Step 7: Update Backend CORS

1. Go back to Render dashboard
2. Update `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy the backend service

---

## Post-Deployment Checklist

### Backend (Render)
- [ ] Backend is accessible at `https://your-backend.onrender.com`
- [ ] Health check endpoint responds: `/api/stripe/config`
- [ ] CORS is configured correctly (check browser console)
- [ ] Database connection is working
- [ ] All environment variables are set
- [ ] Logs show no errors

### Frontend (Vercel)
- [ ] Frontend is accessible at `https://your-app.vercel.app`
- [ ] API calls are working (check Network tab)
- [ ] No CORS errors in browser console
- [ ] Stripe integration works (if applicable)
- [ ] All environment variables are set

### Integration
- [ ] Frontend can communicate with backend
- [ ] Authentication flow works
- [ ] All API endpoints respond correctly
- [ ] Webhooks are configured (if applicable)

### Security
- [ ] `SESSION_SECRET` is a strong random string
- [ ] API keys are not exposed in frontend code
- [ ] CORS only allows your frontend domain
- [ ] HTTPS is enabled (automatic on Render/Vercel)

---

## Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` in backend matches your Vercel URL exactly
- Check that CORS origins include both `https://your-app.vercel.app` and `http://localhost:5173`
- Clear browser cache and try again

### Backend Not Starting
- Check Render logs for errors
- Verify `PORT` environment variable is set
- Ensure `BASE_URL` is set correctly
- Check database connection string

### Frontend Build Fails
- Verify all `VITE_*` environment variables are set
- Check Vercel build logs for specific errors
- Ensure `VITE_BACKEND_URL` is set correctly

### API Calls Failing
- Verify `VITE_BACKEND_URL` matches your Render backend URL
- Check browser Network tab for request URLs
- Ensure backend is running and accessible

---

## Support

For issues or questions:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Your Project → Deployments → View Function Logs
3. Review browser console for client-side errors
4. Review this deployment guide

---

## Summary

✅ **Backend Framework:** Node.js/Express (TypeScript)  
✅ **Frontend Framework:** React/Vite  
✅ **Backend Host:** Render  
✅ **Frontend Host:** Vercel  
✅ **Database:** PostgreSQL (via Render) or Supabase  
✅ **All localhost/replit URLs replaced with environment variables**  
✅ **CORS configured for production**  
✅ **Server binds to 0.0.0.0 for Render compatibility**

Good luck with your deployment! 🚀
