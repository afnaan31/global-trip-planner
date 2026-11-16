# Roamora — International Trip Planner

Roamora is an early installable web-app prototype for planning trips and building transparent travel-budget estimates.

## Current features
- Trip inputs for origin, destination, duration, travellers and Budget / Premium / Luxury travel style.
- Separate destination spending currency and traveller display currency.
- Dated reference exchange-rate conversion using Frankfurter's public API. Rates are daily reference rates, not card, cash-exchange or live trading quotes.
- Editable estimates for accommodation, food, activities, local transport, vehicle fuel, tolls and transport tickets.
- Car fuel-cost formula, 10% contingency, group total and per-person total.
- Generic day-by-day itinerary outline, copy plan and print / save as PDF.
- Installable PWA shell with a basic offline cache and responsive layout.

## Important limitations
This is a prototype, not a live travel marketplace or booking engine. Sample costs are illustrative presets, not verified prices for a specific city, date or provider. Replace them with researched local prices before relying on an estimate.

The app does not yet fetch live hotel inventory, flight fares, maps, route distances, traffic, weather, attraction opening hours or availability. Road distance must be entered by the traveller. The itinerary is a generic outline, not verified local advice.

Currency conversion can be unavailable for some pairs. If it cannot retrieve a rate, the app displays the total in the destination currency instead of inventing a conversion. Reference rates can differ from rates and fees charged by banks or card providers.

No API keys or secrets are required. Do not commit credentials or private traveller data to this repository.

## Local use
Open index.html in a browser, or serve this folder with a local static web server. Service-worker installation requires HTTPS or localhost.

## Publishing
A GitHub Actions workflow in .github/workflows/deploy-pages.yml publishes the app to GitHub Pages after pushes to main. After the first successful deployment, the expected address is https://afnaan31.github.io/global-trip-planner/. If GitHub Pages is not enabled automatically, open Settings, then Pages, and set the source to GitHub Actions.

## Roadmap
1. Validate estimates with real travellers and destinations.
2. Add verified destination datasets with sources, timestamps and a maintenance process.
3. Integrate route, maps and weather providers with documented cost limits.
4. Integrate accommodation and activity partners through compliant affiliate links.
5. Add accounts, saved trips, group collaboration and secure persistence.
6. Add AI itinerary suggestions grounded in verified destination data.
7. Add localisation, accessibility, privacy controls and production monitoring.
