"""Full audit of all .env files vs what the configs actually expect."""
import re
from pathlib import Path

ROOT = Path(".")

# ── 1. Read all actual .env files ────────────────────────────────────────────
print("=" * 70)
print("  ALL ENV FILES — CURRENT STATE")
print("=" * 70)
env_files = {}
for f in sorted(ROOT.rglob(".env*")):
    if any(x in f.parts for x in [".git", "node_modules", ".venv", "__pycache__"]):
        continue
    if f.suffix in (".example", ".local", ".bak"):
        continue
    lines = f.read_text(encoding="utf-8", errors="ignore").splitlines()
    keys = {}
    for line in lines:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            keys[k.strip()] = v.strip()
    env_files[str(f)] = keys
    print(f"\n[{f}]")
    for k, v in keys.items():
        masked = v[:6] + "..." if len(v) > 10 and any(c in k.upper() for c in ["KEY", "TOKEN", "SECRET", "PASSWORD"]) else v
        status = "OK" if v and not v.startswith("YOUR_") else "MISSING/PLACEHOLDER"
        print(f"  [{status:^19}]  {k} = {masked}")

# ── 2. What does chatbot_service/config.py expect? ────────────────────────────
print("\n" + "=" * 70)
print("  CHATBOT CONFIG — EXPECTED KEYS")
print("=" * 70)
cs_config = Path("chatbot_service/config.py").read_text(encoding="utf-8")

# Extract field names and env aliases from pydantic Settings
field_pattern = re.compile(r'(\w+)\s*:\s*[\w\|\[\]]+[^\n]*=\s*Field\(')
alias_pattern = re.compile(r'validation_alias\s*=\s*["\']([A-Z_]+)["\']')

chatbot_keys = set(re.findall(r'["\']([A-Z_][A-Z0-9_]+)["\']', cs_config))
chatbot_keys.update(re.findall(r'os\.(?:environ|getenv)\(["\']([A-Z_]+)', cs_config))

chatbot_env = env_files.get("chatbot_service\\.env", env_files.get("chatbot_service/.env", {}))
if not chatbot_env:
    for k in env_files:
        if "chatbot_service" in k and ".example" not in k:
            chatbot_env = env_files[k]
            break

missing_chatbot = []
for key in sorted(chatbot_keys):
    if len(key) < 4:
        continue
    in_env = key in chatbot_env
    val = chatbot_env.get(key, "")
    is_placeholder = val.startswith("YOUR_") or not val
    if not in_env or is_placeholder:
        missing_chatbot.append((key, "MISSING" if not in_env else "PLACEHOLDER"))

if missing_chatbot:
    for k, status in missing_chatbot:
        print(f"  [!] {k}: {status}")
else:
    print("  All expected keys present.")

# ── 3. What does backend/core/config.py expect? ────────────────────────────────
print("\n" + "=" * 70)
print("  BACKEND CONFIG — EXPECTED KEYS")
print("=" * 70)
be_config = Path("backend/core/config.py").read_text(encoding="utf-8")
backend_keys = set(re.findall(r'["\']([A-Z_][A-Z0-9_]+)["\']', be_config))
backend_keys.update(re.findall(r'os\.(?:environ|getenv)\(["\']([A-Z_]+)', be_config))

backend_env = {}
for k in env_files:
    if "backend" in k and "chatbot" not in k and ".example" not in k:
        backend_env = env_files[k]
        break

missing_backend = []
for key in sorted(backend_keys):
    if len(key) < 4:
        continue
    in_env = key in backend_env
    val = backend_env.get(key, "")
    is_placeholder = val.startswith("YOUR_") or not val
    if not in_env or is_placeholder:
        missing_backend.append((key, "MISSING" if not in_env else "PLACEHOLDER"))

if missing_backend:
    for k, status in missing_backend:
        print(f"  [!] {k}: {status}")
else:
    print("  All expected keys present.")

# ── 4. Frontend env check ────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("  FRONTEND .env — EXPECTED KEYS")
print("=" * 70)
# Scan all .ts/.tsx files for process.env or NEXT_PUBLIC_ usage
fe_keys = set()
for f in Path("frontend").rglob("*.ts"):
    if "node_modules" in f.parts:
        continue
    txt = f.read_text(encoding="utf-8", errors="ignore")
    fe_keys.update(re.findall(r'process\.env\.([A-Z_][A-Z0-9_]+)', txt))
    fe_keys.update(re.findall(r'process\.env\[["\']([A-Z_][A-Z0-9_]+)', txt))

fe_env = {}
for k in env_files:
    if "frontend" in k and ".example" not in k:
        fe_env = env_files[k]
        break

if fe_keys:
    for key in sorted(fe_keys):
        val = fe_env.get(key, "")
        status = "OK" if val and not val.startswith("YOUR_") else "MISSING"
        print(f"  [{status}]  {key} = {val or '(not set)'}")
else:
    print("  No process.env usage found in frontend TypeScript files.")

print("\n" + "=" * 70)
print("  SUMMARY")
print("=" * 70)
print(f"  Chatbot missing/placeholder: {len(missing_chatbot)} keys")
print(f"  Backend missing/placeholder: {len(missing_backend)} keys")
