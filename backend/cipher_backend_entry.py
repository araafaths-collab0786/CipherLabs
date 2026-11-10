"""
Cipher Labs - FastAPI Sidecar Entrypoint
SECURE. RECOVER. VERIFY.
Listens strictly on loopback 127.0.0.1:8765. Never 0.0.0.0.
"""

import os
import sys
import uvicorn

if __name__ == "__main__":
    # Ensure current directory is in sys.path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    uvicorn.run(
        "cipher_backend.main:app",
        host="127.0.0.1",
        port=8765,
        log_level="info",
        reload=False
    )
