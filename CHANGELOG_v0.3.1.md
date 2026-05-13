# Nour Prototype v0.3.1 — Flow Polish + Architecture Cleanup

## UX fixes
- Made the check-in date picker less prominent so it does not dominate the reflection flow.
- Added feature-flagged date restriction logic for a future 3-day backdating limit. The code is present but OFF by default.
- Kept slider neutral defaults unchanged.
- Improved skipped-field semantics with a distinct skipped-card state and clearer restore action.
- Removed the notes-export checkbox from the Notes page.
- Moved note inclusion control into the Export / QA controls area.

## Chart updates
- Renamed the chart's raw aggregate from "Composite" to "Daily Average" for warmer, clearer UI language.
- Kept "Trend Line" as the V1 name for the smoothed path.
- Continued the restrained hand-drawn/graphite chart direction.

## Slider label fix
- Reworked slider labels to share the same coordinate system as the slider track.
- Labels now live inside a shared `slider-track-wrap` and anchor at 0%, 25%, 50%, 75%, and 100%.
- This is intended to prevent label stacking, shifting, and width mismatch bugs.

## Export updates
- Export note inclusion is now selected at export time instead of during check-in.
- Export language now refers to Daily Average and Trend Line.

## Architecture / maintainability
- Added a feature flag for future backdating restriction.
- Added comments clarifying that the tracker registry is meant to support future configuration without exposing V2 configuration UI yet.
- Added CSS design tokens for future theming/style work.
- Kept QA CSV importer behavior unchanged per product decision.

## Verification
- `npm run build` passed.
- `npm run lint` passed.
