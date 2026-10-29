# Saltwell Embarques – source code

Single-page web app used by Saltwell SpA to manage container shipments (orders, bookings, bills of lading, export documents, controls and reports).

It is hosted as a **Claude artifact** on claude.ai:
https://claude.ai/artifact/WvPkA3u36i5wCLYcF3zRMi

## Files

| File | Purpose |
|---|---|
| `index.html` | Page shell, CSS (light/dark themes), navigation, script includes |
| `app.js` | Application logic: data model, views (home, shipments, imports, bookings, BL, controls, reports, master data, settings), validations, emails, AI review/assistant |
| `parser.js` | Positional PDF text parsers: SAP Business One PO/SO, carrier booking confirmations, bills of lading (draft/final) |
| `docs.js` | PDF document generation with jsPDF: Draft Packing List, Proforma Invoice, Packing List, ISF, Booking Request |
| `i18n.js` | UI translation layer (Spanish source → English / Swedish) |
| `icons.js` | Inline SVG icon set and automatic UI decoration |
| `brand.js` | Saltwell logo and scanned signature as base64 data URIs (used in the PDFs) |
| `seed.json` | One-time initial import of the historical `Ventas_Contenedores.xlsx` data (80 shipments + master data) |
| `lib/` | Third-party libraries, unmodified: pdf.js 3.11.174 (`pdf.min.js`, `pdf.worker.min.js`), jsPDF 2.5.1 (`jspdf.umd.min.js`) |

Loaded from cdnjs at runtime (not bundled): SheetJS xlsx 0.18.5 (Excel export) and JSZip 3.10.1 (zip / .eml download).

## Runtime dependencies (claude.ai artifact platform)

The page runs inside claude.ai and uses the platform's capability API through `window.claude.use(name)`:

- `db` – shared document database (collections `shipments`, `bookings`, `bls`, `feedback`, docs `config/masters`, `config/settings`, `config/seed`; per-user prefs under `data/users/<id>/prefs`).
- `user` – current user id / name and write permission.
- `assets` – storage of uploaded PDFs (served at `/_blob/<id>`).
- `downloads` – saving generated files (PDF, XLSX, ZIP).
- `sample` – calls to Claude for AI reading of non-SAP PDFs, "Review with Claude" and the assistant (uses each viewer's own Claude account).

Outside claude.ai these capabilities are not available: the page loads but shows a notice that the database only works inside Claude. To self-host, those five calls would need to be replaced by an own backend (e.g. a REST API + database + file storage) and an LLM API for the AI features. All business logic, parsers and document generation are plain client-side JavaScript and can be reused as-is.

## Data

Business data is not in this package except the initial `seed.json`. The live data lives in the artifact's database on claude.ai and can be exported to Excel from the Reports page (same columns as the original Ventas sheet).

## Notes

- No build step: plain ES2019 JavaScript, no framework.
- `brand.js` contains a scanned signature image; handle accordingly.
