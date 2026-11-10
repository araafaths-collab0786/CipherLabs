"""
Cipher Labs - MongoDB Atlas Async Client & Index Manager
Enforces collection indexes, idempotency constraints, and connection pooling.
"""

import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import MONGODB_URI, MONGODB_DB_NAME

logger = logging.getLogger("cipher_backend.db")

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None

async def init_db() -> Optional[AsyncIOMotorDatabase]:
    global _client, _db
    if not MONGODB_URI:
        logger.warning("MongoDB URI not provided. Database running in local fallback / offline mode.")
        return None

    try:
        _client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        _db = _client[MONGODB_DB_NAME]

        # Verify connection
        await _client.admin.command('ping')
        logger.info("Successfully connected to MongoDB Atlas database: %s", MONGODB_DB_NAME)

        # Enforce unique compound indexes (replacing PostgreSQL RLS / unique constraints)
        await _db.users.create_index("email", unique=True)
        await _db.devices.create_index([("user_id", 1), ("app_device_id", 1)], unique=True)
        await _db.operations.create_index([("user_id", 1), ("idempotency_key", 1)], unique=True)
        await _db.reports.create_index([("user_id", 1), ("idempotency_key", 1)], unique=True)
        await _db.audit_log.create_index([("user_id", 1), ("sequence_id", 1)])
        await _db.recovery_copies.create_index([("user_id", 1), ("operation_id", 1)])
        await _db.recovery_candidates.create_index([("user_id", 1), ("scan_id", 1)])

        return _db
    except Exception as e:
        logger.error("Failed to connect to MongoDB Atlas: %s. Operating in offline diagnostic mode.", str(e))
        _db = None
        return None

def get_db() -> Optional[AsyncIOMotorDatabase]:
    return _db

async def close_db():
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB client closed.")
