# Nour v0.4.0 Mobile First Patch

## Primary change
Reworked the prototype toward a mobile-first layout instead of a desktop layout squeezed into a phone viewport.

## Included
- Irish Glade design tokens applied through the main embedded style layer
- Centered mobile header and tagline
- Hamburger menu for secondary actions
- Export PDF and clear demo data moved into the menu
- Graph placed first on the home screen
- Chart controls moved below the chart
- Range controls placed below the chart
- Large pre-check-in CTA
- Muted post-check-in CTA state
- Responsive vertical stacking for mobile
- Phone-friendly spacing, card sizing, typography, buttons, and sliders
- Sticky bottom step navigation for the check-in flow
- One-question-per-screen check-in flow preserved
- Special Day 1 marker state using a subtle compass animation and text: "Day 1. Start of my journey."
- Reduced-motion support for users who prefer less animation
- Kept local-first data model and schemaVersion field intact

## Preserved
- Local-only storage
- CSV/data model compatibility assumptions
- Existing check-in fields, tags, notes, export report generation, and chart data logic
- No AI insights, diagnosis, prediction, or interpretation

## Build verification
`npm run build` completed successfully after refreshing dependencies in the working copy.
