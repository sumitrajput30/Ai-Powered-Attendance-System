from fastapi import APIRouter, Depends, HTTPException
from database import db
from utils.auth import require_role
from bson import ObjectId

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role(["Admin"]))])

@router.get("/users")
async def get_users():
    col = db.client.get_database("attendance").get_collection("users")
    cursor = col.find({}, {"hashed_password": 0, "face_encoding": 0})
    users = await cursor.to_list(length=100)
    for u in users:
        u["_id"] = str(u["_id"])
    return users

@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str):
    col = db.client.get_database("attendance").get_collection("users")
    user = await col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("is_active", True)
    await col.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_active": new_status}})
    return {"message": f"User {'enabled' if new_status else 'disabled'} successfully."}

@router.get("/attendance")
async def get_all_attendance():
    col = db.client.get_database("attendance").get_collection("attendance")
    cursor = col.find().sort("date", -1)
    records = await cursor.to_list(length=500)
    for r in records:
        r["_id"] = str(r["_id"])
        # Fetch user name for display
        u_col = db.client.get_database("attendance").get_collection("users")
        user = await u_col.find_one({"_id": ObjectId(r["user_id"])})
        r["user_name"] = user["full_name"] if user else "Unknown"
    return records

@router.put("/attendance/{record_id}/invalidate")
async def invalidate_attendance(record_id: str):
    col = db.client.get_database("attendance").get_collection("attendance")
    res = await col.update_one({"_id": ObjectId(record_id)}, {"$set": {"is_valid": False}})
    if res.modified_count == 0:
         raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Record marked as invalid."}
