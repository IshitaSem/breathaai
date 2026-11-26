# BreatheWise AI – Urban Air Quality Assistant

Hack2Skill PromptWars Challenge 6. Plain HTML, CSS and JavaScript. No build step, no dependencies, no network calls.
All air quality values are **demo data**, not live readings.

## Folder structure
```
breathewise-ai/
├── index.html                  App shell (links the CSS and JS)
├── css/styles.css              All styling, light/dark themes, responsive rules
├── js/app.js                   Demo data, demo AI provider, charts, icons, 8 pages, actions
├── standalone/breathewise-ai.html   Same app as one self-contained file (identical to the published Artifact)
└── README.md
```
Icons and charts are inline SVG generated in `js/app.js`, so there are no image assets.

## Run on Windows with VS Code
**Option A – quickest:** double-click `index.html` (or `standalone/breathewise-ai.html`). It runs from `file://`.

**Option B – Live Server (recommended):**
1. Install VS Code, then the extension **Live Server** (Ritwick Dey).
2. File > Open Folder > select `breathewise-ai`.
3. Right-click `index.html` > **Open with Live Server**.

**Option C – terminal:**
```
cd breathewise-ai
python -m http.server 5173
```
Open http://localhost:5173

## Pages
Overview, Air Quality Monitor, AI Air Assistant, Daily Action Planner, Indoor Air Care, Explore Greener Choices, Community Impact, Settings (hash routes: `#overview`, `#monitor`, `#assistant`, `#planner`, `#indoor`, `#greener`, `#community`, `#settings`).

## Persistence
Settings, chat history, planner checkboxes, joined challenges, sidebar state and theme are stored in `localStorage` under the key `bw`. Clear it in DevTools > Application > Local Storage to reset.
Note: localStorage is per origin, so data saved at `file://` and at `localhost` is separate.

## Connecting a real GenAI backend later
In `js/app.js`, `demoProvider` is the AI adapter (`AI = demoProvider`). Replace it with an object whose `ask(question, ctx)` calls your FastAPI endpoint (for example `POST /api/chat`) and returns `{t: string, cards: [[title, why], ...]}`. Keep API keys on the server, never in this frontend.
