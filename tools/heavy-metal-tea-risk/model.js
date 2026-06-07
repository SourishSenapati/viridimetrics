/**
 * Heavy Metal Translocation & Dietary Exposure Modeler (HM-DETM)
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

function safeStr(val, fallback) {
    if (typeof val !== 'string') return fallback;
    return val.trim().toLowerCase();
}

class HeavyMetalTranslocator {
    /**
     * Calculates the Soil-to-Leaf Translocation Factor.
     * @param {number} soilConc - Heavy metal concentration in soil (mg/kg).
     * @param {number} plantConc - Heavy metal concentration in plant leaves (mg/kg).
     * @returns {number} Translocation factor.
     */
    static calculateTF(soilConc, plantConc) {
        const sc = safeNumClamped(soilConc, 0.0, 0);
        const pc = safeNumClamped(plantConc, 0.0, 0);
        if (sc <= 1e-9) return 0; // Avoid division by zero or extremely small soil concentration
        return parseFloat((pc / sc).toFixed(4));
    }

    /**
     * Models dietary ingestion risk of heavy metals via leaf-steeped herbal tea infusions.
     * @param {string} metalKey - Metal type: 'lead', 'cadmium', 'chromium', 'nickel', 'copper', 'zinc'.
     * @param {number} leafConc - Leaf metal concentration (mg/kg).
     * @param {number} leafWeight - Mass of leaves steeped (g).
     * @param {number} extractionRate - Transfer efficiency from leaf to water (%).
     * @param {number} waterVol - Volume of water used for steeping (L).
     * @param {number} dailyIntake - Daily volume of tea consumed (L).
     * @param {number} bodyWeight - Body weight of the consumer (kg).
     * @returns {Object} Daily intake, hazard quotient, risk status, and safety warning.
     */
    static simulateDietaryRisk(metalKey, leafConc, leafWeight, extractionRate, waterVol, dailyIntake, bodyWeight) {
        const lc = safeNumClamped(leafConc, 0.5, 0);
        const lw = safeNumClamped(leafWeight, 2.0, 0);
        const er = safeNumClamped(extractionRate, 50.0, 0, 100.0);
        const wv = safeNumClamped(waterVol, 0.2, 1e-6); // Avoid zero water volume
        const di = safeNumClamped(dailyIntake, 0.2, 0);
        const bw = safeNumClamped(bodyWeight, 70.0, 1e-3); // Avoid zero body weight

        const rfdMap = {
            lead: 0.0035,
            cadmium: 0.0005,
            chromium: 0.0030,
            nickel: 0.0200,
            copper: 0.0400,
            zinc: 0.3000
        };

        const metal = safeStr(metalKey, 'lead');
        const rfd = rfdMap[metal] || 0.0035;

        // DIM = (C_leaf * W_leaf_kg * extraction_fraction * V_intake) / (V_water * BW)
        const leafWeightKg = lw / 1000;
        const extractionFraction = er / 100;
        
        let dim = 0;
        if (wv > 0 && bw > 0) {
            dim = (lc * leafWeightKg * extractionFraction * di) / (wv * bw);
        }

        const hq = dim / rfd;
        const roundedHq = parseFloat(hq.toFixed(3));

        let riskStatus = "SAFE / UNDER THRESHOLD";
        let warning = "Dietary risk from heavy metal ingestion is within safe baseline thresholds.";

        if (roundedHq >= 1.0) {
            riskStatus = "TOXIC INGESTION HAZARD";
            warning = `WARNING: Hazard Quotient is ${roundedHq.toFixed(2)}. Potential chronic toxic ingestion hazard from heavy metal concentration in infusion.`;
        } else if (roundedHq >= 0.2) {
            riskStatus = "ELEVATED RISK";
            warning = `CAUTION: Hazard Quotient is ${roundedHq.toFixed(2)}. Elevated exposure levels require monitoring and raw source assessment.`;
        }

        return {
            dailyIntakeOfMetal: parseFloat(dim.toFixed(7)),
            hazardQuotient: roundedHq,
            riskStatus: riskStatus,
            warning: warning
        };
    }
}

module.exports = { HeavyMetalTranslocator };
