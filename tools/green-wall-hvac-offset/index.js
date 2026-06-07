/**
 * Urban Green Wall Evapotranspirational Cooling & Building HVAC Offset Calculator (GWECB) CLI Tool
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { GreenWallThermalPredictor } = require('./model');

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
    logHeader("GWECB Help");
    console.log("Usage: node tools/gwecb/index.js [options]");
    console.log("\nOptions:");
    console.log("  --list-species             List all species in this tool's database.");
    console.log("  --species, -s <key>        Species key (e.g. 'hedera_helix') to run simulation.");
    console.log("  --interactive              Run in interactive mode.");
    console.log("  --help, -h                 Show this help menu.");
    console.log("\nModel Parameters (Optional for Batch Mode):");
    console.log("  --area <num>               Vertical wall area in m². Default: 150.0");
    console.log("  --lai <num>                Leaf Area Index (LAI) of the green wall. Default: 4.0");
    console.log("  --cop <num>                HVAC cooling Coefficient of Performance (COP). Default: 3.0");
    console.log("  --elec <num>               Electricity utility rate in $/kWh. Default: 0.15");
    console.log("  --reduction <num>          Solar radiation reduction percentage (%). Default: 30.0");
    console.log("\nExamples:");
    console.log("  node tools/gwecb/index.js --species hedera_helix --area 200 --lai 4.5 --elec 0.18");
    console.log("  node tools/gwecb/index.js --interactive");
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
        } else if (arg === '--area' && argv[i + 1]) {
            args.area = parseFloat(argv[++i]);
        } else if (arg === '--lai' && argv[i + 1]) {
            args.lai = parseFloat(argv[++i]);
        } else if (arg === '--cop' && argv[i + 1]) {
            args.cop = parseFloat(argv[++i]);
        } else if (arg === '--elec' && argv[i + 1]) {
            args.elec = parseFloat(argv[++i]);
        } else if (arg === '--reduction' && argv[i + 1]) {
            args.reduction = parseFloat(argv[++i]);
        }
    }
    return args;
}

function getStatusFormatted(status, efficiencyClass) {
    let color = colors.fgGreen;
    if (efficiencyClass.includes('NEGLIGIBLE')) color = colors.fgRed;
    else if (status.includes('LOW')) color = colors.fgYellow;
    return `${color}${colors.bright}${status}${colors.reset}`;
}

function runCalculation(speciesKey, params = {}) {
    const species = database.species.find(s => s.speciesKey.toLowerCase() === speciesKey.toLowerCase().trim());
    if (!species) {
        console.error(`${colors.fgRed}[ERROR] Species "${speciesKey}" not found in local database.${colors.reset}`);
        process.exit(1);
    }

    const area = params.area !== undefined ? params.area : 150.0;
    const lai = params.lai !== undefined ? params.lai : 4.0;
    const cop = params.cop !== undefined ? params.cop : 3.0;
    const elec = params.elec !== undefined ? params.elec : 0.15;
    const reduction = params.reduction !== undefined ? params.reduction : 30.0;

    const transpirationRate = species.transpirationRate;

    const res = GreenWallThermalPredictor.simulateThermalOffset(
        area,
        lai,
        transpirationRate,
        cop,
        elec,
        reduction
    );

    logHeader("GWECB Green Wall Report");
    console.log(`${colors.bright}Selected Species:${colors.reset} ${species.scientificName} (${species.commonName})`);
    console.log(`${colors.fgCyan}Literature Sources:${colors.reset} ${species.sourcePapers.join(', ')}`);
    console.log("--------------------------------------------------");
    console.log(`Vertical Wall Surface Area:   ${area} m²`);
    console.log(`Green Wall Leaf Area Index:   ${lai}`);
    console.log(`Species Transpiration Rate:   ${transpirationRate} L/m²·day`);
    console.log(`Air Conditioner System COP:   ${cop}`);
    console.log(`Utility Electricity Cost:     $${elec} / kWh`);
    console.log(`Direct Solar Load Shielding:  ${reduction}%`);
    console.log("--------------------------------------------------");
    console.log(`${colors.bright}Daily Water Transpired:${colors.reset}         ${res.dailyWaterTranspiredL} Liters`);
    console.log(`${colors.bright}Latent Evaporative Cooling Load:${colors.reset} ${res.latentCoolingKwh} kWh/day`);
    console.log(`${colors.bright}Solar Heat Shading Offset:${colors.reset}      ${res.shadingSavingsKwh} kWh/day`);
    console.log(`${colors.bright}Cumulative Thermal Load Offset:${colors.reset} ${res.totalThermalKwh} kWh/day`);
    console.log(`${colors.bright}HVAC Electricity Mitigated:${colors.reset}     ${res.hvacElectricalKwhSaved} kWh/day`);
    console.log(`${colors.bright}Daily Financial Saving:${colors.reset}         $${res.dailySavingsDollars.toFixed(2)}`);
    console.log(`${colors.bright}Daily Carbon Emission Offset:${colors.reset}   ${res.dailyCo2MitigatedKg} kg CO2`);
    console.log(`Green Wall Impact Tier:                  ${getStatusFormatted(res.status, res.efficiencyClass)}`);
    console.log(`Performance Class:                       ${colors.bright}${res.efficiencyClass}${colors.reset}`);
    console.log("==================================================\n");
}

function runInteractive() {
    logHeader("GWECB Interactive Mode");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

    const mainFlow = async () => {
        console.log("Select a species:");
        database.species.forEach((s, idx) => {
            console.log(`  [${idx + 1}] ${s.scientificName} (${s.commonName}) - Transpiration: ${s.transpirationRate} L/m²·day`);
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

        const area = parseFloat(await askQuestion("Vertical green wall surface area in m² (Default 150): ")) || 150.0;
        const lai = parseFloat(await askQuestion("Green wall Leaf Area Index (LAI) (Default 4.0): ")) || 4.0;
        const cop = parseFloat(await askQuestion("Building AC coefficient of performance (COP) (Default 3.0): ")) || 3.0;
        const elec = parseFloat(await askQuestion("Local electricity utility rate in $/kWh (Default 0.15): ")) || 0.15;
        const reduction = parseFloat(await askQuestion("Vegetative shading solar load block percentage (%) (Default 30): ")) || 30.0;

        runCalculation(species.speciesKey, {
            area,
            lai,
            cop,
            elec,
            reduction
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
        logHeader("GWECB Species database Catalog");
        database.species.forEach((s, idx) => {
            console.log(`${idx + 1}. Key: ${s.speciesKey}`);
            console.log(`   Scientific: ${s.scientificName}`);
            console.log(`   Common:     ${s.commonName} (Transpiration: ${s.transpirationRate} L/m²·day)`);
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
