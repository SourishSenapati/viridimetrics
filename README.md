# ViridiMetrics 🌿📈

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](#-licensing)
[![Pricing: Paid/Commercial](https://img.shields.io/badge/Pricing-Commercial_License-blue.svg)](#-licensing)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

**ViridiMetrics** is an enterprise-grade mathematical modeling suite and predictive engine (k-NN RAG & SINDy) for plant biomonitoring, urban forestry optimization, building HVAC thermal offsets, and human-ecological risk mitigation.

By mapping empirical plant traits (such as leaf waxy cuticles, stomatal dynamics, and ascorbic acid content) against environmental inputs, ViridiMetrics translates complex botanical mechanics into actionable, quantitative safety and financial metrics.

> [!IMPORTANT]
> **Terms of Use & Academic Licensing Agreement**
> This repository is **not** open-source. It is licensed under a custom agreement:
>
> * 🎓 **Teaching:** Free to run in classrooms, but *only* in its original, unmodified form.
> * 🛠️ **Modification:** Any code modification (even for teaching) requires a paid license.
> * 📝 **Research Papers:** If you use this tool to generate data for a scientific paper or preprint, **you must include Sourish Senapati as a co-author** of your publication.
> * 💼 **Commercial & Other Uses:** Any other use requires a paid commercial license.
>
> Contact **Sourish Senapati** (`sourish.senapati@jadavpuruniversity.in`) for licensing and publication coordination.

---

## 🛠️ The 8 Core Biomonitoring Calculators

ViridiMetrics organizes environmental equations into eight high-fidelity analytical modules:

| Module / Folder Name | Premium Name | Purpose & Scientific Context | Primary Output Metrics |
| :--- | :--- | :--- | :--- |
| **[heavy-metal-tea-risk](file:///d:/PROJECT/ddos/tools/heavy-metal-tea-risk)** | **PhytoBrew** | Soil-to-leaf translocation & dietary risk of consuming leaf infusions (teas) harvested from contaminated urban soils. | Hazard Quotient (HQ) & Daily Intake of Metal (DIM) |
| **[pesticide-spray-retention](file:///d:/PROJECT/ddos/tools/pesticide-spray-retention)** | **PestiWash** | Agricultural canopy spray retention, waxy crop cuticle adhesion, and rain-induced runoff leaching. | Soil Contamination Mass (mg) & Adjuvant Effectiveness |
| **[greenbelt-suitability-index](file:///d:/PROJECT/ddos/tools/greenbelt-suitability-index)** | **EcoCanopy** | Physiological tolerance and anticipated performance grading of trees/shrubs for roadside greenbelts. | APTI Score, API Grade (1-16) & Suitability Stars |
| **[pm-deposition-velocity](file:///d:/PROJECT/ddos/tools/pm-deposition-velocity)** | **PlumeScrub** | Atmospheric particulate matter ($PM_{10}$, $PM_{2.5}$, $PM_{0.2}$) dry deposition velocity & downwind exhaust plume mitigation. | Deposition Velocity ($V_d$), Removed Flux & Plume Decay |
| **[green-wall-hvac-offset](file:///d:/PROJECT/ddos/tools/green-wall-hvac-offset)** | **TranspiraCool** | Urban vertical green wall evapotranspiration rates, latent heat cooling, solar shading, and building HVAC offsets. | Thermal Offset (kWh), HVAC Money Saved ($) & $CO_2$ Mitigated |
| **[hvac-filter-clog-energy](file:///d:/PROJECT/ddos/tools/hvac-filter-clog-energy)** | **BlowerStrain** | Particulate dust cake accumulation on commercial HVAC air filters and corresponding fan energy overheads. | Clogging %, Filter Pressure Drop (Pa) & Excess Power Draw (kW) |
| **[dermal-skin-air-partition](file:///d:/PROJECT/ddos/tools/dermal-skin-air-partition)** | **SkinBarrier** | Adapts plant cuticular wax partition science to predict occupational human dermal absorption of volatile organics (VOCs/PAHs). | Skin-Air Partition ($K_{skin\_air}$) & Absorbed Dermal Dose |
| **[phytoremediation-sizing-roi](file:///d:/PROJECT/ddos/tools/phytoremediation-sizing-roi)** | **PhytoClean** | Sizing metrics, year cycles, and ROI of hyperaccumulating crops for soil remediation compared to excavation. | Cleanup Timeline (Years), Phyto vs. Excavation Cost & Savings % |

---

## 🧠 Premium Predictive Engines

Beyond standard calculations, ViridiMetrics features two advanced math modules:

1. **PhytoRAG (k-NN Traits Predictor):** Estimates biochemical and physical traits (such as Chlorophyll content, pH, and bioconcentration factors) for unlisted species by executing Cosine Similarity retrieval across our reference database using known morphological markers.
2. **SindySolver (Sparse Dynamics Discovery):** An implementation of the *Sparse Identification of Non-linear Dynamics* (SINDy) algorithm. It automatically derives symbolic governing equations (e.g. pressure drops during filter cake compaction) directly from experimental time-series data.

---

## 🔗 Architecture & Interconnection

Although each tool is a self-contained module running in its own subdirectory (complete with individual CLI, configurations, and unit tests), they are unified by a single core architecture:

* **Shared Database (`open_source_data.json`):** A single master catalog of plant species compiled from literature, ensuring that an update to a species profile (like a newly verified translocation factor) immediately syncs across all calculators.
* **Central Integration (`engine.js`):** Integrates all equations into a single interface.
* **Unified Console (`cli.js`):** Run the master interactive suite by calling `node cli.js`.
* **Universal Test Runner (`test_all_modular.js`):** Run all test suites consecutively using `npm test`.

---

## 📦 Project Setup & Installation

### Prerequisites

* Node.js >= 18.0.0

### Install Dependencies

```bash
npm install
```

### Run CLI (Interactive Mode)

To run the terminal interface:

```bash
npm start
```

### Run Batch Computations

You can query individual modules via CLI arguments:

```bash
# Calculate air pollution suitability index for Ficus Religiosa
node cli.js --tool apti --species ficus_religiosa

# Model pesticide runoff during a 10mm rainstorm
node cli.js --tool apsrwm --species morus_alba --rain 10 --adjuvant sticker
```

---

## 📄 Licensing

Copyright (c) 2026 Sourish Senapati. All Rights Reserved.
Refer to the [LICENSE](LICENSE) file for the full terms. Unauthorized deployment, hosting, copying, or modification of this software is strictly prohibited.
