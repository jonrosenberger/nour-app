# Nour Prototype v0.3.0 — QA Import + Stability Pass

## Naming / versioning
- Renamed package to `nour-prototype`.
- Set prototype version to `0.3.0`.
- Recommended artifact naming: `nour-prototype-v0.3.0-qa-importer.zip`.

## Added
- Testing-only CSV importer in Export / QA controls.
- Included `qa_synthetic_1_year_therapy_trend.csv` with one year of synthetic therapy-like trend data.
- Synthetic import supports Mood, Energy, Self-talk, status, notes, and source fields.
- Imported CSV entries are marked with test/import metadata where practical.

## Updated
- Renamed unclear chart terminology from “Overall path” to “Trend Line”.
- Slider labels now anchor to exact slider positions at 0%, 25%, 50%, 75%, and 100%.
- Skipped fields now have a clearer muted card state.
- “Answer this field” now has stronger visual weight than the quiet skip action.
- CSS moved out of the giant inline template string and into `src/App.css`.
- Export builder renamed from `ExportPrintable` to `buildExportHTML`.
- Package metadata updated for cleaner prototype versioning.

## Reliability / safety
- `saveEntries` now uses try/catch and returns save status.
- Save failures now show a “Save failed” button state instead of silently losing data.
- “Clear local data” now requires confirmation before deleting entries.
- IDs now use `crypto.randomUUID()` when available, with fallback.
- Added lightweight migration placeholder structure for future schema changes.

## Preserved for future
- Tags/events infrastructure remains in code but feature-flagged off for V1.
- Tracker configuration remains internal/future-proofed but not exposed in UI.
- CSV importer is for testing/QA only, not a V2 product feature.

## Verification
- `npm run lint` passes.
- `npm run build` passes.
