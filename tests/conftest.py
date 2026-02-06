"""
Pytest Configuration for AutoForge Tests
=========================================

This conftest.py ensures the project root is on sys.path
so that the `autoforge` package can be imported during tests.
"""

import sys
from pathlib import Path

# Add the project root to sys.path so 'autoforge' package can be imported
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
