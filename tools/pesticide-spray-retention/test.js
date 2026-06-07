/**
 * Test Suite for Agricultural Pesticide Spray Retention & Washoff Modeler (APSRWM)
 */

const assert = require('assert');
const { PesticideWashoffModeler } = require('./model');

console.log("==================================================");
console.log("RUNNING TESTS FOR: APSRWM");
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

runTest("simulateWashoff - broadleaf with high runoff", () => {
    const res = PesticideWashoffModeler.simulateWashoff('broadleaf', 200.0, 2.0, 10.0, 'none');
    assert.strictEqual(res.cropName, "Broadleaf Crop (Soybean)");
    assert.strictEqual(res.initialLoadMg, 280.0);
    assert.ok(res.leachedToSoilMg > 153 && res.leachedToSoilMg < 155);
    assert.ok(res.retainedMg > 125 && res.retainedMg < 127);
    assert.strictEqual(res.status, "CRITICAL ECO-TOXIC SOIL RUNOFF");
});

runTest("simulateWashoff - edge cases and type safety", () => {
    // Negatives (clamped to 0)
    const resNeg = PesticideWashoffModeler.simulateWashoff('broadleaf', -50.0, -1.0, -5.0, 'none');
    assert.strictEqual(resNeg.initialLoadMg, 0.0);
    assert.strictEqual(resNeg.leachedToSoilMg, 0.0);
    assert.strictEqual(resNeg.retainedMg, 0.0);
    assert.strictEqual(resNeg.washOffPercent, 0.0);

    // Unrecognized crop key and adjuvant
    const resDefaults = PesticideWashoffModeler.simulateWashoff('unknown_crop', 100.0, 1.0, 10.0, 'unknown_adjuvant');
    // crop -> broadleaf (baseAdhesion=0.70, betaWash=0.08), adjuvant -> none (multiplier=1.0)
    // totalPesticide = 100 * 1 = 100
    // initialFoliarLoad = 100 * 0.70 = 70.0
    // washOffFraction = 1 - e^(-0.08 * 10 * 1.0) = 1 - e^-0.8 = 1 - 0.4493 = 0.5507
    // leached = 70.0 * 0.5507 = 38.55
    // retained = 70.0 * 0.4493 = 31.45
    assert.strictEqual(resDefaults.cropName, "Broadleaf Crop (Soybean)");
    assert.strictEqual(resDefaults.initialLoadMg, 70.0);
    assert.strictEqual(resDefaults.leachedToSoilMg, 38.55);
    assert.strictEqual(resDefaults.retainedMg, 31.45);

    // Nulls and invalid types
    const resNulls = PesticideWashoffModeler.simulateWashoff(null, null, null, null, null);
    // cropKey -> broadleaf, conc -> 100.0, sprayVol -> 1.0, rain -> 0.0, adjuvant -> none
    // initialLoad = 70.0
    // washOffFraction = 1 - e^(0) = 0
    assert.strictEqual(resNulls.initialLoadMg, 70.0);
    assert.strictEqual(resNulls.leachedToSoilMg, 0.0);
    assert.strictEqual(resNulls.retainedMg, 70.0);
});

console.log("--------------------------------------------------");
console.log(`APSRWM TESTS COMPLETE: ${testsPassed} / ${totalTests} PASSED`);
console.log("==================================================\n");

if (testsPassed === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
