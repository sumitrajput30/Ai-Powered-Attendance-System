import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    mongodb_url: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017/attendance")
    secret_key: str = os.getenv("SECRET_KEY", "super_secret_key")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def get_db():
    return db.client.get_database("attendance")

async def connect_to_mongo():
    print(f"Connecting to MongoDB at: {settings.mongodb_url}")
    db.client = AsyncIOMotorClient(
        settings.mongodb_url,
        tls=True,
        tlsInsecure=True,           # Bypass TLS cert/version negotiation issues on Windows
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=20000,
        socketTimeoutMS=20000,
    )
    print("Connected to MongoDB")

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")
