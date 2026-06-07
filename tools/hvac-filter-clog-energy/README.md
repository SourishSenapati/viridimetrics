# HVAC Filter Clogging & Fan Power Energy Predictor (HFCFPEP)

HFCFPEP models particulate matter loading on commercial HVAC air filters, predicts filter cake pressure resistance build-up, and estimates the resulting fan power energy draw overheads.

## Scientific Context

Just as airborne dust blocks stomatal leaf pores and suppresses transpiration in plants, particulate matter deposits on building ventilation filters to form a dust cake. This cake increases system aerodynamic resistance, forcing the blower fans to draw more electricity. HFCFPEP simulates this non-linear clogging kinetics to optimize building HVAC maintenance schedules.

## Mathematical Formulation

1. **Cumulative Filter Dust Cake ($M_{dust}$, $mg$):**
   $$M_{dust} = C_{PM} \times Q_{flow} \times t \times 10^{-3}$$
   where:
   - $C_{PM}$ is ambient PM concentration ($\mu g/m^3$).
   - $Q_{flow}$ is HVAC airflow ($m^3/h$).
   - $t$ is runtime in hours.

2. **Filter Clogging Fraction ($C_{clog}$):**
   $$C_{clog} = 1 - e^{-\delta \times M_{dust} \times 10^{-5}}$$
   where $\delta$ is the dust cake compaction factor ($mg^{-1}$).

3. **Clogged Pressure Drop ($dP_{clogged}$, $Pa$):**
   $$dP_{clogged} = dP_{clean} \times (1 + 8 \times C_{clog}^2)$$
   where $dP_{clean}$ is the clean filter pressure drop ($Pa$).

4. **Fan Power Increase ($\Delta W$, $Watts$):**
   $$\Delta W = W_{clean} \times \left(\frac{dP_{clogged}}{dP_{clean}} - 1\right)$$
   where $W_{clean}$ is the clean fan operating power ($Watts$).

5. **Excess Energy Overhead ($E_{overhead}$, $kWh$):**
   $$E_{overhead} = \frac{\Delta W \times t}{1000}$$

### Filter Grade Parameters
- **MERV 8 (Coarse Pre-filter)**: $dP_{clean} = 70\text{ Pa}$, $\delta = 0.8\text{ mg}^{-1}$, $W_{clean} = 400\text{ W}$
- **MERV 13 (Medium Efficiency)**: $dP_{clean} = 120\text{ Pa}$, $\delta = 1.5\text{ mg}^{-1}$, $W_{clean} = 600\text{ W}$
- **HEPA H13 (Absolute Cleanroom)**: $dP_{clean} = 250\text{ Pa}$, $\delta = 3.5\text{ mg}^{-1}$, $W_{clean} = 1200\text{ W}$

### Maintenance Status Classes
- $C_{clog} \ge 50\%$: Critical Pressure Resistance / Replace Filter
- $15\% \le C_{clog} < 50\%$: Elevated Cake Dust Level / Schedule Service
- $C_{clog} < 15\%$: Optimal Pressure Balance

## Usage

### Interactive Mode
```bash
node tools/hfcfpep/index.js --interactive
```

### Batch Mode
```bash
node tools/hfcfpep/index.js --filter merv13 --pm 100 --flow 2000 --hours 240
```

### Command Options
- `--filter <key>`: Grade ('merv8', 'merv13', 'hepa').
- `--pm <num>`: PM concentration ($\mu g/m^3$).
- `--flow <num>`: HVAC airflow ($m^3/h$).
- `--hours <num>`: Blower operational hours.
