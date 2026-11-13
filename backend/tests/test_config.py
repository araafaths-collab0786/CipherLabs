import importlib
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from cipher_backend import config


class TestJwtSecretConfiguration(unittest.TestCase):
    def test_secret_is_generated_once_and_persisted_per_app_data_directory(self):
        with tempfile.TemporaryDirectory(prefix="cipherlabs_config_") as temp_dir:
            secret_file = Path(temp_dir) / "jwt.secret"
            first = config._load_or_create_jwt_secret(Path(temp_dir), "")
            second = config._load_or_create_jwt_secret(Path(temp_dir), "")

            self.assertTrue(first)
            self.assertEqual(second, first)
            self.assertEqual(secret_file.read_text(encoding="utf-8"), first)

    def test_configured_secret_is_used_without_persisting_it(self):
        with tempfile.TemporaryDirectory(prefix="cipherlabs_config_") as temp_dir:
            configured_secret = "a-configured-runtime-secret"

            result = config._load_or_create_jwt_secret(Path(temp_dir), configured_secret)

            self.assertEqual(result, configured_secret)
            self.assertFalse((Path(temp_dir) / "jwt.secret").exists())

    def test_desktop_config_file_is_loaded_at_runtime(self):
        with tempfile.TemporaryDirectory(prefix="cipherlabs_config_") as temp_dir:
            config_file = Path(temp_dir) / "cipherlabs.env"
            config_file.write_text(
                "MONGODB_URI=mongodb://runtime.example/cipher_labs\n"
                "JWT_SECRET=runtime-configured-secret\n",
                encoding="utf-8",
            )
            app_data_dir = Path(temp_dir) / "app-data"

            try:
                with patch.dict(
                    os.environ,
                    {
                        "CIPHER_CONFIG_FILE": str(config_file),
                        "CIPHER_APP_DATA": str(app_data_dir),
                    },
                    clear=True,
                ):
                    importlib.reload(config)
                    self.assertEqual(
                        config.MONGODB_URI,
                        "mongodb://runtime.example/cipher_labs",
                    )
                    self.assertEqual(config.JWT_SECRET, "runtime-configured-secret")
            finally:
                importlib.reload(config)


if __name__ == "__main__":
    unittest.main()
