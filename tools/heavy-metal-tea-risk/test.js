/**
 * Test Suite for Heavy Metal Translocation & Dietary Exposure Modeler (HM-DETM)
 */

const assert = require('assert');
const { HeavyMetalTranslocator } = require('./model');

console.log("==================================================");
console.log("RUNNING TESTS FOR: HM-DETM");
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

runTest("calculateTF - basic translocation", () => {
    // soil=100.0, plant=25.0 => TF = 0.25
    const tf = HeavyMetalTranslocator.calculateTF(100.0, 25.0);
    assert.strictEqual(tf, 0.25);
    
    // soil=0.0 => TF = 0
    assert.strictEqual(HeavyMetalTranslocator.calculateTF(0.0, 25.0), 0);
});

runTest("simulateDietaryRisk - safe vs toxic cup", () => {
    // Lead simulation: RfD = 0.0035 mg/kg/day. Adult weight 70kg, consuming 0.2L cup daily.
    // Safe Cup: leafConc=0.5 mg/kg, 2g steeped, extractionRate=50%, steepVol=0.2L
    // DIM = 0.00000714 mg/kg/day. HQ = 0.00000714 / 0.0035 = 0.002
    const safe = HeavyMetalTranslocator.simulateDietaryRisk('lead', 0.5, 2.0, 50.0, 0.2, 0.2, 70);
    assert.strictEqual(safe.hazardQuotient, 0.002);
    assert.strictEqual(safe.riskStatus, "SAFE / UNDER THRESHOLD");

    // Toxic Cup: extreme road-dust lead. leafConc=500 mg/kg, 5g steeped, extractionRate=90%, steepVol=0.2L, dailyIntake=1.0L, childWeight=15kg
    // DIM = 0.75 mg/kg/day. HQ = 0.75 / 0.0035 = 214.286 => rounded to 3 decimals: 214.286
    const toxic = HeavyMetalTranslocator.simulateDietaryRisk('lead', 500.0, 5.0, 90.0, 0.2, 1.0, 15);
    assert.ok(toxic.hazardQuotient > 214.0);
    assert.strictEqual(toxic.riskStatus, "TOXIC INGESTION HAZARD");
    assert.ok(toxic.warning.includes("WARNING: Hazard Quotient"));
});

runTest("calculateTF - edge cases and robustness", () => {
    // Negatives
    assert.strictEqual(HeavyMetalTranslocator.calculateTF(-100, 25), 0);
    assert.strictEqual(HeavyMetalTranslocator.calculateTF(100, -25), 0);
    // Invalid types: null, undefined, strings, arrays
    assert.strictEqual(HeavyMetalTranslocator.calculateTF(null, 25), 0);
    assert.strictEqual(HeavyMetalTranslocator.calculateTF(100, undefined), 0);
    assert.strictEqual(HeavyMetalTranslocator.calculateTF("invalid", "string"), 0);
    assert.strictEqual(HeavyMetalTranslocator.calculateTF([1, 2], { a: 1 }), 0);
});

runTest("simulateDietaryRisk - edge cases and robustness", () => {
    // Negative inputs and out-of-bounds (e.g. extraction rate > 100 clamped to 100, negatives clamped to 0)
    // waterVol <= 0 clamped to 0.2, bodyWeight <= 0 clamped to 70.0
    // leafConc = -10 (clamped to 0), leafWeight = -2 (clamped to 0) => DIM = 0, HQ = 0
    const resNegative = HeavyMetalTranslocator.simulateDietaryRisk('cadmium', -10, -2, 150, 0.0, 0.2, 0.0);
    assert.strictEqual(resNegative.hazardQuotient, 0.0);
    assert.strictEqual(resNegative.dailyIntakeOfMetal, 0.0);
    assert.strictEqual(resNegative.riskStatus, "SAFE / UNDER THRESHOLD");

    // Unrecognized metal key (should default to lead, RfD = 0.0035)
    // leafConc = 1.0, leafWeight = 2.0, extraction = 50, waterVol = 0.2, dailyIntake = 0.2, bodyWeight = 70
    // DIM = (1.0 * 0.002 * 0.5 * 0.2) / (0.2 * 70) = 0.0002 / 14 = 0.000014285
    // HQ = 0.000014285 / 0.0035 = 0.00408 => rounded to 3 decimals: 0.004
    const resUnrecognizedMetal = HeavyMetalTranslocator.simulateDietaryRisk('unknown_metal', 1.0, 2.0, 50.0, 0.2, 0.2, 70);
    assert.strictEqual(resUnrecognizedMetal.hazardQuotient, 0.004);

    // Completely null/undefined parameters
    const resNulls = HeavyMetalTranslocator.simulateDietaryRisk(null, null, null, null, null, null, null);
    // leafConc -> 0.5, leafWeight -> 2.0, extraction -> 50.0, waterVol -> 0.2, dailyIntake -> 0.2, bodyWeight -> 70.0, metalKey -> 'lead'
    // DIM = (0.5 * 0.002 * 0.5 * 0.2) / (0.2 * 70) = 0.0001 / 14 = 0.00000714
    // HQ = 0.00000714 / 0.0035 = 0.002
    assert.strictEqual(resNulls.hazardQuotient, 0.002);
});

console.log("--------------------------------------------------");
console.log(`HM-DETM TESTS COMPLETE: ${testsPassed} / ${totalTests} PASSED`);
console.log("==================================================\n");

if (testsPassed === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
