/**
 * Canopy Deposition Velocity & Plume Mitigation Simulator (CDVPMS) CLI Tool
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { CanopyDepositionSimulator } = require('./model');

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
    logHeader("CDVPMS Help");
    console.log("Usage: node tools/cdvpms/index.js [options]");
    console.log("\nOptions:");
    console.log("  --list-species             List all species in this tool's database.");
    console.log("  --species, -s <key>        Species key (e.g. 'pinus_sylvestris') to run simulation.");
    console.log("  --interactive              Run in interactive mode.");
    console.log("  --help, -h                 Show this help menu.");
    console.log("\nSimulation Parameters (Optional for Batch Mode):");
    console.log("  --pm <key>                 PM fraction: 'pm10', 'pm25', 'pm02'. Default: 'pm25'");
    console.log("  --wind <num>               Wind speed (m/s). Default: 2.0");
    console.log("  --lai <num>                Leaf Area Index (LAI). Default: 3.5");
    console.log("  --ambient <num>            Ambient PM concentration (µg/m³). Default: 100.0");
    console.log("  --area <num>               Canopy surface area (m²). Default: 5000.0");
    console.log("  --hours <num>              Exposure duration in hours. Default: 10.0");
    console.log("  --width <num>              Cross-sectional width of the greenbelt (m). Default: 30.0");
    console.log("\nExamples:");
    console.log("  node tools/cdvpms/index.js --species pinus_sylvestris --pm pm10 --wind 4.5 --ambient 150");
    console.log("  node tools/cdvpms/index.js --interactive");
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
        } else if (arg === '--pm' && argv[i + 1]) {
            args.pm = argv[++i];
        } else if (arg === '--wind' && argv[i + 1]) {
            args.wind = parseFloat(argv[++i]);
        } else if (arg === '--lai' && argv[i + 1]) {
            args.lai = parseFloat(argv[++i]);
        } else if (arg === '--ambient' && argv[i + 1]) {
            args.ambient = parseFloat(argv[++i]);
        } else if (arg === '--area' && argv[i + 1]) {
            args.area = parseFloat(argv[++i]);
        } else if (arg === '--hours' && argv[i + 1]) {
            args.hours = parseFloat(argv[++i]);
        } else if (arg === '--width' && argv[i + 1]) {
            args.width = parseFloat(argv[++i]);
        }
    }
    return args;
}

function runCalculation(speciesKey, params = {}) {
    const species = database.species.find(s => s.speciesKey.toLowerCase() === speciesKey.toLowerCase().trim());
    if (!species) {
        console.error(`${colors.fgRed}[ERROR] Species "${speciesKey}" not found in local database.${colors.reset}`);
        process.exit(1);
    }

    const pm = (params.pm || 'pm25').toLowerCase().trim();
    const wind = params.wind !== undefined ? params.wind : 2.0;
    const lai = params.lai !== undefined ? params.lai : 3.5;
    const ambient = params.ambient !== undefined ? params.ambient : 100.0;
    const area = params.area !== undefined ? params.area : 5000.0;
    const hours = params.hours !== undefined ? params.hours : 10.0;
    const width = params.width !== undefined ? params.width : 30.0;

    const isPubescent = species.isPubescent;

    const scrub = CanopyDepositionSimulator.simulatePlumeScrubbing(
        pm,
        lai,
        wind,
        isPubescent,
        ambient,
        area,
        hours,
        width
    );

    logHeader("CDVPMS Plume Mitigation Report");
    console.log(`${colors.bright}Selected Species:${colors.reset} ${species.scientificName} (${species.commonName})`);
    console.log(`${colors.fgCyan}Literature Sources:${colors.reset} ${species.sourcePapers.join(', ')}`);
    console.log("--------------------------------------------------");
    console.log(`Aerodynamic Fraction:     ${pm.toUpperCase()}`);
    console.log(`Local Wind Speed:          ${wind} m/s`);
    console.log(`Leaf Area Index (LAI):     ${lai}`);
    console.log(`Leaf Pubescence (Hairs):   ${isPubescent ? 'Yes (Hairy)' : 'No (Glabrous)'}`);
    console.log(`Leaf Shape:                ${species.morphology.toUpperCase()}`);
    console.log(`Ambient PM Conc:           ${ambient} µg/m³`);
    console.log(`Greenbelt Canopy Area:     ${area} m²`);
    console.log(`Exposure Duration:         ${hours} hours`);
    console.log(`Greenbelt Barrier Width:   ${width} m`);
    console.log("--------------------------------------------------");
    console.log(`${colors.bright}Deposition Velocity (Vd):${colors.reset}       ${scrub.vd} cm/s`);
    console.log(`${colors.bright}Particulate Deposition Flux (F):${colors.reset} ${scrub.depositionFlux} µg/m²·s`);
    console.log(`${colors.bright}Total PM Mass Removed:${colors.reset}          ${scrub.massRemovedGrams.toFixed(2)} grams`);
    console.log(`${colors.bright}Downwind PM Concentration:${colors.reset}      ${scrub.downwindConcentration} µg/m³`);
    console.log(`${colors.bright}Scrubbing Removal Efficiency:${colors.reset}   ${scrub.removalEfficiencyPercent}%`);
    console.log("==================================================\n");
}

function runInteractive() {
    logHeader("CDVPMS Interactive Mode");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

    const mainFlow = async () => {
        console.log("Select a species:");
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

        console.log("\nSelect PM fraction:");
        const fractions = ['pm10', 'pm25', 'pm02'];
        fractions.forEach((f, i) => console.log(`  [${i+1}] ${f.toUpperCase()}`));
        const pmIdx = parseInt(await askQuestion(`Option (1-${fractions.length}): `), 10) - 1;
        const pm = fractions[pmIdx] || 'pm25';

        const wind = parseFloat(await askQuestion("Local wind velocity in m/s (Default 2.0): ")) || 2.0;
        const lai = parseFloat(await askQuestion("Canopy Leaf Area Index (LAI) (Default 3.5): ")) || 3.5;
        const ambient = parseFloat(await askQuestion("Ambient PM concentration in µg/m³ (Default 100): ")) || 100.0;
        const area = parseFloat(await askQuestion("Canopy land surface area in m² (Default 5000): ")) || 5000.0;
        const hours = parseFloat(await askQuestion("Plume exposure duration in hours (Default 10): ")) || 10.0;
        const width = parseFloat(await askQuestion("Greenbelt barrier width along wind vector in m (Default 30): ")) || 30.0;

        runCalculation(species.speciesKey, {
            pm,
            wind,
            lai,
            ambient,
            area,
            hours,
            width
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
        logHeader("CDVPMS Species Database Catalog");
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
