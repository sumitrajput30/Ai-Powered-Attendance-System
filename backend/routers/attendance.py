from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import db
from models import AttendanceRecord
from utils.auth import get_current_user
from utils.face_utils import compare_faces, get_face_encoding
from datetime import datetime, date
from bson import ObjectId

router = APIRouter(prefix="/attendance", tags=["attendance"])

class FaceOnboardRequest(BaseModel):
    base64_image: str

class PunchRequest(BaseModel):
    base64_image: str
    location: str # lat,long

@router.post("/onboard-face")
async def onboard_face(request: FaceOnboardRequest, current_user: dict = Depends(get_current_user)):
    encoding = get_face_encoding(request.base64_image)
    if not encoding:
        raise HTTPException(status_code=400, detail="No face detected in the image.")
    
    collection = db.client.get_database("attendance").get_collection("users")
    await collection.update_one(
        {"email": current_user["email"]},
        {"$set": {"face_encoding": encoding}}
    )
    return {"message": "Face registered successfully."}

@router.post("/punch")
async def punch(request: PunchRequest, current_user: dict = Depends(get_current_user)):
    # 1. Verify face
    collection = db.client.get_database("attendance").get_collection("users")
    user = await collection.find_one({"email": current_user["email"]})
    if not user or not user.get("face_encoding"):
        raise HTTPException(status_code=400, detail="Face not registered/User not found.")
    
    is_match = compare_faces(user["face_encoding"], request.base64_image)
    if not is_match:
        raise HTTPException(status_code=401, detail="Face mismatch. Attendance rejected.")
    
    # 2. Add Attendance Record
    att_collection = db.client.get_database("attendance").get_collection("attendance")
    today_str = date.today().isoformat()
    
    record = await att_collection.find_one({
        "user_id": str(user["_id"]),
        "date": today_str
    })
    
    now = datetime.utcnow()
    
    if not record:
        # Punch In
        new_record = AttendanceRecord(
            user_id=str(user["_id"]),
            date=today_str,
            punch_in_time=now,
            punch_in_location=request.location,
            status="incomplete" # Waiting for punch out
        )
        await att_collection.insert_one(new_record.dict())
        return {"message": "Punched in successfully."}
    else:
        # Punch Out
        if record.get("punch_out_time"):
             raise HTTPException(status_code=400, detail="Already punched out for today.")
             
        punch_in_time = record["punch_in_time"]
        worked_seconds = (now - punch_in_time).total_seconds()
        worked_hours = worked_seconds / 3600
        
        status = "present" if worked_hours >= 8 else "incomplete"
        
        await att_collection.update_one(
            {"_id": record["_id"]},
            {"$set": {
                "punch_out_time": now,
                "punch_out_location": request.location,
                "status": status
            }}
        )
        return {"message": "Punched out successfully.", "worked_hours": round(worked_hours, 2), "status": status}

@router.get("/my-records")
async def get_my_records(current_user: dict = Depends(get_current_user)):
    user_collection = db.client.get_database("attendance").get_collection("users")
    user = await user_collection.find_one({"email": current_user["email"]})
    
    att_collection = db.client.get_database("attendance").get_collection("attendance")
    cursor = att_collection.find({"user_id": str(user["_id"])})
    records = await cursor.to_list(length=100)
    for r in records:
        r["_id"] = str(r["_id"])
    return records
