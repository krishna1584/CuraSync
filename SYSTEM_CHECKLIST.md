# Report Upload System - Complete Checklist

## ✅ Configuration Status

### Backend Configuration
- [x] Report model created with 35 fields
- [x] Cloudinary configured (cloud: dfbabcwcd)
- [x] Gemini AI configured (model: gemini-1.5-flash)
- [x] MongoDB connection string set
- [x] Report controller with uploadReport function
- [x] API routes registered at `/api/reports`
- [x] Multer configured for file uploads (10MB max)
- [x] Authentication middleware applied
- [x] CORS configured for localhost:3000

### Frontend Configuration  
- [x] `.env.local` set to `http://localhost:5000`
- [x] Upload page at `/upload-report`
- [x] FormData fields match backend expectations
- [x] Report types match backend enum
- [x] File validation (PDF, PNG, JPG, JPEG, max 10MB)
- [x] Authentication token in headers
- [x] Toast notifications configured

### Dependencies Installed
- [x] Backend: @google/generative-ai@0.24.1
- [x] Backend: axios@1.13.2
- [x] Backend: cloudinary@2.7.0
- [x] Backend: multer@2.0.2
- [x] All other backend dependencies
- [x] All frontend dependencies

## 🔧 What Was Fixed

1. **Report Types Mismatch**
   - Changed from 13 types to 9 types matching backend
   - Updated default from "Lab Report" to "Blood Test"

2. **FormData Field Names**
   - `file` → `reportFile`
   - `title` → `reportTitle`
   - `reportDate` → `testDate`
   - `description` → `notes`

3. **Patient ID Selection**
   - Fixed redundant `selectedPatient._id || selectedPatient.patientId || selectedPatient._id`
   - Now: `selectedPatient._id || selectedPatient.patientId`

4. **API URL Configuration**
   - Changed from Render URL to localhost
   - Updated `.env.local` to use `http://localhost:5000`

5. **Notes Field**
   - Added default empty string to prevent undefined

## 📝 How to Use

### For Testing Locally

1. **Start Backend** (Terminal 1):
   ```powershell
   cd d:\CuraSync\Curasyncnext\backend
   npm start
   ```
   Wait for: `🚀 CuraSync Hospital API Server running on port 5000`

2. **Start Frontend** (Terminal 2):
   ```powershell
   cd d:\CuraSync\Curasyncnext\frontend
   npm run dev
   ```
   Wait for: `▲ Next.js ... - Local: http://localhost:3000`

3. **Login**:
   - Go to `http://localhost:3000/auth/login`
   - Use doctor/admin/nurse/receptionist account
   - Or use patient account (can upload own reports)

4. **Upload Report**:
   - Go to `http://localhost:3000/upload-report`
   - Select patient (if staff)
   - Fill report title
   - Select report type
   - Choose test date
   - Add notes (optional)
   - Click "Choose File" - select PDF or image
   - Click "Upload Report"

5. **Expected Success**:
   - Toast: "Report uploaded successfully! AI is extracting data..."
   - Redirect to records page
   - Report appears in database with status "pending"
   - After 30-60 seconds: Status changes to "processed"

## 🐛 Common Errors & Solutions

### "upload failed" (red error)

**Possible Causes:**

1. **Backend not running**
   - Solution: Start backend with `npm start`
   - Verify: Open `http://localhost:5000/health` in browser

2. **Not logged in**
   - Solution: Login first at `/auth/login`
   - Verify: Check browser localStorage for 'token'

3. **Missing required fields**
   - Solution: Fill all required fields (patient, title, type, date)
   - Verify: Check browser console (F12) for specific error

4. **File too large**
   - Solution: Use file smaller than 10MB
   - Verify: Check file size before uploading

5. **Wrong file type**
   - Solution: Only use PDF, PNG, JPG, or JPEG
   - Verify: Check file extension

6. **CORS issue**
   - Solution: Ensure backend CORS allows localhost:3000
   - Verify: Check backend console for CORS messages

7. **MongoDB not connected**
   - Solution: Check MongoDB connection string in `.env`
   - Verify: Backend should show "MongoDB Connected" on start

8. **Cloudinary not configured**
   - Solution: Verify all CLOUDINARY_* variables in `.env`
   - Verify: Run `npm run check` in backend folder

### "Network error. Please try again."

**This means the fetch request failed completely**

Solutions:
1. Verify backend is running on port 5000
2. Check `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:5000`
3. Restart both servers
4. Check firewall isn't blocking port 5000

### Backend Errors

If backend shows error, check:
1. MongoDB connection
2. Cloudinary credentials
3. Gemini API key
4. Patient exists in database
5. File buffer is valid

## 🧪 Testing Checklist

- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can login successfully
- [ ] Upload page loads
- [ ] Can select patient from dropdown
- [ ] Can select file (file name appears)
- [ ] Can fill all fields
- [ ] Submit button is not disabled
- [ ] Upload completes with success toast
- [ ] Redirects to records page
- [ ] Report appears in records list
- [ ] Report status changes to "processed" after ~60 seconds
- [ ] Can view extracted data
- [ ] Metrics are displayed correctly

## 📊 Backend API Endpoints

```
POST /api/reports/upload
Headers: Authorization: Bearer <token>
Body: FormData
  - reportFile: File
  - patientId: String
  - reportTitle: String
  - reportType: String (enum)
  - testDate: Date
  - notes: String (optional)
Response: { success: true, message: "...", data: {...} }

GET /api/reports/my-reports
Headers: Authorization: Bearer <token>
Response: { success: true, data: [...] }

GET /api/reports/:id
Headers: Authorization: Bearer <token>
Response: { success: true, data: {...} }
```

## 🎯 System Architecture

```
User → Frontend (Next.js) → Backend API (Express) → MongoDB
                              ↓
                         Cloudinary (File Storage)
                              ↓
                         Gemini AI (Data Extraction)
                              ↓
                         MongoDB (Store Extracted Data)
```

## 🔑 Important Notes

1. **AI Extraction is Asynchronous**
   - Upload returns immediately with "pending" status
   - Gemini AI processes in background (30-60 seconds)
   - Status updates to "processed" when complete
   - Check backend console for extraction logs

2. **Free Tier Limits**
   - Cloudinary: 25GB storage, 25GB bandwidth/month
   - Gemini AI: 1,500 requests/day, 15 RPM
   - Both are sufficient for testing

3. **File Size Limits**
   - Backend: 10MB max (multer config)
   - Frontend: 10MB validation
   - Cloudinary: Supports up to 100MB (but we limit to 10MB)

4. **Supported File Types**
   - PDF (recommended for reports)
   - PNG, JPG, JPEG (for images)
   - Backend validates file type

5. **Authentication Required**
   - All report endpoints require JWT token
   - Token must be in Authorization header
   - Token stored in localStorage after login

## 🚀 Production Deployment Notes

When deploying to production:

1. Update `.env.local` to use production backend URL
2. Update backend `.env` with production MongoDB
3. Ensure CORS allows production frontend URL
4. Test with actual medical reports
5. Monitor Gemini API usage
6. Set up error logging
7. Add report upload analytics
