# Nour v0.4.1 — Mobile Build Stabilization

## Summary
This release keeps the v0.4.0 mobile-first UX work while restoring stability and architecture protections from v0.3.1 that were lost during the mobile patch.

## Restored
- Save error handling for local storage writes
- Clear-data confirmation dialog
- `crypto.randomUUID()` with fallback ID generation
- Entry migration/schema scaffolding
- Active tracker registry with V1 field flags
- Feature flag scaffold for future backdating restriction
- Chart date generation using a current-day state instead of hidden `todayISO()` calls
- User-controlled notes inclusion for exports
- External `App.css` stylesheet instead of injected JSX styles

## Fixed
- Composite calculation now uses only active V1 fields
- Clear-data menu label changed from “Clear demo data” to “Clear all local data”
- Day 1 animation is treated as a one-time local experience instead of replaying on every page load
- Duplicate injected style blocks removed
- Check-in CTA now opens the current-day draft directly

## Preserved
- Mobile-first responsive layout
- Irish Glade palette
- Hamburger menu structure
- Graph-first home layout
- Prominent pre-check-in CTA and muted post-check-in state
- Day 1 compass graph moment
- CSV QA tooling
- Local-first privacy model
