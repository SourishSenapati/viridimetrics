/**
 * Urban Green Wall Evapotranspirational Cooling & Building HVAC Offset Calculator (GWECB)
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

class GreenWallThermalPredictor {
    /**
     * Simulates evapotranspirational cooling and solar shading energy savings of a green wall on building HVAC systems.
     * @param {number} wallAreaM2 - Vertical wall surface area covered by vegetation (m²).
     * @param {number} leafAreaIndex - Leaf Area Index of green wall canopy.
     * @param {number} transpirationRateLPerM2Day - Average transpiration rate (L water / m² leaf area per day).
     * @param {number} copCooling - Coefficient of Performance of building HVAC cooling system (typically 2.5 to 4.0).
     * @param {number} electricityCostPerKwh - Local cost of electricity in $/kWh.
     * @param {number} solarHeatGainReductionPercent - Percentage of direct solar radiation blocked by green wall shading (%).
     * @returns {Object} Transpiration water lost, cooling load offset, energy saved, monetary savings, and carbon reduction.
     */
    static simulateThermalOffset(wallAreaM2, leafAreaIndex, transpirationRateLPerM2Day, copCooling, electricityCostPerKwh, solarHeatGainReductionPercent) {
        const area = safeNumClamped(wallAreaM2, 100.0, 0);
        const lai = safeNumClamped(leafAreaIndex, 2.0, 0, 20.0);
        const rate = safeNumClamped(transpirationRateLPerM2Day, 5.0, 0);
        const cop = safeNumClamped(copCooling, 3.0, 1e-3); // Prevent division by zero
        const cost = safeNumClamped(electricityCostPerKwh, 0.15, 0);
        const reduction = safeNumClamped(solarHeatGainReductionPercent, 30.0, 0, 100.0);

        // 1. Water transpired per day (L) = Wall Area * LAI * TranspRate
        const leafAreaTotalM2 = area * lai;
        const waterTranspiredDailyL = leafAreaTotalM2 * rate;

        // 2. Latent Heat cooling energy offset
        // Latent heat of vaporization of water at 25C is ~2.45 MJ / L
        // 1 MJ = 0.277778 kWh
        const coolingEnergyMjDaily = waterTranspiredDailyL * 2.45;
        const coolingEnergyKwhDaily = coolingEnergyMjDaily * 0.277778;

        // 3. Solar shading cooling load offset
        // Assume base solar load on a bare wall is 4.0 kWh/m²/day
        // Shading reduction factor reduces this load directly
        const baseSolarHeatGainKwhDaily = area * 4.0;
        const shadingEnergyKwhDaily = baseSolarHeatGainKwhDaily * (reduction / 100);

        const totalThermalEnergyOffsetKwhDaily = coolingEnergyKwhDaily + shadingEnergyKwhDaily;

        // 4. Actual HVAC electrical energy savings (kWh) = Thermal Offset / COP
        let electricalSavingsKwhDaily = 0;
        if (cop > 0) {
            electricalSavingsKwhDaily = totalThermalEnergyOffsetKwhDaily / cop;
        }
        const monetarySavingsDaily = electricalSavingsKwhDaily * cost;

        // 5. Carbon emissions reduction: EPA average emission factor ~0.38 kg CO2 per kWh
        const co2MitigatedKgDaily = electricalSavingsKwhDaily * 0.38;

        let efficiencyClass = "EFFICIENT GREEN WALL THERMAL BARRIER";
        let status = "HIGH COOLING OFFSET";
        if (electricalSavingsKwhDaily < 5.0) {
            status = "LOW COOLING OFFSET";
            efficiencyClass = "NEGLIGIBLE THERMAL IMPACT";
        } else if (electricalSavingsKwhDaily > 30.0) {
            status = "EXCEPTIONAL COOLING OFFSET";
            efficiencyClass = "APEX ENERGY SAVING INFRASTRUCTURE";
        }

        return {
            dailyWaterTranspiredL: parseFloat(waterTranspiredDailyL.toFixed(1)),
            latentCoolingKwh: parseFloat(coolingEnergyKwhDaily.toFixed(2)),
            shadingSavingsKwh: parseFloat(shadingEnergyKwhDaily.toFixed(2)),
            totalThermalKwh: parseFloat(totalThermalEnergyOffsetKwhDaily.toFixed(2)),
            hvacElectricalKwhSaved: parseFloat(electricalSavingsKwhDaily.toFixed(2)),
            dailySavingsDollars: parseFloat(monetarySavingsDaily.toFixed(2)),
            dailyCo2MitigatedKg: parseFloat(co2MitigatedKgDaily.toFixed(2)),
            status: status,
            efficiencyClass: efficiencyClass
        };
    }
}

module.exports = { GreenWallThermalPredictor };
