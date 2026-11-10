"""
Cipher Labs - Phase 1 Secure Erasure Simulation Engine
Strictly read-only hashing. Refuses any target outside test workspace.
Creates optional recovery copies in controlled vault.
"""

import os
import shutil
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

from .config import TEST_WORKSPACE_DIR, RECOVERY_VAULT_DIR, RESTORED_OUTPUT_DIR
from .audit import log_audit_event
from .db import get_db

def compute_file_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def is_safe_target_path(filename: str) -> bool:
    clean_name = os.path.basename(filename)
    target_path = os.path.abspath(os.path.join(TEST_WORKSPACE_DIR, clean_name))
    workspace_path = os.path.abspath(TEST_WORKSPACE_DIR)
    return target_path.startswith(workspace_path) and os.path.exists(target_path)

def seed_sample_workspace_files():
    samples = [
        ("confidential_financials_2026.pdf", b"%PDF-1.7\nSynthetic Financial Statement 2026 Q3"),
        ("database_backup_dump.sql", b"-- Synthetic DB Dump\nCREATE TABLE logs (id INT);"),
        ("patient_health_records.csv", b"id,name,diagnosis\nPT-01,Test Subject,Clear"),
        ("system_access_credentials.env", b"STAGE=PRODUCTION_SIMULATION\nPORT=8765")
    ]
    for name, content in samples:
        path = os.path.join(TEST_WORKSPACE_DIR, name)
        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(content)

async def execute_simulation(
    user_id: str,
    target_names: List[str],
    method: str,
    create_recovery_copy: bool,
    idempotency_key: str
) -> Tuple[Dict[str, Any], List[Dict[str, Any]], Dict[str, Any]]:
    seed_sample_workspace_files()

    pre_hashes = {}
    post_hashes = {}
    clean_targets = []

    # 1. Path safety check & pre-hashing
    for name in target_names:
        clean = os.path.basename(name)
        file_path = os.path.join(TEST_WORKSPACE_DIR, clean)
        if not is_safe_target_path(clean):
            raise ValueError(f"SIMULATION_TARGET_NOT_ALLOWED: Path '{clean}' is outside controlled workspace")
        clean_targets.append(clean)
        pre_hashes[clean] = compute_file_sha256(file_path)

    op_id = f"op-{int(datetime.now(timezone.utc).timestamp()*1000)}"

    # 2. Audit: SIMULATION_INITIATED
    await log_audit_event(user_id, "SIMULATION_INITIATED", op_id, {
        "method": method,
        "targets": clean_targets,
        "create_recovery_copy": create_recovery_copy
    })

    # 3. Create recovery copies in vault if opted in
    recovery_copies = []
    if create_recovery_copy:
        for clean in clean_targets:
            src = os.path.join(TEST_WORKSPACE_DIR, clean)
            copy_filename = f"{clean}.backup"
            dst = os.path.join(RECOVERY_VAULT_DIR, copy_filename)
            shutil.copy2(src, dst)
            copy_item = {
                "id": f"rc-{int(datetime.now(timezone.utc).timestamp()*1000)}-{clean[:4]}",
                "operation_id": op_id,
                "user_id": user_id,
                "original_file_name": clean,
                "original_workspace_path": f"/app-data/test-workspace/{clean}",
                "recovery_vault_path": f"/app-data/recovery-vault/{copy_filename}",
                "original_sha256": pre_hashes[clean],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "AVAILABLE"
            }
            recovery_copies.append(copy_item)
            db = get_db()
            if db is not None:
                await db.recovery_copies.insert_one(dict(copy_item))

    # 4. Simulation Execution (strictly read-only)
    for clean in clean_targets:
        file_path = os.path.join(TEST_WORKSPACE_DIR, clean)
        post_hashes[clean] = compute_file_sha256(file_path)

    hashes_match = all(pre_hashes[c] == post_hashes[c] for c in clean_targets)
    verification_status = "SIMULATION_CHECK_PASSED" if hashes_match else "SIMULATION_CHECK_FAILED"
    verification_msg = (
        "Simulation check passed. No file changes were detected. This is not physical erasure verification."
        if hashes_match else
        "Simulation check failed. A file change was detected. Review the details before doing anything else."
    )

    op_doc = {
        "id": op_id,
        "user_id": user_id,
        "operation_type": "ERASURE_SIMULATION",
        "mode": "SIMULATION_ONLY",
        "target_reference": f"{len(clean_targets)} files in /app-data/test-workspace/",
        "method": method,
        "execution_status": "SIMULATION_COMPLETED",
        "verification_status": verification_status,
        "tracking_state": "Recovery Copy Available" if create_recovery_copy else "Simulation Completed",
        "idempotency_key": idempotency_key,
        "target_count": len(clean_targets),
        "has_recovery_copy": create_recovery_copy,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "verification_message": verification_msg,
        "pre_hashes": pre_hashes,
        "post_hashes": post_hashes
    }

    # 5. Report Document
    report_doc = {
        "id": f"rep-{op_id}",
        "user_id": user_id,
        "operation_id": op_id,
        "idempotency_key": f"report-{idempotency_key}",
        "report_status": "COMPLETE",
        "report_sha256": hashlib.sha256(json_str := str(op_doc).encode('utf-8')).hexdigest(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "report_json": {
            "operationType": "Simulation",
            "method": method,
            "executionStatus": "SIMULATION_COMPLETED",
            "verificationStatus": verification_status,
            "targets": [{"name": c, "sha256": pre_hashes[c]} for c in clean_targets],
            "simulationDisclaimer": "This is a simulation. No physical erasure was performed. The check confirms only that the simulated targets were not changed.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }

    db = get_db()
    if db is not None:
        await db.operations.insert_one(dict(op_doc))
        op_doc.pop("_id", None)
        await db.reports.insert_one(dict(report_doc))
        report_doc.pop("_id", None)

    await log_audit_event(user_id, "SIMULATION_COMPLETED", op_id, {
        "verification_status": verification_status,
        "target_count": len(clean_targets)
    })

    return op_doc, recovery_copies, report_doc
