"""
Cipher Labs - Filesystem Deletion & Secure Sanitization Unit Test Suite
Tests actual filesystem operations, recursive directory walks, protection rules,
read-only attribute clearing, and byte overwrite sanitization.
"""

import os
import shutil
import tempfile
import unittest
import asyncio
import stat

from cipher_backend.deletion import (
    analyze_and_validate_path,
    is_protected_path,
    delete_single_file,
    delete_directory_tree,
    sanitize_file_bytes,
    execute_actual_permanent_deletion,
)

class TestCipherLabsDeletionEngine(unittest.TestCase):

    def setUp(self):
        """Create an isolated temporary workspace directory for safe testing."""
        self.test_dir = tempfile.mkdtemp(prefix="cipherlabs_test_ws_")

    def tearDown(self):
        """Clean up test workspace directory after test runs."""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_01_single_file_deletion(self):
        """Test actual permanent deletion of a single file."""
        filepath = os.path.join(self.test_dir, "single_target.txt")
        with open(filepath, "w") as f:
            f.write("Sensitive user data to be permanently unlinked.")

        self.assertTrue(os.path.exists(filepath))
        ok, msg = delete_single_file(filepath)
        self.assertTrue(ok)
        self.assertFalse(os.path.exists(filepath), "File must be unlinked from filesystem.")

    def test_02_read_only_locked_file_deletion(self):
        """Test permission & read-only attribute handling during deletion."""
        filepath = os.path.join(self.test_dir, "readonly_target.dat")
        with open(filepath, "w") as f:
            f.write("Locked read-only record.")

        # Set file to read-only
        os.chmod(filepath, stat.S_IREAD)

        ok, msg = delete_single_file(filepath)
        self.assertTrue(ok)
        self.assertFalse(os.path.exists(filepath), "Read-only file should have permission cleared & unlinked.")

    def test_03_folder_and_nested_subfolders_deletion(self):
        """Test recursive folder and subfolder deletion."""
        folder_path = os.path.join(self.test_dir, "target_folder")
        sub_path = os.path.join(folder_path, "sub_level_1", "sub_level_2")
        os.makedirs(sub_path, exist_ok=True)

        file1 = os.path.join(folder_path, "file_root.pdf")
        file2 = os.path.join(sub_path, "deep_file.docx")

        with open(file1, "w") as f:
            f.write("Root file payload.")
        with open(file2, "w") as f:
            f.write("Deep nested file payload.")

        self.assertTrue(os.path.exists(file1))
        self.assertTrue(os.path.exists(file2))

        ok, f_cnt, d_cnt, errors = delete_directory_tree(folder_path)
        self.assertTrue(ok, f"Errors encountered: {errors}")
        self.assertEqual(f_cnt, 2, "Should have deleted 2 files.")
        self.assertFalse(os.path.exists(folder_path), "Root folder must be completely removed.")

    def test_04_system_protected_path_rejection(self):
        """Test rejection of protected OS system directories and root drives."""
        # Windows System32
        is_prot, reason = is_protected_path("C:\\Windows\\System32")
        self.assertTrue(is_prot)

        # Partition Root
        is_prot_root, reason_root = is_protected_path("C:\\")
        self.assertTrue(is_prot_root)

        # Valid subfolder
        is_prot_valid, _ = is_protected_path(os.path.join(self.test_dir, "user_doc.pdf"))
        self.assertFalse(is_prot_valid)

    def test_05_secure_sanitization_byte_overwrite(self):
        """Test byte pattern overwriting with fsync before unlinking."""
        filepath = os.path.join(self.test_dir, "sanitize_target.bin")
        payload = b"SECRET_PASSWORD_12345" * 100
        with open(filepath, "wb") as f:
            f.write(payload)

        self.assertTrue(os.path.exists(filepath))
        ok, msg, passes = sanitize_file_bytes(filepath, "NIST_800_88_REV1")

        self.assertTrue(ok)
        self.assertGreaterEqual(passes, 1)
        self.assertFalse(os.path.exists(filepath), "Sanitized file must be unlinked.")

    def test_06_async_execute_permanent_deletion_engine(self):
        """Test full deletion engine with validation and audit generation."""
        file1 = os.path.join(self.test_dir, "doc1.txt")
        file2 = os.path.join(self.test_dir, "doc2.txt")
        with open(file1, "w") as f:
            f.write("Document 1 content")
        with open(file2, "w") as f:
            f.write("Document 2 content")

        async def run_test():
            op, copies, report = await execute_actual_permanent_deletion(
                user_id="test_user_001",
                target_paths=[file1, file2],
                confirmation_signature="PERMANENTLY DELETE",
                idempotency_key="idem-test-001",
                save_in_recovery=False,
                mode="PERMANENT_DELETION"
            )
            return op, report

        loop = asyncio.get_event_loop()
        op, report = loop.run_until_complete(run_test())

        self.assertEqual(op["verification_status"], "PERMANENT_DELETION_VERIFIED")
        self.assertEqual(op["successful_count"], 2)
        self.assertFalse(os.path.exists(file1))
        self.assertFalse(os.path.exists(file2))


if __name__ == "__main__":
    unittest.main()
