"""Run: python3 tests/test_read_savegame.py — hash IDs observed in a real save."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from read_savegame import string_hash64

assert string_hash64("bot__base_baseStation01") == 0x6f6426646ee1175e
assert string_hash64("cr__base_xf_plates_t1_primitive") == 0xd4ad3f9f0ae71c4a
assert string_hash64("it__base_rubble_xenoferrite") == 0xe69793cf43a68fbf
print("ok")
