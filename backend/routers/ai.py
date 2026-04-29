from fastapi import APIRouter, Depends
from pydantic import BaseModel
import google.generativeai as genai
from database import settings, db
from utils.auth import require_role
import json

router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(require_role(["Admin", "Manager"]))])

class AIQuery(BaseModel):
    query: str

@router.post("/ask")
async def ask_ai(query_req: AIQuery):
    if not settings.gemini_api_key:
        return {"response": "Gemini API Key is not configured."}
    
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    # Fetch Data Context
    att_col = db.client.get_database("attendance").get_collection("attendance")
    records = await att_col.find().to_list(length=100)
    
    users_col = db.client.get_database("attendance").get_collection("users")
    users = await users_col.find({}, {"full_name": 1, "email": 1}).to_list(length=100)
    user_map = {str(u["_id"]): u["full_name"] for u in users}

    ot_col = db.client.get_database("attendance").get_collection("overtime")
    ot_requests = await ot_col.find().to_list(length=100)
    
    context_data = {
        "attendance_records": records,
        "users": user_map,
        "overtime_requests": ot_requests
    }
    
    prompt = f"""
    You are an AI assistant for an Attendance Management System. 
    A Manager/Admin asked: "{query_req.query}"
    
    Here is the system data in JSON format:
    {json.dumps(context_data, default=str)}
    
    Please answer the query accurately based ONLY on this data. Be concise.
    """
    
    response = model.generate_content(prompt)
    return {"response": response.text}
