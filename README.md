# Aireolifye – Your Intelligent Urban Air Quality Companion
### Breathe better. Live lighter.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=flat&logo=google)](https://ai.google.dev)
[![Open-Meteo](https://img.shields.io/badge/Open--Meteo-Live_Copernicus_AQI-orange?style=flat)](https://open-meteo.com)

**Aireolifye** is an intelligent urban air quality companion. It transforms complex environmental telemetry into calm, personalized, actionable guidance for citizens living in pollution-impacted urban centers.

---

## 🌟 Key Highlights & Innovations

1. **Zero UI Distortion (Preserved Original Design)**:
   - Faithfully retains the original prototype's forest green / mint aesthetic, typography, responsive collapsible sidebar (desktop & mobile drawer), custom cards, and smooth CSS theme switching (`light`, `dark`, and `system auto`).
2. **Real Atmospheric Telemetry (Open-Meteo & Copernicus Integration)**:
   - Queries live ambient data for $PM_{2.5}$, $PM_{10}$, $NO_2$, $SO_2$, $CO$, and $O_3$ from the European Copernicus Atmospheric Monitoring Service.
   - Calculates the **Indian National Air Quality Index (NAQI)** following Central Pollution Control Board (CPCB) linear sub-index piecewise interpolation, while clearly distinguishing it from US EPA AQI.
   - Transparent attribution with live vs. benchmark status indicators.
3. **Contextual GenAI Assistant (Google Gemini 2.5 Flash)**:
   - End-to-end integration with the `google-genai` SDK.
   - Injects real-time user context: current city, live AQI, dominant pollutant concentration, household size, commute lifestyle, and health sensitivity profile.
   - Generates structured advice cards (`[Title, Scientific Rationale]`).
   - Includes a high-fidelity local scientific fallback engine when offline or if an API key is unconfigured (ensuring 100% uptime with zero false claims).
4. **All 8 Pages Fully Implemented**:
   - **Overview**: Executive dashboard, 24-hr area sparkline, pollutant cards, tailored recommendations, and personal emissions tracker.
   - **Air Quality Monitor**: Diurnal hourly trends, 7-day synoptic forecast, comparative urban benchmarking, interactive station scatter map, and pollutant health advisories.
   - **AI Air Assistant**: Full conversational interface with suggested prompt chips, message history, streaming animations, and structured guidance cards.
   - **Daily Action Planner**: Dynamic "Clean Air Window" based on thermal inversion patterns, time-of-day tabs (*Morning*, *Afternoon*, *Evening*), persistent interactive checklist, and carbon savings counter.
   - **Indoor Air Care**: Room-specific guidance (*Kitchen*, *Bedroom*, *Living Room*, *Kids*), CADR-rated True HEPA purifier best practices, and damp cleaning protocols.
   - **Explore Greener Choices**: Actionable low-emission lifestyle choices (*Transport*, *Home*) with quantified $CO_2e$ savings benchmarks.
   - **Community Impact**: Aggregate citizen impact tracking, weekly/monthly emission avoidance bar charts, and interactive environmental challenges (*No-burn week*, *Car-free Friday*, *Switch off standby*).
   - **Settings**: Personalized user profile, health sensitivity selector, notification preferences, privacy toggles, and live theme switcher.
5. **Robust SQLite Persistence & Local Sync**:
   - Dual-layer persistence: immediate responsive client `localStorage` with asynchronous SQLite synchronization via FastAPI.

---

## 📐 Project Architecture

```
BreatheWise-AI/
├── frontend/                          # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/                # AppLayout, Sidebar (collapsible), Header
│   │   │   ├── common/                # AQICard, PollutantGrid, Toast
│   │   │   └── charts/                # TrendChart (Recharts), ComparisonChart, StationMap
│   │   ├── context/                   # AppContext (global state), ThemeContext (theme engine)
│   │   ├── constants/                 # Mock benchmarks, navigation routes, cities
│   │   ├── pages/                     # 8 Complete Page Views
│   │   ├── services/                  # api.ts (Backend & Open-Meteo client), storage.ts (localStorage)
│   │   ├── types/                     # Clean TypeScript definitions
│   │   ├── App.tsx                    # React Router configuration
│   │   ├── index.css                  # Tailored styles preserving original CSS variables
│   │   └── main.tsx                   # React 18 DOM root
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                           # Python 3.14 + FastAPI + SQLite
│   ├── app/
│   │   ├── api/                       # API Routers (/air-quality, /chat, /planner, /community, /settings)
│   │   ├── core/                      # config.py (Pydantic Settings), database.py (SQLAlchemy SQLite)
│   │   ├── models/                    # db_models.py (SQLite Tables), schemas.py (Pydantic Schemas)
│   │   ├── services/                  # aqi_service.py (Open-Meteo & NAQI math), ai_service.py (Gemini 2.5 Flash)
│   │   └── main.py                    # FastAPI application entrypoint with CORS & Lifespan
│   ├── tests/                         # Automated pytest test suite (100% passing)
│   ├── requirements.txt
│   ├── run.py                         # Backend runner script
│   ├── .env.example
│   └── .env
├── legacy-prototype/                  # Preserved original Claude Artifact prototype
├── run-backend.bat                    # 1-click Windows runner for Backend
├── run-frontend.bat                   # 1-click Windows runner for Frontend
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ or v24+) & **npm**
- **Python** (3.10+ or 3.14+) with `pip`

---

### Step 1: Backend Setup & Execution

1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   py -m pip install -r requirements.txt
   ```
3. (Optional) Configure Gemini API Key in `backend/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   > *Note: If no API key is set, the application automatically uses its built-in contextual fallback engine. It never crashes and clearly identifies the engine used.*
4. Start the backend:
   ```bash
   py run.py
   ```
   *The backend will run on `http://127.0.0.1:8000`. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.*

---

### Step 2: Frontend Setup & Execution

1. Open a new terminal in `frontend/`:
   ```bash
   cd frontend
   ```
2. Install frontend packages:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

> **Windows 1-Click Launchers**: You can also simply double-click `run-backend.bat` and `run-frontend.bat` from the root directory!

---

## 🧪 Testing & Verification

Run the automated backend test suite:
```bash
cd backend
py -m pytest tests/test_api.py -v
```
All 6 tests cover health checks, live Open-Meteo air quality queries, Gemini chat generation, task toggling, and SQLite persistence.

Run frontend production compilation check:
```bash
cd frontend
npm run build
```
Generates an optimized, typesafe production bundle in `frontend/dist/`.

---

## 🔬 Scientific & Environmental Methodology

### Indian National Air Quality Index (CPCB Standard)
The sub-index $I$ for a pollutant concentration $C$ within concentration breakpoints $[B_{low}, B_{high}]$ and index breakpoints $[I_{low}, I_{high}]$ is evaluated via:
$$I = I_{low} + \frac{I_{high} - I_{low}}{B_{high} - B_{low}} \times (C - B_{low})$$
The primary NAQI is computed as the maximum particulate sub-index ($PM_{2.5}$ and $PM_{10}$).

### Carbon Abatement Factors
- **Public Transit (Metro / Bus)**: $\approx 1.8\text{ kg } CO_2e$ per 15 km passenger trip avoided.
- **Short-distance Active Transit (Walking / Cycling)**: $\approx 0.4\text{ kg } CO_2e$ per 2 km trip avoided.
- **Carpooling**: $\approx 1.0\text{ kg } CO_2e$ per shared 15 km commute.
- **Standby Elimination**: $\approx 0.3\text{ kg } CO_2e$ per household night.
- **Cooking Efficiency (Induction / Closed Lids)**: $\approx 0.6\text{ kg } CO_2e$ per household day.

---

## 🛡️ Security, Privacy & Reliability

- **No Secrets Exposed**: Gemini API credentials remain exclusively on the server in `.env`.
- **CORS Restricted**: Backend CORS strictly permits configured frontend hosts.
- **Input Validation**: Robust Pydantic model schemas validate bounds (e.g. household size 1–20, query length limits, and email formatting).
- **Graceful Degradation**: If external APIs fail or are unreachable, clear benchmark indicators prevent user confusion without breaking the interface.

---

## 📜 Competition Compliance
*Developed for **Hack2Skill PromptWars Challenge 6**.*
*Preserves 100% of original UI layout and features while upgrading to an enterprise-grade full-stack architecture.*
