"""
Cipher Labs - Cryptographic Audit Ledger (MongoDB Atlas)
Append-only hash-chained ledger: previous_hash || action || operation_id || canonical_json.
Genesis starts with 'GENESIS'.
"""

import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from .db import get_db

def to_canonical_json(data: Any) -> str:
    return json.dumps(data, sort_keys=True, separators=(',', ':'))

def compute_sha256(payload: str) -> str:
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

# In-memory audit fallback
MOCK_AUDIT: List[Dict[str, Any]] = []

async def log_audit_event(
    user_id: str,
    action: str,
    operation_id: Optional[str] = None,
    safe_details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    if safe_details is None:
        safe_details = {}

    db = get_db()
    previous_hash = "GENESIS"
    next_seq_id = 1

    if db is not None:
        last_entry = await db.audit_log.find_one({"user_id": user_id}, sort=[("sequence_id", -1)])
        if last_entry:
            previous_hash = last_entry["entry_hash"]
            next_seq_id = last_entry["sequence_id"] + 1
    else:
        user_entries = [e for e in MOCK_AUDIT if e["user_id"] == user_id]
        if user_entries:
            previous_hash = user_entries[-1]["entry_hash"]
            next_seq_id = user_entries[-1]["sequence_id"] + 1

    canonical_details = to_canonical_json(safe_details)
    raw_payload = f"{previous_hash}|{action}|{operation_id or ''}|{canonical_details}"
    entry_hash = compute_sha256(raw_payload)

    entry = {
        "sequence_id": next_seq_id,
        "user_id": user_id,
        "action": action,
        "operation_id": operation_id,
        "previous_hash": previous_hash,
        "entry_hash": entry_hash,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "safe_details": safe_details
    }

    if db is not None:
        await db.audit_log.insert_one(entry)
        entry.pop("_id", None)
    else:
        MOCK_AUDIT.append(entry)

    return entry

async def verify_audit_chain(user_id: str) -> Dict[str, Any]:
    db = get_db()
    entries: List[Dict[str, Any]] = []

    if db is not None:
        cursor = db.audit_log.find({"user_id": user_id}).sort("sequence_id", 1)
        async for doc in cursor:
            doc.pop("_id", None)
            entries.append(doc)
    else:
        entries = [e for e in MOCK_AUDIT if e["user_id"] == user_id]

    if not entries:
        return {"is_valid": True, "total_entries": 0}

    expected_prev = "GENESIS"
    for entry in entries:
        if entry["previous_hash"] != expected_prev:
            return {
                "is_valid": False,
                "total_entries": len(entries),
                "broken_entry_id": entry["sequence_id"],
                "error_reason": f"Entry #{entry['sequence_id']} previous_hash ({entry['previous_hash']}) does not match expected ({expected_prev})"
            }

        canonical_details = to_canonical_json(entry["safe_details"])
        raw_payload = f"{entry['previous_hash']}|{entry['action']}|{entry.get('operation_id') or ''}|{canonical_details}"
        recomputed = compute_sha256(raw_payload)

        if recomputed != entry["entry_hash"]:
            return {
                "is_valid": False,
                "total_entries": len(entries),
                "broken_entry_id": entry["sequence_id"],
                "error_reason": f"Entry #{entry['sequence_id']} calculated hash differs from stored entry_hash"
            }

        expected_prev = entry["entry_hash"]

    return {"is_valid": True, "total_entries": len(entries)}
