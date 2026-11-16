# Roamora — Global Trip Planner (early prototype)

A static, responsive travel-planning prototype. The current version includes:

- Trip inputs for origin, destination, duration (1–30 days), travellers, travel style and currency.
- Editable estimates for accommodation, food, activities, local transport and main transport.
- Car fuel, vehicle efficiency, route-distance and toll calculations.
- A 10% contingency allowance and per-person total.
- A simple daily itinerary outline.
- Copy plan and print / save as PDF actions.
- Mobile-friendly layout and destination prompts.

## Important limitations

This is an early prototype, not a live travel marketplace. It does not connect to hotel inventory, live flight fares, maps, traffic, weather, booking providers or an AI model. Sample rates are illustrative placeholders and must be replaced with researched quotes before relying on an estimate. The itinerary is a generic planning outline, not verified destination advice.

No API keys or secrets are required for this prototype. Do not commit credentials to this repository.

## Run locally

Open index.html in a browser, or use a local static server.

## Deploy on Netlify

The site is static and the publish directory is the repository root. Connect the GitHub repository to Netlify and use the main branch. The included netlify.toml contains the basic publish configuration.

## Next development milestones

1. Validate the planner with real travellers.
2. Add verified destination and supplier data with update timestamps.
3. Add maps and route data through an approved provider.
4. Add legitimate accommodation and activity affiliate / booking integrations.
5. Add a backend for accounts, saved trips and synchronised data.
6. Add AI trip generation with verified source data and clear price freshness.
