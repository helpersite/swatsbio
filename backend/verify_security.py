import unittest

suite = unittest.defaultTestLoader.loadTestsFromName('test_env_config')
with open('verify_security_output.txt', 'w', encoding='utf-8') as fh:
    result = unittest.TextTestRunner(stream=fh, verbosity=2).run(suite)
if not result.wasSuccessful():
    raise SystemExit(1)
