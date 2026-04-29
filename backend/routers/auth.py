from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from models import UserCreate, UserInDB, Token
from database import db
from utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserInDB)
async def register(user: UserCreate):
    collection = db.client.get_database("attendance").get_collection("users")
    existing_user = await collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict.pop("password")
    
    db_user = UserInDB(**user_dict)
    user_doc = db_user.dict(by_alias=True, exclude_none=True)
    user_doc["hashed_password"] = hashed_password
    
    # insert
    result = await collection.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    return user_doc

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(OAuth2PasswordRequestForm)):
    collection = db.client.get_database("attendance").get_collection("users")
    user = await collection.find_one({"email": form_data.username})
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=60)
    access_token = create_access_token(
        data={"sub": user["email"], "role": user.get("role", "Employee")},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
