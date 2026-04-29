from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import connect_to_mongo, close_mongo_connection
import traceback
import os

from routers import auth, attendance, overtime, admin, ai

app = FastAPI(title="AI-Powered Attendance System")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ai-powered-attendance-system-sigma.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if os.getenv("ENVIRONMENT") == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Print the traceback for debugging
    traceback.print_exc()
    
    headers = {}
    req_origin = request.headers.get("origin")
    if req_origin in origins or (os.getenv("ENVIRONMENT") != "production"):
        headers["Access-Control-Allow-Origin"] = req_origin or "*"
        headers["Access-Control-Allow-Credentials"] = "true"

    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
        headers=headers
    )

app.include_router(auth.router)
app.include_router(attendance.router)
app.include_router(overtime.router)
app.include_router(admin.router)
app.include_router(ai.router)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/")
def root():
    return {"message": "Welcome to the AI-Powered Attendance API"}
