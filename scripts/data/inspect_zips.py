import zipfile
from pathlib import Path

ROOT = Path(".")

zips = [
    "backend/datasets/accidents/kaggle/AccidentsBig.csv.zip",
    "chatbot_service/data/legal/indian_kanoon/indian_kanoon_statistics_v1.zip",
    "chatbot_service/data/pothole_training/road_damage_2025/archive.zip",
    "chatbot_service/data/qa_pairs/file-1745432916167-910662924.zip",
    "chatbot_service/data/roads/pmgsy-geosadak-master.zip",
]

for zpath in zips:
    p = ROOT / zpath
    if not p.exists():
        print(f"MISSING: {zpath}")
        continue
    size_mb = p.stat().st_size / 1024 / 1024
    print(f"\n[{size_mb:.1f}MB] {p.name}")
    try:
        with zipfile.ZipFile(p) as z:
            members = z.namelist()
            print(f"  Total entries: {len(members)}")
            top = sorted(set(m.split("/")[0] for m in members))
            for t in top[:6]:
                print(f"  root-dir: {t}/")
            sample = [m for m in members if not m.endswith("/")][:6]
            for s in sample:
                info = z.getinfo(s)
                print(f"  file: {s}  ({info.file_size:,}B uncompressed)")
    except Exception as e:
        print(f"  Cannot open: {e}")
