from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "Employee"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(UserBase):
    id: Optional[str] = Field(None, alias="_id")
    is_active: bool = True
    face_encoding: Optional[List[float]] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class AttendanceRecord(BaseModel):
    user_id: str
    date: str # YYYY-MM-DD
    punch_in_time: Optional[datetime] = None
    punch_out_time: Optional[datetime] = None
    punch_in_location: Optional[str] = None # lat,long
    punch_out_location: Optional[str] = None # lat,long
    status: str = "absent" # present, incomplete, absent
    is_valid: bool = True

class OvertimeRequest(BaseModel):
    user_id: str
    date: str
    hours: float
    reason: str
    status: str = "pending" # pending, approved, rejected
