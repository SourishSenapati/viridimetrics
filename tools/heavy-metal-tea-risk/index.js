/**
 * Heavy Metal Translocation & Dietary Exposure Modeler (HM-DETM) CLI Tool
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { HeavyMetalTranslocator } = require('./model');

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
    logHeader("HM-DETM Classifier Help");
    console.log("Usage: node tools/hm_detm/index.js [options]");
    console.log("\nOptions:");
    console.log("  --list-species             List all species in this tool's database.");
    console.log("  --species, -s <key>        Species key (e.g. 'tilia_cordata') to run the model.");
    console.log("  --interactive              Run in interactive mode.");
    console.log("  --help, -h                 Show this help menu.");
    console.log("\nModel Parameters (Optional for Batch Mode):");
    console.log("  --metal <key>              Metal: 'lead', 'cadmium', 'chromium', 'nickel', 'copper', 'zinc'. Default: 'lead'");
    console.log("  --soil-conc <num>          Soil concentration in mg/kg. Default: 100.0");
    console.log("  --leaf-weight <num>        Mass of leaves steeped in tea in grams. Default: 2.0");
    console.log("  --water-vol <num>          Volume of water used to steep tea in L. Default: 0.2");
    console.log("  --daily-intake <num>       Daily volume of tea consumed in L. Default: 0.2");
    console.log("  --body-weight <num>        Body weight of the consumer in kg. Default: 70.0");
    console.log("\nExamples:");
    console.log("  node tools/hm_detm/index.js --species tilia_cordata --metal lead --soil-conc 120");
    console.log("  node tools/hm_detm/index.js --interactive");
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
        } else if (arg === '--metal' && argv[i + 1]) {
            args.metal = argv[++i];
        } else if (arg === '--soil-conc' && argv[i + 1]) {
            args.soilConc = parseFloat(argv[++i]);
        } else if (arg === '--leaf-weight' && argv[i + 1]) {
            args.leafWeight = parseFloat(argv[++i]);
        } else if (arg === '--water-vol' && argv[i + 1]) {
            args.waterVol = parseFloat(argv[++i]);
        } else if (arg === '--daily-intake' && argv[i + 1]) {
            args.dailyIntake = parseFloat(argv[++i]);
        } else if (arg === '--body-weight' && argv[i + 1]) {
            args.bodyWeight = parseFloat(argv[++i]);
        }
    }
    return args;
}

function getStatusFormatted(status) {
    let color = colors.fgGreen;
    if (status.includes('TOXIC') || status.includes('HAZARD')) color = colors.fgRed;
    else if (status.includes('ELEVATED') || status.includes('RISK')) color = colors.fgYellow;
    return `${color}${colors.bright}${status}${colors.reset}`;
}

function runCalculation(speciesKey, params = {}) {
    const species = database.species.find(s => s.speciesKey.toLowerCase() === speciesKey.toLowerCase().trim());
    if (!species) {
        console.error(`${colors.fgRed}[ERROR] Species "${speciesKey}" not found in local database.${colors.reset}`);
        process.exit(1);
    }

    const metal = (params.metal || 'lead').toLowerCase().trim();
    const soilConc = params.soilConc !== undefined ? params.soilConc : 100.0;
    const leafWeight = params.leafWeight !== undefined ? params.leafWeight : 2.0;
    const waterVol = params.waterVol !== undefined ? params.waterVol : 0.2;
    const dailyIntake = params.dailyIntake !== undefined ? params.dailyIntake : 0.2;
    const bodyWeight = params.bodyWeight !== undefined ? params.bodyWeight : 70.0;

    const tf = species.heavyMetalTF[metal];
    const extractionRate = species.heavyMetalExtractionRate[metal];

    if (tf === undefined || extractionRate === undefined) {
        console.error(`${colors.fgRed}[ERROR] Metal "${metal}" parameters not defined for species "${species.scientificName}".${colors.reset}`);
        process.exit(1);
    }

    const leafConc = soilConc * tf;
    const riskResult = HeavyMetalTranslocator.simulateDietaryRisk(
        metal,
        leafConc,
        leafWeight,
        extractionRate,
        waterVol,
        dailyIntake,
        bodyWeight
    );

    logHeader("HM-DETM Ingestion Risk Report");
    console.log(`${colors.bright}Selected Species:${colors.reset} ${species.scientificName} (${species.commonName})`);
    console.log(`${colors.fgCyan}Literature Sources:${colors.reset} ${species.sourcePapers.join(', ')}`);
    console.log("--------------------------------------------------");
    console.log(`Analyzed Heavy Metal:  ${metal.toUpperCase()}`);
    console.log(`Soil Concentration:    ${soilConc} mg/kg`);
    console.log(`Translocation Factor:  ${tf}`);
    console.log(`Resulting Leaf Conc:   ${leafConc.toFixed(4)} mg/kg dry weight`);
    console.log("--- Infusion Steeping Profile ---");
    console.log(`Dry Leaves Steeped:    ${leafWeight} g`);
    console.log(`Water Transfer Rate:   ${extractionRate}%`);
    console.log(`Water Steep Volume:    ${waterVol} L`);
    console.log(`Daily Intake Volume:   ${dailyIntake} L`);
    console.log(`Consumer Body Weight:  ${bodyWeight} kg`);
    console.log("--------------------------------------------------");
    console.log(`${colors.bright}Daily Intake of Metal (DIM):${colors.reset} ${riskResult.dailyIntakeOfMetal.toFixed(7)} mg/kg/day`);
    console.log(`${colors.bright}Hazard Quotient (HQ):${colors.reset}        ${riskResult.hazardQuotient}`);
    console.log(`Toxicological Status:       ${getStatusFormatted(riskResult.riskStatus)}`);
    console.log(`\n${colors.bright}Management Guidance:${colors.reset}\n${riskResult.warning}`);
    console.log("==================================================\n");
}

function runInteractive() {
    logHeader("HM-DETM Interactive Mode");
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

        console.log("\nSelect metal type:");
        const metals = ['lead', 'cadmium', 'chromium', 'nickel', 'copper', 'zinc'];
        metals.forEach((m, i) => console.log(`  [${i+1}] ${m.toUpperCase()}`));
        const metalIdx = parseInt(await askQuestion(`Option (1-${metals.length}): `), 10) - 1;
        const metal = metals[metalIdx] || 'lead';
        
        const soilConc = parseFloat(await askQuestion("Soil Concentration in mg/kg (Default 100): ")) || 100.0;
        const leafWeight = parseFloat(await askQuestion("Foliar mass steeped in tea in grams (Default 2.0): ")) || 2.0;
        const waterVol = parseFloat(await askQuestion("Infusion steeping water volume in L (Default 0.2): ")) || 0.2;
        const dailyIntake = parseFloat(await askQuestion("Daily volume of tea consumed in L (Default 0.2): ")) || 0.2;
        const bodyWeight = parseFloat(await askQuestion("Consumer body weight in kg (Default 70): ")) || 70.0;

        runCalculation(species.speciesKey, {
            metal,
            soilConc,
            leafWeight,
            waterVol,
            dailyIntake,
            bodyWeight
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
        logHeader("HM-DETM Species Database Catalog");
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
