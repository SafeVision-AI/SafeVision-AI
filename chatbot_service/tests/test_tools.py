from __future__ import annotations

from config import get_settings
from tools.first_aid_tool import FirstAidTool


def test_first_aid_tool_loads_guides_from_seed_file():
    tool = FirstAidTool(get_settings())
    guide = tool.lookup('How do I help with a severe burn?')

    assert guide is not None
    assert guide['title'] == 'Burns'
    assert guide['steps']
