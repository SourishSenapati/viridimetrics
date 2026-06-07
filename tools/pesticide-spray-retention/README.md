# Agricultural Pesticide Spray Retention & Washoff Modeler (APSRWM)

APSRWM models agricultural pesticide spray retention, crop cuticular absorption, and rain-induced wash-off, calculating toxic soil runoff rates and recommending eco-toxicological mitigation.

## Scientific Context

In farming, crop sprays are lost when rainfall washes pesticide ingredients off leaves and into localized soils. This tool adapts rainfall wash-off kinetics from plant biomonitoring to compute pesticide canopy retention, scaling by crop wax profiles and modeling rain-fastening adjuvants to optimize agricultural efficiency and reduce environmental contamination.

## Mathematical Formulation

1. **Intercepted Foliar Mass ($M_{foliar}$, $mg$):**
   $$M_{foliar} = C_{spray} \times V_{spray} \times Adhesion_{crop}$$
   where:
   - $C_{spray}$ is spray active ingredient concentration ($mg/L$).
   - $V_{spray}$ is applied volume ($L$).
   - $Adhesion_{crop}$ is the crop-specific leaf adhesion coefficient ($0.0$ to $1.0$).

2. **Wash-off Fraction ($F_{washoff}$):**
   $$F_{washoff} = 1 - e^{-\beta_{wash} \times Rainfall \times Adjuvant_{factor}}$$
   where:
   - $\beta_{wash}$ is the crop wash-off rate constant ($mm^{-1}$).
   - $Rainfall$ is the precipitated rain volume ($mm$).
   - $Adjuvant_{factor}$ scales from $1.0$ (no adjuvant) down to $0.25$ (rain-fast stickers).

3. **Leached to Soil ($M_{leached}$, $mg$):**
   $$M_{leached} = M_{foliar} \times F_{washoff}$$

4. **Retained on Crop ($M_{retained}$, $mg$):**
   $$M_{retained} = M_{foliar} \times (1 - F_{washoff})$$

### Crop Profiles
- **Broadleaf Crop (Soybean)**: $Adhesion = 0.70$, $\beta_{wash} = 0.08\text{ mm}^{-1}$
- **Waxy Crop (Cabbage)**: $Adhesion = 0.40$, $\beta_{wash} = 0.12\text{ mm}^{-1}$ (lower adhesion due to superhydrophobicity, fast wash-off)
- **Coniferous Orchard (Citrus)**: $Adhesion = 0.85$, $\beta_{wash} = 0.05\text{ mm}^{-1}$

### Adjuvant Modifiers
- **None**: $Adjuvant_{factor} = 1.0$
- **Surfactant**: $Adjuvant_{factor} = 0.6$ (reduces wash-off rate)
- **Sticker**: $Adjuvant_{factor} = 0.25$ (highly rain-fast formulation)

### Eco-Toxicological Safety Levels
- $M_{leached} \ge 100.0\text{ mg}$: Critical Eco-Toxic Soil Runoff (high aquatic contamination risk)
- $25.0 \le M_{leached} < 100.0\text{ mg}$: Elevated Soil Leaching (elevated crop protection loss)
- $M_{leached} < 25.0\text{ mg}$: Safe Runoff

## Usage

### Interactive Mode
```bash
node tools/apsrwm/index.js --interactive
```

### Batch Mode
```bash
node tools/apsrwm/index.js --species morus_alba --conc 200 --vol 2.0 --rain 10 --adjuvant sticker
```

### Command Options
- `--list-species`: Catalog species keys.
- `--species, -s <key>`: Target plant species.
- `--conc <num>`: Pesticide spray concentration ($mg/L$).
- `--vol <num>`: Applied volume ($L$).
- `--rain <num>`: Rainfall depth ($mm$).
- `--adjuvant <key>`: Adjuvant type ('none', 'surfactant', 'sticker').
