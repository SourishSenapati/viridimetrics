/**
 * Master Test Runner for Modular Biomonitoring Tools Suite
 * Sequentially executes test.js in each tool folder and aggregates results.
 */

const { fork } = require('child_process');
const path = require('path');

const testSuites = [
    'greenbelt-suitability-index',
    'heavy-metal-tea-risk',
    'pm-deposition-velocity',
    'dermal-skin-air-partition',
    'pesticide-spray-retention',
    'hvac-filter-clog-energy',
    'phytoremediation-sizing-roi',
    'green-wall-hvac-offset',
    'test_predictive_engine.js'
];

console.log("==================================================");
console.log("STARTING MASTER MODULAR TEST RUNNER");
console.log("==================================================");

let currentIndex = 0;
const failures = [];

function runNextSuite() {
    if (currentIndex >= testSuites.length) {
        console.log("==================================================");
        console.log("ALL TEST SUITES FINISHED");
        console.log("==================================================");
        if (failures.length > 0) {
            console.error(`\n[FAIL] The following test suites failed:`);
            failures.forEach(f => console.error(`  - ${f}`));
            process.exit(1);
        } else {
            console.log(`\n[SUCCESS] All ${testSuites.length} modular test suites passed successfully!`);
            process.exit(0);
        }
    }

    const suite = testSuites[currentIndex];
    const testPath = suite.endsWith('.js') ? path.join(__dirname, suite) : path.join(__dirname, suite, 'test.js');
    
    console.log(`\nStarting Suite ${currentIndex + 1}/${testSuites.length}: ${suite.toUpperCase()}`);
    console.log(`Path: ${testPath}\n`);

    const child = fork(testPath, [], { stdio: 'inherit' });

    child.on('exit', (code) => {
        if (code !== 0) {
            failures.push(suite);
            console.error(`\n[ERROR] Test suite "${suite}" exited with code ${code}.\n`);
        } else {
            console.log(`\n[PASS] Test suite "${suite}" completed successfully.\n`);
        }
        currentIndex++;
        runNextSuite();
    });
}

runNextSuite();
