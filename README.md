# AI-Powered Attendance System

## Overview
This is a Full-Stack AI-based Attendance Management System utilizing face recognition and an AI assistant. The backend is built with FastAPI, OpenCV, and MongoDB Atlas. The frontend is built using React (Vite) and Redux Toolkit.

## Tech Stack
- **Backend:** FastAPI, Python, OpenCV, `face-recognition`, MongoDB, Google Gemini API
- **Frontend:** React (Vite), Redux Toolkit, Axios, Custom Vanilla CSS
- **Database:** MongoDB Atlas

## Core Features
1. Secure JWT Login & Role-based authentication (Employee, Manager, Admin)
2. Smart Attendance marking using Facial Recognition matching base64 live captures.
3. Overtime requests workflow with manager approval.
4. Admin panel for managing employees and invalidating attendance records.
5. AI Assistant integrated with Google Gemini to answer questions about attendance and data.

## Environment Variables (.env)
You must set the following environment variables (or rely on defaults/export directly) for the backend:
```env
MONGODB_URL=your_MONGODB_Url_here
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secure_jwt_secret
```

## Running Locally

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. Activate environment:
   * Windows: `.\venv\Scripts\activate`
   * Mac/Linux: `source venv/bin/activate`
4. `pip install -r requirements.txt` (or install manually per plan: `pip install fastapi uvicorn pymongo motor opencv-python-headless face-recognition google-generativeai python-jose[cryptography] passlib[bcrypt] python-multipart pydantic-settings`)
5. Start Server: `uvicorn main:app --reload`
*The server will run on http://localhost:8000*

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Start Dev Server: `npm run dev`
*The Vite application will start, typically on http://localhost:5173*

## API Endpoints (Quick Reference)
- `POST /auth/register` - Create user
- `POST /auth/login` - Obtain JWT
- `POST /attendance/onboard-face` - Register a user's face encoding
- `POST /attendance/punch` - Match face and mark attendance
- `POST /overtime/request` - Submit OT
- `POST /ai/ask` - Send a text query to the Gemini Assistant
