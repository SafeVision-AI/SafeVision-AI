import subprocess, sys
from pathlib import Path

ROOT = Path(".")

scripts = [
    # Root scripts/data/
    "scripts/data/bootstrap_local_data.py",
    "scripts/data/download_legal_pdfs.py",
    "scripts/data/extract_morth2022_tables.py",
    "scripts/data/verify_data.py",
    "scripts/data/seed_blackspots.py",
    "scripts/data/fetch_hospitals.py",
    "scripts/data/fetch_police.py",
    "scripts/data/fetch_fire.py",
    "scripts/data/fetch_ambulance.py",
    "scripts/data/fetch_blood_banks.py",
    "scripts/data/_overpass_utils.py",
    "scripts/data/inspect_zips.py",
    # Root scripts/app/
    "scripts/app/seed_nhp_hospitals.py",
    "scripts/app/seed_emergency.py",
    # Backend scripts/data/
    "backend/scripts/data/seed_violations.py",
    "backend/scripts/data/prepare_road_sources.py",
    "backend/scripts/data/sample_pmgsy.py",
    # Backend scripts/app/
    "backend/scripts/app/build_vectorstore.py",
    "backend/scripts/app/seed_emergency.py",
    "backend/scripts/app/build_offline_bundle.py",
    "backend/scripts/app/seed_roadwatch_sample.py",
    "backend/scripts/app/import_road_infrastructure.py",
    "backend/scripts/app/import_official_road_sources.py",
    # Chatbot scripts/data/
    "chatbot_service/scripts/data/fetch_hospitals.py",
    "chatbot_service/scripts/data/fetch_police.py",
    "chatbot_service/scripts/data/fetch_ambulance.py",
    "chatbot_service/scripts/data/fetch_blood_banks.py",
    "chatbot_service/scripts/data/fetch_fire.py",
    "chatbot_service/scripts/data/_overpass_utils.py",
    # Chatbot scripts/app/
    "chatbot_service/scripts/app/seed_emergency.py",
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
