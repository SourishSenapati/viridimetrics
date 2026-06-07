/**
 * HVAC Filter Clogging & Fan Power Energy Predictor (HFCFPEP) CLI Tool
 */

const readline = require('readline');
const { FilterCloggingEnergyPredictor } = require('./model');

// Color Utilities
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    fgRed: "\x1b[31m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgBlue: "\x1b[34m",
    fgMagenta: "\x1b[35m",
    fgCyan: "\x1b[36m"
};

function logHeader(text) {
    console.log(`\n${colors.fgBlue}${colors.bright}=== ${text.toUpperCase()} ===${colors.reset}\n`);
}

function printHelp() {
    logHeader("HFCFPEP Help");
    console.log("Usage: node tools/hfcfpep/index.js [options]");
    console.log("\nOptions:");
    console.log("  --interactive              Run in interactive mode.");
    console.log("  --help, -h                 Show this help menu.");
    console.log("\nSimulation Parameters (Optional for Batch Mode):");
    console.log("  --filter <key>             Filter grade: 'merv8', 'merv13', 'hepa'. Default: 'merv13'");
    console.log("  --pm <num>                 Ambient PM concentration (µg/m³). Default: 100.0");
    console.log("  --flow <num>               HVAC air flow volume rate (m³/h). Default: 2000.0");
    console.log("  --hours <num>              Operational blower hours. Default: 240.0");
    console.log("\nExamples:");
    console.log("  node tools/hfcfpep/index.js --filter merv13 --pm 120 --flow 2200 --hours 480");
    console.log("  node tools/hfcfpep/index.js --interactive");
}

function parseArgs() {
    const args = {};
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help' || arg === '-h') {
            args.help = true;
        } else if (arg === '--interactive') {
            args.interactive = true;
        } else if (arg === '--filter' && argv[i + 1]) {
            args.filter = argv[++i];
        } else if (arg === '--pm' && argv[i + 1]) {
            args.pm = parseFloat(argv[++i]);
        } else if (arg === '--flow' && argv[i + 1]) {
            args.flow = parseFloat(argv[++i]);
        } else if (arg === '--hours' && argv[i + 1]) {
            args.hours = parseFloat(argv[++i]);
        }
    }
    return args;
}

function getStatusFormatted(status, cssClass) {
    let color = colors.fgGreen;
    if (cssClass.includes('danger') || cssClass.includes('red')) color = colors.fgRed;
    else if (cssClass.includes('warning') || cssClass.includes('yellow')) color = colors.fgYellow;
    return `${color}${colors.bright}${status}${colors.reset}`;
}

function runCalculation(params = {}) {
    const filter = (params.filter || 'merv13').toLowerCase().trim();
    const pm = params.pm !== undefined ? params.pm : 100.0;
    const flow = params.flow !== undefined ? params.flow : 2000.0;
    const hours = params.hours !== undefined ? params.hours : 240.0;

    const res = FilterCloggingEnergyPredictor.simulateClogging(
        filter,
        pm,
        flow,
        hours
    );

    logHeader("HFCFPEP Report");
    console.log(`HVAC Filter Grade:          ${filter.toUpperCase()}`);
    console.log(`Ambient PM Concentration:   ${pm} µg/m³`);
    console.log(`System Air Flow Volume:     ${flow} m³/h`);
    console.log(`Operational Run Time:       ${hours} hours`);
    console.log("--------------------------------------------------");
    console.log(`${colors.bright}Filter Dust Cake Captured:${colors.reset}   ${res.dustCapturedMg} mg`);
    console.log(`${colors.bright}Filter Clogging Fraction:${colors.reset}    ${res.cloggingPercent}%`);
    console.log(`${colors.bright}Clogged Pressure Resistance:${colors.reset} ${res.pressureDropPa} Pa`);
    console.log(`${colors.bright}Incremental Fan Power Draw:${colors.reset}  ${res.fanPowerIncreaseWatts} Watts`);
    console.log(`${colors.bright}Excess Energy Overhead:${colors.reset}      ${res.energyOverheadKwh} kWh`);
    console.log(`HVAC Maintenance Status:                 ${getStatusFormatted(res.status, res.cssClass)}`);
    console.log(`\n${colors.bright}Service Guidance:${colors.reset}\n${res.warning}`);
    console.log("==================================================\n");
}

function runInteractive() {
    logHeader("HFCFPEP Interactive Mode");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

    const mainFlow = async () => {
        console.log("Select commercial HVAC filter grade:");
        const filters = ['merv8', 'merv13', 'hepa'];
        filters.forEach((f, i) => console.log(`  [${i+1}] ${f.toUpperCase()}`));
        const choiceStr = (await askQuestion(`\nEnter choice (1-3) or 'q' to quit: `)).trim();
        if (choiceStr.toLowerCase() === 'q') {
            rl.close();
            return;
        }

        const idx = parseInt(choiceStr, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= filters.length) {
            console.log(`${colors.fgRed}Invalid option.${colors.reset}`);
            rl.close();
            return;
        }

        const filter = filters[idx];
        const pm = parseFloat(await askQuestion("Ambient air PM concentration in µg/m³ (Default 100): ")) || 100.0;
        const flow = parseFloat(await askQuestion("Blower air flow volume rate in m³/h (Default 2000): ")) || 2000.0;
        const hours = parseFloat(await askQuestion("Blower operational hours (Default 240): ")) || 240.0;

        runCalculation({
            filter,
            pm,
            flow,
            hours
        });
        rl.close();
    };

    mainFlow();
}

function main() {
    const args = parseArgs();
    if (args.help) {
        printHelp();
        process.exit(0);
    }
    if (args.interactive || Object.keys(args).length === 0) {
        runInteractive();
    } else {
        runCalculation(args);
    }
}

if (require.main === module) {
    main();
}
