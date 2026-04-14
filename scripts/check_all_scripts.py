import subprocess, sys
from pathlib import Path

ROOT = Path(".")

scripts = [
    # Top-level scripts
    "scripts/bootstrap_local_data.py",
    "scripts/download_legal_pdfs.py",
    "scripts/extract_morth2022_tables.py",
    "scripts/verify_data.py",
    "scripts/seed_blackspots.py",
    "scripts/seed_nhp_hospitals.py",
    "scripts/fetch_hospitals.py",
    "scripts/fetch_police.py",
    "scripts/fetch_fire.py",
    "scripts/fetch_ambulance.py",
    "scripts/fetch_blood_banks.py",
    "scripts/_overpass_utils.py",
    "scripts/seed_emergency.py",
    "scripts/inspect_zips.py",
    # Backend scripts
    "backend/scripts/seed_violations.py",
    "backend/scripts/build_vectorstore.py",
    "backend/scripts/seed_emergency.py",
    "backend/scripts/build_offline_bundle.py",
    "backend/scripts/seed_roadwatch_sample.py",
    "backend/scripts/import_road_infrastructure.py",
    "backend/scripts/import_official_road_sources.py",
    # Chatbot
    "chatbot_service/data/build_vectorstore.py",
]

passed = []
failed = []

for s in scripts:
    p = ROOT / s
    if not p.exists():
        failed.append((s, "FILE NOT FOUND"))
        continue
    result = subprocess.run(
        [sys.executable, "-m", "py_compile", str(p)],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        passed.append(s)
    else:
        err = (result.stderr or result.stdout).strip().splitlines()[-1]
        failed.append((s, err))

print()
print("=" * 70)
print(f"  SCRIPT SYNTAX CHECK — {len(scripts)} scripts")
print("=" * 70)
for s in passed:
    print(f"  [PASS]  {s}")
for s, err in failed:
    print(f"  [FAIL]  {s}")
    print(f"          {err}")
print("=" * 70)
print(f"  {len(passed)} PASS | {len(failed)} FAIL")
print("=" * 70)
