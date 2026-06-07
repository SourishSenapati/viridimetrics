/**
 * Soil Heavy Metal Phytoremediation Sizing & ROI Estimator (SHMPS)
 * Core mathematical engine.
 */

function safeNum(val, fallback) {
    if (val === null || val === undefined || typeof val === 'boolean' || typeof val === 'object' || Array.isArray(val)) {
        return fallback;
    }
    const num = Number(val);
    return isNaN(num) ? fallback : num;
}

function safeNumClamped(val, fallback, min = null, max = null) {
    let num = safeNum(val, fallback);
    if (min !== null && num < min) num = min;
    if (max !== null && num > max) num = max;
    return num;
}

class PhytoCleanupModeler {
    /**
     * Simulates heavy metal soil remediation cycles using phytoremediation hyperaccumulators and estimates ROI vs excavation.
     * @param {number} soilConcInit - Initial soil metal concentration (mg/kg).
     * @param {number} soilConcTarget - Target regulatory safety threshold (mg/kg).
     * @param {number} siteAreaM2 - Land area of the polluted site (m²).
     * @param {number} soilDepthM - Contaminated soil depth (m, typically 0.15 to 1.0).
     * @param {number} biomassYieldKgHa - Crop biomass dry yield per hectare per year (kg/ha/year).
     * @param {number} bcf - Bioconcentration Factor (Plant Conc / Soil Conc).
     * @param {number} costPerCycleHa - Cost of planting, harvesting, and ash disposal per hectare per cycle ($).
     * @returns {Object} Remediation timeline, cost, excavation comparison, and feasibility assessment.
     */
    static simulateRemediation(soilConcInit, soilConcTarget, siteAreaM2, soilDepthM, biomassYieldKgHa, bcf, costPerCycleHa) {
        let sci = safeNum(soilConcInit, 100.0);
        if (sci <= 0) sci = 100.0;
        let sct = safeNum(soilConcTarget, 10.0);
        if (sct <= 0) sct = 10.0;

        const area = safeNumClamped(siteAreaM2, 1000.0, 0);
        const depth = safeNumClamped(soilDepthM, 0.5, 0);
        const yieldKg = safeNumClamped(biomassYieldKgHa, 5000.0, 0);
        const b = safeNumClamped(bcf, 5.0, 0);
        const cpc = safeNumClamped(costPerCycleHa, 1000.0, 0);

        if (sct >= sci) {
            return {
                soilMassTons: parseFloat(((area * depth * 1300) / 1000).toFixed(2)),
                cyclesRequired: 0,
                phytoCost: 0,
                excavationCost: parseFloat((((area * depth * 1300) / 1000) * 140).toFixed(2)),
                savingsDollars: parseFloat(((((area * depth * 1300) / 1000) * 140)).toFixed(2)),
                savingsPercent: 100.0,
                status: "REMEDIATION ALREADY COMPLETED",
                warning: "Soil concentration is already below target safety threshold."
            };
        }

        // Soil bulk density assumed at 1.3 g/cm3 = 1300 kg/m3
        const soilDensityKgM3 = 1300;
        const totalSoilMassKg = area * depth * soilDensityKgM3;

        // Area in hectares (1 ha = 10,000 m²)
        const siteAreaHa = area / 10000;

        // Annual biomass dry yield on the site (kg/year)
        const siteBiomassYieldKg = yieldKg * siteAreaHa;

        // extractionFraction = (siteBiomassYieldKg * BCF) / totalSoilMassKg.
        // Cap the extraction fraction at 0.95 per cycle to remain conservative.
        let extractionFraction = 0;
        if (totalSoilMassKg > 1e-9) {
            extractionFraction = Math.min(0.95, (siteBiomassYieldKg * b) / totalSoilMassKg);
        }

        let cycles = 0;
        if (extractionFraction > 1e-9) {
            // C_t = C_0 * (1 - extractionFraction)^cycles
            // cycles = ln(C_target / C_init) / ln(1 - extractionFraction)
            cycles = Math.log(sct / sci) / Math.log(1 - extractionFraction);
            cycles = Math.ceil(cycles);
        } else {
            cycles = Infinity;
        }

        const phytoCost = siteAreaHa * cpc * (isFinite(cycles) ? cycles : 0);

        // Excavation (dig-and-dump) cost calculation:
        // Soil mass in metric tons (1 metric ton = 1000 kg)
        const soilMassTons = totalSoilMassKg / 1000;
        // Cost: $50/ton dig + $60/ton hazardous landfill fee + $30/ton backfill = $140/ton
        const excavationCostPerTon = 140;
        const excavationCost = soilMassTons * excavationCostPerTon;

        const savingsDollars = excavationCost - phytoCost;
        const savingsPercent = excavationCost > 0 ? (savingsDollars / excavationCost) * 100 : 0;

        let status = "PHYTOREMEDIATION HIGHLY FEASIBLE";
        let warningText = `Phytoremediation is projected to take ${cycles} years/cycles. It saves $${savingsDollars.toFixed(0)} (${savingsPercent.toFixed(1)}%) compared to rapid excavation. Highly recommended for non-urgent site developments.`;

        if (cycles > 25) {
            status = "PHYTOREMEDIATION NOT RECOMMENDED / TIMELINE TOO LONG";
            warningText = `CAUTION: Cleanup timeline exceeds 25 years (${cycles} cycles required due to low biomass/BCF). Rapid excavation is recommended despite higher costs ($${excavationCost.toFixed(0)}) if site development is urgent.`;
        } else if (cycles > 10) {
            status = "PHYTOREMEDIATION CONDITIONALLY FEASIBLE";
            warningText = `NOTE: Moderate timeline of ${cycles} cycles required. Cost savings are substantial ($${savingsDollars.toFixed(0)}). Recommended as a low-cost holding strategy.`;
        }

        return {
            soilMassTons: parseFloat(soilMassTons.toFixed(2)),
            cyclesRequired: isFinite(cycles) ? cycles : 999,
            phytoCost: parseFloat(phytoCost.toFixed(2)),
            excavationCost: parseFloat(excavationCost.toFixed(2)),
            savingsDollars: parseFloat(savingsDollars.toFixed(2)),
            savingsPercent: parseFloat(savingsPercent.toFixed(2)),
            status: status,
            warning: warningText
        };
    }
}

module.exports = { PhytoCleanupModeler };
