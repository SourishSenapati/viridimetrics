/**
 * Agricultural Pesticide Spray Retention & Washoff Modeler (APSRWM)
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

class PesticideWashoffModeler {
    /**
     * Models agricultural pesticide spray retention, crop cuticular absorption, and rain wash-off.
     * @param {string} cropKey - Crop profile: 'broadleaf' (e.g. soybean), 'waxy' (e.g. cabbage), 'coniferous' (orchard).
     * @param {number} concentrationMgL - Active pesticide concentration in spray (mg/L).
     * @param {number} sprayVolL - Applied volume (L).
     * @param {number} rainfallMm - Precipitated rainfall volume (mm).
     * @param {string} adjuvant - Adjuvant type: 'none', 'surfactant' (reduces wash-off), 'sticker' (rain-fast).
     * @returns {Object} Mass applied, retained mass, washed runoff, and soil hazard rating.
     */
    static simulateWashoff(cropKey, concentrationMgL, sprayVolL, rainfallMm, adjuvant) {
        const conc = safeNumClamped(concentrationMgL, 100.0, 0);
        const vol = safeNumClamped(sprayVolL, 1.0, 0);
        const rain = safeNumClamped(rainfallMm, 0.0, 0);
        
        const cropConfigs = {
            broadleaf: { name: "Broadleaf Crop (Soybean)", baseAdhesion: 0.70, betaWash: 0.08 },
            waxy: { name: "Waxy Crop (Cabbage)", baseAdhesion: 0.40, betaWash: 0.12 },
            coniferous: { name: "Coniferous Orchard (Citrus)", baseAdhesion: 0.85, betaWash: 0.05 }
        };
        
        const key = safeStr(cropKey, 'broadleaf');
        const crop = cropConfigs[key] || cropConfigs.broadleaf;
        
        // 1. Initial chemical mass intercepted on foliage (mg)
        const totalPesticideMg = conc * vol;
        const initialFoliarLoadMg = totalPesticideMg * crop.baseAdhesion;
        
        // Adjuvant adjustments
        const adj = safeStr(adjuvant, 'none');
        let adjuvantMultiplier = 1.0;
        if (adj === 'surfactant') {
            adjuvantMultiplier = 0.6;
        } else if (adj === 'sticker') {
            adjuvantMultiplier = 0.25;
        }
        
        // 2. Wash-off Fraction (F_washoff)
        const washOffFraction = 1 - Math.exp(-crop.betaWash * rain * adjuvantMultiplier);
        
        const leachedToSoilMg = initialFoliarLoadMg * washOffFraction;
        const retainedOnFoliageMg = initialFoliarLoadMg * (1 - washOffFraction);
        
        let hazardStatus = "SAFE RUNOFF";
        let hazardClass = "alert-safe";
        let warningText = "Pesticide foliar retention is within target limits. Soil and groundwater runoff contamination is minimal.";
        
        if (leachedToSoilMg >= 100.0) {
            hazardStatus = "CRITICAL ECO-TOXIC SOIL RUNOFF";
            hazardClass = "alert-danger";
            warningText = `CRITICAL HAZARD: Rain wash-off has flushed ${leachedToSoilMg.toFixed(1)} mg of pesticide active ingredient into localized soils. High risk of aquatic runoff and groundwater contamination. Immediate application of polymer stickers is recommended.`;
        } else if (leachedToSoilMg >= 25.0) {
            hazardStatus = "ELEVATED SOIL LEACHING";
            hazardClass = "alert-warning";
            warningText = `CAUTION: Pesticide leaching to soil reaches ${leachedToSoilMg.toFixed(1)} mg. Elevated crop protection loss. Delay pesticide spraying if heavy rain forecast within 48 hours.`;
        }
        
        return {
            cropName: crop.name,
            initialLoadMg: parseFloat(initialFoliarLoadMg.toFixed(2)),
            leachedToSoilMg: parseFloat(leachedToSoilMg.toFixed(2)),
            retainedMg: parseFloat(retainedOnFoliageMg.toFixed(2)),
            washOffPercent: parseFloat((washOffFraction * 100).toFixed(2)),
            status: hazardStatus,
            cssClass: hazardClass,
            warning: warningText
        };
    }
}

module.exports = { PesticideWashoffModeler };
