"""
Cipher Labs - Backend Configuration
Handles MongoDB Atlas connection string, JWT secrets, and app-data paths.
Never logs or exposes secret values.
"""

import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

# Desktop builds point to a per-user config file; source runs use backend/.env.
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
CONFIG_FILE = os.getenv("CIPHER_CONFIG_FILE")
load_dotenv(dotenv_path=Path(CONFIG_FILE) if CONFIG_FILE else ENV_FILE, override=False)

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

def _load_or_create_jwt_secret(app_data_dir: Path, configured_secret: str) -> str:
    if configured_secret:
        return configured_secret

    jwt_secret_file = app_data_dir / "jwt.secret"
    secret = secrets.token_urlsafe(64)
    try:
        with jwt_secret_file.open("x", encoding="utf-8") as secret_file:
            secret_file.write(secret)
    except FileExistsError:
        secret = jwt_secret_file.read_text(encoding="utf-8").strip()
    if not secret:
        raise RuntimeError(f"JWT secret file is empty: {jwt_secret_file}")

    return secret


# JWT Authentication
JWT_SECRET = _load_or_create_jwt_secret(
    Path(APP_DATA_DIR),
    os.getenv("JWT_SECRET", "").strip(),
)
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
