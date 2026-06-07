# Urban Green Wall Evapotranspirational Cooling & Building HVAC Offset Calculator (GWECB)

GWECB models the daily volume of water transpired by vertical green walls, calculates the latent heat and solar shading thermal cooling offsets, and estimates the building HVAC electrical utility cost and carbon emissions savings.

## Scientific Context

Vertical green walls provide microclimatic cooling through plant transpiration and reduce building solar heat gains by shading exterior walls. This tool computes the daily transpired water volume, the corresponding cooling energy offset, the reduction in building HVAC electricity draw, electricity bill savings, and carbon emissions mitigation.

## Mathematical Formulation

1. **Daily Transpired Water Volume ($V_{transp}$, $L$):**
   $$V_{transp} = Area_{wall} \times LAI \times Rate_{transp}$$
   where:
   - $Area_{wall}$ is the green wall surface area ($m^2$).
   - $LAI$ is Leaf Area Index of green wall canopy.
   - $Rate_{transp}$ is the transpiration rate per unit leaf area ($L/m^2\cdot day$).

2. **Latent Cooling Energy Offset ($E_{latent}$, $kWh$):**
   $$E_{latent} = V_{transp} \times \lambda_{vap} \times 0.277778$$
   where $\lambda_{vap} = 2.45\text{ MJ/L}$ is the latent heat of vaporization of water at 25°C, and $0.277778$ converts $MJ$ to $kWh$.

3. **Shading Cooling Energy Offset ($E_{shading}$, $kWh$):**
   $$E_{shading} = Area_{wall} \times BaseSolarLoad \times \left(\frac{Reduction\%}{100}\right)$$
   where $BaseSolarLoad = 4.0\text{ kWh/m}^2\cdot day$ is the base solar heat load on bare masonry walls, and $Reduction\%$ is the percentage of solar load blocked.

4. **Building HVAC Electricity Savings ($E_{saved}$, $kWh$):**
   $$E_{saved} = \frac{E_{latent} + E_{shading}}{COP}$$
   where $COP$ is the Coefficient of Performance of the HVAC system.

5. **Monetary and Carbon Offsets:**
   $$\text{Daily Financial Savings} = E_{saved} \times Cost_{electricity}$$
   $$\text{Daily CO2 Mitigated (kg)} = E_{saved} \times 0.38$$
   where $0.38\text{ kg CO2/kWh}$ is the standard grid power emission factor.

### Performance Classes
- $E_{saved} \ge 30.0\text{ kWh/day}$: Exceptional Cooling Offset (APEX ENERGY SAVING INFRASTRUCTURE)
- $5.0 \le E_{saved} < 30.0\text{ kWh/day}$: High Cooling Offset (EFFICIENT GREEN WALL THERMAL BARRIER)
- $E_{saved} < 5.0\text{ kWh/day}$: Low Cooling Offset (NEGLIGIBLE THERMAL IMPACT)

## Usage

### Interactive Mode
```bash
node tools/gwecb/index.js --interactive
```

### Batch Mode
```bash
node tools/gwecb/index.js --species hedera_helix --area 150 --lai 4.0 --cop 3.0 --elec 0.15 --reduction 30
```

### Command Options
- `--list-species`: Catalog species keys.
- `--species, -s <key>`: Target plant species.
- `--area <num>`: Wall surface area ($m^2$).
- `--lai <num>`: Leaf Area Index.
- `--cop <num>`: HVAC COP coefficient.
- `--elec <num>`: Electricity rate ($\$/kWh$).
- `--reduction <num>`: Shading solar load block percentage ($0.0$ to $100.0$).
