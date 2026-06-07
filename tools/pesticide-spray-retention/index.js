/**
 * Agricultural Pesticide Spray Retention & Washoff Modeler (APSRWM) CLI Tool
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { PesticideWashoffModeler } = require('./model');

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
    logHeader("APSRWM Help");
    console.log("Usage: node tools/apsrwm/index.js [options]");
    console.log("\nOptions:");
    console.log("  --list-species             List all species in this tool's database.");
    console.log("  --species, -s <key>        Species key (e.g. 'morus_alba') to map to crop profile.");
    console.log("  --interactive              Run in interactive mode.");
    console.log("  --help, -h                 Show this help menu.");
    console.log("\nModel Parameters (Optional for Batch Mode):");
    console.log("  --conc <num>               Pesticide spray concentration in mg/L. Default: 200.0");
    console.log("  --vol <num>                Applied pesticide spray volume in L. Default: 2.0");
    console.log("  --rain <num>               Rainfall depth in mm. Default: 10.0");
    console.log("  --adjuvant <key>           Adjuvant: 'none', 'surfactant', 'sticker'. Default: 'none'");
    console.log("\nExamples:");
    console.log("  node tools/apsrwm/index.js --species morus_alba --conc 250 --vol 3.0 --rain 15.0");
    console.log("  node tools/apsrwm/index.js --interactive");
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
        } else if (arg === '--conc' && argv[i + 1]) {
            args.conc = parseFloat(argv[++i]);
        } else if (arg === '--vol' && argv[i + 1]) {
            args.vol = parseFloat(argv[++i]);
        } else if (arg === '--rain' && argv[i + 1]) {
            args.rain = parseFloat(argv[++i]);
        } else if (arg === '--adjuvant' && argv[i + 1]) {
            args.adjuvant = argv[++i];
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

function runCalculation(speciesKey, params = {}) {
    const species = database.species.find(s => s.speciesKey.toLowerCase() === speciesKey.toLowerCase().trim());
    if (!species) {
        console.error(`${colors.fgRed}[ERROR] Species "${speciesKey}" not found in local database.${colors.reset}`);
        process.exit(1);
    }

    const conc = params.conc !== undefined ? params.conc : 200.0;
    const vol = params.vol !== undefined ? params.vol : 2.0;
    const rain = params.rain !== undefined ? params.rain : 10.0;
    const adjuvant = (params.adjuvant || 'none').toLowerCase().trim();

    // Map species/morphology/wax to crop profiles:
    // acicular -> 'coniferous', waxy characteristics -> 'waxy', planar/elliptic -> 'broadleaf'
    let cropKey = 'broadleaf';
    if (species.morphology === 'acicular') {
        cropKey = 'coniferous';
    } else if (species.epicuticularWax > 300 && !species.isPubescent) {
        cropKey = 'waxy';
    }

    const res = PesticideWashoffModeler.simulateWashoff(
        cropKey,
        conc,
        vol,
        rain,
        adjuvant
    );

    logHeader("APSRWM Washoff Report");
    console.log(`${colors.bright}Selected Species:${colors.reset} ${species.scientificName} (${species.commonName})`);
    console.log(`${colors.fgCyan}Literature Sources:${colors.reset} ${species.sourcePapers.join(', ')}`);
    console.log("--------------------------------------------------");
    console.log(`Mapped Crop Profile:         ${cropKey.toUpperCase()}`);
    console.log(`Active Ingredient Conc:      ${conc} mg/L`);
    console.log(`Applied Spray Volume:        ${vol} L`);
    console.log(`Precipitation Depth:         ${rain} mm`);
    console.log(`Foliar Adjuvant Additive:    ${adjuvant.toUpperCase()}`);
    console.log("--------------------------------------------------");
    console.log(`${colors.bright}Initial Foliar Intercepted Mass:${colors.reset} ${res.initialLoadMg} mg`);
    console.log(`${colors.bright}Rain Wash-off Fraction:${colors.reset}          ${res.washOffPercent}%`);
    console.log(`${colors.bright}Leached Runoff to Local Soil:${colors.reset}    ${res.leachedToSoilMg} mg`);
    console.log(`${colors.bright}Retained Pesticide on Crop:${colors.reset}      ${res.retainedMg} mg`);
    console.log(`Eco-Toxicological Safety:                 ${getStatusFormatted(res.status, res.cssClass)}`);
    console.log(`\n${colors.bright}Runoff Guidance:${colors.reset}\n${res.warning}`);
    console.log("==================================================\n");
}

function runInteractive() {
    logHeader("APSRWM Interactive Mode");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

    const mainFlow = async () => {
        console.log("Select a species/crop profile:");
        database.species.forEach((s, idx) => {
            console.log(`  [${idx + 1}] ${s.scientificName} (${s.commonName})`);
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

        const conc = parseFloat(await askQuestion("Pesticide spray concentration in mg/L (Default 200): ")) || 200.0;
        const vol = parseFloat(await askQuestion("Spray applied volume on crop canopy in L (Default 2.0): ")) || 2.0;
        const rain = parseFloat(await askQuestion("Rainfall depth in mm (Default 10): ")) || 10.0;
        
        console.log("\nSelect pesticide adjuvant additive:");
        const adjuvants = ['none', 'surfactant', 'sticker'];
        adjuvants.forEach((a, i) => console.log(`  [${i+1}] ${a.toUpperCase()}`));
        const adjIdx = parseInt(await askQuestion(`Option (1-${adjuvants.length}): `), 10) - 1;
        const adjuvant = adjuvants[adjIdx] || 'none';

        runCalculation(species.speciesKey, {
            conc,
            vol,
            rain,
            adjuvant
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
        logHeader("APSRWM Crop/Species database Catalog");
        database.species.forEach((s, idx) => {
            console.log(`${idx + 1}. Key: ${s.speciesKey}`);
            console.log(`   Scientific: ${s.scientificName}`);
            console.log(`   Common:     ${s.commonName}`);
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
