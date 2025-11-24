# Vercel Environment Variables Setup

## Important: .env.local vs Vercel Environment Variables

**.env.local** is for LOCAL development only - Vercel **DOES NOT** read this file.

For Vercel deployment, you must set environment variables in the Vercel Dashboard.

## Step-by-Step: Add Environment Variables to Vercel

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your project: **curasync1**

### 2. Navigate to Settings
- Click on **Settings** tab
- Click on **Environment Variables** in the left sidebar

### 3. Add These Variables

Add each variable one by one:

#### Variable 1: API URL
- **Key:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://curasync.onrender.com/api`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2: Socket URL
- **Key:** `NEXT_PUBLIC_SOCKET_URL`
- **Value:** `https://curasync.onrender.com`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### 4. Redeploy
After adding variables, you MUST redeploy:
- Go to **Deployments** tab
- Click on the latest deployment
- Click **"Redeploy"** button

OR simply push a new commit:
```powershell
git add .
git commit -m "Update environment configuration"
git push
```

## Render Environment Variables Setup

### Go to Render Dashboard
- Visit: https://dashboard.render.com
- Select your backend service: **curasync**

### Add These Variables

#### Variable 1: Frontend URL
- **Key:** `FRONTEND_URL`
- **Value:** `https://curasync1.vercel.app`

#### Variable 2: Node Environment
- **Key:** `NODE_ENV`
- **Value:** `production`

#### Variable 3: MongoDB URI
- **Key:** `MONGODB_URI`
- **Value:** `mongodb+srv://krishna1584:abhishek1234@backend.s6pu1zv.mongodb.net/TestingCuraSync`

#### Variable 4: JWT Secret
- **Key:** `JWT_SECRET`
- **Value:** `cura-sync-jwt-secret-key-123456789`

#### Variable 5: JWT Expiry
- **Key:** `JWT_EXPIRE`
- **Value:** `30d`

### Save and Redeploy
- Click **"Save Changes"**
- Render will automatically redeploy

## Verification Checklist

After deployment, verify:

### ✅ Backend Health Check
```
GET https://curasync.onrender.com/health
```
Should return status 200 with message.

### ✅ Frontend Build
- Check Vercel deployment logs
- Ensure no errors about missing environment variables

### ✅ CORS Working
- Open https://curasync1.vercel.app
- Try to login
- Check browser console for CORS errors (should be none)

### ✅ WebSocket Connection
- After login, check browser console
- Look for "✅ Socket connected" message

## Common Issues

### Issue: Vercel shows "Missing environment variables"
**Solution:** Environment variables MUST be added in Vercel Dashboard, not in .env.local file.

### Issue: CORS error on production
**Solution:** Ensure `FRONTEND_URL` on Render exactly matches: `https://curasync1.vercel.app` (no trailing slash)

### Issue: Cookies not working
**Solution:** Already fixed - backend uses `sameSite: 'none'` and `secure: true` for production.

## Key Differences: Local vs Production

| File/Setting | Local Development | Production (Vercel) |
|--------------|-------------------|---------------------|
| Environment File | `.env.local` | Vercel Dashboard → Environment Variables |
| API URL | `http://localhost:5000/api` | `https://curasync.onrender.com/api` |
| Socket URL | `http://localhost:5000` | `https://curasync.onrender.com` |
| CORS Origin | `http://localhost:3000` | `https://curasync1.vercel.app` |

## After Completing Setup

1. ✅ Push code to GitHub
2. ✅ Verify Render deployment (check logs)
3. ✅ Verify Vercel deployment (check logs)
4. ✅ Test login at https://curasync1.vercel.app
5. ✅ Test WebSocket notifications

Your app should now work perfectly on production! 🎉
