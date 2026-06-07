/**
 * Test Suite for APTI-API Classifier Tool
 */

const assert = require('assert');
const { AptiApiClassifier } = require('./model');

console.log("==================================================");
console.log("RUNNING TESTS FOR: APTI-API CLASSIFIER");
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

runTest("calculateApti - sensitive profile", () => {
    // (2 * (1.5 + 5.5) + 70) / 10 = (14 + 70) / 10 = 8.4
    const res = AptiApiClassifier.calculateApti(2.0, 1.5, 5.5, 70);
    assert.strictEqual(res.score, 8.4);
    assert.strictEqual(res.classification, "Sensitive");
    assert.strictEqual(res.cssClass, "status-danger");
});

runTest("calculateApti - tolerant profile", () => {
    // (15 * (10 + 6) + 85) / 10 = (240 + 85) / 10 = 32.5
    const res = AptiApiClassifier.calculateApti(15.0, 10.0, 6.0, 85);
    assert.strictEqual(res.score, 32.5);
    assert.strictEqual(res.classification, "Highly Tolerant (Ideal Bio-filter)");
    assert.strictEqual(res.cssClass, "status-healthy");
});

runTest("calculateApi - star ratings", () => {
    // Dense evergreen tree with high APTI and high economics => API = 8 + 4 + 2 + 2 = 16
    const res1 = AptiApiClassifier.calculateApi(32.5, 'tree_dense', true, 'high');
    assert.strictEqual(res1.score, 16);
    assert.strictEqual(res1.grade, "Excellent (Apex Greenbelt Choice)");
    assert.strictEqual(res1.stars, "★★★★★");

    // Deciduous shrub with low APTI and low economics => API = 0 + 1 + 1 + 0 = 2
    const res2 = AptiApiClassifier.calculateApi(8.4, 'shrub', false, 'low');
    assert.strictEqual(res2.score, 2);
    assert.strictEqual(res2.grade, "Poor (Not Recommended)");
    assert.strictEqual(res2.stars, "★☆☆☆☆");
});

runTest("calculateApti - edge cases and robustness", () => {
    // Test negative values: ascorbic acid -5 (clamped to 0), chlorophyll -2 (clamped to 0), pH 5.5, rwc -10 (clamped to 0)
    // score = (0 * (0 + 5.5) + 0) / 10 = 0
    const resNegative = AptiApiClassifier.calculateApti(-5.0, -2.0, 5.5, -10.0);
    assert.strictEqual(resNegative.score, 0);

    // Test out of bounds pH and relative water content
    // pH 16.0 (clamped to 14.0), RWC 150.0 (clamped to 100.0)
    // ascorbic = 10, chlor = 6 => (10 * (6 + 14) + 100) / 10 = (200 + 100) / 10 = 30
    const resOutOfBounds = AptiApiClassifier.calculateApti(10.0, 6.0, 16.0, 150.0);
    assert.strictEqual(resOutOfBounds.score, 30);
    assert.strictEqual(resOutOfBounds.classification, "Highly Tolerant (Ideal Bio-filter)");

    // Test null/undefined and invalid types
    // ascorbic: null (fallback 2), chlor: undefined (fallback 1.5), pH: "invalid" (fallback 7.0), rwc: [1,2] (fallback 70)
    // score = (2 * (1.5 + 7.0) + 70) / 10 = (17 + 70) / 10 = 8.7
    const resInvalidTypes = AptiApiClassifier.calculateApti(null, undefined, "invalid", [1, 2]);
    assert.strictEqual(resInvalidTypes.score, 8.7);
});

runTest("calculateApi - edge cases and robustness", () => {
    // API edge cases: aptiScore null, growthHabit invalid type, evergreen string "true", economicValue invalid type
    // apti null => fallback 10 => API score = 2
    // growthHabit null => fallback 'shrub' => API score += 1
    // evergreen "true" => parsed to true => API score += 2
    // economicValue null => fallback 'low' => API score += 0
    // total = 2 + 1 + 2 + 0 = 5 => Poor
    const resEdge = AptiApiClassifier.calculateApi(null, null, "true", null);
    assert.strictEqual(resEdge.score, 5);
    assert.strictEqual(resEdge.grade, "Poor (Not Recommended)");
    assert.strictEqual(resEdge.stars, "★☆☆☆☆");

    // growthHabit unrecognized but string => score += 1
    const resUnrecognizedHabit = AptiApiClassifier.calculateApi(30, "unknown_habit_type", true, "high");
    // apti 30 => 8; habit unrecognized => 1; evergreen true => 2; economic high => 2. Total = 13 => Very Good
    assert.strictEqual(resUnrecognizedHabit.score, 13);
    assert.strictEqual(resUnrecognizedHabit.grade, "Very Good (Highly Recommended)");
});

console.log("--------------------------------------------------");
console.log(`APTI-API TESTS COMPLETE: ${testsPassed} / ${totalTests} PASSED`);
console.log("==================================================\n");

if (testsPassed === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
