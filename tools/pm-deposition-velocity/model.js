/**
 * Canopy Deposition Velocity & Plume Mitigation Simulator (CDVPMS)
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

class CanopyDepositionSimulator {
    /**
     * Computes the Dry Deposition Velocity (Vd) of particulate matter onto a forest canopy.
     * @param {string} pmSizeKey - PM category: 'pm10', 'pm25', 'pm02'.
     * @param {number} windSpeed - Local wind velocity (m/s).
     * @param {number} lai - Leaf Area Index.
     * @param {boolean} isPubescent - Presence of leaf trichomes/hairs.
     * @returns {number} Deposition velocity in cm/s.
     */
    static calculateVd(pmSizeKey, windSpeed, lai, isPubescent) {
        const ws = safeNumClamped(windSpeed, 2.0, 0, 100);
        const l = safeNumClamped(lai, 2.0, 0, 20.0);

        const baseVdMap = {
            pm10: 0.64,
            pm25: 0.16,
            pm02: 0.04
        };

        const capMap = {
            pm10: 6.0,
            pm25: 2.5,
            pm02: 1.0
        };

        const key = safeStr(pmSizeKey, 'pm25');
        const baseVd = baseVdMap[key] || 0.16;
        const cap = capMap[key] || 2.5;

        let ip = false;
        if (typeof isPubescent === 'boolean') {
            ip = isPubescent;
        } else if (typeof isPubescent === 'string') {
            ip = isPubescent.trim().toLowerCase() === 'true';
        }

        const pFactor = ip ? 0.45 : 0.0;

        const vd = baseVd * l * (ws / 2.0) * (1 + pFactor);
        const finalVd = Math.min(vd, cap);

        return parseFloat(finalVd.toFixed(2));
    }

    /**
     * Simulates PM mass removal and plume concentration reduction downwind of a greenbelt canopy.
     * @param {string} pmSizeKey - PM category: 'pm10', 'pm25', 'pm02'.
     * @param {number} lai - Leaf Area Index.
     * @param {number} windSpeed - Wind speed in m/s.
     * @param {boolean} isPubescent - Pubescent leaves indicator.
     * @param {number} ambientConc - Ambient PM concentration in µg/m³.
     * @param {number} canopyArea - Surface canopy land area in m².
     * @param {number} durationHours - Duration of exposure in hours.
     * @param {number} barrierWidth - Cross-sectional width of the greenbelt (m).
     * @returns {Object} Vd, deposition flux, mass removed, downwind concentration, and removal efficiency.
     */
    static simulatePlumeScrubbing(pmSizeKey, lai, windSpeed, isPubescent, ambientConc, canopyArea, durationHours, barrierWidth) {
        const ac = safeNumClamped(ambientConc, 50.0, 0);
        const ca = safeNumClamped(canopyArea, 1000.0, 0);
        const dh = safeNumClamped(durationHours, 1.0, 0);
        const bw = safeNumClamped(barrierWidth, 10.0, 0);
        const l = safeNumClamped(lai, 2.0, 0, 20.0);
        const ws = safeNumClamped(windSpeed, 2.0, 0, 100);

        const vd = CanopyDepositionSimulator.calculateVd(pmSizeKey, ws, l, isPubescent);
        
        // Flux F = Vd (cm/s) * C (µg/m³) * 10^-2 = µg / (m² * s)
        const depositionFlux = vd * ac * 0.01;

        // Mass M = F * Area * Time_seconds * 10^-6 grams
        const durationSeconds = dh * 3600;
        const massRemovedGrams = depositionFlux * ca * durationSeconds * 0.000001;

        // Downwind concentration modeling: C_down = C_amb * exp(- (Vd_m_s * LAI * W) / (H * u) )
        // mixing height H = 10m
        const H = 10.0;
        const vdm = vd * 0.01; // convert cm/s to m/s
        
        let downwindConc = ac;
        let removalEfficiency = 0.0;

        if (ws > 1e-9 && ac > 0) {
            const exponent = (vdm * l * bw) / (H * ws);
            downwindConc = ac * Math.exp(-exponent);
            removalEfficiency = ((ac - downwindConc) / ac) * 100;
        }

        return {
            vd: vd,
            depositionFlux: parseFloat(depositionFlux.toFixed(4)),
            massRemovedGrams: parseFloat(massRemovedGrams.toFixed(4)),
            downwindConcentration: parseFloat(downwindConc.toFixed(2)),
            removalEfficiencyPercent: parseFloat(removalEfficiency.toFixed(2))
        };
    }
}

module.exports = { CanopyDepositionSimulator };
