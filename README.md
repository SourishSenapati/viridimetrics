# ViridiMetrics

ViridiMetrics is a mathematical modeling suite and predictive engine designed for plant biomonitoring, urban greening assessment, building HVAC offset optimization, and ecotoxicological risk analysis. The platform links empirical botanical traits, such as cuticular wax density, stomatal resistance, and biochemical stress indicators, to environmental inputs to evaluate urban forestry layouts and human exposure.

The workspace contains two primary components:
1. An interactive web-based dashboard (index.html, app.js) providing real-time visualization of particulate deposition, rainfall shedding, and specific leaf area calculations.
2. A modular developer-centric calculations engine (tools/ directory) providing CLI-based batch simulations, a k-NN Retrieval-Augmented Generation (RAG) parameter estimator, and a SINDy symbolic regression solver.

---

## Terms of Use and Licensing Agreement

This repository is proprietary. It is not licensed under standard open-source agreements. By accessing, downloading, or executing this code, you agree to the following terms:

### Educational Use
Classroom instruction and unmodified educational demonstrations at accredited academic institutions are permitted without charge.

### Code Modification
Any modification of the source code, mathematical equations, or data structures—including for classroom use—requires a paid license from the author.

### Research Publications and Patents (Co-Authorship)
If this software, its algorithms, or outputs are used to compile data, charts, or conclusions for any academic paper, preprint, thesis, conference presentation, or patent, you must:
1. Contact the author to arrange collaboration.
2. Formally include Sourish Senapati as a co-author on the publication.
3. Cite the repository and primary literature sources.

Violations of these terms in published research will result in formal retraction requests sent to the relevant journal publishers (e.g., Elsevier, Springer, Nature) for copyright infringement and academic integrity violations.

### Commercial and Consulting Use
Any use of the software for commercial projects, corporate utilities, public edge deployment, or paid private consultancy (such as urban planning audits, building energy offset assessments) requires a paid Commercial License.

For licensing inquiries, contact:
Sourish Senapati (sourish.senapati@jadavpuruniversity.in)

---

## System Architecture

The project is structured as a unified monorepo:

```text
viridimetrics/
├── .gitignore                 # Excludes node_modules and vercel caches
├── index.html                 # Web dashboard entry point
├── app.js                     # Frontend interactive controller
├── styles.css                 # Custom glassmorphic styling
├── models.js                  # Central mathematical formulations module
├── LICENSE                    # Full text of the custom proprietary license
├── README.md                  # Main project repository documentation
├── package.json               # Root package dependencies
├── papers/                    # Reference literature PDFs and metadata JSONs
└── tools/                     # Modular backend CLI & calculations suite
    ├── greenbelt-suitability-index/   (APTI-API greenbelt planning model)
    ├── heavy-metal-tea-risk/          (Foliar metal translocation model)
    ├── pm-deposition-velocity/        (Canopy deposition plume model)
    ├── dermal-skin-air-partition/     (Dermal partition VOC absorption model)
    ├── pesticide-spray-retention/     (Agricultural spray retention model)
    ├── hvac-filter-clog-energy/       (HVAC filter cake clogging model)
    ├── phytoremediation-sizing-roi/   (Hyperaccumulator cleanup sizing model)
    ├── green-wall-hvac-offset/         (Vertical green wall cooling model)
    ├── licenses/                      (Commercial/Modification/Enterprise paid licenses)
    ├── cli.js                         (Command-line execution panel)
    ├── test_all_modular.js            (Automated test runner)
    ├── models.js                      (Local copy of math engine for package portability)
    └── engine.js                      (CLI calculation mapping engine)
```

---

## Mathematical Formulations

### 1. Leaf Area Parameterization & Deposition Normalization (LAPDN)

This module calculates the leaf area of samples based on shape correction factors and normalizes particulate matter (PM) mass deposition.

*   **Leaf Area Calculation:**
    $$A = L \cdot W \cdot N \cdot C_f$$
    Where:
    *   $A$ is the total leaf area ($\text{cm}^2$).
    *   $L$ is the average leaf length ($\text{cm}$).
    *   $W$ is the average leaf width ($\text{cm}$).
    *   $N$ is the total number of leaves sampled.
    *   $C_f$ is the morphology-specific correction factor:
        *   Planar (Broadleaf): $C_f = 0.78$
        *   Elliptic / Obovate: $C_f = 0.72$
        *   Lanceolate: $C_f = 0.65$
        *   Acicular (Coniferous Needles): $C_f = 0.05$

*   **Foliar PM Deposition Density:**
    $$D = \frac{(W_{\text{loaded}} - W_{\text{tare}}) \cdot 1000}{2 \cdot A}$$
    Where:
    *   $D$ is the PM deposition density ($\mu\text{g/cm}^2$).
    *   $W_{\text{loaded}}$ and $W_{\text{tare}}$ are the loaded and clean filter weights ($\text{mg}$).
    *   The factor 2 accounts for bilateral leaf deposition (adaxial and abaxial surfaces).

*   **Precipitation Wash-off Model:**
    $$D_{\text{SPM, remaining}} = D_{\text{SPM, initial}} \cdot e^{-0.05 \cdot P}$$
    $$D_{\text{washed}} = D_{\text{SPM, initial}} \cdot (1 - e^{-0.05 \cdot P})$$
    Where:
    *   $P$ is the rainfall volume ($\text{mm}$).
    *   Surface Particulate Matter (SPM) is subject to exponential wash-off, whereas Wax-embedded Particulate Matter (WPM) is shielded by cuticular lipids and remains unaffected.

---

### 2. Foliar Dust Stress & Photosynthetic Resilience (FDSPRP)

Evaluates the physiological degradation of plant monitors under dust loading.

*   **Chlorophyll Retention Fraction:**
    $$R_{\text{chl}} = e^{-k_{\text{chl}} \cdot D_{\text{dust}} \cdot \left(\frac{t_{\text{dry}}}{10}\right)}$$
    Where:
    *   $k_{\text{chl}}$ is the species decay constant (e.g., *Alstonia scholaris*: 0.45, *Ficus religiosa*: 0.08).
    *   $D_{\text{dust}}$ is the dust accumulation density ($\text{mg/cm}^2$).
    *   $t_{\text{dry}}$ is the number of dry days since the last rain.

*   **Stomatal Pore Blockage Rate:**
    $$R_{\text{stoma}} = 1 - \frac{1}{1 + b \cdot D_{\text{dust}}}$$
    Where $b$ is a species-specific clogging coefficient (e.g., *Alstonia scholaris*: 1.5, *Ficus religiosa*: 0.2).

*   **Net Photosynthetic Suppression:**
    $$S_{\text{photo}} = 1 - \left[R_{\text{chl}} \cdot (1 - R_{\text{stoma}})\right]$$

---

### 3. Leaf Litter Decomposition & Toxin Leaching (LLDTLS)

Models the chemical degradation of leaf litter and the leaching of organic toxins.

*   **Litter Decay Rate Constant:**
    $$k = k_{\text{base}} \cdot f_T \cdot f_P \cdot \left(\frac{30}{L_{\text{lignin}}}\right)$$
    Where:
    *   $k_{\text{base}} = 0.05\ \text{month}^{-1}$.
    *   $f_T = 2^{(T - 20)/10}$ (Temperature $Q_{10}$ rule).
    *   $f_P = \frac{P}{P + 50}$ (Precipitation saturation factor).
    *   $L_{\text{lignin}}$ is the lignin-to-nitrogen ratio of the litter (e.g., *Pinus sylvestris*: 45, *Fagus sylvatica*: 30).

*   **Litter Mass Remaining:**
    $$M_{\text{remaining}} = e^{-k \cdot t}$$

*   **Organic Pollutant Leaching Fraction:**
    $$F_{\text{leach}} = \min\left(1.0,\ \left(1 - e^{-k_{\text{leach}} \cdot t}\right) \cdot \left(1 + \frac{100 - M_{\text{remaining}}\%}{100}\right)\right)$$
    Where:
    *   $k_{\text{leach}}$ is the leaching constant (LMW PAH: 0.15, HMW PAH: 0.02, PCB: 0.005) scaled by $\frac{P}{P + 100}$.
    *   Carcinogenic High-Molecular Weight (HMW) PAHs and PCBs leach slowly due to high octanol-water partition coefficients ($K_{\text{ow}}$), but leaching is amplified as structural cell integrity decomposes.

*   **Runoff Toxic Equivalency (TEQ):**
    $$\text{TEQ} = (0.001 \cdot C_{\text{LMW}}) + (0.1 \cdot C_{\text{HMW}}) + (0.03 \cdot C_{\text{PCB}})$$

---

### 4. Air Pollution Tolerance Index & Anticipated Performance Classifier (EcoCanopy)

Assesses species suitability for greenbelt design.

*   **Air Pollution Tolerance Index (APTI):**
    $$\text{APTI} = \frac{A \cdot (T + P) + R}{10}$$
    Where:
    *   $A$ is ascorbic acid content ($\text{mg/g}$).
    *   $T$ is total chlorophyll ($\text{mg/g}$).
    *   $P$ is leaf extract pH.
    *   $R$ is relative water content ($\%$).

*   **Anticipated Performance Index (API):**
    Integrates APTI scores with botanical structural features (evergreen vs deciduous, canopy density, and socioeconomic value) to assign a grading score from 0 to 16.

---

### 5. Soil-to-Leaf Translocation & Dietary Exposure Risk (PhytoBrew)

Calculates the bioconcentration and risk profiles of consuming teas brewed from roadside leaves.

*   **Translocation Factor (TF):**
    $$\text{TF} = \frac{C_{\text{plant}}}{C_{\text{soil}}}$$

*   **Daily Intake of Metal (DIM):**
    $$\text{DIM} = \frac{C_{\text{leaf}} \cdot W_{\text{leaf}} \cdot E_{\text{fraction}} \cdot V_{\text{intake}}}{V_{\text{water}} \cdot \text{BW}}$$
    Where:
    *   $C_{\text{leaf}}$ is leaf metal concentration ($\text{mg/kg}$).
    *   $W_{\text{leaf}}$ is steeped leaf mass ($\text{kg}$).
    *   $E_{\text{fraction}}$ is water extraction rate ($\%$).
    *   $V_{\text{intake}}$ is daily tea volume consumed ($\text{L}$).
    *   $V_{\text{water}}$ is steep volume ($\text{L}$).
    *   $\text{BW}$ is consumer body weight ($\text{kg}$).

*   **Hazard Quotient (HQ):**
    $$\text{HQ} = \frac{\text{DIM}}{\text{RfD}}$$
    Where $\text{RfD}$ represents US EPA Oral Reference Doses (Lead: 0.0035, Cadmium: 0.0005, Chromium: 0.0030, Nickel: 0.0200, Copper: 0.0400, Zinc: 0.3000).

---

### 6. Canopy Deposition Velocity & Plume Mitigation (PlumeScrub)

*   **Dry Deposition Velocity:**
    $$V_d = V_{d,\text{base}} \cdot \text{LAI} \cdot \left(\frac{u}{2.0}\right) \cdot (1 + f_{\text{pubescent}})$$
    Where:
    *   $V_{d,\text{base}}$ is base size fraction velocity ($PM_{10}: 0.64$, $PM_{2.5}: 0.16$, $PM_{0.2}: 0.04\ \text{cm/s}$).
    *   $\text{LAI}$ is Leaf Area Index.
    *   $u$ is wind speed ($\text{m/s}$).
    *   $f_{\text{pubescent}} = 0.45$ for hairy leaves.
    *   $V_d$ is capped by size fraction (6.0, 2.5, and 1.0 cm/s respectively).

*   **Downwind Plume Concentration Decay:**
    $$C_{\text{downwind}} = C_{\text{ambient}} \cdot e^{-\frac{V_d \cdot \text{LAI} \cdot W}{H \cdot u}}$$
    Where $W$ is greenbelt width ($\text{m}$) and $H = 10\ \text{m}$ is mixing height.

---

### 7. Skin Dermal Partition & Exposure Modeler (SkinBarrier)

Adapts plant cuticular wax partition science to human dermal exposure.

*   **Skin-Air Partition Coefficient:**
    $$K_{\text{skin-air}} = 10^{(0.7 \cdot \log K_{\text{ow}} - 1.5)}$$

*   **Equilibrium Concentration Capacity:**
    $$M_{\text{eq}} = C_{\text{air}} \cdot V_{\text{skin-lipid}} \cdot K_{\text{skin-air}}$$

*   **Absorbed Dose Over Time:**
    $$M_{\text{absorbed}} = M_{\text{eq}} \cdot (1 - e^{-k_{\text{absorb}} \cdot t})$$

---

## Predictive Modeling Engines

### PhytoRAG Trait Predictor
Performs a $k$-Nearest Neighbors ($k$-NN) retrieval query using cosine similarity metrics to estimate parameters of uncatalogued species:
$$\text{Similarity} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$

### SindySolver Sparsity Learner
Learns governing systems of non-linear ordinary differential equations directly from raw measurements:
$$\dot{\mathbf{x}}(t) = \mathbf{\Theta}(\mathbf{x}) \mathbf{\Xi}$$

---

## Installation and Execution

### CLI Setup
Navigate to the tools directory, install dependencies, and run the interface:
```bash
cd tools
npm install
npm start
```

### Batch Mode Examples
Use the developer-centric folder names (Archetype C) for command keys:
```bash
# Evaluate greenbelt index for Ficus Religiosa
node cli.js --tool greenbelt-suitability-index --species ficus_religiosa

# Simulate pesticide spray retention on Morus Alba
node cli.js --tool pesticide-spray-retention --species morus_alba --rain 10 --adjuvant sticker
```

### Verification
Execute the automated test suites:
```bash
npm test
```
