# Skin Dermal Partition & Exposure Modeler (SDPEM)

SDPEM simulates the occupational dermal uptake of volatile organic compounds (VOCs) and polycyclic aromatic hydrocarbons (PAHs) by workers in contaminated air environments, adapting organic partition modeling from cuticular leaf wax science.

## Scientific Context

Just as plant cuticular wax acts as a lipophilic sink that partitions semi-volatile contaminants from the air, human skin surface lipids partition organic compounds. This tool estimates human dermal absorption kinetics to evaluate occupational safety hazards.

## Mathematical Formulation

1. **Skin-Air Partition Coefficient ($K_{skin\_air}$):**
   $$K_{skin\_air} = 10^{0.7 \log K_{ow} - 1.5}$$
   where $K_{ow}$ is the octanol-water partition coefficient of the organic contaminant.

2. **Maximum Skin Equilibrium Capacity ($M_{max}$, $\mu g$):**
   $$M_{max} = C_{air} \times V_{lipid} \times K_{skin\_air}$$
   where:
   - $C_{air}$ is ambient air concentration ($\mu g/m^3$).
   - $V_{lipid}$ is skin lipid volume ($m^3$, converted from $mL$ using $1\text{ mL} = 10^{-6}\text{ m}^3$).

3. **Dermal Dose Absorbed ($M_{absorbed}$, $\mu g$):**
   $$M_{absorbed} = M_{max} \times (1 - e^{-k_{absorb} \times t})$$
   where $k_{absorb}$ is the physiological absorption rate ($hour^{-1}$) and $t$ is exposure time in hours.

### Compounds Profile
- **Toluene (VOC)**: $\log K_{ow} = 2.73$, $k_{absorb} = 0.25\text{ hour}^{-1}$
- **Phenanthrene (LMW PAH)**: $\log K_{ow} = 4.57$, $k_{absorb} = 0.04\text{ hour}^{-1}$
- **Benzo[a]pyrene (HMW PAH)**: $\log K_{ow} = 6.13$, $k_{absorb} = 0.01\text{ hour}^{-1}$

### Safety Alerts
- $M_{absorbed} \ge 5.0\text{ }\mu g$: Critical Skin Uptake Hazard (chemical suits/barrier creams mandatory)
- $1.0 \le M_{absorbed} < 5.0\text{ }\mu g$: Moderate Dermal Accumulation (scheduled washing advised)
- $M_{absorbed} < 1.0\text{ }\mu g$: Safe / Negligible Dermal Penetration

## Usage

### Interactive Mode
```bash
node tools/sdpem/index.js --interactive
```

### Batch Mode
```bash
node tools/sdpem/index.js --compound benzo_a_pyrene --lipid 3.0 --air 5000 --hours 8
```

### Command Options
- `--compound <key>`: Mapped contaminant ('toluene', 'phenanthrene', 'benzo_a_pyrene').
- `--lipid <num>`: Skin lipid volume ($mL$).
- `--air <num>`: Workplace air concentration ($\mu g/m^3$).
- `--hours <num>`: Shift duration (hours).
