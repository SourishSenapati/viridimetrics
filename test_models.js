/**
 * Unit Test Suite for Biomonitoring Analytical Models
 * Runs assertions using Node.js built-in 'assert' module.
 * 
 * Run with: node test_models.js
 * 
 * Author: Sourish Senapati
 * Date: May 28, 2026
 */

const assert = require('assert');
const { LeafNormalizer, ResiliencePredictor, LitterLeacher, AptiApiClassifier, HeavyMetalTranslocator, CanopyDepositionSimulator, DermalPartitionSimulator, PesticideWashoffModeler, FilterCloggingEnergyPredictor, PhytoCleanupModeler, GreenWallThermalPredictor } = require('./models');

console.log("==================================================");
console.log("STARTING TEST SUITE FOR BIOMONITORING MODELS");
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

// --------------------------------------------------
// 1. LEAF NORMALIZER TESTS (LAPDN)
// --------------------------------------------------

runTest("LeafNormalizer.calculateLeafArea - planar morphology", () => {
    // 5 leaves, length=10, width=5, cf=0.78 => 10*5*5*0.78 = 195
    const area = LeafNormalizer.calculateLeafArea(10, 5, 5, 'planar');
    assert.strictEqual(area, 195);
});

runTest("LeafNormalizer.calculateLeafArea - acicular (needle) morphology", () => {
    // 10 needles, length=8, width=0.5, cf=0.05 => 8*0.5*10*0.05 = 2
    const area = LeafNormalizer.calculateLeafArea(8, 0.5, 10, 'acicular');
    assert.strictEqual(area, 2);
});

runTest("LeafNormalizer.calculateLeafArea - invalid inputs return 0", () => {
    assert.strictEqual(LeafNormalizer.calculateLeafArea(0, 5, 10, 'planar'), 0);
    assert.strictEqual(LeafNormalizer.calculateLeafArea(10, -1, 10, 'planar'), 0);
    assert.strictEqual(LeafNormalizer.calculateLeafArea(10, 5, 0, 'planar'), 0);
});

runTest("LeafNormalizer.calculateDeposition - standard conversion", () => {
    // final=15.5mg, tare=10.5mg, delta=5.0mg = 5000 µg
    // area=50cm2, bilateral = 100cm2 => 5000 / 100 = 50 µg/cm²
    const dep = LeafNormalizer.calculateDeposition(10.5, 15.5, 50);
    assert.strictEqual(dep, 50);
});

runTest("LeafNormalizer.calculateDeposition - zero area handle", () => {
    assert.strictEqual(LeafNormalizer.calculateDeposition(10.5, 15.5, 0), 0);
});

runTest("LeafNormalizer.calculateDeposition - weight final < tare tared weight handles", () => {
    assert.strictEqual(LeafNormalizer.calculateDeposition(15.5, 10.5, 50), 0);
});

runTest("LeafNormalizer.calculateRainShedding - zero rainfall", () => {
    const res = LeafNormalizer.calculateRainShedding(30, 20, 0);
    assert.strictEqual(res.washedSpm, 0);
    assert.strictEqual(res.remainingSpm, 30);
    assert.strictEqual(res.totalRemainingPm, 50);
});

runTest("LeafNormalizer.calculateRainShedding - high rainfall wash-off", () => {
    // 50mm rainfall => washOffFraction = 1 - e^(-2.5) ~ 0.9179
    const res = LeafNormalizer.calculateRainShedding(10, 5, 50);
    assert.ok(res.washedSpm > 9.0);
    assert.ok(res.remainingSpm < 1.0);
    assert.strictEqual(res.remainingWpm, 5); // WPM remains untouched
});

// --------------------------------------------------
// 2. RESILIENCE PREDICTOR TESTS (FDSPRP)
// --------------------------------------------------

runTest("ResiliencePredictor.predictResilience - zero stress baseline", () => {
    const res = ResiliencePredictor.predictResilience('ficus_religiosa', 0, 0);
    assert.strictEqual(res.chlorophyllRetention, 100);
    assert.strictEqual(res.photosynthesisReductionPercent, 0);
    assert.strictEqual(res.healthStatus, "Healthy / Resilient");
});

runTest("ResiliencePredictor.predictResilience - species vulnerability contrast", () => {
    // Alstonia is sensitive (kChl=0.45) vs Eucalyptus is resilient (kChl=0.04)
    // Under 2 mg/cm² dust load and 10 dry days (dryDays/10 = 1.0)
    // Alstonia chlRetention = e^(-0.45 * 2 * 1) = e^(-0.9) ~ 40.66%
    // Eucalyptus chlRetention = e^(-0.04 * 2 * 1) = e^(-0.08) ~ 92.31%
    const alstonia = ResiliencePredictor.predictResilience('alstonia', 2.0, 10);
    const eucalyptus = ResiliencePredictor.predictResilience('eucalyptus', 2.0, 10);
    
    assert.ok(alstonia.chlorophyllRetention < 42 && alstonia.chlorophyllRetention > 39);
    assert.ok(eucalyptus.chlorophyllRetention > 91 && eucalyptus.chlorophyllRetention < 93);
    
    // Alstonia should register critical or moderate stress while Eucalyptus is safer
    assert.strictEqual(alstonia.healthStatus, "Critical Physiological Collapse");
    assert.strictEqual(eucalyptus.healthStatus, "Moderate Stress"); // photosynthesis reduced due to stomatal clogging
});

// --------------------------------------------------
// 3. LITTER LEACHER TESTS (LLDTLS)
// --------------------------------------------------

runTest("LitterLeacher.simulateLeaching - zero time decay", () => {
    const res = LitterLeacher.simulateLeaching('quercus', 25, 100, 0, 50, 20, 10);
    assert.strictEqual(res.massRemainingPercent, 100);
    assert.strictEqual(res.leachedTeq, 0);
});

runTest("LitterLeacher.simulateLeaching - lignin content contrast", () => {
    // Quercus robur (lignin=35) decays faster than Pinus sylvestris (lignin=45)
    // Under 20°C, 100mm rain, 6 months
    const quercus = LitterLeacher.simulateLeaching('quercus', 20, 100, 6, 100, 100, 100);
    const pinus = LitterLeacher.simulateLeaching('pinus', 20, 100, 6, 100, 100, 100);
    
    assert.ok(quercus.massRemainingPercent < pinus.massRemainingPercent);
});

runTest("LitterLeacher.simulateLeaching - partition coefficient leaching differentiation", () => {
    // LMW PAHs (kLeach=0.15) must leach faster than HMW PAHs (kLeach=0.02) and PCBs (kLeach=0.005)
    const res = LitterLeacher.simulateLeaching('quercus', 20, 100, 12, 100, 100, 100);
    
    assert.ok(res.leachedLmw > res.leachedHmw);
    assert.ok(res.leachedHmw > res.leachedPcb);
});

runTest("LitterLeacher.simulateLeaching - toxic warning threshold triggers", () => {
    // High initial HMW concentration (e.g. 400 ng/g) should cause high leached TEQ (TEQ factor = 0.1)
    // 400 * 0.1 = 40 ng/g potential TEQ. Under high leaching, this triggers HAZARDOUS runoff.
    const toxicRes = LitterLeacher.simulateLeaching('quercus', 25, 200, 12, 100, 400, 50);
    
    assert.ok(toxicRes.leachedTeq >= 5.0);
    assert.strictEqual(toxicRes.alert, "HAZARDOUS WATER RUNOFF WARNING");
    assert.ok(toxicRes.warning.includes("CRITICAL HAZARD"));
});


// --------------------------------------------------
// 4. APTI-API CLASSIFIER TESTS
// --------------------------------------------------

runTest("AptiApiClassifier.calculateApti - sensitive vs tolerant", () => {
    // Sensitive profile: ascorbicAcid=2.0, chlorophyll=1.5, pH=5.5, rwc=70
    // (2 * (1.5 + 5.5) + 70) / 10 = (14 + 70) / 10 = 8.4 (Sensitive)
    const sens = AptiApiClassifier.calculateApti(2.0, 1.5, 5.5, 70);
    assert.strictEqual(sens.score, 8.4);
    assert.strictEqual(sens.classification, "Sensitive");
    assert.strictEqual(sens.cssClass, "status-danger");

    // Tolerant profile: ascorbicAcid=15.0, chlorophyll=10.0, pH=6.0, rwc=85
    // (15 * (10 + 6) + 85) / 10 = (240 + 85) / 10 = 32.5 (Highly Tolerant)
    const tol = AptiApiClassifier.calculateApti(15.0, 10.0, 6.0, 85);
    assert.strictEqual(tol.score, 32.5);
    assert.strictEqual(tol.classification, "Highly Tolerant (Ideal Bio-filter)");
    assert.strictEqual(tol.cssClass, "status-healthy");
});

runTest("AptiApiClassifier.calculateApi - star ratings", () => {
    // Dense evergreen tree with high APTI (32.5) and high economics => API = 8 (APTI) + 4 (dense tree) + 2 (evergreen) + 2 (high econ) = 16
    const api1 = AptiApiClassifier.calculateApi(32.5, 'tree_dense', true, 'high');
    assert.strictEqual(api1.score, 16);
    assert.strictEqual(api1.grade, "Excellent (Apex Greenbelt Choice)");
    assert.strictEqual(api1.stars, "★★★★★");

    // Deciduous shrub with low APTI (8.4) and low economics => API = 0 (APTI) + 1 (shrub) + 1 (deciduous) + 0 (low econ) = 2
    const api2 = AptiApiClassifier.calculateApi(8.4, 'shrub', false, 'low');
    assert.strictEqual(api2.score, 2);
    assert.strictEqual(api2.grade, "Poor (Not Recommended)");
    assert.strictEqual(api2.stars, "★☆☆☆☆");
});

// --------------------------------------------------
// 5. HEAVY METAL TRANSLOCATOR TESTS
// --------------------------------------------------

runTest("HeavyMetalTranslocator.calculateTF - basic translocation", () => {
    // soil=100.0, plant=25.0 => TF = 0.25
    const tf = HeavyMetalTranslocator.calculateTF(100.0, 25.0);
    assert.strictEqual(tf, 0.25);
    
    // soil=0.0 => TF = 0
    assert.strictEqual(HeavyMetalTranslocator.calculateTF(0.0, 25.0), 0);
});

runTest("HeavyMetalTranslocator.simulateDietaryRisk - safe vs toxic cup", () => {
    // Lead simulation: RfD = 0.0035 mg/kg/day. Adult weight 70kg, consuming 0.2L cup daily.
    // Safe Cup: leafConc=0.5 mg/kg, 2g steeped, extractionRate=50%, steepVol=0.2L
    // Metal steeped = 0.5 * 2 = 1.0 µg. Leached = 0.5 µg. InfusionConc = 0.5 µg / 0.2 L = 2.5 µg/L = 0.0025 mg/L.
    // Intake = 0.0025 * 0.2 = 0.0005 mg. DIM = 0.0005 / 70 = 0.00000714 mg/kg/day. HQ = 0.00000714 / 0.0035 = 0.002
    const safe = HeavyMetalTranslocator.simulateDietaryRisk('lead', 0.5, 2.0, 50.0, 0.2, 0.2, 70);
    assert.strictEqual(safe.hazardQuotient, 0.002);
    assert.strictEqual(safe.riskStatus, "SAFE / UNDER THRESHOLD");

    // Toxic Cup: extreme road-dust lead. leafConc=500 mg/kg, 5g steeped, extractionRate=90%, steepVol=0.2L, dailyIntake=1.0L, childWeight=15kg
    // Metal steeped = 500 * 5 = 2500 µg. Leached = 2250 µg = 2.25 mg. InfusionConc = 2.25 / 0.2 = 11.25 mg/L.
    // Intake = 11.25 * 1.0 = 11.25 mg. DIM = 11.25 / 15 = 0.75 mg/kg/day. HQ = 0.75 / 0.0035 = 214.28
    const toxic = HeavyMetalTranslocator.simulateDietaryRisk('lead', 500.0, 5.0, 90.0, 0.2, 1.0, 15);
    assert.ok(toxic.hazardQuotient > 214.0);
    assert.strictEqual(toxic.riskStatus, "TOXIC INGESTION HAZARD");
    assert.ok(toxic.warning.includes("WARNING: Hazard Quotient"));
});

// --------------------------------------------------
// 6. CANOPY DEPOSITION SIMULATOR TESTS
// --------------------------------------------------

runTest("CanopyDepositionSimulator.calculateVd - size fraction scaling", () => {
    // PM10 (base=0.64) vs PM0.2 (base=0.04) under wind=2.0, LAI=2.0, non-pubescent
    const vdPm10 = CanopyDepositionSimulator.calculateVd('pm10', 2.0, 2.0, false);
    const vdPm02 = CanopyDepositionSimulator.calculateVd('pm02', 2.0, 2.0, false);
    
    // PM10 Vd = 0.64 * 2.0 * 1.0 * 1.0 = 1.28 cm/s
    // PM0.2 Vd = 0.04 * 2.0 * 1.0 * 1.0 = 0.08 cm/s
    assert.strictEqual(vdPm10, 1.28);
    assert.strictEqual(vdPm02, 0.08);
});

runTest("CanopyDepositionSimulator.simulatePlumeScrubbing - mass capture", () => {
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

// --------------------------------------------------
// 7. DERMAL PARTITION SIMULATOR TESTS
// --------------------------------------------------

runTest("DermalPartitionSimulator.simulateDermalUptake - safe toluene", () => {
    const res = DermalPartitionSimulator.simulateDermalUptake('toluene', 2.0, 50.0, 4.0);
    assert.strictEqual(res.compoundName, "Toluene (VOC)");
    assert.strictEqual(res.kSkinAir, 2.58);
    assert.strictEqual(res.maxCapacityUg, 0.0003);
    assert.strictEqual(res.massAbsorbedUg, 0.0002);
    assert.strictEqual(res.status, "SAFE / NEGLIGIBLE DERMAL PENETRATION");
});

runTest("DermalPartitionSimulator.simulateDermalUptake - elevated benzo_a_pyrene", () => {
    const res = DermalPartitionSimulator.simulateDermalUptake('benzo_a_pyrene', 5.0, 8000.0, 24.0);
    assert.strictEqual(res.compoundName, "Benzo[a]pyrene (HMW PAH)");
    assert.strictEqual(res.kSkinAir, 618.02);
    assert.strictEqual(res.maxCapacityUg, 24.7207);
    assert.ok(res.massAbsorbedUg > 5.2 && res.massAbsorbedUg < 5.35);
    assert.strictEqual(res.status, "CRITICAL SKIN UPTAKE HAZARD");
});

// --------------------------------------------------
// 8. PESTICIDE WASHOFF MODELER TESTS
// --------------------------------------------------

runTest("PesticideWashoffModeler.simulateWashoff - broadleaf with high runoff", () => {
    const res = PesticideWashoffModeler.simulateWashoff('broadleaf', 200.0, 2.0, 10.0, 'none');
    assert.strictEqual(res.cropName, "Broadleaf Crop (Soybean)");
    assert.strictEqual(res.initialLoadMg, 280.0);
    assert.ok(res.leachedToSoilMg > 153 && res.leachedToSoilMg < 155);
    assert.ok(res.retainedMg > 125 && res.retainedMg < 127);
    assert.strictEqual(res.status, "CRITICAL ECO-TOXIC SOIL RUNOFF");
});

// --------------------------------------------------
// 9. FILTER CLOGGING ENERGY PREDICTOR TESTS
// --------------------------------------------------

runTest("FilterCloggingEnergyPredictor.simulateClogging - merv13 heavy clogging", () => {
    const res = FilterCloggingEnergyPredictor.simulateClogging('merv13', 100.0, 2000.0, 240.0);
    assert.strictEqual(res.filterName, "MERV 13 (Medium Efficiency)");
    assert.ok(res.cloggingPercent > 50 && res.cloggingPercent < 53);
    assert.ok(res.pressureDropPa > 370 && res.pressureDropPa < 375);
    assert.ok(res.fanPowerIncreaseWatts > 1260 && res.fanPowerIncreaseWatts < 1268);
    assert.ok(res.energyOverheadKwh > 300 && res.energyOverheadKwh < 306);
    assert.strictEqual(res.status, "CRITICAL PRESSURE RESISTANCE / REPLACE FILTER");
});

// --------------------------------------------------
// 10. PHYTOREMEDIATION CLEANUP MODELER TESTS
// --------------------------------------------------

runTest("PhytoCleanupModeler.simulateRemediation - long timeline", () => {
    const res = PhytoCleanupModeler.simulateRemediation(150.0, 15.0, 5000.0, 0.5, 10000.0, 4.0, 2000.0);
    assert.strictEqual(res.soilMassTons, 3250.0);
    assert.strictEqual(res.cyclesRequired, 374);
    assert.strictEqual(res.phytoCost, 374000.0);
    assert.strictEqual(res.excavationCost, 455000.0);
    assert.strictEqual(res.savingsDollars, 81000.0);
    assert.strictEqual(res.savingsPercent, 17.80);
    assert.strictEqual(res.status, "PHYTOREMEDIATION NOT RECOMMENDED / TIMELINE TOO LONG");
});

runTest("PhytoCleanupModeler.simulateRemediation - highly feasible", () => {
    const res = PhytoCleanupModeler.simulateRemediation(100.0, 10.0, 2000.0, 0.15, 15000.0, 150.0, 3000.0);
    assert.strictEqual(res.soilMassTons, 390.0);
    assert.strictEqual(res.cyclesRequired, 1);
    assert.strictEqual(res.phytoCost, 600.0);
    assert.strictEqual(res.excavationCost, 54600.0);
    assert.strictEqual(res.savingsDollars, 54000.0);
    assert.strictEqual(res.savingsPercent, 98.90);
    assert.strictEqual(res.status, "PHYTOREMEDIATION HIGHLY FEASIBLE");
});

// --------------------------------------------------
// 11. GREEN WALL THERMAL PREDICTOR TESTS
// --------------------------------------------------

runTest("GreenWallThermalPredictor.simulateThermalOffset - high savings", () => {
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

console.log("==================================================");
console.log(`TEST SUITE COMPLETE: ${testsPassed} / ${totalTests} TESTS PASSED`);
console.log("==================================================");

if (testsPassed === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
