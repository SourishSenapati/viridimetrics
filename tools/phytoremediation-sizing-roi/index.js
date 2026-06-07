/**
 * Soil Heavy Metal Phytoremediation Sizing & ROI Estimator (SHMPS) CLI Tool
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { PhytoCleanupModeler } = require('./model');

// Load local database slice
const dbPath = path.join(__dirname, 'data.json');
const database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

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
    logHeader("SHMPS Help");
    console.log("Usage: node tools/shmps/index.js [options]");
    console.log("\nOptions:");
    console.log("  --list-species             List all species in this tool's database.");
    console.log("  --species, -s <key>        Species key (e.g. 'ficus_religiosa') to run remediation model.");
    console.log("  --interactive              Run in interactive mode.");
    console.log("  --help, -h                 Show this help menu.");
    console.log("\nModel Parameters (Optional for Batch Mode):");
    console.log("  --soil-init <num>          Initial soil metal concentration (mg/kg). Default: 150.0");
    console.log("  --soil-target <num>        Target regulatory metal safety limit (mg/kg). Default: 15.0");
    console.log("  --area <num>               Site area (m²). Default: 5000.0");
    console.log("  --depth <num>              Contaminated soil depth (m). Default: 0.5");
    console.log("  --cost <num>               Planting/disposal cost per hectare per cycle ($). Default: 2000.0");
    console.log("\nExamples:");
    console.log("  node tools/shmps/index.js --species ficus_religiosa --soil-init 120 --soil-target 12 --area 2000");
    console.log("  node tools/shmps/index.js --interactive");
}

function parseArgs() {
    const args = {};
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help' || arg === '-h') {
            args.help = true;
        } else if (arg === '--list-species') {
            args.listSpecies = true;
        } else if (arg === '--interactive') {
            args.interactive = true;
        } else if ((arg === '--species' || arg === '-s') && argv[i + 1]) {
            args.species = argv[++i];
        } else if (arg === '--soil-init' && argv[i + 1]) {
            args.soilInit = parseFloat(argv[++i]);
        } else if (arg === '--soil-target' && argv[i + 1]) {
            args.soilTarget = parseFloat(argv[++i]);
        } else if (arg === '--area' && argv[i + 1]) {
            args.area = parseFloat(argv[++i]);
        } else if (arg === '--depth' && argv[i + 1]) {
            args.depth = parseFloat(argv[++i]);
        } else if (arg === '--cost' && argv[i + 1]) {
            args.cost = parseFloat(argv[++i]);
        }
    }
    return args;
}

function getStatusFormatted(status) {
    let color = colors.fgGreen;
    if (status.includes('NOT RECOMMENDED') || status.includes('LONG')) color = colors.fgRed;
    else if (status.includes('CONDITIONALLY')) color = colors.fgYellow;
    return `${color}${colors.bright}${status}${colors.reset}`;
}

function runCalculation(speciesKey, params = {}) {
    const species = database.species.find(s => s.speciesKey.toLowerCase() === speciesKey.toLowerCase().trim());
    if (!species) {
        console.error(`${colors.fgRed}[ERROR] Species "${speciesKey}" not found in local database.${colors.reset}`);
        process.exit(1);
    }

    const soilInit = params.soilInit !== undefined ? params.soilInit : 150.0;
    const soilTarget = params.soilTarget !== undefined ? params.soilTarget : 15.0;
    const area = params.area !== undefined ? params.area : 5000.0;
    const depth = params.depth !== undefined ? params.depth : 0.5;
    const cost = params.cost !== undefined ? params.cost : 2000.0;

    const bcf = species.bcf;
    const biomassYield = species.biomassYieldKgHa;

    const res = PhytoCleanupModeler.simulateRemediation(
        soilInit,
        soilTarget,
        area,
        depth,
        biomassYield,
        bcf,
        cost
    );

    logHeader("SHMPS Phyto-remediation Report");
    console.log(`${colors.bright}Selected Species:${colors.reset} ${species.scientificName} (${species.commonName})`);
    console.log(`${colors.fgCyan}Literature Sources:${colors.reset} ${species.sourcePapers.join(', ')}`);
    console.log("--------------------------------------------------");
    console.log(`Initial Soil Metal Level:    ${soilInit} mg/kg`);
    console.log(`Target Cleanup Safety Limit:  ${soilTarget} mg/kg`);
    console.log(`Site Surface Area:            ${area} m²`);
    console.log(`Contaminated Soil Depth:      ${depth} m`);
    console.log(`Foliar Bioconcentration (BCF): ${bcf}`);
    console.log(`Dry Biomass Annual Yield:     ${biomassYield} kg/ha/year`);
    console.log(`Planting/Disposal Cost:       $${cost} / hectare / cycle`);
    console.log("--------------------------------------------------");
    console.log(`${colors.bright}Total Contaminated Soil Mass:${colors.reset} ${res.soilMassTons} metric tons`);
    console.log(`${colors.bright}Remediation Cycles Required:${colors.reset}  ${res.cyclesRequired} years/cycles`);
    console.log(`${colors.bright}Estimated Phytoremediation Cost:${colors.reset} $${res.phytoCost.toFixed(2)}`);
    console.log(`${colors.bright}Estimated Excavation Cost (Dump):${colors.reset} $${res.excavationCost.toFixed(2)}`);
    console.log(`${colors.bright}Projected Financial Savings:${colors.reset}     $${res.savingsDollars.toFixed(2)} (${res.savingsPercent}%)`);
    console.log(`Feasibility Index:                       ${getStatusFormatted(res.status)}`);
    console.log(`\n${colors.bright}Financial & Sizing Outlook:${colors.reset}\n${res.warning}`);
    console.log("==================================================\n");
}

function runInteractive() {
    logHeader("SHMPS Interactive Mode");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

    const mainFlow = async () => {
        console.log("Select a species:");
        database.species.forEach((s, idx) => {
            console.log(`  [${idx + 1}] ${s.scientificName} (${s.commonName}) - BCF: ${s.bcf}, Biomass: ${s.biomassYieldKgHa} kg/ha`);
        });
        
        const choiceStr = (await askQuestion(`\nEnter choice (1-${database.species.length}) or 'q' to quit: `)).trim();
        if (choiceStr.toLowerCase() === 'q') {
            rl.close();
            return;
        }

        const idx = parseInt(choiceStr, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= database.species.length) {
            console.log(`${colors.fgRed}Invalid option.${colors.reset}`);
            rl.close();
            return;
        }

        const species = database.species[idx];

        const soilInit = parseFloat(await askQuestion("Initial soil metal level in mg/kg (Default 150): ")) || 150.0;
        const soilTarget = parseFloat(await askQuestion("Regulatory safety threshold in mg/kg (Default 15): ")) || 15.0;
        const area = parseFloat(await askQuestion("Site surface area in m² (Default 5000): ")) || 5000.0;
        const depth = parseFloat(await askQuestion("Contaminated soil depth in m (Default 0.5): ")) || 0.5;
        const cost = parseFloat(await askQuestion("Planting, harvesting, and ash disposal cost/ha/cycle in $ (Default 2000): ")) || 2000.0;

        runCalculation(species.speciesKey, {
            soilInit,
            soilTarget,
            area,
            depth,
            cost
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
    if (args.listSpecies) {
        logHeader("SHMPS Species database Catalog");
        database.species.forEach((s, idx) => {
            console.log(`${idx + 1}. Key: ${s.speciesKey}`);
            console.log(`   Scientific: ${s.scientificName}`);
            console.log(`   Common:     ${s.commonName} (BCF: ${s.bcf}, Biomass: ${s.biomassYieldKgHa} kg/ha)`);
            console.log("--------------------------------------------------");
        });
        process.exit(0);
    }
    if (args.species) {
        runCalculation(args.species, args);
    } else {
        runInteractive();
    }
}

if (require.main === module) {
    main();
}
