# CuraSync Hospital Management System

A full-stack hospital management system built with Next.js (Frontend) and Express.js (Backend).

## Project Structure

```
CuraSync/
├── frontend/   # Next.js app (run it from this folder)
├── backend/    # Express API (run it from this folder)
└── README.md
```

The two apps are separate: each has its own `package.json` and is installed and started from its own folder.

## Prerequisites

- Node.js 18 or newer
- A MongoDB database (local or Atlas)
- A Cloudinary account, for report uploads
- A Gemini API key, for reading values out of uploaded reports (optional)

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

### 2. Configure the backend

Copy `backend/.env.example` to `backend/.env` and fill it in. `MONGODB_URI` and `JWT_SECRET` are required; the server will not start without a real `JWT_SECRET`.

Email is optional and off by default, so accounts can use made-up addresses such as `test1@gmail.com`. Set `EMAIL_VERIFICATION_ENABLED=true` and the `EMAIL_*` values to turn on verification codes and password reset by email.

### 3. Configure the frontend

Create `frontend/.env.local` with the backend's address. It works with or without a trailing `/api`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

`NEXT_PUBLIC_SOCKET_URL` is optional and defaults to the same address.

### 4. Create the first admin

Run this from the `backend` folder:

```bash
npm run create-admin -- "Admin Name" admin@hospital.com "a-strong-password"
```

Admins create doctor and staff accounts from the admin dashboard. Patients can sign up themselves.

### 5. Start both apps

In one terminal, from `backend`:

```bash
npm run dev
```

In another terminal, from `frontend`:

```bash
npm run dev
```

## Available Scripts

### Backend (`backend/`)
- `npm run dev` - Start with auto-reload
- `npm start` - Start for production
- `npm run create-admin -- "Name" email "password"` - Create or promote an admin
- `npm run check` - Check the database, Cloudinary and Gemini connections

### Frontend (`frontend/`)
- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm start` - Serve the production build
- `npm run lint` - Run ESLint

## API Integration

The browser calls the backend directly. Frontend code gets the address from `API_URL` in `frontend/src/lib/config.ts`, and the backend only accepts browser requests from `FRONTEND_URL`, `ALLOWED_ORIGINS` and the origins listed in `backend/src/config/origins.js`.

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Backend Health Check**: http://localhost:5000/health

## Features

### Frontend (Next.js)
- User Authentication (Login/Signup, optional email verification)
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
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React
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
- Prescriptions
- Settings
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
2. **API Calls**: Build backend URLs from `API_URL` in `frontend/src/lib/config.ts`.
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