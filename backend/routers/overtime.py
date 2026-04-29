from fastapi import APIRouter, Depends, HTTPException
from database import db
from models import OvertimeRequest
from utils.auth import get_current_user, require_role
from bson import ObjectId

router = APIRouter(prefix="/overtime", tags=["overtime"])

@router.post("/request")
async def request_overtime(req: OvertimeRequest, current_user: dict = Depends(get_current_user)):
    user_col = db.client.get_database("attendance").get_collection("users")
    user = await user_col.find_one({"email": current_user["email"]})
    
    ot_col = db.client.get_database("attendance").get_collection("overtime")
    ot_doc = req.dict()
    ot_doc["user_id"] = str(user["_id"])
    ot_doc["status"] = "pending"
    
    await ot_col.insert_one(ot_doc)
    return {"message": "Overtime request submitted successfully."}

@router.get("/requests", dependencies=[Depends(require_role(["Admin", "Manager"]))])
async def get_all_requests():
    ot_col = db.client.get_database("attendance").get_collection("overtime")
    cursor = ot_col.find().sort("date", -1)
    requests = await cursor.to_list(length=100)
    for r in requests:
        r["_id"] = str(r["_id"])
        # Fetch user name
        u_col = db.client.get_database("attendance").get_collection("users")
        user = await u_col.find_one({"_id": ObjectId(r["user_id"])})
        r["user_name"] = user["full_name"] if user else "Unknown"
    return requests

@router.put("/approve/{req_id}", dependencies=[Depends(require_role(["Admin", "Manager"]))])
async def approve_request(req_id: str, status: str):
    ot_col = db.client.get_database("attendance").get_collection("overtime")
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    res = await ot_col.update_one(
        {"_id": ObjectId(req_id)},
        {"$set": {"status": status}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
        
    return {"message": f"Overtime request {status}."}
