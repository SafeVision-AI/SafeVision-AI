# SafeVisionAI - Data Science & ML Pipelines

This directory contains the original Google Colab / Jupyter notebooks utilized to train the machine learning models and process the massive datasets for the SafeVisionAI platform. 

The outputs from these notebooks form the entire "intelligence" layer of the application, driving everything from the real-time webcam inference to the RAG chatbot.

---

## 🗄️ IMPORTANT: How to load the Datasets into Colab
If you are running these Notebooks from scratch in Google Colab, you need the raw source datasets to train them.

1. **Extract the Data Vault**: You will find a Backup Zip file inside this directory (e.g., `SafeVisionAI_Data_Backup.zip`). **Extract this zip file** first.
2. **Find the Paths**: Open the extracted folder, and navigate to the `data/` directory. Here you will see the exact same folder structure as the main codebase (e.g., `data/backend/data` and `data/chatbot_service/data`).
3. **Upload to Colab**: When a Notebook asks you to manually upload a dataset, upload the specific files from inside the extracted `data/` directory.

---


## 📓 Notebook 1: YOLOv8 Pothole Detector Training
* **Purpose**: Trains a custom YOLOv8 Nano object detection model on the Indian Road Pothole dataset to identify multiple classes: `pothole`, `crack`, and `manhole`. Employs data augmentation and runs for 50 epochs to maximize mAP.
* **Why we use it**: It acts as the core computer vision engine to warn drivers of upcoming road deformities.
* **Where the outputs live**:
  * ➔ `frontend/public/models/pothole.onnx` (12MB ONNX artifact used by the browser/app to perform real-time tracking entirely offline).
  * ➔ `backend/models/pothole.pt` (PyTorch artifact utilized by the backend server for heavier image verification/reporting).

## 📓 Notebook 2: ChromaDB RAG Vectorstore Build
* **Purpose**: Ingests thousands of pages of Indian legal Pdfs, MVA (Motor Vehicles Act) penalty charts, and traffic regulations. It utilizes `langchain` and SentenceTransformers to chunk, embed, and store this data in a persistent local SQLite vector store.
* **Why we use it**: It gives the AI Chatbot absolute knowledge over Indian road laws, ensuring it never hallucinates legal advice.
* **Where the outputs live**:
  * ➔ `chatbot_service/data/chroma_db/` (The actual `chroma.sqlite3` vectors used by the LangChain retrieval chain).

## 📓 Notebook 3: Accident EDA & Hotspot Generator
* **Purpose**: Analyzes the multi-million row India Accidents GPS dataset. It calculates national statistics, aggregates state-wise fatality rates, and clusters raw GPS tags into definitive geographic "blackspots" (areas with historical fatality density).
* **Why we use it**: Displays compelling statistics to the user and warns them if their current route is historically dangerous.
* **Where the outputs live**:
  * ➔ `chatbot_service/data/accidents/blackspot_seed.csv` (Parsed by the SOS and routing engine).
  * ➔ `chatbot_service/data/accidents/accidents_summary.json` & `frontend/public/offline-data/accidents_summary.json` (Used by the UI panels and chatbot context).

## 📓 Notebook 4: Roads Data Processing
* **Purpose**: Cleans and strips down massive tabular highway/toll data. Maps unformatted legacy headers (`name, lat, lon, id`) into clean schemas (`Plaza Name, NH Number`) to reduce the file payload size for mobile clients.
* **Why we use it**: Prevents the frontend from downloading megabytes of unused CSV columns just to render map markers.
* **Where the outputs live**:
  * ➔ `backend/data/toll_plazas.json` (Served directly to the Mapbox/Leaflet UI components).

## 📓 Notebook 5: Risk Model ONNX Training
* **Purpose**: Synthesizes environmental data (e.g., weather condition, speed limits, time of day, road type) to train a lightweight `GradientBoostingClassifier` evaluating the current risk probability (Safe vs. Danger) of a drive.
* **Why we use it**: Generates an ultra-lightweight (15KB) classification model capable of running edge inferences on the user's phone, even in poor-connectivity standard Indian rural areas.
* **Where the outputs live**:
  * ➔ `frontend/public/models/risk_model.onnx` (Triggered via ONNX.js in the browser frontend).
