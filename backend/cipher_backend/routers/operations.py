"""
Cipher Labs - Operations & Erasure Simulation Router
Handles simulation execution, target inspections, and verification re-checks.
"""

import os
from typing import Optional, List
from fastapi import APIRouter, Depends, Header
from ..schemas import ResponseEnvelope, ErrorDetail, SimulationRunRequest
from ..auth import get_current_user
from ..config import TEST_WORKSPACE_DIR, RESTORED_OUTPUT_DIR, RECOVERY_VAULT_DIR
from ..simulation import execute_simulation, compute_file_sha256, seed_sample_workspace_files
from ..audit import log_audit_event, verify_audit_chain
from ..db import get_db

router = APIRouter(prefix="/api", tags=["operations"])

@router.get("/erasure/simulate/targets", response_model=ResponseEnvelope)
async def get_simulation_targets(current_user: dict = Depends(get_current_user)):
    seed_sample_workspace_files()
    files = []
    for fname in os.listdir(TEST_WORKSPACE_DIR):
        fpath = os.path.join(TEST_WORKSPACE_DIR, fname)
        if os.path.isfile(fpath):
            stat = os.stat(fpath)
            files.append({
                "id": f"tf-{fname}",
                "name": fname,
                "relative_path": f"/app-data/test-workspace/{fname}",
                "size_bytes": stat.st_size,
                "sha256": compute_file_sha256(fpath),
                "status": "ACTIVE"
            })
    return ResponseEnvelope(data=files)

@router.post("/erasure/simulate/run", response_model=ResponseEnvelope)
async def run_simulation(
    req: SimulationRunRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: dict = Depends(get_current_user)
):
    if req.confirmation.strip() != "SIMULATE":
        return ResponseEnvelope(
            error=ErrorDetail(code="VALIDATION_FAILED", message="Explicit confirmation 'SIMULATE' is required.")
        )

    if not req.targets:
        return ResponseEnvelope(
            error=ErrorDetail(code="VALIDATION_FAILED", message="At least one target file must be selected.")
        )

    idem_key = idempotency_key or f"idem-{int(os.times().elapsed * 1000)}"

    try:
        op, copies, report = await execute_simulation(
            user_id=current_user["id"],
            target_names=req.targets,
            method=req.method,
            create_recovery_copy=req.create_recovery_copy,
            idempotency_key=idem_key
        )
        return ResponseEnvelope(data={"operation": op, "recovery_copies": copies, "report": report})
    except ValueError as ve:
        return ResponseEnvelope(
            error=ErrorDetail(code="SIMULATION_TARGET_NOT_ALLOWED", message=str(ve))
        )

@router.get("/operations", response_model=ResponseEnvelope)
async def list_operations(current_user: dict = Depends(get_current_user)):
    db = get_db()
    ops = []
    if db is not None:
        cursor = db.operations.find({"user_id": current_user["id"]}).sort("created_at", -1)
        async for doc in cursor:
            doc.pop("_id", None)
            ops.append(doc)
    return ResponseEnvelope(data=ops)

@router.post("/operations/{op_id}/verify", response_model=ResponseEnvelope)
async def reverify_operation(op_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    op = None
    if db is not None:
        op = await db.operations.find_one({"id": op_id, "user_id": current_user["id"]})

    if not op:
        return ResponseEnvelope(
            error=ErrorDetail(code="NOT_FOUND", message=f"Operation '{op_id}' not found.")
        )

    # Re-verify hashes
    passed = True
    for fname, orig_hash in op.get("pre_hashes", {}).items():
        fpath = os.path.join(TEST_WORKSPACE_DIR, fname)
        if not os.path.exists(fpath) or compute_file_sha256(fpath) != orig_hash:
            passed = False
            break

    new_verif = "SIMULATION_CHECK_PASSED" if passed else "SIMULATION_CHECK_FAILED"
    if db is not None:
        await db.operations.update_one(
            {"id": op_id},
            {"$set": {"verification_status": new_verif}}
        )

    await log_audit_event(current_user["id"], "REVERIFY_CHECK_EXECUTED", op_id, {
        "verification_status": new_verif
    })

    return ResponseEnvelope(data={"operation_id": op_id, "verification_status": new_verif})

@router.get("/dashboard/summary", response_model=ResponseEnvelope)
async def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    db = get_db()
    total_ops = 0
    verified_ops = 0
    sim_passed = 0
    recovery_scans = 0

    if db is not None:
        total_ops = await db.operations.count_documents({"user_id": current_user["id"]})
        verified_ops = await db.operations.count_documents({"user_id": current_user["id"], "verification_status": "VERIFIED"})
        sim_passed = await db.operations.count_documents({"user_id": current_user["id"], "verification_status": "SIMULATION_CHECK_PASSED"})
        recovery_scans = await db.operations.count_documents({"user_id": current_user["id"], "operation_type": "RECOVERY_TEST"})

    return ResponseEnvelope(data={
        "total_operations": total_ops,
        "verified_operations": verified_ops,
        "simulation_checks_passed": sim_passed,
        "devices_assessed": 1,
        "recovery_scans": recovery_scans
    })

@router.get("/audit/verify-chain", response_model=ResponseEnvelope)
async def check_audit_chain(current_user: dict = Depends(get_current_user)):
    result = await verify_audit_chain(current_user["id"])
    return ResponseEnvelope(data=result)
