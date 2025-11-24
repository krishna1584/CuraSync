# CuraSync Deployment Guide

## Overview
This guide covers deploying the CuraSync application with backend on Render and frontend on your preferred platform.

## Backend Deployment (Render)

### 1. Environment Variables Required on Render

Set these environment variables in your Render dashboard:

```env
NODE_ENV=production
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/curasync?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secure-random-string-here
JWT_EXPIRE=30d

# Frontend URL for CORS (update after deploying frontend)
FRONTEND_URL=http://localhost:3000
# For production: FRONTEND_URL=https://your-frontend-domain.com
```

### 2. Important Configurations

#### Trust Proxy Setting
✅ **Already configured** in `backend/src/app.js`:
```javascript
app.set('trust proxy', 1);
```
This is required for Render's reverse proxy to correctly identify client IPs for rate limiting.

#### Cookie Settings
✅ **Already configured** in `backend/src/controllers/authController.js`:
- `sameSite: 'none'` for production (enables cross-origin cookies)
- `secure: true` for production (HTTPS only)
- `httpOnly: true` (prevents XSS attacks)

#### CORS Configuration
✅ **Already configured** in `backend/src/app.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### 3. Deployment Steps

1. **Push your code to GitHub**
   ```powershell
   git add .
   git commit -m "Configure for production deployment"
   git push origin main
   ```

2. **On Render Dashboard:**
   - Go to your backend service
   - Navigate to "Environment" tab
   - Add all the environment variables listed above
   - Click "Save Changes"
   - Render will automatically redeploy

3. **After deployment, test the health endpoint:**
   ```
   https://curasync.onrender.com/health
   ```
   Should return:
   ```json
   {
     "status": "success",
     "message": "CuraSync API is running",
     "timestamp": "2025-11-24T...",
     "environment": "production",
     "version": "1.0.0"
   }
   ```

## Frontend Deployment

### 1. Environment Variables

Create `.env.production` in the frontend directory:

```env
NEXT_PUBLIC_API_URL=https://curasync.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://curasync.onrender.com
```

### 2. Deployment Options

#### Option A: Vercel (Recommended for Next.js)

1. **Install Vercel CLI** (if not already installed):
   ```powershell
   npm install -g vercel
   ```

2. **Deploy:**
   ```powershell
   cd frontend
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to project settings
   - Add `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`
   - Redeploy

4. **Update Backend FRONTEND_URL:**
   - Once deployed, copy your Vercel URL (e.g., `https://curasync.vercel.app`)
   - Go to Render dashboard → Backend service → Environment
   - Update `FRONTEND_URL` to your Vercel URL
   - Save (this will trigger a redeploy)

#### Option B: Netlify

1. **Build the frontend:**
   ```powershell
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify:**
   - Connect your GitHub repo
   - Set build command: `npm run build`
   - Set publish directory: `.next`
   - Add environment variables in Netlify dashboard

3. **Update Backend FRONTEND_URL** with your Netlify URL

## Testing Deployment

### 1. Test Backend Health
```
GET https://curasync.onrender.com/health
```

### 2. Test CORS
```javascript
// From your deployed frontend, this should work:
fetch('https://curasync.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'test@test.com', password: 'test123' })
})
```

### 3. Test Authentication Flow
1. Go to your deployed frontend
2. Navigate to signup page
3. Create a test account
4. Verify email
5. Login
6. Check that cookies are set (DevTools → Application → Cookies)

## Common Issues & Solutions

### Issue: CORS Error "Origin not allowed"
**Solution:** Update `FRONTEND_URL` environment variable on Render to match your deployed frontend URL exactly (no trailing slash).

### Issue: Cookies not being set
**Solution:** Ensure:
- Backend has `credentials: true` in CORS config ✅
- Frontend includes `credentials: 'include'` in all fetch calls ✅
- Backend uses `sameSite: 'none'` and `secure: true` in production ✅

### Issue: Rate limiting errors
**Solution:** Ensure `app.set('trust proxy', 1)` is configured ✅

### Issue: MongoDB connection failed
**Solution:** 
- Check `MONGODB_URI` is correct
- Ensure MongoDB Atlas allows connections from 0.0.0.0/0 (all IPs)
- Or add Render's IP addresses to MongoDB whitelist

## Security Checklist

- ✅ JWT_SECRET is a strong, random string
- ✅ NODE_ENV set to 'production'
- ✅ MONGODB_URI connection string is secure
- ✅ CORS restricted to specific frontend origin
- ✅ Rate limiting enabled (100 req/15min)
- ✅ Trust proxy configured for Render
- ✅ Cookies are httpOnly, secure, and sameSite
- ✅ .env files are gitignored

## Local Development

To test locally with the deployed backend:

1. **Frontend .env.local:**
   ```env
   NEXT_PUBLIC_API_URL=https://curasync.onrender.com/api
   NEXT_PUBLIC_SOCKET_URL=https://curasync.onrender.com
   ```

2. **Temporarily update Render FRONTEND_URL:**
   ```env
   FRONTEND_URL=http://localhost:3000
   ```
   Remember to change it back to production URL after testing!

## Monitoring

### Logs
- **Render:** Dashboard → Logs tab
- **Frontend:** Vercel/Netlify dashboard → Functions/Logs

### Health Check
Set up monitoring for:
```
https://curasync.onrender.com/health
```

## Need Help?

Common debugging commands:

```powershell
# Check frontend build
cd frontend
npm run build

# Test backend locally
cd backend
npm start

# Check environment variables
echo $env:NEXT_PUBLIC_API_URL  # PowerShell
```

---

## Summary of Changes Made

### Backend Changes:
1. ✅ Added `app.set('trust proxy', 1)` for Render deployment
2. ✅ Updated cookie `sameSite` to `'none'` for production cross-origin support
3. ✅ Created `.env.example` with all required environment variables

### Frontend Changes:
1. ✅ Added `credentials: 'include'` to all fetch API calls (17 locations)
2. ✅ Created centralized config at `src/lib/config.ts`
3. ✅ Created `.env.local` and `.env.example` files

All authentication flows now properly handle cross-origin cookies! 🎉
