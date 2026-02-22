# Phase 6: UI and Visualization (Reconciled)

_Last reconciled: February 22, 2026._

## Primary UI Components

- Calculator route and state: `src/routes/calculator.tsx`
- Immersive results layout: `src/components/results/FullPageGlobeLayout.tsx`
- Data panel controls: `src/components/results/FloatingDataPanel.tsx`
- Enhanced globe renderer: `src/components/globe/EnhancedGlobeCanvas.tsx`
- Layer implementations: `src/components/globe/layers/`
- Declination table: `src/components/calculator/DeclinationTable.tsx`
- Detailed tab content (including parans): `src/components/results/tabs/ParansTab.tsx`

## Current Notes

- Calculator flow uses the enhanced custom Three.js stack.
- Saved/shared routes are not yet fully equivalent to calculator enhanced output.
- UI behavior and performance are being iterated with emphasis on layer lifecycle correctness and rendering efficiency.
