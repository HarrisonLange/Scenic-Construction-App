# Teacher guide source

Builds `../SDSCPA-Virtual-Labs-Teacher-Guide.docx`.

- `make-guide.js` — generates the .docx (all guide text lives here). Run with
  `npm install docx` then `node make-guide.js`. It reads screenshots from `shots/`
  and writes the .docx to the repo root (edit the output path at the bottom if needed).
- `shots/` — screenshots of each lab "working", embedded in the guide.
- `capture.js` / `capture-fix.js` — Playwright scripts that produced `shots/`.
  They expect the site served at `http://localhost:8099` (e.g. `python -m http.server 8099`
  from the repo root) and a local Chrome; run with `npm install playwright-core`,
  `node capture.js`. Re-run after UI changes so the guide's screenshots stay current.

Standards citations in the guide reference the California CTE Model Curriculum
Standards, Arts, Entertainment & Design career cluster — Performance, Music, &
Live Entertainment pathway, Stage & Event Technology focus area (ST.17.x–ST.20.x).
