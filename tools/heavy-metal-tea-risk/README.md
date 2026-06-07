# Heavy Metal Translocation & Dietary Exposure Modeler (HM-DETM)

HM-DETM models the transfer of heavy metals from contaminated soils into the foliage of vascular plants, and computes the toxicological risk to humans who consume infusions (herbal teas) made from these leaves.

## Scientific Context

Vascular plants absorb heavy metals (like Lead, Cadmium, Chromium, Nickel, Copper, and Zinc) from urban soils and translocate them to their aerial parts (foliage and flowers). Harvesting these leaves for herbal steeps poses chronic health risks. HM-DETM simulates how easily metals dissolve during brewing and computes the Hazard Quotient (HQ) to grade consumer exposure safety.

## Mathematical Formulation

1. **Soil-to-Leaf Translocation Factor ($TF$):**
   $$TF = \frac{C_{leaf}}{C_{soil}}$$
   where $C_{leaf}$ is the foliar dry weight concentration ($mg/kg$) and $C_{soil}$ is the soil concentration ($mg/kg$). A $TF > 1.0$ designates a hyperaccumulator.

2. **Daily Intake of Metal ($DIM$, $mg/kg \cdot day^{-1}$):**
   $$DIM = \frac{C_{leaf} \times W_{leaf} \times \eta \times V_{intake}}{10^5 \times V_{water} \times BW}$$
   where:
   - $W_{leaf}$ is dry leaf mass steeped ($g$).
   - $\eta$ is transfer/extraction rate ($0.0\%$ to $100.0\%$).
   - $V_{intake}$ is daily tea consumed ($L$).
   - $V_{water}$ is steep preparation volume ($L$).
   - $BW$ is consumer body weight ($kg$).

3. **Hazard Quotient ($HQ$):**
   $$HQ = \frac{DIM}{RfD}$$
   where $RfD$ represents the EPA Oral Reference Dose ($mg/kg \cdot day^{-1}$):
   - **Lead (Pb)**: $0.0035$
   - **Cadmium (Cd)**: $0.0005$
   - **Chromium (Cr)**: $0.0030$
   - **Nickel (Ni)**: $0.0200$
   - **Copper (Cu)**: $0.0400$
   - **Zinc (Zn)**: $0.3000$

### Risk Classes
- $HQ \ge 1.0$: Toxic Ingestion Hazard (chronic health risks)
- $0.2 \le HQ < 1.0$: Elevated Risk (requires monitoring)
- $HQ < 0.2$: Safe

## Usage

### Interactive Mode
```bash
node tools/hm_detm/index.js --interactive
```

### Batch Mode
```bash
node tools/hm_detm/index.js --species tilia_cordata --metal lead --soil-conc 120 --leaf-weight 2.5
```

### Command Options
- `--list-species`: Catalog species keys.
- `--species, -s <key>`: Select target species.
- `--metal <key>`: Select metal type.
- `--soil-conc <num>`: Soil level ($mg/kg$).
- `--leaf-weight <num>`: Mass steeped ($g$).
- `--water-vol <num>`: Steep water volume ($L$).
- `--daily-intake <num>`: Consumed volume ($L$).
- `--body-weight <num>`: Weight ($kg$).
