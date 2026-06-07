/**
 * Test Suite for Urban Green Wall Evapotranspirational Cooling & Building HVAC Offset Calculator (GWECB)
 */

const assert = require('assert');
const { GreenWallThermalPredictor } = require('./model');

console.log("==================================================");
console.log("RUNNING TESTS FOR: GWECB");
console.log("==================================================");

let testsPassed = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`[PASS] ${name}`);
        testsPassed++;
    } catch (error) {
        console.error(`[FAIL] ${name}`);
        console.error(error);
    }
}

runTest("simulateThermalOffset - high savings", () => {
    const res = GreenWallThermalPredictor.simulateThermalOffset(150.0, 4.0, 2.5, 3.2, 0.15, 35.0);
    assert.strictEqual(res.dailyWaterTranspiredL, 1500.0);
    assert.strictEqual(res.latentCoolingKwh, 1020.83);
    assert.strictEqual(res.shadingSavingsKwh, 210.0);
    assert.strictEqual(res.totalThermalKwh, 1230.83);
    assert.strictEqual(res.hvacElectricalKwhSaved, 384.64);
    assert.strictEqual(res.dailySavingsDollars, 57.70);
    assert.strictEqual(res.dailyCo2MitigatedKg, 146.16);
    assert.strictEqual(res.status, "EXCEPTIONAL COOLING OFFSET");
    assert.strictEqual(res.efficiencyClass, "APEX ENERGY SAVING INFRASTRUCTURE");
});

runTest("simulateThermalOffset - edge cases and robustness", () => {
    // Negatives (clamped to 0 or defaults)
    const resNeg = GreenWallThermalPredictor.simulateThermalOffset(-150.0, -4.0, -2.5, -3.2, -0.15, -35.0);
    // area clamped to 0, lai to 0, rate to 0, cop clamped to 3.0 (since <= 0), cost to 0, reduction to 0
    assert.strictEqual(resNeg.dailyWaterTranspiredL, 0.0);
    assert.strictEqual(resNeg.latentCoolingKwh, 0.0);
    assert.strictEqual(resNeg.shadingSavingsKwh, 0.0);
    assert.strictEqual(resNeg.hvacElectricalKwhSaved, 0.0);
    assert.strictEqual(resNeg.dailySavingsDollars, 0.0);
    assert.strictEqual(resNeg.status, "LOW COOLING OFFSET");

    // Extreme high reduction percentage clamped to 100%
    const resHighReduction = GreenWallThermalPredictor.simulateThermalOffset(100.0, 2.0, 5.0, 3.0, 0.15, 150.0);
    // reduction clamped to 100
    // baseSolarHeatGain = 100 * 4 = 400. shadingSavingsKwh = 400 * 1.0 = 400
    assert.strictEqual(resHighReduction.shadingSavingsKwh, 400.0);

    // Completely null / undefined inputs
    const resNulls = GreenWallThermalPredictor.simulateThermalOffset(null, null, null, null, null, null);
    // area -> 100.0, lai -> 2.0, rate -> 5.0, cop -> 3.0, cost -> 0.15, reduction -> 30.0
    // leafAreaTotal = 100 * 2 = 200. waterTranspired = 200 * 5 = 1000 L.
    // coolingEnergyMj = 1000 * 2.45 = 2450. coolingKwh = 2450 * 0.277778 = 680.56
    // baseSolarHeatGain = 100 * 4 = 400. shadingKwh = 400 * 0.3 = 120.0
    // totalThermal = 680.56 + 120 = 800.56
    // hvacElectrical = 800.56 / 3.0 = 266.85
    assert.strictEqual(resNulls.dailyWaterTranspiredL, 1000.0);
    assert.strictEqual(resNulls.latentCoolingKwh, 680.56);
    assert.strictEqual(resNulls.shadingSavingsKwh, 120.00);
    assert.strictEqual(resNulls.hvacElectricalKwhSaved, 266.85);
});

console.log("--------------------------------------------------");
console.log(`GWECB TESTS COMPLETE: ${testsPassed} / ${totalTests} PASSED`);
console.log("==================================================\n");

if (testsPassed === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
