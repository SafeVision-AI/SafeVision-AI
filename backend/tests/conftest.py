from __future__ import annotations

import sys
from pathlib import Path

import pytest


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


from core.database import get_db  # noqa: E402
from main import create_app  # noqa: E402


class DummySession:
    pass


@pytest.fixture
def app():
    application = create_app()

    async def override_db():
        yield DummySession()

    application.dependency_overrides[get_db] = override_db
    return application
