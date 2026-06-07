/**
 * HVAC Filter Clogging & Fan Power Energy Predictor (HFCFPEP)
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

class FilterCloggingEnergyPredictor {
    /**
     * Models particulate capture in commercial air HVAC filters and predicts blower energy overheads.
     * @param {string} filterKey - Filter grade: 'merv8', 'merv13', 'hepa'.
     * @param {number} pmConcUgM3 - Ambient PM concentration in µg/m³.
     * @param {number} flowRateM3H - Air flow volume in m³/hour.
     * @param {number} exposureHours - Blower operational hours.
     * @returns {Object} Clogging percentage, pressure drop, fan power increase, and energy overhead.
     */
    static simulateClogging(filterKey, pmConcUgM3, flowRateM3H, exposureHours) {
        const pm = safeNumClamped(pmConcUgM3, 50.0, 0);
        const flow = safeNumClamped(flowRateM3H, 500.0, 0);
        const hours = safeNumClamped(exposureHours, 24.0, 0);
        
        const filterConfigs = {
            merv8: { name: "MERV 8 (Coarse Pre-filter)", dpClean: 70, delta: 0.8, powerClean: 400 },
            merv13: { name: "MERV 13 (Medium Efficiency)", dpClean: 120, delta: 1.5, powerClean: 600 },
            hepa: { name: "HEPA H13 (Absolute Cleanroom)", dpClean: 250, delta: 3.5, powerClean: 1200 }
        };
        
        const key = safeStr(filterKey, 'merv13');
        const filter = filterConfigs[key] || filterConfigs.merv13;
        
        // 1. Cumulative dust mass captured in filter cake (mg)
        const cumulativeDustMg = pm * flow * hours * 0.001;
        
        // 2. Clogging fraction: modeled after exponential cake filtration curves
        const cloggingFraction = 1 - Math.exp(-filter.delta * cumulativeDustMg * 0.00001);
        const cloggingPercent = cloggingFraction * 100;
        
        // 3. Pressure drop (dP, Pascals)
        const dpClogged = filter.dpClean * (1 + 8 * Math.pow(cloggingFraction, 2));
        
        // 4. Blower Power increase (Watts) and energy overhead (kWh)
        // If clean pressure drop is 0, we avoid division by zero
        let deltaPowerWatts = 0;
        if (filter.dpClean > 0) {
            deltaPowerWatts = filter.powerClean * ((dpClogged / filter.dpClean) - 1);
        }
        const energyOverheadKwh = (deltaPowerWatts * hours) / 1000;
        
        let maintenanceStatus = "OPTIMAL PRESSURE BALANCE";
        let statusClass = "alert-safe";
        let warningText = `Filter pressure drop is within optimal boundary limits (dP = ${dpClogged.toFixed(0)} Pa). Blower energy draw is normal.`;
        
        if (cloggingPercent >= 50) {
            maintenanceStatus = "CRITICAL PRESSURE RESISTANCE / REPLACE FILTER";
            statusClass = "alert-danger";
            warningText = `WARNING: Pre-filter is heavily clogged at ${cloggingPercent.toFixed(1)}%. Pressure drop has spiked to ${dpClogged.toFixed(0)} Pa. HVAC fan energy overhead is inflated by ${energyOverheadKwh.toFixed(2)} kWh. Immediate filter replacement required to prevent blower motor burnout.`;
        } else if (cloggingPercent >= 15) {
            maintenanceStatus = "ELEVATED CAKE DUST LEVEL / SCHEDULE SERVICE";
            statusClass = "alert-warning";
            warningText = `CAUTION: Filter is showing dust loading (clogged: ${cloggingPercent.toFixed(1)}%). Pressure drop reaches ${dpClogged.toFixed(0)} Pa. Fan energy draw is elevated by ${deltaPowerWatts.toFixed(0)} Watts. Schedule replacement within 72 operating hours.`;
        }
        
        return {
            filterName: filter.name,
            dustCapturedMg: parseFloat(cumulativeDustMg.toFixed(2)),
            cloggingPercent: parseFloat(cloggingPercent.toFixed(2)),
            pressureDropPa: parseFloat(dpClogged.toFixed(2)),
            fanPowerIncreaseWatts: parseFloat(deltaPowerWatts.toFixed(2)),
            energyOverheadKwh: parseFloat(energyOverheadKwh.toFixed(2)),
            status: maintenanceStatus,
            cssClass: statusClass,
            warning: warningText
        };
    }
}

module.exports = { FilterCloggingEnergyPredictor };
