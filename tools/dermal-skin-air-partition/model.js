/**
 * Skin Dermal Partition & Exposure Modeler (SDPEM)
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

class DermalPartitionSimulator {
    /**
     * Models compound partitioning from air to skin lipids and evaluates dermal uptake.
     * @param {string} compoundKey - Chemical species: 'phenanthrene', 'benzo_a_pyrene', 'toluene'.
     * @param {number} skinLipidVolMl - Volume of skin surface lipids (mL, typically 0.5 to 5.0).
     * @param {number} airConcUgM3 - Ambient air concentration in µg/m³.
     * @param {number} exposureHours - Duration of exposure in hours.
     * @returns {Object} Mass partitioned, skin concentration, absorption rate, and safety warnings.
     */
    static simulateDermalUptake(compoundKey, skinLipidVolMl, airConcUgM3, exposureHours) {
        const slv = safeNumClamped(skinLipidVolMl, 1.0, 1e-6); // Avoid 0 or negative volume
        const ac = safeNumClamped(airConcUgM3, 50.0, 0);
        const eh = safeNumClamped(exposureHours, 8.0, 0);

        const partitionConfigs = {
            phenanthrene: { name: "Phenanthrene (LMW PAH)", logKow: 4.57, kAbsorb: 0.04 },
            benzo_a_pyrene: { name: "Benzo[a]pyrene (HMW PAH)", logKow: 6.13, kAbsorb: 0.01 },
            toluene: { name: "Toluene (VOC)", logKow: 2.73, kAbsorb: 0.25 }
        };
        
        const key = safeStr(compoundKey, 'phenanthrene');
        const config = partitionConfigs[key] || partitionConfigs.phenanthrene;
        
        // K_skin_air partition coefficient approximated from logKow: K_skin_air = 10^(0.7 * logKow - 1.5)
        const kSkinAir = Math.pow(10, (0.7 * config.logKow) - 1.5);
        
        // Max equilibrium capacity (µg) = AirConc (µg/m³) * Vol_skin_lipid (converted to m³) * K_skin_air
        // 1 mL = 10^-6 m³
        const skinLipidVolM3 = slv * 0.000001;
        const maxEquilibriumCapacityUg = ac * skinLipidVolM3 * kSkinAir;
        
        // Mass absorbed over time (µg) based on absorption rate constant (kAbsorb)
        const massAbsorbedUg = maxEquilibriumCapacityUg * (1 - Math.exp(-config.kAbsorb * eh));
        
        let hazardStatus = "SAFE / NEGLIGIBLE DERMAL PENETRATION";
        let hazardClass = "alert-safe";
        let warningText = `Dermal uptake of ${config.name} remains within safe workplace boundaries. standard skin barrier functions are protective.`;
        
        // If dermal absorption exceeds 5.0 µg, flag workplace toxic caution
        if (massAbsorbedUg >= 5.0) {
            hazardStatus = "CRITICAL SKIN UPTAKE HAZARD";
            hazardClass = "alert-danger";
            warningText = `WARNING: Dermal dose reaches ${massAbsorbedUg.toFixed(2)} µg. High accumulation of lipophilic ${config.name} inside skin oils. Dermal absorption bypasses hepatic filtration. Protective barrier creams or chemical suits mandatory in this sector.`;
        } else if (massAbsorbedUg >= 1.0) {
            hazardStatus = "MODERATE DERMAL ACCUMULATION";
            hazardClass = "alert-warning";
            warningText = `CAUTION: Dermal accumulation reaches ${massAbsorbedUg.toFixed(2)} µg. Extended exposure may trigger cuticular wax swelling or contact dermatitis. Scheduled skin washing advised.`;
        }
        
        return {
            compoundName: config.name,
            kSkinAir: parseFloat(kSkinAir.toFixed(2)),
            maxCapacityUg: parseFloat(maxEquilibriumCapacityUg.toFixed(4)),
            massAbsorbedUg: parseFloat(massAbsorbedUg.toFixed(4)),
            status: hazardStatus,
            cssClass: hazardClass,
            warning: warningText
        };
    }
}

module.exports = { DermalPartitionSimulator };
