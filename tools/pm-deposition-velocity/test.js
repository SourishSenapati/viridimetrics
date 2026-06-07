/**
 * Test Suite for Canopy Deposition Velocity & Plume Mitigation Simulator (CDVPMS)
 */

const assert = require('assert');
const { CanopyDepositionSimulator } = require('./model');

console.log("==================================================");
console.log("RUNNING TESTS FOR: CDVPMS");
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

runTest("calculateVd - size fraction scaling", () => {
    // PM10 (base=0.64) vs PM0.2 (base=0.04) under wind=2.0, LAI=2.0, non-pubescent
    // PM10 Vd = 0.64 * 2.0 * (2.0 / 2.0) * 1.0 = 1.28 cm/s
    // PM0.2 Vd = 0.04 * 2.0 * (2.0 / 2.0) * 1.0 = 0.08 cm/s
    const vdPm10 = CanopyDepositionSimulator.calculateVd('pm10', 2.0, 2.0, false);
    const vdPm02 = CanopyDepositionSimulator.calculateVd('pm02', 2.0, 2.0, false);
    
    assert.strictEqual(vdPm10, 1.28);
    assert.strictEqual(vdPm02, 0.08);
});

runTest("simulatePlumeScrubbing - mass capture", () => {
    // PM2.5, LAI=4.0, wind=2.0, non-pubescent, conc=100µg/m³, area=5000m², duration=10h
    // Vd = 0.16 * 4.0 * 1.0 * 1.0 = 0.64 cm/s
    // Flux = 0.64 * 100 * 0.01 = 0.64 µg/(m²*s)
    // Mass = 0.64 * 5000 * 36000 * 1e-6 = 115.2 grams
    const scrub = CanopyDepositionSimulator.simulatePlumeScrubbing('pm25', 4.0, 2.0, false, 100.0, 5000.0, 10.0, 30.0);
    assert.strictEqual(scrub.vd, 0.64);
    assert.strictEqual(scrub.depositionFlux, 0.64);
    assert.strictEqual(scrub.massRemovedGrams, 115.2);
    
    // Check downwind conc is scrubbed
    // Mixing H = 10m, wind = 2.0m/s, W = 30m, Vd = 0.0064 m/s, LAI = 4.0
    // exponent = (0.0064 * 4.0 * 30) / (10 * 2.0) = 0.768 / 20 = 0.0384
    // C_down = 100 * e^(-0.0384) ~ 96.23 µg/m³
    // removalPercent ~ 3.77%
    assert.strictEqual(scrub.downwindConcentration, 96.23);
    assert.strictEqual(scrub.removalEfficiencyPercent, 3.77);
});

runTest("calculateVd - edge cases and robustness", () => {
    // Negatives (should clamp to 0)
    assert.strictEqual(CanopyDepositionSimulator.calculateVd('pm25', -5.0, -1.0, false), 0);

    // Extreme high inputs (should clamp to physical caps)
    // PM10 cap = 6.0. base=0.64, wind=20.0, LAI=15.0 => vd = 0.64 * 15 * 10 = 96. Cap is 6.0
    assert.strictEqual(CanopyDepositionSimulator.calculateVd('pm10', 20.0, 15.0, true), 6.0);
    // PM0.2 cap = 1.0.
    assert.strictEqual(CanopyDepositionSimulator.calculateVd('pm02', 50.0, 18.0, true), 1.0);

    // Invalid categories (should default to pm25)
    // wind=2.0, LAI=2.0 => vd = 0.16 * 2 * 1 * 1 = 0.32
    assert.strictEqual(CanopyDepositionSimulator.calculateVd('unknown_pm_type', 2.0, 2.0, false), 0.32);

    // Nulls and invalid types (should use default values)
    // pmSizeKey -> 'pm25', windSpeed -> 2.0, lai -> 2.0
    // vd = 0.16 * 2.0 * 1.0 * 1.0 = 0.32
    assert.strictEqual(CanopyDepositionSimulator.calculateVd(null, null, null, null), 0.32);
});

runTest("simulatePlumeScrubbing - zero and invalid boundary cases", () => {
    // Zero wind speed scenario (should not trigger division by zero, downwindConc = ambientConc)
    const zeroWind = CanopyDepositionSimulator.simulatePlumeScrubbing('pm25', 4.0, 0.0, false, 100.0, 5000.0, 10.0, 30.0);
    assert.strictEqual(zeroWind.downwindConcentration, 100.0);
    assert.strictEqual(zeroWind.removalEfficiencyPercent, 0.0);

    // Negative parameters and nulls
    const badParams = CanopyDepositionSimulator.simulatePlumeScrubbing(null, null, null, null, -100, -500, -2, -10);
    // ambientConc clamped to 0, area to 0, duration to 0, barrierWidth to 0, lai -> 2.0, wind -> 2.0
    assert.strictEqual(badParams.massRemovedGrams, 0);
    assert.strictEqual(badParams.downwindConcentration, 0);
    assert.strictEqual(badParams.removalEfficiencyPercent, 0);
});

console.log("--------------------------------------------------");
console.log(`CDVPMS TESTS COMPLETE: ${testsPassed} / ${totalTests} PASSED`);
console.log("==================================================\n");

if (testsPassed === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
