# CuraSync Hospital Management System

A full-stack hospital management system built with Next.js (Frontend) and Express.js (Backend).

## Project Structure

```
curasync-hospital-management/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── package.json       # Root package.json for managing both apps
└── README.md         # This file
```

## Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB (local or cloud instance)

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies for both frontend and backend
npm run install-all
```

### 2. Environment Setup

#### Backend Configuration
Create a `.env` file in the `backend/` directory:
```bash
cp backend/.env.example backend/.env
```

Update the environment variables in `backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/cura-sync-hospital

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

#### Frontend Configuration
The frontend environment is already configured in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### 3. Development

#### Start Both Applications (Recommended)
```bash
npm run dev
```
This starts both the backend (port 5000) and frontend (port 3000) concurrently.

#### Start Applications Individually
```bash
# Start only the backend
npm run dev:backend

# Start only the frontend
npm run dev:frontend
```

### 4. Production Build

```bash
# Build the frontend for production
npm run build

# Start production servers
npm run start
```

## API Integration

The frontend and backend are integrated using:

1. **Next.js Rewrites**: API calls starting with `/api` are automatically proxied to the backend server
2. **CORS Configuration**: Backend is configured to accept requests from the frontend
3. **Environment Variables**: API URLs are configurable via environment variables

### API Base URL
- Development: `http://localhost:5000/api`
- Frontend calls use relative paths: `/api/auth/login`, `/api/users`, etc.

## Available Scripts

### Root Level Scripts
- `npm run install-all` - Install dependencies for both apps
- `npm run dev` - Start both apps in development mode
- `npm run start` - Start both apps in production mode
- `npm run build` - Build frontend for production
- `npm run lint` - Lint both applications
- `npm run clean` - Clean node_modules and build files

### Individual App Scripts
- `npm run dev:frontend` - Start frontend only
- `npm run dev:backend` - Start backend only
- `npm run start:frontend` - Start frontend in production
- `npm run start:backend` - Start backend in production

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Backend Health Check**: http://localhost:5000/health

## Features

### Frontend (Next.js)
- User Authentication (Login/Signup/OTP Verification)
- Patient Dashboard
- Doctor Dashboard
- Admin Panel
- Appointment Booking
- Lab Test Booking
- Medical Records Management
- Report Upload

### Backend (Express.js)
- RESTful API
- JWT Authentication
- User Management (Patients, Doctors, Admins)
- Appointment Management
- Lab Test Management
- File Upload (Cloudinary integration)
- Email Services (OTP, Notifications)

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod
- **UI Components**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast

### Backend
- **Framework**: Express.js 4.18.2
- **Language**: JavaScript (Node.js)
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting

## Database

The application uses MongoDB with the following collections:
- Users (Patients, Doctors, Admins)
- Appointments
- Lab Tests
- Medical Records
- Reports
- OTPs

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- File upload restrictions
- Environment variable protection

## Development Guidelines

1. **Environment Variables**: Never commit `.env` files. Use `.env.example` files as templates.
2. **API Calls**: Use the provided `apiCall` utility in `frontend/src/lib/api.ts` for consistent API interactions.
3. **Error Handling**: Both frontend and backend have centralized error handling.
4. **Code Style**: Use the provided ESLint configurations.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend's `FRONTEND_URL` environment variable matches your frontend URL.
2. **Database Connection**: Verify MongoDB is running and the `MONGODB_URI` is correct.
3. **Port Conflicts**: Change the `PORT` in backend `.env` if port 5000 is in use.
4. **Environment Variables**: Ensure all required environment variables are set.

### Logs

- Backend logs are displayed in the terminal
- Frontend logs are in the browser console
- Check the browser's Network tab for API call details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.