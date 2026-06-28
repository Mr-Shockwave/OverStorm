# OverStorm Risk Intelligence Engine

Internal reference for the proprietary Risk and Revenue models used in demos.

## Risk Model

**Name:** OverStorm Proprietary Risk Model  
**Not a FEMA formula.** This is a transparent weighted scoring framework for demo and sales intelligence — not an official hazard certification.

### Formula

```
Risk Score = round(
  Coastal Exposure       × 30% +
  Flood Zone Severity    × 25% +
  Elevation Risk         × 20% +
  Storm Path Proximity   × 15% +
  Asset Vulnerability    × 10%
)
```

Each factor is scored 0–100 based on asset geography, storm replay context, and building profile.

### Data Sources

| Factor | Inputs |
|--------|--------|
| Coastal Exposure | Atlantic barrier-island position, Collins Ave oceanfront vs bay-side |
| Flood Zone Severity | Miami-Dade coastal AE surge mapping references (public FEMA zone context — not a FEMA score) |
| Elevation Risk | Barrier island elevation (~3–10 ft), surge inundation susceptibility |
| Storm Path Proximity | Hurricane Milton (2024) historical replay — South Florida regional impact envelope |
| Asset Vulnerability | Building year, hospitality footprint, asset type (resort vs hotel) |

### Assumptions

- Scores are static for the Miami Beach demo asset set (`convex/assetData.ts`).
- Milton replay uses October 2024 historical track — no live weather APIs.
- Component scores are analyst-calibrated to reflect known coastal geography, not field inspections.

### Implementation

- Engine: `convex/services/riskIntelligence.ts`
- Per-asset inputs: `convex/assetData.ts` → `riskBreakdown`
- Stored on opportunities: `riskBreakdown`, `whyAtRisk`, `riskScore`

---

## Revenue Opportunity Model

**Label:** OverStorm Predicted Revenue Opportunity  
**Not a real-world damage estimate.** Model output for pipeline prioritization only.

### Formula

```
Predicted Revenue = (Risk Score ÷ 100) × Asset Value Factor × Repair Complexity Factor × Base Scale
```

Default `Base Scale` = **$100,000**

### Factors

| Factor | Meaning |
|--------|---------|
| Risk Score | Composite output from Risk Model |
| Asset Value Factor | Hospitality scale proxy (resort 2.2, luxury 2.0, hotel ~1.8) |
| Repair Complexity Factor | Building age and operational complexity multiplier |

### Assumptions

- Factors are calibrated so demo assets produce judge-friendly opportunity values ($120k–$210k range).
- Revenue does not represent insured loss, FEMA claims, or verified repair quotes.
- Restoration Demand Score is derived as `Risk Score − 2` for display consistency.

### Implementation

- Computed in `buildRiskIntelligence()` alongside risk scoring
- Stored: `expectedRevenue`, `revenueExplanation`, `revenueModel` on opportunities

---

## UI Surfaces

| Location | Feature |
|----------|---------|
| Property drawer | Risk Intelligence panel — breakdown + methodology |
| Dashboard table | Risk / Restoration / Predicted Revenue columns |
| Map popup | Risk score + predicted revenue labels |

---

## Migrations

Patch existing opportunities with model data:

```bash
npx convex run seed:syncCoastalAssetMetadata
```

Full asset replace (clears discovery/enrichment):

```bash
npx convex run seed:patchRealAssets
```
