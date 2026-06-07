/**
 * APTI-API Classifier CLI Tool
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { AptiApiClassifier } = require('./model');

// Load local database slice
const dbPath = path.join(__dirname, 'data.json');
const database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Color Utilities
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[ dimm",
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
    logHeader("APTI-API Classifier Help");
    console.log("Usage: node tools/apti_api_classifier/index.js [options]");
    console.log("\nOptions:");
    console.log("  --list-species             List all species in this tool's database.");
    console.log("  --species, -s <key>        Species key (e.g. 'ficus_religiosa') to run indexer.");
    console.log("  --interactive              Run in interactive mode.");
    console.log("  --help, -h                 Show this help menu.");
    console.log("\nExamples:");
    console.log("  node tools/apti_api_classifier/index.js --species alstonia_scholaris");
    console.log("  node tools/apti_api_classifier/index.js --interactive");
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

function runCalculation(speciesKey) {
    const species = database.species.find(s => s.speciesKey.toLowerCase() === speciesKey.toLowerCase().trim());
    if (!species) {
        console.error(`${colors.fgRed}[ERROR] Species "${speciesKey}" not found in local database.${colors.reset}`);
        process.exit(1);
    }

    const aptiResult = AptiApiClassifier.calculateApti(
        species.ascorbicAcid,
        species.totalChlorophyll,
        species.pH,
        species.rwc
    );

    const apiResult = AptiApiClassifier.calculateApi(
        aptiResult.score,
        species.growthHabit,
        species.evergreen,
        species.economicValue
    );

    logHeader("APTI-API Classifier Report");
    console.log(`${colors.bright}Selected Species:${colors.reset} ${species.scientificName} (${species.commonName})`);
    console.log(`${colors.fgCyan}Literature Sources:${colors.reset} ${species.sourcePapers.join(', ')}`);
    console.log("--------------------------------------------------");
    console.log(`Ascorbic Acid:     ${species.ascorbicAcid} mg/g`);
    console.log(`Total Chlorophyll: ${species.totalChlorophyll} mg/g`);
    console.log(`Leaf Extract pH:   ${species.pH}`);
    console.log(`Relative Water:    ${species.rwc}%`);
    console.log(`Growth Form:       ${species.growthHabit}`);
    console.log(`Seasonality:       ${species.evergreen ? 'Evergreen' : 'Deciduous'}`);
    console.log(`Utility Value:     ${species.economicValue.toUpperCase()}`);
    console.log("--------------------------------------------------");
    console.log(`${colors.bright}Air Pollution Tolerance Index (APTI):${colors.reset} ${aptiResult.score}`);
    console.log(`Tolerance Class:   ${getStatusFormatted(aptiResult.classification, aptiResult.cssClass)}`);
    console.log(`${colors.bright}Anticipated Performance Index (API):${colors.reset}  ${apiResult.score} / 16`);
    console.log(`Suitability Grade: ${getStatusFormatted(apiResult.grade, apiResult.stars.includes('★★★★★') ? 'healthy' : 'warning')} [${apiResult.stars}]`);
    console.log("==================================================\n");
}

function runInteractive() {
    logHeader("APTI-API Classifier Interactive Mode");
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
        runCalculation(species.speciesKey);
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
        logHeader("APTI-API Species Database Catalog");
        database.species.forEach((s, idx) => {
            console.log(`${idx + 1}. Key: ${s.speciesKey}`);
            console.log(`   Scientific: ${s.scientificName}`);
            console.log(`   Common:     ${s.commonName}`);
            console.log("--------------------------------------------------");
        });
        process.exit(0);
    }
    if (args.species) {
        runCalculation(args.species);
    } else {
        runInteractive();
    }
}

if (require.main === module) {
    main();
}
