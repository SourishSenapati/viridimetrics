# Air Pollution Tolerance Index & Anticipated Performance Index (APTI-API) Classifier

This tool provides a quantitative classification system for selecting tree and shrub species for urban forestry and roadside greenbelts. It integrates biochemical stress indicators with plant structural characteristics.

## Mathematical Formulation

### 1. Air Pollution Tolerance Index (APTI)
APTI measures the physiological tolerance of a plant to air pollution using four leaf parameters:
$$APTI = \frac{A \times (T + P) + R}{10}$$
Where:
- $A$: Ascorbic Acid content ($mg/g$ dry weight) - acts as an antioxidant.
- $T$: Total Chlorophyll content ($mg/g$ dry weight) - measures photosynthetic energy production.
- $P$: Leaf extract pH - indicates chemical buffering capacity (stabilizes gas uptake like $SO_2$).
- $R$: Relative Water Content (%) - acts as a physiological buffer against transpiration.

#### Classification Thresholds
- $APTI \ge 30$: Highly Tolerant
- $17 \le APTI < 30$: Tolerant
- $11 \le APTI < 17$: Intermediate
- $APTI < 11$: Sensitive

---

### 2. Anticipated Performance Index (API)
API combines the biochemical tolerance score with socio-economic and biological parameters to rank species for greenbelt implementation.

The total score (max 16 points) is based on:
1. **APTI Score (Max 8 pts):**
   - $APTI > 25 \to 8$ points
   - $21 \le APTI \le 25 \to 6$ points
   - $16 \le APTI < 21 \to 4$ points
   - $10 \le APTI < 16 \to 2$ points
   - $APTI < 10 \to 0$ points
2. **Growth Habit & Canopy Structure (Max 4 pts):**
   - Dense, spreading canopy $\to 4$ points
   - Open, vertical canopy $\to 2$ points
   - Shrub $\to 1$ point
3. **Foliage Seasonality (Max 2 pts):**
   - Evergreen $\to 2$ points
   - Deciduous $\to 1$ point
4. **Economic & Urban Utility (Max 2 pts):**
   - High value $\to 2$ points
   - Moderate value $\to 1$ point
   - Low value $\to 0$ points

#### Suitability Grading
- $15 \le API \le 16$: Excellent (★★★★★)
- $13 \le API \le 14$: Very Good (★★★★☆)
- $10 \le API \le 12$: Good (★★★☆☆)
- $6 \le API \le 9$: Fair (★★☆☆☆)
- $API < 6$: Poor (★☆☆☆☆)

## Usage

Run the CLI interactively:
```bash
node tools/apti_api_classifier/index.js --interactive
```

Run for a specific species:
```bash
node tools/apti_api_classifier/index.js --species ficus_religiosa
```
