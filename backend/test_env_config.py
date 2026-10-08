import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parent


class EnvConfigSecurityTests(unittest.TestCase):
    def test_example_env_has_no_real_secrets(self):
        text = (ROOT / ".env.example").read_text(encoding="utf-8")

        forbidden_patterns = [
            "trackdown@proton.me",
            "9vK2mX7pQ4wL8zF1dNcR3bV5hJ0tG6yS",
            "cloudinary://336676394525868",
            "AaU3tWXH1W12ilK1ygmZGyOsJyXXL0-e",
            "Bnu1WPv1R5nMQ171FBORwGW8UR2Y8tUB",
        ]

        for value in forbidden_patterns:
            self.assertNotIn(value, text)

    def test_server_does_not_ship_real_defaults(self):
        text = (ROOT / "server.py").read_text(encoding="utf-8")

        forbidden_patterns = [
            "trackdown@proton.me",
            "9vK2mX7pQ4wL8zF1dNcR3bV5hJ0tG6yS",
            "cloudinary://336676394525868",
            "AaU3tWXH1W12ilK1ygmZGyOsJyXXL0-e",
            "Bnu1WPv1R5nMQ171FBORwGW8UR2Y8tUB",
        ]

        for value in forbidden_patterns:
            self.assertNotIn(value, text)

    def test_server_does_not_bootstrap_predictable_default_admin(self):
        text = (ROOT / "server.py").read_text(encoding="utf-8")

        self.assertNotIn('get_env("ADMIN_EMAIL", "admin@swats.bio")', text)
        self.assertNotIn('get_env("ADMIN_PASSWORD", "change-me-please")', text)
        self.assertNotIn('get_env(\'JWT_SECRET\', \'replace-with-a-long-random-secret\')', text)

    def test_startup_adds_fingerprint_column_before_index(self):
        text = (ROOT / "server.py").read_text(encoding="utf-8")

        self.assertIn('ALTER TABLE IF EXISTS view_events ADD COLUMN IF NOT EXISTS fingerprint TEXT DEFAULT \'\'', text)
        self.assertIn('CREATE INDEX IF NOT EXISTS idx_view_events_user_fp_time ON view_events(user_id, fingerprint, at)', text)


if __name__ == "__main__":
    unittest.main()
