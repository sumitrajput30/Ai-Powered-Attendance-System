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
    print(f"Connecting to MongoDB...")
    try:
        db.client = AsyncIOMotorClient(
            settings.mongodb_url,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        # Send a ping to confirm a successful connection
        await db.client.admin.command('ping')
        print("Successfully connected to MongoDB")
    except Exception as e:
        print(f"Could not connect to MongoDB: {e}")
        # Fallback for local development or if SSL issues persist
        print("Retrying with tlsInsecure=True...")
        db.client = AsyncIOMotorClient(
            settings.mongodb_url,
            tls=True,
            tlsInsecure=True,
            serverSelectionTimeoutMS=5000,
        )
        try:
            await db.client.admin.command('ping')
            print("Connected to MongoDB (Insecure Mode)")
        except Exception as e2:
            print(f"Failed to connect even in insecure mode: {e2}")
            raise e2

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")
