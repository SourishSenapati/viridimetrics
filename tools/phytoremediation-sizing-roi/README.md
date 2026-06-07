# Soil Heavy Metal Phytoremediation Sizing & ROI Estimator (SHMPS)

SHMPS models the multi-year decontamination timeline of heavy metal contaminated soils using hyperaccumulating crops and estimates the financial Return on Investment (ROI) compared to conventional excavation.

## Scientific Context

Excavating and dumping toxic soils in landfills (dig-and-dump) is fast but extremely expensive. Phytoremediation using hyperaccumulators is a low-cost, green, in-situ alternative. SHMPS uses species bioconcentration factors (BCF) and annual biomass dry yields to calculate the number of cropping cycles required to reach safety limits, comparing project cost profiles to excavation.

## Mathematical Formulation

1. **Total Contaminated Soil Mass ($M_{soil}$, $kg$):**
   $$M_{soil} = Area_{site} \times depth_{soil} \times \rho_{soil}$$
   where:
   - $Area_{site}$ is the site size ($m^2$).
   - $depth_{soil}$ is soil depth ($m$).
   - $\rho_{soil} = 1300\text{ kg/m}^3$ (standard soil bulk density).

2. **Metal Extraction Fraction per Cycle ($F_{extract}$):**
   $$F_{extract} = \min\left(0.95, \frac{Biomass_{ha} \times Area_{ha} \times BCF}{M_{soil}}\right)$$
   where:
   - $Biomass_{ha}$ is dry biomass yield ($kg/ha/cycle$).
   - $Area_{ha}$ is site area in hectares ($Area_{site} / 10000$).
   - $BCF$ is the plant-to-soil bioconcentration factor (concentration in foliar dry matter divided by soil concentration).

3. **Remediation Cycles/Years Required ($N$):**
   $$N = \left\lceil \frac{\ln(C_{target} / C_{init})}{\ln(1 - F_{extract})} \right\rceil$$
   where $C_{init}$ is initial soil metal level ($mg/kg$) and $C_{target}$ is regulatory safety threshold ($mg/kg$).

4. **Total Phytoremediation Cost ($Cost_{phyto}$, $\$$):**
   $$Cost_{phyto} = Area_{ha} \times Cost_{cycle} \times N$$
   where $Cost_{cycle}$ is planting, harvesting, and ash disposal cost per hectare per cycle.

5. **Excavation Cost ($Cost_{excav}$, $\$$):**
   $$Cost_{excav} = \left(\frac{M_{soil}}{1000}\right) \times Cost_{ton}$$
   where $Cost_{ton} = \$140/\text{ton}$ (standard excavation, transport, dumping, and backfilling fee).

6. **Financial Savings:**
   $$\text{Savings} = Cost_{excav} - Cost_{phyto}$$
   $$\text{Savings Percent} = \frac{\text{Savings}}{Cost_{excav}} \times 100$$

### Feasibility Ratings
- $N > 25\text{ cycles}$: Phyto Not Recommended / Timeline Too Long
- $10 < N \le 25\text{ cycles}$: Phyto Conditionally Feasible (low-cost holding strategy)
- $N \le 10\text{ cycles}$: Phyto Highly Feasible (highly recommended)

## Usage

### Interactive Mode
```bash
node tools/shmps/index.js --interactive
```

### Batch Mode
```bash
node tools/shmps/index.js --species ficus_religiosa --soil-init 150 --soil-target 15 --area 5000
```

### Command Options
- `--list-species`: Catalog species keys.
- `--species, -s <key>`: Target plant species.
- `--soil-init <num>`: Initial soil concentration ($mg/kg$).
- `--soil-target <num>`: Regulatory safety limit ($mg/kg$).
- `--area <num>`: Polluted site area ($m^2$).
- `--depth <num>`: Contaminated depth ($m$).
- `--cost <num>`: Phyto cycle cost per hectare ($\$$).
