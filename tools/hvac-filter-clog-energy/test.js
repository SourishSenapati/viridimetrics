/**
 * Test Suite for HVAC Filter Clogging & Fan Power Energy Predictor (HFCFPEP)
 */

const assert = require('assert');
const { FilterCloggingEnergyPredictor } = require('./model');

console.log("==================================================");
console.log("RUNNING TESTS FOR: HFCFPEP");
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

runTest("simulateClogging - merv13 heavy clogging", () => {
    const res = FilterCloggingEnergyPredictor.simulateClogging('merv13', 100.0, 2000.0, 240.0);
    assert.strictEqual(res.filterName, "MERV 13 (Medium Efficiency)");
    assert.ok(res.cloggingPercent > 50 && res.cloggingPercent < 53);
    assert.ok(res.pressureDropPa > 370 && res.pressureDropPa < 375);
    assert.ok(res.fanPowerIncreaseWatts > 1260 && res.fanPowerIncreaseWatts < 1268);
    assert.ok(res.energyOverheadKwh > 300 && res.energyOverheadKwh < 306);
    assert.strictEqual(res.status, "CRITICAL PRESSURE RESISTANCE / REPLACE FILTER");
});

runTest("simulateClogging - edge cases and robustness", () => {
    // Negatives (clamped to 0)
    const resNeg = FilterCloggingEnergyPredictor.simulateClogging('merv13', -100.0, -500.0, -24.0);
    assert.strictEqual(resNeg.dustCapturedMg, 0.0);
    assert.strictEqual(resNeg.cloggingPercent, 0.0);
    assert.strictEqual(resNeg.pressureDropPa, 120.0); // clean pressure drop of MERV 13
    assert.strictEqual(resNeg.fanPowerIncreaseWatts, 0.0);
    assert.strictEqual(resNeg.energyOverheadKwh, 0.0);
    assert.strictEqual(resNeg.status, "OPTIMAL PRESSURE BALANCE");

    // Unrecognized filter key (should default to merv13)
    const resDefault = FilterCloggingEnergyPredictor.simulateClogging('unknown_filter', 100.0, 1000.0, 10.0);
    assert.strictEqual(resDefault.filterName, "MERV 13 (Medium Efficiency)");

    // Completely null / undefined inputs
    const resNulls = FilterCloggingEnergyPredictor.simulateClogging(null, null, null, null);
    // filterKey -> merv13, pm -> 50.0, flow -> 500.0, hours -> 24.0
    // dustCaptured = 50 * 500 * 24 * 0.001 = 600.0 mg
    assert.strictEqual(resNulls.dustCapturedMg, 600.0);
    assert.strictEqual(resNulls.filterName, "MERV 13 (Medium Efficiency)");
});

console.log("--------------------------------------------------");
console.log(`HFCFPEP TESTS COMPLETE: ${testsPassed} / ${totalTests} PASSED`);
console.log("==================================================\n");

if (testsPassed === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
