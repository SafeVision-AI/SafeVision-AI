# Dataset Placement

This file is the project-wide placement guide for every dataset, legal corpus file, and offline data asset mentioned in the RoadSoS data and chatbot documents.

Use this file when downloading or copying resources into the repo.

## Scope

This guide covers placement for:
- backend import datasets
- chatbot RAG/legal corpus files
- frontend offline static data bundles
- dataset manifests used for imports

This guide does not cover:
- secret keys or `.env` values
- model training datasets stored outside the repo
- dashboard-only benchmark/reference apps

## Placement Rules

- Put government and importable CSV/GeoJSON/JSON assets under `backend/datasets/`.
- Put chatbot legal/RAG PDFs and vectorstore source files under `chatbot_service/data/legal/` and `chatbot_service/data/medical/`.
- Put browser-consumed offline bundles under `frontend/public/offline-data/`.
- Keep very large raw training datasets outside git unless we explicitly decide otherwise.
- Prefer the suggested filenames below so import scripts and future docs stay consistent.

## 1. Backend Dataset Root

Base path: `backend/datasets/`

### 1.1 Emergency Services

| Dataset | Put it here | Suggested filename |
|---|---|---|
| National Hospital Directory with Geo Code | `backend/datasets/emergency/hospitals/` | `hospital_directory_nhp.csv` |
| Blood Bank Directory National Health Portal | `backend/datasets/emergency/blood_banks/` | `blood_bank_directory_nhp.csv` |
| Number of Sub-Centres, PHCs and CHCs | `backend/datasets/emergency/primary_care/` | `sub_centres_phc_chc_counts.csv` |
| State-wise Number of PHCs/CHCs functioning Rural Urban | `backend/datasets/emergency/primary_care/` | `phc_chc_rural_urban.csv` |
| NHM health facilities export | `backend/datasets/emergency/primary_care/` | `nhm_health_facilities.csv` |

### 1.2 Accident and Risk Datasets

| Dataset | Put it here | Suggested filename |
|---|---|---|
| Road Accidents in India 2022 | `backend/datasets/accidents/adsi/` | `road_accidents_india_2022.csv` |
| Road Accidents in India 2021 | `backend/datasets/accidents/adsi/` | `road_accidents_india_2021.csv` |
| Road Accidents in India 2020 | `backend/datasets/accidents/adsi/` | `road_accidents_india_2020.csv` |
| Road Accidents in India 2019 | `backend/datasets/accidents/adsi/` | `road_accidents_india_2019.csv` |
| State/UT/City-wise Traffic Accidents Cases Injured Died 2022 | `backend/datasets/accidents/adsi/` | `traffic_accidents_cases_injured_died_2022.csv` |
| Accidental Deaths and Suicides in India ADSI 2022 | `backend/datasets/accidents/adsi/` | `adsi_2022.csv` |
| MoRTH accidents by vehicle type 2012-2016 | `backend/datasets/accidents/morth/` | `morth_vehicle_type_2012_2016.csv` |
| MoRTH accidents by road features 2014-2016 | `backend/datasets/accidents/morth/` | `morth_road_features_2014_2016.csv` |
| Persons injured 2011-2014 | `backend/datasets/accidents/morth/` | `morth_persons_injured_2011_2014.csv` |
| India road accident dataset with coordinates | `backend/datasets/accidents/kaggle/` | `india_road_accident_coords.csv` |
| Road accident severity dataset | `backend/datasets/accidents/kaggle/` | `road_accident_severity.csv` |
| Road accidents India (Manu Gupta) | `backend/datasets/accidents/kaggle/` | `road_accidents_india_manu_gupta.csv` |
| Crime Review India 2025 | `backend/datasets/accidents/kaggle/` | `crime_review_india_2025.csv` |

### 1.3 Road Infrastructure and RoadWatch Sources

| Dataset | Put it here | Suggested filename |
|---|---|---|
| PMGSY Rural Roads export (single file) | `backend/datasets/roads/pmgsy/` | `pmgsy_rural_roads.csv` |
| PMGSY Rural Roads export (state-wise multiple files) | `backend/datasets/roads/pmgsy/` | `pmgsy_<state>.csv` |
| National Highway Length state-wise | `backend/datasets/roads/nhai/` | `national_highway_length_statewise.csv` |
| Basic Road Statistics of India | `backend/datasets/roads/basic_stats/` | `basic_road_statistics_india.pdf` |
| District boundaries GeoJSON | `backend/datasets/roads/boundaries/` | `district_boundaries.geojson` |
| State road GeoJSON exports | `backend/datasets/roads/boundaries/` | `<state>_roads.geojson` |
| NHAI Toll Plazas India | `backend/datasets/roads/toll_plazas/` | `nhai_toll_plazas_india.csv` |
| City corporation streets export | `backend/datasets/roads/boundaries/` | `city_corporation_streets.csv` |

### 1.4 Police and Authority Routing Datasets

| Dataset | Put it here | Suggested filename |
|---|---|---|
| List of Police Stations India | `backend/datasets/police/stations/` | `police_stations_india.csv` |
| District-wise Crime Statistics NCRB | `backend/datasets/police/crime/` | `district_crime_statistics.csv` |
| State police contacts export | `backend/datasets/police/stations/` | `state_police_contacts.csv` |

### 1.5 Legal and Policy Corpora for Backend Use

| Dataset / file | Put it here | Suggested filename |
|---|---|---|
| Motor Vehicles Act 1988 PDF | `backend/datasets/legal/acts/` | `motor_vehicles_act_1988.pdf` |
| MV Amendment Act 2019 PDF | `backend/datasets/legal/acts/` | `mv_amendment_act_2019.pdf` |
| WHO Trauma Care Guidelines PDF | `backend/datasets/legal/who/` | `who_trauma_care_guidelines.pdf` |
| WHO Global Road Safety Report 2023 PDF | `backend/datasets/legal/who/` | `who_road_safety_2023.pdf` |
| State amendment PDFs | `backend/datasets/legal/state_amendments/` | `<state>.pdf` |
| Indian Kanoon legal judgments | `backend/datasets/legal/court_cases/` | `<case_name>.pdf` |

### 1.6 Dataset Manifests and Import Configs

| File | Put it here | Suggested filename |
|---|---|---|
| data.gov.in source manifest | `backend/datasets/manifests/data_gov/` | `data_gov_sources.json` |
| import run manifest / batch notes | `backend/datasets/manifests/imports/` | `import_manifest.json` |
| official road source manifest | `backend/datasets/manifests/imports/` | `road_sources.json` |

## 2. Chatbot Service Data Root

Base path: `chatbot_service/data/`

These files are for RAG, legal reasoning, and chatbot-side retrieval.

| Dataset / file | Put it here | Suggested filename |
|---|---|---|
| Motor Vehicles Act 1988 PDF | `chatbot_service/data/legal/` | `motor_vehicles_act_1988.pdf` |
| MV Amendment Act 2019 PDF | `chatbot_service/data/legal/` | `mv_amendment_act_2019.pdf` |
| WHO Trauma Care Guidelines PDF | `chatbot_service/data/medical/` | `who_trauma_care_guidelines.pdf` |
| Offline first-aid JSON corpus | `chatbot_service/data/` | `first_aid.json` |
| State amendment PDFs | `chatbot_service/data/legal/state_amendments/` | `<state>.pdf` |
| Indian Kanoon legal judgments | `chatbot_service/data/legal/indian_kanoon/` | `<case_name>.pdf` |
| Chroma persistence files | `chatbot_service/data/chroma_db/` | generated files |

Do not manually rename the generated Chroma files unless we also update the vectorstore code.

## 3. Frontend Offline Data Root

Base path: `frontend/public/offline-data/`

These files are meant to be served directly to the browser/PWA.

| Dataset / file | Put it here | Suggested filename |
|---|---|---|
| Offline first-aid reference bundle | `frontend/public/offline-data/` | `first-aid.json` |
| Offline emergency services GeoJSON | `frontend/public/offline-data/` | `india-emergency.geojson` |
| Violations rules CSV | `frontend/public/offline-data/` | `violations.csv` |
| State override CSV | `frontend/public/offline-data/` | `state_overrides.csv` |
| City offline service bundles | `frontend/public/offline-data/city-bundles/` | `<city>.json` |
| Translation packs | `frontend/public/offline-data/translations/` | `<lang>.json` |

## 4. Keep Outside the Repo by Default

These datasets are useful, but large enough that we should keep them outside normal git tracking unless we explicitly decide to vendor them.

| Dataset | Recommended local storage |
|---|---|
| Potholes YOLOv8 (Anggadwi) | `C:/datasets/potholes/anggadwi_yolov8/` |
| Pothole dataset (Sachin Patel) | `C:/datasets/potholes/sachin_patel/` |
| Pothole dataset (Andrew) | `C:/datasets/potholes/andrew_pascal_voc/` |
| Road Damage Dataset 2025 | `C:/datasets/road_damage_2025/` |
| Potholes + Cracks + Manholes | `C:/datasets/potholes_cracks_manholes/` |
| BhasaAnuvaad speech corpus | `C:/datasets/bhasaanuvaad/` |

## 5. Recommended Download Order

If we are collecting data in phases, use this order:

1. `backend/datasets/emergency/hospitals/hospital_directory_nhp.csv`
2. `backend/datasets/emergency/blood_banks/blood_bank_directory_nhp.csv`
3. `backend/datasets/police/stations/police_stations_india.csv`
4. `backend/datasets/accidents/adsi/road_accidents_india_2022.csv`
5. `backend/datasets/accidents/adsi/road_accidents_india_2021.csv`
6. `backend/datasets/roads/pmgsy/pmgsy_rural_roads.csv`
7. `backend/datasets/legal/acts/motor_vehicles_act_1988.pdf`
8. `backend/datasets/legal/acts/mv_amendment_act_2019.pdf`
9. `chatbot_service/data/legal/indian_kanoon/<case_name>.pdf`
10. `frontend/public/offline-data/city-bundles/<city>.json`

## 6. Naming and Hygiene Rules

- Use lowercase filenames with underscores where possible.
- Prefer `.csv`, `.geojson`, `.json`, or `.pdf` as downloaded formats unless the source forces another format.
- If a source provides ZIP files, keep the original ZIP only temporarily, then extract and place the final data file in the correct target folder.
- Do not put API keys or tokens in these folders.
- Do not commit huge raw ML training datasets to the repo.

## 7. If a Dataset Does Not Match Cleanly

If you download a file and it does not fit one of the exact placements above:
- place it in the nearest matching category folder first
- keep the original source name in a side note or manifest
- then we can normalize it in an import manifest later

When in doubt, prefer category correctness over perfect filename matching.
