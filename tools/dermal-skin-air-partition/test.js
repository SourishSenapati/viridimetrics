/**
 * Test Suite for Skin Dermal Partition & Exposure Modeler (SDPEM)
 */

const assert = require('assert');
const { DermalPartitionSimulator } = require('./model');

console.log("==================================================");
console.log("RUNNING TESTS FOR: SDPEM");
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

runTest("simulateDermalUptake - safe toluene", () => {
    const res = DermalPartitionSimulator.simulateDermalUptake('toluene', 2.0, 50.0, 4.0);
    assert.strictEqual(res.compoundName, "Toluene (VOC)");
    assert.strictEqual(res.kSkinAir, 2.58);
    assert.strictEqual(res.maxCapacityUg, 0.0003);
    assert.strictEqual(res.massAbsorbedUg, 0.0002);
    assert.strictEqual(res.status, "SAFE / NEGLIGIBLE DERMAL PENETRATION");
});

runTest("simulateDermalUptake - elevated benzo_a_pyrene", () => {
    const res = DermalPartitionSimulator.simulateDermalUptake('benzo_a_pyrene', 5.0, 8000.0, 24.0);
    assert.strictEqual(res.compoundName, "Benzo[a]pyrene (HMW PAH)");
    assert.strictEqual(res.kSkinAir, 618.02);
    assert.strictEqual(res.maxCapacityUg, 24.7207);
    assert.ok(res.massAbsorbedUg > 5.2 && res.massAbsorbedUg < 5.35);
    assert.strictEqual(res.status, "CRITICAL SKIN UPTAKE HAZARD");
});

runTest("simulateDermalUptake - edge cases and type robustness", () => {
    // Negative parameters and out-of-bounds (clamped)
    const resNeg = DermalPartitionSimulator.simulateDermalUptake('toluene', -5.0, -10.0, -2.0);
    // skinLipidVolMl clamped to 1.0, airConcUgM3 to 0, exposureHours to 0
    assert.strictEqual(resNeg.maxCapacityUg, 0.0);
    assert.strictEqual(resNeg.massAbsorbedUg, 0.0);
    assert.strictEqual(resNeg.status, "SAFE / NEGLIGIBLE DERMAL PENETRATION");

    // Unrecognized compound key (should default to phenanthrene)
    const resDefault = DermalPartitionSimulator.simulateDermalUptake('unknown_chemical', 1.0, 100.0, 8.0);
    assert.strictEqual(resDefault.compoundName, "Phenanthrene (LMW PAH)");

    // Completely null / undefined inputs
    const resNulls = DermalPartitionSimulator.simulateDermalUptake(null, null, null, null);
    // skinLipidVolMl -> 1.0, airConcUgM3 -> 50.0, exposureHours -> 8.0, compoundKey -> 'phenanthrene'
    // logKow = 4.57 => kSkinAir = 10^(0.7*4.57 - 1.5) = 10^1.699 = 50.00
    // maxCap = 50.0 * 1.0e-6 * 50.00 = 0.0025
    // massAbsorbed = 0.0025 * (1 - e^(-0.04 * 8)) = 0.0025 * (1 - e^-0.32) = 0.0025 * (1 - 0.726) = 0.000685
    assert.strictEqual(resNulls.compoundName, "Phenanthrene (LMW PAH)");
    assert.strictEqual(resNulls.kSkinAir, 50.00);
    assert.strictEqual(resNulls.maxCapacityUg, 0.0025);
    assert.ok(resNulls.massAbsorbedUg > 0.0006 && resNulls.massAbsorbedUg < 0.0008);
});

console.log("--------------------------------------------------");
console.log(`SDPEM TESTS COMPLETE: ${testsPassed} / ${totalTests} PASSED`);
console.log("==================================================\n");

if (testsPassed === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
