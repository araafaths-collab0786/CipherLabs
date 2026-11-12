import asyncio
import hashlib
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException

from cipher_backend.routers.operations import restore_recovery_file
from cipher_backend.schemas import RestoreRecoveryFileRequest


class TestRecoveryFileRoute(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory(prefix="cipherlabs_recovery_")
        self.vault_dir = Path(self.temp_dir.name)
        self.payload = b"exact recovery vault bytes"
        (self.vault_dir / "restored-item.backup").write_bytes(self.payload)
        self.vault_patch = patch(
            "cipher_backend.routers.operations.RECOVERY_VAULT_DIR",
            self.temp_dir.name,
        )
        self.vault_patch.start()

    def tearDown(self):
        self.vault_patch.stop()
        self.temp_dir.cleanup()

    def test_returns_exact_file_from_vault(self):
        request = RestoreRecoveryFileRequest(
            recovery_file_name="restored-item.backup",
            original_sha256=hashlib.sha256(self.payload).hexdigest(),
        )

        response = asyncio.run(restore_recovery_file(request))

        self.assertEqual(Path(response.path).read_bytes(), self.payload)

    def test_rejects_hash_mismatch(self):
        request = RestoreRecoveryFileRequest(
            recovery_file_name="restored-item.backup",
            original_sha256="0" * 64,
        )

        with self.assertRaises(HTTPException) as error:
            asyncio.run(restore_recovery_file(request))

        self.assertEqual(error.exception.status_code, 409)

    def test_rejects_path_traversal(self):
        request = RestoreRecoveryFileRequest(
            recovery_file_name=os.path.join("..", "outside.backup"),
            original_sha256=hashlib.sha256(self.payload).hexdigest(),
        )

        with self.assertRaises(HTTPException) as error:
            asyncio.run(restore_recovery_file(request))

        self.assertEqual(error.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
