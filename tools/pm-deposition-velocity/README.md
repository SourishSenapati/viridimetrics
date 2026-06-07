# Canopy Deposition Velocity & Plume Mitigation Simulator (CDVPMS)

CDVPMS models particulate matter ($PM_{10}$, $PM_{2.5}$, $PM_{0.2}$) dry deposition velocity onto a vegetation canopy, computes the gravimetric mass of PM scrubbed from passing air, and simulates downwind plume reduction.

## Scientific Context

Roadside vegetation acts as a passive filter blocking vehicle particulate exhaust. CDVPMS simulates aerodynamic and boundary layer deposition kinetics ($V_d$), scaling them based on local wind speeds, canopy Leaf Area Index (LAI), leaf pubescence (hairs), and particulate size fractions. It also uses a Gaussian-like box model to estimate downwind concentration reduction.

## Mathematical Formulation

1. **Dry Deposition Velocity ($V_d$, $cm/s$):**
   $$V_d = V_{d,base} \times LAI \times \left(\frac{u}{u_0}\right) \times (1 + P_{factor})$$
   where:
   - $u_0 = 2.0\text{ m/s}$ (reference wind velocity).
   - $u$ is the local wind speed ($m/s$).
   - $P_{factor}$ is the pubescence multiplier ($0.45$ if leaves are hairy/pubescent, $0.0$ if smooth).
   - $V_{d,base}$ is the reference deposition velocity at $u_0 = 2.0\text{ m/s}$:
     - **Coarse ($PM_{10}$)**: $0.64\text{ cm/s}$ (capped at $6.0\text{ cm/s}$)
     - **Fine ($PM_{2.5}$)**: $0.16\text{ cm/s}$ (capped at $2.5\text{ cm/s}$)
     - **Ultrafine ($PM_{0.2}$)**: $0.04\text{ cm/s}$ (capped at $1.0\text{ cm/s}$)

2. **Particulate Deposition Flux ($F$, $\mu g/m^2 \cdot s$):**
   $$F = V_d \times C_{ambient} \times 10^{-2}$$
   where $C_{ambient}$ is ambient concentration ($\mu g/m^3$).

3. **Total PM Mass Removed ($M$, grams):**
   $$M = F \times A_{canopy} \times t \times 10^{-6}$$
   where $A_{canopy}$ is canopy cover area ($m^2$) and $t$ is exposure time in seconds.

4. **Downwind Plume Concentration ($C_{downwind}$, $\mu g/m^3$):**
   $$C_{downwind} = C_{ambient} \times e^{-\frac{V_{d,m/s} \times LAI \times W}{H \times u}}$$
   where:
   - $W$ is the greenbelt cross-sectional width along the wind vector ($m$).
   - $H$ is the localized mixing height above the canopy (standardized at $10.0\text{ m}$).
   - $V_{d,m/s}$ is the deposition velocity converted to $m/s$ ($V_d \times 10^{-2}$).

## Usage

### Interactive Mode

```bash
node tools/cdvpms/index.js --interactive
```

### Batch Mode

```bash
node tools/cdvpms/index.js --species pinus_sylvestris --pm pm25 --wind 3.0 --ambient 80
```

### Command Options

- `--list-species`: Catalog species keys.
- `--species, -s <key>`: Target plant species.
- `--pm <key>`: PM fraction: 'pm10', 'pm25', 'pm02'.
- `--wind <num>`: Wind velocity ($m/s$).
- `--lai <num>`: Leaf Area Index.
- `--ambient <num>`: PM concentration ($\mu g/m^3$).
- `--area <num>`: Canopy area ($m^2$).
- `--hours <num>`: Duration (hours).
- `--width <num>`: Greenbelt width ($m$).
