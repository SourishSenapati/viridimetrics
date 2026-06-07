/**
 * Test Suite for Soil Heavy Metal Phytoremediation Sizing & ROI Estimator (SHMPS)
 */

const assert = require('assert');
const { PhytoCleanupModeler } = require('./model');

console.log("==================================================");
console.log("RUNNING TESTS FOR: SHMPS");
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

runTest("simulateRemediation - long timeline", () => {
    const res = PhytoCleanupModeler.simulateRemediation(150.0, 15.0, 5000.0, 0.5, 10000.0, 4.0, 2000.0);
    assert.strictEqual(res.soilMassTons, 3250.0);
    assert.strictEqual(res.cyclesRequired, 374);
    assert.strictEqual(res.phytoCost, 374000.0);
    assert.strictEqual(res.excavationCost, 455000.0);
    assert.strictEqual(res.savingsDollars, 81000.0);
    assert.strictEqual(res.savingsPercent, 17.80);
    assert.strictEqual(res.status, "PHYTOREMEDIATION NOT RECOMMENDED / TIMELINE TOO LONG");
});

runTest("simulateRemediation - highly feasible", () => {
    const res = PhytoCleanupModeler.simulateRemediation(100.0, 10.0, 2000.0, 0.15, 15000.0, 150.0, 3000.0);
    assert.strictEqual(res.soilMassTons, 390.0);
    assert.strictEqual(res.cyclesRequired, 1);
    assert.strictEqual(res.phytoCost, 600.0);
    assert.strictEqual(res.excavationCost, 54600.0);
    assert.strictEqual(res.savingsDollars, 54000.0);
    assert.strictEqual(res.savingsPercent, 98.90);
    assert.strictEqual(res.status, "PHYTOREMEDIATION HIGHLY FEASIBLE");
});

runTest("simulateRemediation - edge cases and robustness", () => {
    // Target concentration >= Initial concentration
    const resCompleted = PhytoCleanupModeler.simulateRemediation(50.0, 60.0, 1000.0, 0.5, 5000.0, 5.0, 1000.0);
    assert.strictEqual(resCompleted.cyclesRequired, 0);
    assert.strictEqual(resCompleted.phytoCost, 0);
    assert.strictEqual(resCompleted.savingsPercent, 100.0);
    assert.strictEqual(resCompleted.status, "REMEDIATION ALREADY COMPLETED");

    // Negatives (should clamp to 0 or baseline positive values for concentrations)
    // initial = -50 (fallback to 100.0), target = -10 (fallback to 10.0), area = -500 (clamp to 0), depth = -0.5 (clamp to 0)
    const resNeg = PhytoCleanupModeler.simulateRemediation(-50.0, -10.0, -500.0, -0.5, -5000.0, -5.0, -1000.0);
    assert.strictEqual(resNeg.soilMassTons, 0.0);
    assert.strictEqual(resNeg.cyclesRequired, 999);
    assert.strictEqual(resNeg.phytoCost, 0.0);
    assert.strictEqual(resNeg.excavationCost, 0.0);

    // Completely null / undefined inputs
    const resNulls = PhytoCleanupModeler.simulateRemediation(null, null, null, null, null, null, null);
    // initial -> 100.0, target -> 10.0, area -> 1000.0, depth -> 0.5, yield -> 5000.0, bcf -> 5.0, costPerCycle -> 1000.0
    // soilMass = 1000 * 0.5 * 1300 = 650000 kg = 650 tons. siteAreaHa = 0.1
    // siteBiomass = 5000 * 0.1 = 500 kg
    // extraction = 500 * 5.0 / 650000 = 2500 / 650000 = 0.003846
    // cycles = ln(10.0 / 100.0) / ln(1 - 0.003846) = ln(0.1) / ln(0.996154) = -2.302585 / -0.003854 = 597.5 => 598
    assert.strictEqual(resNulls.soilMassTons, 650.0);
    assert.strictEqual(resNulls.cyclesRequired, 598);
    assert.strictEqual(resNulls.status, "PHYTOREMEDIATION NOT RECOMMENDED / TIMELINE TOO LONG");
});

console.log("--------------------------------------------------");
console.log(`SHMPS TESTS COMPLETE: ${testsPassed} / ${totalTests} PASSED`);
console.log("==================================================\n");

if (testsPassed === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
