/**
 * Skin Dermal Partition & Exposure Modeler (SDPEM) CLI Tool
 */

const readline = require('readline');
const { DermalPartitionSimulator } = require('./model');

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
    logHeader("SDPEM Help");
    console.log("Usage: node tools/sdpem/index.js [options]");
    console.log("\nOptions:");
    console.log("  --interactive              Run in interactive mode.");
    console.log("  --help, -h                 Show this help menu.");
    console.log("\nSimulation Parameters (Optional for Batch Mode):");
    console.log("  --compound <key>           Compound: 'phenanthrene', 'benzo_a_pyrene', 'toluene'. Default: 'phenanthrene'");
    console.log("  --lipid <num>              Skin lipid volume (mL). Default: 1.0");
    console.log("  --air <num>                Ambient air concentration (µg/m³). Default: 100.0");
    console.log("  --hours <num>              Exposure duration in hours. Default: 8.0");
    console.log("\nExamples:");
    console.log("  node tools/sdpem/index.js --compound benzo_a_pyrene --lipid 2.0 --air 500");
    console.log("  node tools/sdpem/index.js --interactive");
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
        } else if (arg === '--compound' && argv[i + 1]) {
            args.compound = argv[++i];
        } else if (arg === '--lipid' && argv[i + 1]) {
            args.lipid = parseFloat(argv[++i]);
        } else if (arg === '--air' && argv[i + 1]) {
            args.air = parseFloat(argv[++i]);
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
    const compound = (params.compound || 'phenanthrene').toLowerCase().trim();
    const lipid = params.lipid !== undefined ? params.lipid : 1.0;
    const air = params.air !== undefined ? params.air : 100.0;
    const hours = params.hours !== undefined ? params.hours : 8.0;

    const res = DermalPartitionSimulator.simulateDermalUptake(
        compound,
        lipid,
        air,
        hours
    );

    logHeader("SDPEM Report");
    console.log(`Organic Contaminant:       ${compound.toUpperCase()}`);
    console.log(`Skin Lipid Volume:         ${lipid} mL`);
    console.log(`Ambient Air Concentration:  ${air} µg/m³`);
    console.log(`Exposure Duration:         ${hours} hours`);
    console.log("--------------------------------------------------");
    console.log(`${colors.bright}Skin-Air Partition Coefficient (K_skin_air):${colors.reset} ${res.kSkinAir}`);
    console.log(`${colors.bright}Max Dermal Equilibrium Capacity:${colors.reset}             ${res.maxCapacityUg} µg`);
    console.log(`${colors.bright}Cumulative Dermal Dose Absorbed:${colors.reset}             ${res.massAbsorbedUg} µg`);
    console.log(`Dermal Exposure Status:                       ${getStatusFormatted(res.status, res.cssClass)}`);
    console.log(`\n${colors.bright}Occupational Health Alert:${colors.reset}\n${res.warning}`);
    console.log("==================================================\n");
}

function runInteractive() {
    logHeader("SDPEM Interactive Mode");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

    const mainFlow = async () => {
        console.log("Select chemical compound:");
        const compounds = ['phenanthrene', 'benzo_a_pyrene', 'toluene'];
        compounds.forEach((c, i) => console.log(`  [${i+1}] ${c.toUpperCase()}`));
        const choiceStr = (await askQuestion(`\nEnter choice (1-3) or 'q' to quit: `)).trim();
        if (choiceStr.toLowerCase() === 'q') {
            rl.close();
            return;
        }

        const idx = parseInt(choiceStr, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= compounds.length) {
            console.log(`${colors.fgRed}Invalid option.${colors.reset}`);
            rl.close();
            return;
        }

        const compound = compounds[idx];
        const lipid = parseFloat(await askQuestion("Worker skin surface lipid volume in mL (Default 1.0): ")) || 1.0;
        const air = parseFloat(await askQuestion("Workplace air concentration in µg/m³ (Default 100): ")) || 100.0;
        const hours = parseFloat(await askQuestion("Operational exposure duration in hours (Default 8): ")) || 8.0;

        runCalculation({
            compound,
            lipid,
            air,
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
