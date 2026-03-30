# SafeVisionAI  Setup & Installation Guide

Step-by-step guide to install dependencies and run both backend and frontend locally.

---

## Prerequisites

Make sure you have these installed before starting:

| Tool   | Version | Check            | Download                           |
|--------|-------  |------------------|------------------------------------|
| Python | 3.11+   | `python --version` | [python.org](https://python.org) |
| pip    | latest  | `pip --version`  | bundled with Python                |
| Node.js| 20+     | `node --version` | [nodejs.org](https://nodejs.org)   |
| npm    | 9+      | `npm --version`  | bundled with Node.js               |
| Git    | any     | `git --version`  | [git-scm.com](https://git-scm.com) |

---

## Step 1  Create Project Folder & Clone the Repository

>  **Note:** `git clone` automatically initializes the git repo for you  you do **NOT** need to run `git init` before cloning.

### Option A  Clone directly (if repo already exists on GitHub)

```bash
# 1. Go to the folder where you want the project
cd C:\Hackathons\IITM           # Windows example
# cd ~/projects                 # Linux/Mac example

# 2. Clone the repository
git clone https://github.com/SafeVision-AI/SafeVision-AI.git

# 3. Enter the project folder
cd SafeVisionAI
```

### Option B  Create folder first, then clone into it

```bash
# 1. Create the project folder
mkdir SafeVisionAI

# 2. Enter it
cd SafeVisionAI

# 3. Clone into current folder (note the dot at end)
git clone https://github.com/SafeVision-AI/SafeVision-AI.git .
```

### Option C  Fresh start (no GitHub yet)

```bash
# 1. Create the folder
mkdir SafeVisionAI
cd SafeVisionAI

# 2. Initialize a new git repo
git init

# 3. Create the folder structure manually or copy files in
```

 After cloning, verify you can see the project files:

```bash
# Windows
dir

# Linux/Mac
ls -la
```

You should see: `backend/`, `frontend/`, `docs/`, `README.md`, `SETUP.md`

---

#  BACKEND SETUP

---

## Step 2  Create a Python Virtual Environment

> A virtual environment keeps project dependencies isolated from your global Python.

```bash
# Navigate to the backend folder
cd backend

# Create the virtual environment
python -m venv .venv
```

### Activate the Virtual Environment

**Windows (PowerShell):**
```powershell
.venv\Scripts\activate
```

**Windows (Command Prompt):**
```cmd
.venv\Scripts\activate
```

**Linux / macOS:**
```bash
source .venv/bin/activate
```

 You should see `(.venv)` at the start of your terminal line after activation.

---

## Step 3  Install Backend Dependencies

```bash
# Make sure venv is activated (see above)
pip install -r requirements.txt
```

This installs all packages listed in `requirements.txt`:
- **FastAPI + Uvicorn**  web framework and server
- **LangChain + Groq**  AI chatbot pipeline
- **ChromaDB**  vector store for RAG
- **SQLAlchemy + asyncpg**  async database ORM
- **GeoAlchemy2**  PostGIS geometry support
- **sentence-transformers**  embeddings (runs locally, no API)
- **DuckDB**  SQL engine for challan calculator
- **Redis (hiredis)**  cache client
- **httpx**  async HTTP for Overpass/Nominatim
- **Pydantic**  request/response validation
- **Alembic**  database migrations
- **pypdf, aiofiles, Pillow**  document and file handling

>  First install takes 35 minutes (sentence-transformers is large).

Verify installation:
```bash
python -c "import fastapi, langchain, chromadb; print('All packages OK')"
```

---

## Step 4  Configure Environment Variables

```bash
# Copy the template
cp .env.example .env
```

Create `.env` file in the `backend/` folder and fill in all the required values.

---

## Step 5  Run the Backend

```bash
# Make sure venv is activated and you are in backend/
uvicorn main:app --reload --port 8000
```

The `--reload` flag auto-restarts the server when you save a file.

 **Verify it's running:**
- Health check: [http://localhost:8000/health](http://localhost:8000/health)
- Swagger API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

Expected response at `/health`:
```json
{
  "status": "ok",
  "chatbot_ready": true,
  "environment": "development"
}
```

---

#  FRONTEND SETUP

---

## Step 9  Install Frontend Dependencies

Open a **new terminal** (keep backend running in the other one):

```bash
# Navigate to the frontend folder (from project root)
cd frontend

# Install all npm packages
npm install
```

This installs all packages in `package.json`:
- **Next.js 14**  React framework with App Router
- **TypeScript**  type-safe JavaScript
- **Tailwind CSS**  utility-first CSS
- **Leaflet.js + react-leaflet**  interactive maps
- **@mlc-ai/web-llm**  Phi-3 Mini offline AI in browser
- **@huggingface/transformers**  YOLOv8n pothole detection in browser
- **@duckdb/duckdb-wasm**  SQL in browser for offline challan calc
- **idb**  IndexedDB wrapper for offline storage
- **zustand**  global state management
- **swr**  data fetching with caching
- **framer-motion**  animations
- **next-pwa + workbox**  Progressive Web App / Service Worker

>  First install takes 24 minutes (web-llm package is large).

Verify installation:
```bash
npx next --version
# Should print: 14.x.x
```

---

## Step 10  Configure Frontend Environment Variables

```bash
# From inside the frontend/ folder
cp .env.local.example .env.local
```

Create `.env.local` file in the `frontend/` folder and fill in all the required values.

---

## Step 11  Run the Frontend

```bash
# Make sure you are in frontend/
npm run dev
```

 App opens at: [http://localhost:3000](http://localhost:3000)

You should see the SafeVisionAI home page with the 4 module cards.

---

## Step 12  Test Offline / PWA Mode

> **Important**: The Service Worker (offline mode) only works in a production build. `npm run dev` skips it.

```bash
# Build production bundle
npm run build

# Start production server locally
npm start

# Now visit http://localhost:3000 in Chrome
# Then: DevTools  Application  Service Workers  verify "Activated"
# Then: DevTools  Network  check "Offline"
# Navigate to /emergency  hospital markers should still appear from cache
```

---

#  -  Daily Quick-Start

Once everything is installed, these are the only two commands you need each day:

```bash
#  Terminal 1: Backend 
cd SafeVisionAI/backend
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # Linux/Mac
uvicorn main:app --reload --port 8000

#  Terminal 2: Frontend 
cd SafeVisionAI/frontend
npm run dev

#  Both running 
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
# Frontend: http://localhost:3000
```

---

#  All Useful Commands

## Backend Commands

```bash
#  Run the server 
uvicorn main:app --reload --port 8000

#  Testing 
pytest tests/ -v                                         # Run all tests
pytest tests/test_challan.py -v                          # Run one test file
pytest tests/test_challan.py::test_drunk_driving_fine -v # Run single test

#  Test API endpoints 
curl "http://localhost:8000/api/v1/emergency/nearby?lat=13.0827&lon=80.2707"
curl "http://localhost:8000/api/v1/challan/calculate?violation_code=MVA_185"
curl "http://localhost:8000/health"

#  Venv 
.venv\Scripts\activate                                   # Activate (Windows PS / CMD)
source .venv/bin/activate                                # Activate (Linux/Mac)
deactivate                                               # Deactivate
```

## Frontend Commands

```bash
#  Run 
npm run dev                                              # Start dev server (hot reload)
npm run build                                            # Build for production
npm start                                                # Run production build locally

#  Code quality 
npm run lint                                             # Run ESLint

#  Testing 
npm test                                                 # Run all Vitest tests
npm run test:watch                                       # Run tests in watch mode

#  Packages 
npm install                                              # Install all dependencies
npm install [package-name]                               # Add a new package
npm uninstall [package-name]                             # Remove a package
npx npm-check-updates -u && npm install                  # Upgrade all packages
```

---

#  Troubleshooting

### `ModuleNotFoundError` in backend
```bash
# Make sure .venv is activated  check for (.venv) in terminal
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### `Map not displaying` in browser
- Leaflet requires `dynamic(() => import(...), { ssr: false })`  check `components/EmergencyMap.tsx`
- Make sure Leaflet CSS is imported inside the component, not in `layout.tsx`

### `Cannot find module 'leaflet'` build error
```bash
cd frontend
npm install leaflet @types/leaflet react-leaflet
```

### `GROQ_API_KEY` missing error
- Create a free account at [console.groq.com](https://console.groq.com)
- Go to API Keys  Create Key
- Copy the `gsk_...` key into `backend/.env`

### Port 8000 already in use
```bash
# Windows  find and kill the process
netstat -ano | findstr :8000
taskkill /PID [PID_NUMBER] /F
```

### Port 3000 already in use
```bash
# Run frontend on a different port
npm run dev -- -p 3001
```

---

*For full deployment to Vercel + Render.com, see [`docs/Deployment.md`](docs/Deployment.md)*  
*For the complete app overview, see [`docs/Agent.md`](docs/Agent.md)*
