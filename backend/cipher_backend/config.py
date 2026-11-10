"""
Cipher Labs - Backend Configuration
Handles MongoDB Atlas connection string, JWT secrets, and app-data paths.
Never logs or exposes secret values.
"""

import os
from pathlib import Path

# Paths
APP_DATA_DIR = os.getenv("CIPHER_APP_DATA")
if not APP_DATA_DIR:
    # Default local app data directory
    APP_DATA_DIR = str(Path.home() / ".cipherlabs")

Path(APP_DATA_DIR).mkdir(parents=True, exist_ok=True)
TEST_WORKSPACE_DIR = os.path.join(APP_DATA_DIR, "test-workspace")
RECOVERY_VAULT_DIR = os.path.join(APP_DATA_DIR, "recovery-vault")
RESTORED_OUTPUT_DIR = os.path.join(APP_DATA_DIR, "restored-output")
RECOVERED_CARVED_DIR = os.path.join(APP_DATA_DIR, "recovered")

for d in [TEST_WORKSPACE_DIR, RECOVERY_VAULT_DIR, RESTORED_OUTPUT_DIR, RECOVERED_CARVED_DIR]:
    Path(d).mkdir(parents=True, exist_ok=True)

# MongoDB Atlas Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "cipher_labs").strip()

# JWT Authentication
JWT_SECRET = os.getenv("JWT_SECRET", "cipher_labs_forensics_jwt_secret_key_2026_default_entropy").strip()
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60 * 24 * 7  # 7 days

# Health / Config mode
CONFIG_MODE = "OK" if MONGODB_URI and (MONGODB_URI.startswith("mongodb://") or MONGODB_URI.startswith("mongodb+srv://")) else "CONFIG_MISSING"

def get_redacted_mongo_uri() -> str:
    if not MONGODB_URI:
        return "Not Configured"
    # Redact user/pass from URI
    try:
        parts = MONGODB_URI.split("@")
        if len(parts) == 2:
            prefix = parts[0].split("://")[0]
            host_part = parts[1]
            return f"{prefix}://***:***@{host_part.split('?')[0]}"
        return "mongodb+srv://***:***@cluster.mongodb.net"
    except Exception:
        return "mongodb+srv://[REDACTED]"
