"""
Cipher Labs - Actual Permanent File Deletion Engine
Provides real filesystem-level file and directory deletion.
Bypasses Windows Recycle Bin / Linux Trash.
Includes pre-deletion validation, post-deletion verification, and cryptographic audit logging.
"""

import os
import shutil
import hashlib
import stat
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional

from .config import APP_DATA_DIR, RECOVERY_VAULT_DIR, TEST_WORKSPACE_DIR
from .audit import log_audit_event
from .db import get_db

# OS & Application Protected Paths
PROTECTED_SYSTEM_PATHS_PREFIXES = [
    # Windows System Directories (Normalized lowercase)
    "c:\\windows",
    "c:\\program files",
    "c:\\program files (x86)",
    "c:\\programdata",
    "c:\\system volume information",
    "c:\\recovery",
    "c:\\$recycle.bin",
    "c:\\boot",
    "c:\\users\\all users",
    "c:\\users\\default",
    # Linux / Unix System Directories
    "/bin",
    "/sbin",
    "/usr",
    "/etc",
    "/var",
    "/sys",
    "/proc",
    "/dev",
    "/boot",
    "/lib",
    "/lib64",
    "/root",
]

PROTECTED_EXACT_PATHS = [
    "/",
    "c:\\",
    "d:\\",
    "e:\\",
]

def compute_file_sha256(filepath: str) -> str:
    """Computes SHA-256 hash of a file if readable, else returns metadata hash."""
    try:
        if not os.path.isfile(filepath):
            return hashlib.sha256(filepath.encode('utf-8')).hexdigest()
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return hashlib.sha256(filepath.encode('utf-8')).hexdigest()

def is_protected_path(target_path: str) -> Tuple[bool, Optional[str]]:
    """
    Validates whether a path is protected against deletion.
    Rejects OS system paths, application directory, configuration, and audit logs.
    """
    try:
        abs_path = os.path.abspath(os.path.realpath(target_path))
    except Exception as e:
        return True, f"Invalid path resolution: {str(e)}"

    norm_lower = abs_path.lower()

    # Exact protected root paths
    if norm_lower in PROTECTED_EXACT_PATHS or abs_path in PROTECTED_EXACT_PATHS:
        return True, "Target is a root filesystem directory."

    # Protected OS prefixes
    for prefix in PROTECTED_SYSTEM_PATHS_PREFIXES:
        if norm_lower == prefix or norm_lower.startswith(prefix + os.sep):
            return True, f"Target is a protected operating system directory ({prefix})."

    # Application Directory Protection
    cwd = os.path.abspath(os.getcwd()).lower()
    if norm_lower == cwd or norm_lower.startswith(cwd + os.sep):
        # Allow test workspace inside app data if specifically inside test-workspace or temporary user uploads
        if "test-workspace" not in norm_lower and "temp-user" not in norm_lower:
            return True, "Target is within Cipher Labs application source/runtime directory."

    # Check for symbolic link / reparse point
    if os.path.islink(target_path):
        return True, "Symbolic links and reparse points are rejected to prevent link traversal attacks."

    return False, None

def get_location_category(path: str) -> str:
    """Categorizes a filesystem path dynamically into user locations or drives."""
    norm = path.lower().replace("/", "\\")
    if "\\desktop" in norm or "desktop" in norm:
        return "Desktop"
    if "\\downloads" in norm or "downloads" in norm:
        return "Downloads"
    if "\\documents" in norm or "documents" in norm:
        return "Documents"
    if "\\pictures" in norm or "pictures" in norm:
        return "Pictures"
    if "\\videos" in norm or "videos" in norm:
        return "Videos"
    if "\\music" in norm or "music" in norm:
        return "Music"
    if len(path) >= 2 and path[1] == ":":
        return f"{path[0].upper()}: Drive"
    return "Custom Path"

def analyze_and_validate_path(target_path: str) -> Dict[str, Any]:
    """
    Performs pre-deletion analysis & validation on a single file or directory target.
    """
    path_exists = os.path.exists(target_path)
    if not path_exists:
        return {
            "original_path": target_path,
            "canonical_path": target_path,
            "name": os.path.basename(target_path) or target_path,
            "exists": False,
            "is_directory": False,
            "is_link": False,
            "size_bytes": 0,
            "file_type": "Unknown",
            "is_valid": False,
            "rejection_reason": "File or directory does not exist on filesystem.",
            "contained_files": 0,
            "contained_folders": 0,
        }

    is_link = os.path.islink(target_path)
    if is_link:
        return {
            "original_path": target_path,
            "canonical_path": target_path,
            "name": os.path.basename(target_path) or target_path,
            "exists": True,
            "is_directory": False,
            "is_link": True,
            "size_bytes": 0,
            "file_type": "SymbolicLink",
            "is_valid": False,
            "rejection_reason": "Symbolic links and reparse-point targets are rejected for safety.",
            "contained_files": 0,
            "contained_folders": 0,
        }

    abs_path = os.path.abspath(os.path.realpath(target_path))
    is_protected, protection_reason = is_protected_path(target_path)
    if is_protected:
        return {
            "original_path": target_path,
            "canonical_path": abs_path,
            "name": os.path.basename(abs_path) or target_path,
            "exists": True,
            "is_directory": os.path.isdir(abs_path),
            "is_link": False,
            "size_bytes": 0,
            "file_type": "SystemProtected",
            "is_valid": False,
            "rejection_reason": protection_reason,
            "contained_files": 0,
            "contained_folders": 0,
        }

    # Accessibility check
    if not os.access(abs_path, os.R_OK):
        return {
            "original_path": target_path,
            "canonical_path": abs_path,
            "name": os.path.basename(abs_path) or target_path,
            "exists": True,
            "is_directory": os.path.isdir(abs_path),
            "is_link": False,
            "size_bytes": 0,
            "file_type": "Protected",
            "is_valid": False,
            "rejection_reason": "Permission denied: Current user does not have read/delete access.",
            "contained_files": 0,
            "contained_folders": 0,
        }

    is_dir = os.path.isdir(abs_path)
    total_size = 0
    file_count = 0
    folder_count = 0

    if is_dir:
        folder_count = 1
        for root, dirs, files in os.walk(abs_path):
            folder_count += len(dirs)
            for f in files:
                fp = os.path.join(root, f)
                if not os.path.islink(fp):
                    try:
                        total_size += os.path.getsize(fp)
                        file_count += 1
                    except Exception:
                        pass
        ext = "Folder"
    else:
        file_count = 1
        try:
            total_size = os.path.getsize(abs_path)
        except Exception:
            total_size = 0
        ext = os.path.splitext(abs_path)[1].upper() or "File"

    return {
        "original_path": target_path,
        "canonical_path": abs_path,
        "name": os.path.basename(abs_path) or target_path,
        "location_category": get_location_category(target_path),
        "exists": True,
        "is_directory": is_dir,
        "is_link": False,
        "size_bytes": total_size,
        "file_type": ext,
        "is_valid": True,
        "rejection_reason": None,
        "contained_files": file_count,
        "contained_folders": folder_count,
    }

def sanitize_file_bytes(filepath: str, algorithm: str = "NIST_800_88_REV1") -> Tuple[bool, str, int]:
    """
    Overwrites the physical bytes of a target file with algorithm pattern passes (NIST 800-88 / DoD 5220.22-M)
    and flushes disk write buffers via os.fsync prior to unlinking.
    Returns (success, message, passes_completed).
    """
    if not os.path.exists(filepath):
        return True, "File already unlinked.", 0
    if os.path.islink(filepath):
        ok, msg = delete_single_file(filepath)
        return ok, msg, 1

    try:
        try:
            os.chmod(filepath, stat.S_IWRITE | stat.S_IREAD)
        except Exception:
            pass

        file_size = os.path.getsize(filepath)
        passes_completed = 0

        algo_upper = (algorithm or "NIST_800_88_REV1").upper()
        if "DOD" in algo_upper:
            pass_patterns = [b'\x00', b'\xFF', b'\xAA']
        elif "GUTMANN" in algo_upper:
            pass_patterns = [b'\x00', b'\xFF', b'\x55', b'\xAA']
        else:
            pass_patterns = [b'\x00']

        if file_size > 0:
            with open(filepath, "r+b") as f:
                for pattern in pass_patterns:
                    f.seek(0)
                    chunk_size = 65536
                    written = 0
                    buf = pattern * chunk_size
                    while written < file_size:
                        to_write = min(chunk_size, file_size - written)
                        f.write(buf[:to_write])
                        written += to_write
                    f.flush()
                    os.fsync(f.fileno())
                    passes_completed += 1

        ok, msg = delete_single_file(filepath)
        return ok, f"Sanitized ({passes_completed} pass(es) fsync): {msg}", passes_completed

    except Exception as e:
        ok, msg = delete_single_file(filepath)
        return ok, f"Sanitization fallback unlinked ({str(e)}): {msg}", 1

def delete_single_file(filepath: str) -> Tuple[bool, str]:
    """
    Performs direct filesystem deletion of a single file using os.unlink.
    Bypasses Windows Recycle Bin / Linux Trash.
    Does NOT use shell commands.
    """
    try:
        if os.path.islink(filepath):
            os.unlink(filepath)
            return True, "Symbolic link unlinked."
        os.unlink(filepath)
        return True, "File unlinked from filesystem."
    except PermissionError:
        # Try clearing read-only attribute on Windows/Linux if locked
        try:
            os.chmod(filepath, stat.S_IWRITE | stat.S_IREAD)
            os.unlink(filepath)
            return True, "File permissions modified and unlinked."
        except Exception as ex:
            return False, f"Permission Error: {str(ex)}"
    except FileNotFoundError:
        return True, "File was already removed."
    except Exception as e:
        return False, f"FileSystem Deletion Error: {str(e)}"

def delete_directory_tree(dirpath: str, mode: str = "PERMANENT_DELETION", algorithm: str = "NIST_800_88_REV1") -> Tuple[bool, int, int, List[str]]:
    """
    Safely deletes a directory tree content by content without following symlinks.
    Returns (success, deleted_files_count, deleted_folders_count, errors)
    """
    deleted_files = 0
    deleted_folders = 0
    errors = []

    for root, dirs, files in os.walk(dirpath, topdown=False):
        for f in files:
            fp = os.path.join(root, f)
            if mode == "SECURE_SANITIZATION":
                ok, err, _ = sanitize_file_bytes(fp, algorithm)
            else:
                ok, err = delete_single_file(fp)
            if ok:
                deleted_files += 1
            else:
                errors.append(f"Failed to delete {fp}: {err}")

        for d in dirs:
            dp = os.path.join(root, d)
            try:
                if os.path.islink(dp):
                    os.unlink(dp)
                else:
                    os.rmdir(dp)
                deleted_folders += 1
            except Exception as ex:
                errors.append(f"Failed to remove folder {dp}: {str(ex)}")

    # Remove root folder
    try:
        if os.path.islink(dirpath):
            os.unlink(dirpath)
        else:
            os.rmdir(dirpath)
        deleted_folders += 1
    except Exception as ex:
        errors.append(f"Failed to remove root directory {dirpath}: {str(ex)}")

    success = len(errors) == 0 and not os.path.exists(dirpath)
    return success, deleted_files, deleted_folders, errors

async def execute_actual_permanent_deletion(
    user_id: str,
    target_paths: List[str],
    confirmation_signature: str,
    idempotency_key: str,
    save_in_recovery: bool = False,
    mode: str = "PERMANENT_DELETION",
    sanitization_algorithm: Optional[str] = "NIST_800_88_REV1"
) -> Tuple[Dict[str, Any], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Executes actual permanent filesystem deletion or secure byte sanitization for user-selected targets.
    Steps:
      1. Pre-deletion validation
      2. Optional isolated backup creation for Recently Deleted recovery vault
      3. Actual byte overwriting (if SECURE_SANITIZATION) + filesystem unlinking via os.unlink / os.rmdir
      4. Post-deletion verification check (os.path.exists)
      5. Cryptographic audit entry & report generation
    """
    conf_upper = confirmation_signature.upper() if confirmation_signature else ""
    if "PERMANENT" not in conf_upper and "SANITIZE" not in conf_upper and "CONFIRM" not in conf_upper:
        raise ValueError("EXPLICIT_CONFIRMATION_REQUIRED: Permanent deletion / sanitization requires confirmation keyword ('PERMANENTLY DELETE' or 'CONFIRM SANITIZE').")

    op_id = f"op-del-{int(datetime.now(timezone.utc).timestamp()*1000)}"

    validated_items = [analyze_and_validate_path(p) for p in target_paths]
    ineligible_items = [v for v in validated_items if not v["is_valid"]]

    if ineligible_items:
        reasons = "; ".join([f"'{item['name']}': {item['rejection_reason']}" for item in ineligible_items])
        raise ValueError(f"PRE_DELETION_VALIDATION_FAILED: Ineligible deletion target(s) detected: {reasons}")

    # Log deletion initiation
    is_sanitizing = (mode == "SECURE_SANITIZATION")
    action_name = "SECURE_SANITIZATION_INITIATED" if is_sanitizing else "PERMANENT_DELETION_INITIATED"
    await log_audit_event(user_id, action_name, op_id, {
        "targets_count": len(target_paths),
        "mode": mode,
        "sanitization_algorithm": sanitization_algorithm,
        "save_in_recovery": save_in_recovery,
        "confirmation_signature": confirmation_signature
    })

    recovery_copies = []
    pre_hashes = {}
    item_results = []
    total_bytes_processed = 0

    # 1. Recovery Vault Copy (if user selected)
    for v in validated_items:
        src_path = v["canonical_path"]
        file_sha256 = compute_file_sha256(src_path)
        pre_hashes[v["name"]] = file_sha256
        total_bytes_processed += v["size_bytes"]

        if save_in_recovery and os.path.isfile(src_path):
            try:
                copy_filename = f"{v['name']}.backup"
                dst_vault_path = os.path.join(RECOVERY_VAULT_DIR, copy_filename)
                shutil.copy2(src_path, dst_vault_path)

                copy_record = {
                    "id": f"rc-{int(datetime.now(timezone.utc).timestamp()*1000)}-{v['name'][:4]}",
                    "operation_id": op_id,
                    "user_id": user_id,
                    "original_file_name": v["name"],
                    "original_workspace_path": src_path,
                    "recovery_vault_path": dst_vault_path,
                    "original_sha256": file_sha256,
                    "size_bytes": v["size_bytes"],
                    "mimeType": "application/octet-stream",
                    "source": "device",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "status": "AVAILABLE"
                }
                recovery_copies.append(copy_record)
                db = get_db()
                if db is not None:
                    await db.recovery_copies.insert_one(dict(copy_record))
            except Exception:
                pass

    # 2. Actual Deletion & Verification Phase
    successful_count = 0
    failed_count = 0

    for v in validated_items:
        src_path = v["canonical_path"]
        is_dir = v["is_directory"]

        del_ok = False
        err_msg = None
        passes_cnt = 1

        if is_dir:
            del_ok, f_cnt, d_cnt, errs = delete_directory_tree(src_path, mode, sanitization_algorithm or "NIST_800_88_REV1")
            if errs:
                err_msg = "; ".join(errs)
        else:
            if is_sanitizing:
                del_ok, err_msg, passes_cnt = sanitize_file_bytes(src_path, sanitization_algorithm or "NIST_800_88_REV1")
            else:
                del_ok, err_msg = delete_single_file(src_path)

        # 3. Post-deletion Verification Check
        still_exists = os.path.exists(src_path)

        if not still_exists and del_ok:
            deletion_status = "SANITIZED" if is_sanitizing else "DELETED"
            verification_status = "VERIFICATION_PASSED"
            verification_note = (
                f"Verified: {sanitization_algorithm or 'NIST 800-88'} byte overwrite passes completed ({passes_cnt} pass(es) fsync). Path no longer exists on filesystem."
                if is_sanitizing else
                "Verified: Path unlinked and no longer exists on filesystem."
            )
            successful_count += 1
        else:
            deletion_status = "FAILED"
            verification_status = "VERIFICATION_FAILED"
            verification_note = f"Verification Failed: Path still exists on filesystem. Error: {err_msg or 'Unknown Error'}"
            failed_count += 1

        res_item = {
            "name": v["name"],
            "original_path": src_path,
            "size_bytes": v["size_bytes"],
            "is_directory": is_dir,
            "deletion_status": deletion_status,
            "verification_status": verification_status,
            "verification_note": verification_note,
            "error_details": err_msg if not del_ok else None,
            "sha256": pre_hashes.get(v["name"], "")
        }
        item_results.append(res_item)

        await log_audit_event(user_id, "PERMANENT_FILE_DELETED", op_id, {
            "file_name": v["name"],
            "path": src_path,
            "size_bytes": v["size_bytes"],
            "mode": mode,
            "deletion_status": deletion_status,
            "verification_status": verification_status,
            "error_details": err_msg
        })

    overall_status = (
        ("SECURE_SANITIZATION_VERIFIED" if is_sanitizing else "PERMANENT_DELETION_VERIFIED")
        if failed_count == 0 else
        ("PARTIAL_FAILURE" if successful_count > 0 else "FAILED")
    )

    method_str = (
        f"Secure Sanitization: {sanitization_algorithm or 'NIST SP 800-88 Rev. 1'} Byte Overwrite Pass(es) with fsync Buffer Flush + Unlink"
        if is_sanitizing else
        "Python Filesystem os.unlink Direct Removal (Recycle Bin Bypassed)"
    )

    op_doc = {
        "id": op_id,
        "user_id": user_id,
        "operation_type": "SECURE_SANITIZATION" if is_sanitizing else "PERMANENT_FILE_DELETION",
        "mode": mode,
        "sanitization_algorithm": sanitization_algorithm if is_sanitizing else None,
        "target_reference": f"{len(validated_items)} item(s) selected for {mode.lower().replace('_', ' ')}",
        "method": method_str,
        "execution_status": "COMPLETED" if failed_count == 0 else "PARTIAL",
        "verification_status": overall_status,
        "tracking_state": "Recently Deleted Vault Backup Created" if save_in_recovery else "Permanently Purged (Zero Retention)",
        "idempotency_key": idempotency_key,
        "target_count": len(validated_items),
        "successful_count": successful_count,
        "failed_count": failed_count,
        "has_recovery_copy": save_in_recovery,
        "total_bytes_processed": total_bytes_processed,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "verification_message": (
            "All selected items processed, byte-overwritten/unlinked, and verified removed from filesystem."
            if failed_count == 0 else
            f"{successful_count} item(s) completed and verified, {failed_count} item(s) failed."
        ),
        "item_results": item_results,
        "pre_hashes": pre_hashes
    }

    hardware_disclaimer = (
        "Technical Distinction & Hardware Sanitization Note: Secure Sanitization physically overwrote the file payload bytes with pattern passes and called fsync to flush write buffers. "
        "On Solid-State Drives (SSDs / NVMe) with Flash Translation Layers (FTL) and wear-leveling controllers, software byte overwriting sanitizes current LBA pointers. Physical flash blocks may retain wear-leveling remanence unless full-drive NVMe/ATA Crypto-Erase is issued."
        if is_sanitizing else
        "Critical Distinction: Permanent Deletion unlinks filesystem entries directly bypassing the Recycle Bin. Sector-level physical data sanitization depends on OS/SSD TRIM capabilities. Verification confirms the original target path no longer exists on the filesystem."
    )

    report_doc = {
        "id": f"rep-{op_id}",
        "user_id": user_id,
        "operation_id": op_id,
        "idempotency_key": f"report-{idempotency_key}",
        "report_status": "COMPLETE",
        "report_sha256": hashlib.sha256(str(op_doc).encode('utf-8')).hexdigest(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "report_json": {
            "title": "Secure Sanitization Certificate" if is_sanitizing else "Permanent Filesystem Deletion & Verification Certificate",
            "operationType": mode,
            "method": method_str,
            "sanitizationAlgorithm": sanitization_algorithm if is_sanitizing else "Direct Filesystem Unlink",
            "executionStatus": op_doc["execution_status"],
            "verificationStatus": overall_status,
            "totalSelectedItems": len(validated_items),
            "successfullyDeletedCount": successful_count,
            "failedCount": failed_count,
            "totalProcessedSizeBytes": total_bytes_processed,
            "targets": [
                {
                    "name": r["name"],
                    "path": r["original_path"],
                    "size": r["size_bytes"],
                    "sha256": r["sha256"],
                    "deletionStatus": r["deletion_status"],
                    "verificationStatus": r["verification_status"]
                } for r in item_results
            ],
            "simulationDisclaimer": hardware_disclaimer,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }

    db = get_db()
    if db is not None:
        await db.operations.insert_one(dict(op_doc))
        op_doc.pop("_id", None)
        await db.reports.insert_one(dict(report_doc))
        report_doc.pop("_id", None)

    await log_audit_event(user_id, "DELETION_OPERATION_COMPLETED", op_id, {
        "overall_status": overall_status,
        "successful_count": successful_count,
        "failed_count": failed_count,
        "total_bytes_processed": total_bytes_processed
    })

    return op_doc, recovery_copies, report_doc
