# Upload Report Testing Guide

## Current Configuration

### Backend (Port 5000)
- **API Endpoint**: `POST http://localhost:5000/api/reports/upload`
- **Authentication**: JWT token required in Authorization header
- **Cloudinary**: Configured and tested ✅
- **Gemini AI**: Configured (model: gemini-1.5-flash)
- **MongoDB**: Connected ✅

### Frontend (Port 3000)
- **API URL**: `http://localhost:5000` (configured in `.env.local`)
- **Upload Page**: `/upload-report`

## Required Form Data

The backend expects these fields:
1. `reportFile` - The file (PDF, PNG, JPG, JPEG - max 10MB)
2. `patientId` - Patient's ID or MongoDB _id
3. `reportTitle` - Title of the report
4. `reportType` - One of: Blood Test, Urine Test, X-Ray, MRI, CT Scan, Ultrasound, ECG, Pathology, Other
5. `testDate` - Date of the test
6. `notes` - Optional notes/description

## How to Test

### Step 1: Start Backend Server
```powershell
cd d:\CuraSync\Curasyncnext\backend
npm start
```

Expected output:
```
🚀 CuraSync Hospital API Server running on port 5000
📊 Health check available at: http://localhost:5000/health
```

### Step 2: Start Frontend Server
```powershell
cd d:\CuraSync\Curasyncnext\frontend
npm run dev
```

Expected output:
```
▲ Next.js 15.1.3
- Local:        http://localhost:3000
```

### Step 3: Test Upload Flow

1. **Login First**: Go to `http://localhost:3000/auth/login`
   - Login as a doctor, admin, nurse, or receptionist
   - Or login as a patient (patients can upload their own reports)

2. **Navigate to Upload**: Go to `http://localhost:3000/upload-report`

3. **Fill the Form**:
   - Select Patient (if you're staff) or it will auto-select if you're a patient
   - Enter Report Title (e.g., "Blood Test Results")
   - Select Report Type (e.g., "Blood Test")
   - Select Test Date
   - Add Notes (optional)
   - Click "Choose File" and select a PDF or image

4. **Submit**: Click "Upload Report"

5. **Expected Behavior**:
   - Green toast: "Report uploaded successfully! AI is extracting data..."
   - Redirect to records page
   - Background: Gemini AI extracts data from the report
   - Within 30-60 seconds: Report status changes to "processed"

## Troubleshooting

### Error: "Network error. Please try again."
**Cause**: Backend not running or frontend can't reach it
**Fix**: 
```powershell
# Check if backend is running
curl http://localhost:5000/health

# If not running, start it
cd d:\CuraSync\Curasyncnext\backend
npm start
```

### Error: "Upload failed" with no specific message
**Cause**: Missing required fields or authentication issue
**Fix**:
1. Check browser console (F12) for detailed error
2. Verify you're logged in (check localStorage for 'token')
3. Ensure all required fields are filled

### Error: "Patient not found"
**Cause**: Invalid patient ID
**Fix**:
1. Make sure you selected a patient from the dropdown
2. If you're a patient, ensure your account is properly set up

### Error: "Only images and PDFs are allowed"
**Cause**: Trying to upload unsupported file type
**Fix**: Only upload PDF, PNG, JPG, or JPEG files

### Error: "File size should be less than 10MB"
**Cause**: File too large
**Fix**: Compress the file or use a smaller file

## Backend Logs to Watch

When you upload, you should see in backend console:
```
Uploading to Cloudinary...
Cloudinary upload successful: https://res.cloudinary.com/...
Starting AI extraction for report: [reportId]
AI extraction completed for report: [reportId]
```

## Testing AI Extraction

1. Upload a blood test report PDF
2. Check the database or API response for:
   - `status: "pending"` initially
   - After 30-60 seconds: `status: "processed"`
   - `aiProcessed: true`
   - `extractedData`: Contains extracted information
   - `metrics`: Contains specific values (hemoglobin, bloodSugar, etc.)

## Quick API Test (Using PowerShell)

```powershell
# Get your auth token first (login through UI and copy from localStorage)
$token = "your_jwt_token_here"

# Test upload
$headers = @{
    "Authorization" = "Bearer $token"
}

# This will fail without actual file, but tests connectivity
Invoke-RestMethod -Uri "http://localhost:5000/api/reports/my-reports" -Headers $headers
```

## Changes Made

1. ✅ Fixed `reportTypes` array to match backend enum
2. ✅ Fixed FormData field names (reportFile, reportTitle, testDate, notes)
3. ✅ Fixed redundant patientId access
4. ✅ Updated `.env.local` to use localhost backend
5. ✅ Added default empty string for notes field

## Next Steps After Successful Upload

1. View uploaded reports: `/patient/records` or `/doctor/dashboard`
2. Check AI-extracted data in the report details
3. Verify metrics display correctly
4. Test different report types (X-Ray, MRI, etc.)
