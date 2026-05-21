## Goal

Strengthen ServeSmart as a Product Development & Management course deliverable by adding real, interactive functionality that demonstrates engineering depth — beyond the existing single-snapshot M/M/c calculator.

## Proposed feature additions

### 1. Scenario comparison (side-by-side what-if)
In the Demo Dashboard, let users save up to 3 named scenarios (e.g. "Current", "+1 server", "Peak hour") and compare their KPIs (ρ, Wq, Lq, P(wait), cost proxy) in a single comparison table + grouped bar chart. Great for showing decision-support value.

### 2. Time-of-day arrival profile (non-stationary demand)
Add an hourly arrival-rate profile (24 sliders or a preset like "hospital morning peak", "bank lunch rush"). Run M/M/c per hour and visualize:
- Hourly waiting time line chart
- Hourly utilization heat strip
- Recommended servers per hour (staffing schedule)

This addresses a real limitation of plain M/M/c and looks impressive academically.

### 3. Monte Carlo simulation module
A second analysis tab that simulates N customers with exponential interarrival/service times and reports empirical Wq, Lq distributions (histogram) alongside the analytical M/M/c result. Validates theory vs. simulation — a classic IE coursework angle.

### 4. Cost optimization view
Inputs: server hourly cost, customer waiting cost per hour. Output: total cost curve vs. number of servers, with the economic optimum highlighted. Turns the tool from "describe" into "prescribe".

### 5. Export & shareable report
- "Export PDF report" button: generates a one-page summary (inputs, KPIs, recommendation, chart) — useful artifact for the course submission.
- "Export CSV" of the what-if table and hourly schedule.

### 6. Glossary / methodology drawer
A slide-out panel explaining λ, μ, c, ρ, Erlang-C, M/M/c assumptions, and when the model breaks down. Demonstrates academic rigor and helps non-expert graders.

### 7. Saved sessions (Lovable Cloud)
Optional: simple email login so a user can save scenarios across visits. Only worth adding if you want to show full-stack work.

## Suggested scope for this round

Recommended starter bundle (highest grade-impact, manageable scope):
1. **Scenario comparison** (#1)
2. **Hourly arrival profile + staffing schedule** (#2)
3. **Cost optimization view** (#4)
4. **Methodology drawer** (#6)

Items #3 (Monte Carlo), #5 (PDF/CSV export) and #7 (auth) can be added later if time allows.

## Technical notes

- All math stays client-side in `src/lib/` (extend `queueCalculations.ts`, add `simulation.ts`, `costModel.ts`).
- New UI lives inside `DemoDashboard.tsx` as additional tabs (shadcn `Tabs`) to avoid bloating the landing page.
- No backend required for items 1–6; #7 would use Lovable Cloud auth + a `scenarios` table with RLS.
- PDF export via `jspdf` + `html2canvas`; CSV via a small helper.

## Out of scope

- Visual redesign of existing sections
- Copy rewrites
- SEO/performance work

Tell me which items to build (or confirm the recommended bundle) and I'll start.
