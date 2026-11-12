
"""
Cipher Labs - MongoDB Atlas Async Client & Index Manager
Uses PyMongo Async for database connectivity and index management.
"""

import logging
from typing import Optional, Any

from pymongo import AsyncMongoClient

from .config import MONGODB_URI, MONGODB_DB_NAME

logger = logging.getLogger("cipher_backend.db")

_client: Optional[Any] = None
_db: Optional[Any] = None


async def init_db() -> Optional[Any]:
    global _client, _db

    if not MONGODB_URI:
        logger.warning(
            "MongoDB URI not provided. "
            "Database running in offline mode."
        )
        return None

    try:
        _client = AsyncMongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
        )

        _db = _client[MONGODB_DB_NAME]

        # Verify Atlas connection
        await _client.admin.command("ping")

        logger.info(
            "Successfully connected to MongoDB Atlas: %s",
            MONGODB_DB_NAME,
        )

        # Collection indexes
        await _db.users.create_index("email", unique=True)

        await _db.devices.create_index(
            [("user_id", 1), ("app_device_id", 1)],
            unique=True,
        )

        # Partial unique indexes: allow documents without idempotency keys
        await _db.operations.create_index(
            [("user_id", 1), ("idempotency_key", 1)],
            unique=True,
            partialFilterExpression={
                "idempotency_key": {"$type": "string"}
            },
        )

        await _db.reports.create_index(
            [("user_id", 1), ("idempotency_key", 1)],
            unique=True,
            partialFilterExpression={
                "idempotency_key": {"$type": "string"}
            },
        )

        await _db.audit_log.create_index(
            [("user_id", 1), ("sequence_id", 1)]
        )

        await _db.recovery_copies.create_index(
            [("user_id", 1), ("operation_id", 1)]
        )

        await _db.recovery_candidates.create_index(
            [("user_id", 1), ("scan_id", 1)]
        )

        logger.info("MongoDB indexes verified successfully.")

        return _db

    except Exception:
        logger.exception(
            "MongoDB Atlas initialization failed. "
            "Operating in offline diagnostic mode."
        )

        if _client is not None:
            await _client.close()

        _client = None
        _db = None

        return None


def get_db() -> Optional[Any]:
    return _db


async def close_db():
    global _client, _db

    if _client is not None:
        await _client.close()
        _client = None
        _db = None

        logger.info("MongoDB client closed.")
