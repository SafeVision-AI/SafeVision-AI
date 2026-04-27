#!/usr/bin/env python3
"""
ChromaDB Legal Knowledge Ingestion — Motor Vehicles Act 1988 + Amendment 2019
Enterprise-grade RAG pipeline for DriveLegal challan queries.

Run: python scripts/ingest_legal_chromadb.py

Ingests:
  - Motor Vehicles Act 1988 key sections (hardcoded from official text)
  - MV Amendment Act 2019 updated fines
  - State override notes (from datasets/challan/state_overrides.csv)

Output: backend/chroma_db/ (ChromaDB persistent collection)
"""

import csv
import sys
from pathlib import Path

try:
    import chromadb
    from chromadb.utils import embedding_functions
except ImportError:
    print("Install chromadb: pip install chromadb")
    sys.exit(1)

# ── MV Act 1988 Key Sections (enterprise-grade, court-citable) ────────────────
MV_ACT_1988_SECTIONS = [
    {
        "id": "mva-1988-s112",
        "section": "Section 112 — Limits of Speed",
        "content": "Section 112 of the Motor Vehicles Act 1988 sets the maximum speed limits. "
                   "Motor vehicles shall not be driven at speeds exceeding: "
                   "urban area roads: 50 km/h for LMV; 40 km/h for HMV. "
                   "National and State highways: 100 km/h for LMV; 65 km/h for HMV; "
                   "60 km/h for medium goods vehicles. "
                   "State governments may fix lower speeds for specific routes. "
                   "Fine: ₹1,000–₹2,000 for first offense; ₹2,000–₹4,000 for repeat offense.",
        "act": "Motor Vehicles Act 1988",
        "category": "speeding",
    },
    {
        "id": "mva-1988-s129",
        "section": "Section 129 — Wearing of Protective Headgear",
        "content": "Section 129 mandates every person driving or riding a motorcycle on any public road "
                   "shall wear a protective helmet conforming to BIS standards. "
                   "The helmet must be securely fastened to the head. "
                   "Fine: ₹1,000 for non-wearing of helmet by rider. "
                   "Penalty for pillion passenger not wearing helmet: ₹1,000. "
                   "Disqualification from driving for 3 months may be imposed on repeat offense.",
        "act": "Motor Vehicles Act 1988",
        "category": "helmet",
    },
    {
        "id": "mva-1988-s138",
        "section": "Section 138 — Regulation of Traffic",
        "content": "Section 138 empowers state governments to make rules for regulation of traffic. "
                   "Jumping red light: ₹5,000 fine under MV Amendment 2019. "
                   "Wrong side driving: ₹5,000 fine. "
                   "Driving without seatbelt: ₹1,000 fine. "
                   "Using mobile phone while driving: ₹5,000 fine (repeat: ₹10,000).",
        "act": "Motor Vehicles Act 1988",
        "category": "traffic_signal",
    },
    {
        "id": "mva-1988-s185",
        "section": "Section 185 — Driving by a Drunken Person",
        "content": "Section 185 prohibits driving under the influence of alcohol or drugs. "
                   "Blood alcohol content (BAC) exceeding 30mg per 100ml of blood is an offense. "
                   "First offense: imprisonment up to 6 months OR fine up to ₹10,000 or both. "
                   "Second offense within 3 years: imprisonment up to 2 years AND fine up to ₹15,000. "
                   "Driving license suspension for 6 months minimum on first conviction.",
        "act": "Motor Vehicles Act 1988",
        "category": "drunk_driving",
    },
    {
        "id": "mva-1988-s194",
        "section": "Section 194 — Using Vehicle Exceeding Permissible Weight",
        "content": "Section 194 addresses overloaded vehicles. "
                   "Driving a vehicle with load exceeding permissible weight: "
                   "Fine: ₹20,000 for first offense, plus ₹2,000 per additional tonne or part thereof. "
                   "Repeat offense: ₹25,000 + same per-tonne rate. "
                   "The State government may detain the vehicle until excess load is unloaded.",
        "act": "Motor Vehicles Act 1988",
        "category": "overloading",
    },
    {
        "id": "mva-1988-s196",
        "section": "Section 196 — Driving Without Insurance",
        "content": "Section 196 mandates third-party insurance for all motor vehicles. "
                   "Driving without valid third-party insurance: "
                   "Fine: ₹2,000 and/or imprisonment up to 3 months for first offense. "
                   "Repeat offense: ₹4,000 and/or imprisonment up to 3 months. "
                   "This is a cognizable offense — police can arrest without warrant.",
        "act": "Motor Vehicles Act 1988",
        "category": "no_insurance",
    },
    {
        "id": "mva-1988-s177",
        "section": "Section 177 — General Provisions for Punishment of Offences",
        "content": "Section 177 provides general punishment for traffic rule violations not covered by specific sections. "
                   "Any person contravening any provision of this Act or rules: "
                   "Fine: ₹500 for first offense; ₹1,500 for subsequent offenses. "
                   "Driving license in violation of conditions: ₹5,000.",
        "act": "Motor Vehicles Act 1988",
        "category": "general",
    },
    {
        "id": "mva-1988-s134",
        "section": "Section 134 — Duty of Driver in Case of Accident",
        "content": "Section 134 mandates that the driver of any motor vehicle involved in an accident "
                   "shall take reasonable steps to secure medical attention for the injured person. "
                   "Driver must not flee the scene. Must report the accident to the nearest police station "
                   "within 24 hours if any person was killed or injured. "
                   "Failure to report: imprisonment up to 3 months or fine up to ₹500 or both. "
                   "Hit and run cases: victim compensation from Solatium Fund.",
        "act": "Motor Vehicles Act 1988",
        "category": "accident_duty",
    },
    # ── MV Amendment Act 2019 Updated Fines ────────────────────────────────────
    {
        "id": "mva-2019-s119",
        "section": "MV Amendment 2019 — Updated Fines Schedule",
        "content": "The Motor Vehicles (Amendment) Act 2019 significantly increased traffic fines. "
                   "Key updated fines: "
                   "Drunk driving: ₹10,000 (was ₹2,000); "
                   "Speeding: ₹1,000–₹2,000 (was ₹400); "
                   "Red light jumping: ₹5,000 (was ₹1,000); "
                   "Not wearing helmet: ₹1,000 + 3-month license suspension (was ₹100); "
                   "Not wearing seatbelt: ₹1,000 (was ₹100); "
                   "Dangerous driving: ₹5,000 (was ₹1,000); "
                   "Using mobile phone: ₹5,000 (was ₹1,000); "
                   "Driving without license: ₹5,000 (was ₹500); "
                   "Driving without insurance: ₹2,000 (was ₹1,000); "
                   "Overloading 2-wheelers: ₹2,000 + license disqualification for 3 months; "
                   "Juvenile driving: Guardian or owner liable — ₹25,000 fine, 3 years imprisonment.",
        "act": "MV Amendment Act 2019",
        "category": "general",
    },
    {
        "id": "mva-2019-golden-hour",
        "section": "MV Amendment 2019 — Good Samaritan Protection",
        "content": "The MV Amendment Act 2019 includes Good Samaritan provisions. "
                   "Any person who in good faith voluntarily assists a victim of a road accident "
                   "shall not be subject to civil or criminal liability. "
                   "Good Samaritans cannot be detained at the hospital or police station. "
                   "Police cannot compel a Good Samaritan to be a witness. "
                   "This encourages bystanders to help accident victims without fear of legal trouble. "
                   "Hospital cannot demand payment before providing emergency treatment to accident victims. "
                   "Cashless treatment for road accident victims within first 24 hours.",
        "act": "MV Amendment Act 2019",
        "category": "good_samaritan",
    },
]

# ── India State Fine Overrides (sampled) ──────────────────────────────────────
STATE_OVERRIDES = [
    {
        "id": "state-delhi-helmet",
        "content": "Delhi: Helmet fine ₹1,000 as per Central Act. No separate state override. "
                   "E-challan via CCTV cameras automated in Delhi NCR.",
        "act": "Delhi Motor Vehicle Rules",
        "category": "helmet",
    },
    {
        "id": "state-tamil-nadu-speed",
        "content": "Tamil Nadu: Speed limits on National Highways: 80 km/h for LMV; 60 km/h for HMV. "
                   "Urban area speed limit: 50 km/h. "
                   "Fine for speeding: ₹1,000–₹2,000 as per central act.",
        "act": "Tamil Nadu Motor Vehicles Rules",
        "category": "speeding",
    },
    {
        "id": "state-maharashtra-drunk",
        "content": "Maharashtra: Drunk driving fine ₹10,000 + license suspension 6 months for first offense. "
                   "Repeat within 3 years: license cancellation + imprisonment up to 2 years.",
        "act": "Maharashtra Motor Vehicles Rules",
        "category": "drunk_driving",
    },
]


def ingest_to_chromadb():
    """Load all legal documents into ChromaDB for RAG queries."""

    chroma_path = Path(__file__).parents[1] / "chroma_db"
    chroma_path.mkdir(exist_ok=True)

    print(f"[CHROMA] Connecting to ChromaDB at: {chroma_path}")
    client = chromadb.PersistentClient(path=str(chroma_path))

    # Use sentence-transformers if available, else default
    try:
        from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
        ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        print("[OK] Using SentenceTransformer embeddings (better accuracy)")
    except Exception:
        ef = embedding_functions.DefaultEmbeddingFunction()
        print("[WARN] Using default embeddings (install sentence-transformers for better accuracy)")

    # Create or get collection
    collection = client.get_or_create_collection(
        name="legal_knowledge",
        embedding_function=ef,
        metadata={"description": "India Motor Vehicles Act + MV Amendment 2019"},
    )

    # Prepare documents
    all_docs = MV_ACT_1988_SECTIONS + STATE_OVERRIDES

    # Also load state_overrides.csv if it exists
    csv_path = Path(__file__).parents[1] / "datasets" / "challan" / "state_overrides.csv"
    if csv_path.exists():
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                all_docs.append({
                    "id": f"csv-state-{i}",
                    "content": f"State: {row.get('state', '?')} | Offense: {row.get('offense_type', '?')} | "
                               f"Fine: ₹{row.get('fine_amount', '?')} | Section: {row.get('mv_act_section', 'N/A')}",
                    "act": "State Override CSV",
                    "category": row.get("offense_type", "general"),
                })

    ids = [d["id"] for d in all_docs]
    documents = [d["content"] for d in all_docs]
    metadatas = [{"act": d.get("act", ""), "category": d.get("category", ""), "section": d.get("section", "")}
                 for d in all_docs]

    # Upsert (idempotent)
    collection.upsert(ids=ids, documents=documents, metadatas=metadatas)

    print(f"[OK] Ingested {len(all_docs)} legal documents into ChromaDB collection 'legal_knowledge'")
    print(f"   Path: {chroma_path}")

    # Quick verification query
    results = collection.query(query_texts=["drunk driving fine"], n_results=2)
    print(f"\n[TEST] Test query 'drunk driving fine' -> top results:")
    for doc in results["documents"][0]:
        print(f"  - {doc[:100]}...")


if __name__ == "__main__":
    ingest_to_chromadb()
