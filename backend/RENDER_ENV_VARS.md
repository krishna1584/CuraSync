# ✅ RENDER DEPLOYMENT - Environment Variables

## Set these in Render Dashboard → Environment Tab

| Variable Name | Value | Required |
|--------------|-------|----------|
| `FRONTEND_URL` | `https://your-app.vercel.app` | Yes |
| `NODE_ENV` | `production` | Yes |
| `JWT_SECRET` | Your secure random string | Yes |
| `MONGODB_URI` | Your MongoDB connection string | Yes |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | If using Cloudinary |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | If using Cloudinary |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | If using Cloudinary |
| `GEMINI_API_KEY` | Your Google Gemini API key | If using AI features |

**Important:**
- `FRONTEND_URL` must match your exact Vercel deployment URL
- Include protocol: `https://` not `http://`
- Redeploy after adding/updating variables

## Example Values
```
FRONTEND_URL=https://curasync1.vercel.app
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/curasync
```

## How to Add in Render
1. Go to https://dashboard.render.com/
2. Select your backend service
3. Click **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Add each variable with its value
6. Click **Save Changes**
7. Render will automatically redeploy

## Verify Setup
After deployment, check your Render logs for:
```
🔒 CORS Allowed Origins: [ 'https://your-app.vercel.app' ]
```

If you see this, CORS is configured correctly!
