/**
 * Test Suite for Plant Biomonitoring Predictive Engine (Neural Network, RAG, SINDy)
 */

const assert = require('assert');
const { SimpleNeuralNetwork, SpeciesRAGEngine, SindyDynamicsLearner } = require('./predictive_engine');

console.log("==================================================");
console.log("RUNNING TESTS FOR: PREDICTIVE ENGINE");
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

runTest("SimpleNeuralNetwork - training and convergence", () => {
    // Train a small network to learn XOR
    // Inputs: [0,0], [0,1], [1,0], [1,1]
    // Outputs: [0], [1], [1], [0]
    const nn = new SimpleNeuralNetwork(2, 4, 1);
    
    const inputs = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const targets = [[0], [1], [1], [0]];

    // Train for 2000 epochs
    nn.train(inputs, targets, 2000, 0.5);

    const out00 = nn.forward([0, 0])[0];
    const out01 = nn.forward([0, 1])[0];
    const out10 = nn.forward([1, 0])[0];
    const out11 = nn.forward([1, 1])[0];

    // Assert convergence with a loose threshold since it's a small stochastic net
    assert.ok(out00 < 0.15, `Expected NN([0,0]) < 0.15, got ${out00}`);
    assert.ok(out01 > 0.85, `Expected NN([0,1]) > 0.85, got ${out01}`);
    assert.ok(out10 > 0.85, `Expected NN([1,0]) > 0.85, got ${out10}`);
    assert.ok(out11 < 0.15, `Expected NN([1,1]) < 0.15, got ${out11}`);
});

runTest("SpeciesRAGEngine - parameter search and trait prediction", () => {
    // Define a query species profile with properties that represent Hedera helix (Common ivy)
    const query = {
        morphology: 'planar',
        growthHabit: 'shrub',
        evergreen: true,
        isPubescent: false,
        epicuticularWax: 45.2
    };

    const result = SpeciesRAGEngine.predictTraits(query, 3);
    assert.ok(result.similarMatches.length === 3, "Expected 3 matches retrieved");
    
    // The closest match should be hedera_helix with similarity ~100%
    const closest = result.similarMatches[0];
    assert.strictEqual(closest.commonName, "Common ivy");
    assert.ok(parseFloat(closest.similarity) > 95.0, `Expected high similarity, got ${closest.similarity}`);

    // Verify predicted traits exist and are within reasonable bounds
    assert.ok(result.predictedTraits.ascorbicAcid > 0);
    assert.ok(result.predictedTraits.pH > 5.0 && result.predictedTraits.pH < 7.0);
    assert.ok(result.predictedTraits.heavyMetalTF.lead > 0);
});

runTest("SindyDynamicsLearner - symbolic equation learning", () => {
    // Generate data from a known function: y = 2.5 + 0.0 * x - 1.2 * x^2
    // True coefficients for library [1, x, x^2]: [2.5, 0, -1.2]
    const xValues = [];
    const yValues = [];
    for (let x = -5; x <= 5; x += 0.5) {
        xValues.push(x);
        yValues.push(2.5 - 1.2 * x * x);
    }

    const library = [
        x => 1.0,
        x => x,
        x => x * x,
        x => Math.sin(x)
    ];

    // Fit with threshold 0.1
    const xi = SindyDynamicsLearner.fit(xValues, yValues, library, 0.1);

    // Expected coefficients: [2.5, 0, -1.2, 0]
    assert.deepStrictEqual(xi, [2.5, 0, -1.2, 0]);
});

console.log("--------------------------------------------------");
console.log(`PREDICTIVE ENGINE TESTS COMPLETE: ${testsPassed} / ${totalTests} PASSED`);
console.log("==================================================\n");

if (testsPassed === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
