/**
 * ViridiMetrics Premium CLI Tool
 * Allows running environmental and cross-industry calculations on literature species.
 * 
 * Run with: node tools/cli.js --help
 * 
 * Author: Antigravity AI
 * Date: June 7, 2026
 */

const readline = require('readline');
const engine = require('./engine');

// Color Utilities
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    fgRed: "\x1b[31m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgBlue: "\x1b[34m",
    fgMagenta: "\x1b[35m",
    fgCyan: "\x1b[36m",
    bgBlue: "\x1b[44m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgRed: "\x1b[41m"
};

function logHeader(text) {
    console.log(`\n${colors.fgBlue}${colors.bright}=== ${text.toUpperCase()} ===${colors.reset}\n`);
}

function logSuccess(text) {
    console.log(`${colors.fgGreen}${colors.bright}[SUCCESS] ${text}${colors.reset}`);
}

LogWarning = function(text) {
    console.log(`${colors.fgYellow}${colors.bright}[WARNING] ${text}${colors.reset}`);
};

LogError = function(text) {
    console.log(`${colors.fgRed}${colors.bright}[ERROR] ${text}${colors.reset}`);
};

// Help Guide
function printHelp() {
    logHeader("ViridiMetrics Premium CLI Help");
    console.log("Usage: node tools/cli.js [options]");
    console.log("\nCommands:");
    console.log("  --list-species             List all species in the database and their source papers.");
    console.log("  --interactive              Run the CLI in step-by-step interactive mode.");
    console.log("  --help, -h                 Display this help information.");
    console.log("\nBatch Argument Mode Options:");
    console.log("  --tool, -t <name>          Select the tool to run. Options (Developer-Centric Code Keys):");
    console.log("                             'greenbelt-suitability-index' (EcoCanopy)");
    console.log("                             'heavy-metal-tea-risk'        (PhytoBrew)");
    console.log("                             'pm-deposition-velocity'      (PlumeScrub)");
    console.log("                             'dermal-skin-air-partition'   (SkinBarrier)");
    console.log("                             'pesticide-spray-retention'   (PestiWash)");
    console.log("                             'hvac-filter-clog-energy'     (BlowerStrain)");
    console.log("                             'phytoremediation-sizing-roi' (PhytoClean)");
    console.log("                             'green-wall-hvac-offset'      (TranspiraCool)");
    console.log("  --species, -s <key>        Selected species key (e.g. 'ficus_religiosa').");
    console.log("\nTool-Specific Parameters:");
    console.log("  [heavy-metal-tea-risk] (PhytoBrew)");
    console.log("    --metal <key>            Metal name: 'lead', 'cadmium', 'chromium', 'nickel', 'copper', 'zinc'.");
    console.log("    --soil-conc <num>        Soil metal concentration (mg/kg). Default: 100.");
    console.log("    --leaf-weight <num>      Mass of leaves steeped in tea (g). Default: 2.0.");
    console.log("    --water-vol <num>        Volume of water used to steep tea (L). Default: 0.2.");
    console.log("    --daily-intake <num>     Daily volume of tea consumed (L). Default: 0.2.");
    console.log("    --body-weight <num>      Body weight of the consumer (kg). Default: 70.");
    console.log("  [pm-deposition-velocity] (PlumeScrub)");
    console.log("    --pm <key>               PM size: 'pm10', 'pm25', 'pm02'. Default: 'pm25'.");
    console.log("    --wind <num>             Wind speed (m/s). Default: 2.0.");
    console.log("    --lai <num>              Leaf Area Index (LAI). Default: 3.5.");
    console.log("    --ambient <num>          Ambient atmospheric PM concentration (µg/m³). Default: 100.");
    console.log("    --area <num>             Land area of the greenbelt canopy (m²). Default: 5000.");
    console.log("    --hours <num>            Exposure duration in hours. Default: 10.");
    console.log("    --width <num>            Cross-sectional width of the greenbelt (m). Default: 30.");
    console.log("  [dermal-skin-air-partition] (SkinBarrier)");
    console.log("    --compound <key>         Compound: 'phenanthrene', 'benzo_a_pyrene', 'toluene'. Default: 'phenanthrene'.");
    console.log("    --lipid <num>            Skin lipid volume (mL). Default: 1.0.");
    console.log("    --air <num>              Ambient air concentration (µg/m³). Default: 100.");
    console.log("    --hours <num>            Exposure duration in hours. Default: 8.");
    console.log("  [pesticide-spray-retention] (PestiWash)");
    console.log("    --conc <num>             Pesticide spray concentration (mg/L). Default: 200.");
    console.log("    --vol <num>              Applied pesticide spray volume (L). Default: 2.0.");
    console.log("    --rain <num>             Rainfall depth (mm). Default: 10.");
    console.log("    --adjuvant <key>         Adjuvant: 'none', 'surfactant', 'sticker'. Default: 'none'.");
    console.log("  [hvac-filter-clog-energy] (BlowerStrain)");
    console.log("    --filter <key>           Filter grade: 'merv8', 'merv13', 'hepa'. Default: 'merv13'.");
    console.log("    --pm <num>               Ambient PM concentration (µg/m³). Default: 100.");
    console.log("    --flow <num>             HVAC air flow volume (m³/h). Default: 2000.");
    console.log("    --hours <num>            Operational blower hours. Default: 240.");
    console.log("  [phytoremediation-sizing-roi] (PhytoClean)");
    console.log("    --soil-init <num>        Initial soil metal concentration (mg/kg). Default: 150.");
    console.log("    --soil-target <num>      Regulatory target metal safety limit (mg/kg). Default: 15.");
    console.log("    --area <num>             Site land area (m²). Default: 5000.");
    console.log("    --depth <num>            Contaminated soil depth (m). Default: 0.5.");
    console.log("    --cost <num>             Planting/disposal cost per hectare per cycle ($). Default: 2000.");
    console.log("  [green-wall-hvac-offset] (TranspiraCool)");
    console.log("    --area <num>             Vertical green wall area (m²). Default: 150.");
    console.log("    --lai <num>              Leaf Area Index of green wall. Default: 4.0.");
    console.log("    --cop <num>              Coefficient of Performance of HVAC system. Default: 3.0.");
    console.log("    --elec <num>             Local cost of electricity ($/kWh). Default: 0.15.");
    console.log("    --reduction <num>        Solar heat reduction percentage (%). Default: 30.");
    console.log("\nExamples:");
    console.log("  node tools/cli.js --list-species");
    console.log("  node tools/cli.js --tool greenbelt-suitability-index --species ficus_religiosa");
    console.log("  node tools/cli.js -t heavy-metal-tea-risk -s tilia_cordata --metal lead --soil-conc 120");
    console.log("  node tools/cli.js -t pm-deposition-velocity -s pinus_sylvestris --pm pm10 --wind 4.5 --ambient 150");
    console.log("");
}

// Argument Parser
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
        } else if ((arg === '--tool' || arg === '-t') && argv[i + 1]) {
            args.tool = argv[++i];
        } else if ((arg === '--species' || arg === '-s') && argv[i + 1]) {
            args.species = argv[++i];
        } else if (arg.startsWith('--')) {
            const key = arg.slice(2);
            if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
                const val = argv[++i];
                // Try parsing numbers if applicable
                const num = parseFloat(val);
                args[key] = isNaN(num) ? val : num;
            } else {
                args[key] = true;
            }
        }
    }
    return args;
}

// Format colorized status alerts
function getStatusFormatted(status, cssClass) {
    let color = colors.fgGreen;
    if (cssClass.includes('danger') || cssClass.includes('red')) color = colors.fgRed;
    else if (cssClass.includes('warning') || cssClass.includes('yellow')) color = colors.fgYellow;
    return `${color}${colors.bright}${status}${colors.reset}`;
}

// Print reports in Terminal
function printReport(tool, data) {
    // Mapping internal keys (c) to Display names (a) and Scientific context (b)
    const titles = {
        'greenbelt-suitability-index': 'EcoCanopy [APTI-API Classifier]',
        'heavy-metal-tea-risk': 'PhytoBrew [HM-DETM Modeler]',
        'pm-deposition-velocity': 'PlumeScrub [CDVPMS Plume Simulator]',
        'dermal-skin-air-partition': 'SkinBarrier [SDPEM Skin Modeler]',
        'pesticide-spray-retention': 'PestiWash [APSRWM Pesticide Modeler]',
        'hvac-filter-clog-energy': 'BlowerStrain [HFCFPEP Clogging Predictor]',
        'phytoremediation-sizing-roi': 'PhytoClean [SHMPS Phytoremediation Estimator]',
        'green-wall-hvac-offset': 'TranspiraCool [GWECB HVAC Offset Calculator]'
    };

    logHeader(`Tool Output - ${titles[tool] || tool.toUpperCase()}`);
    
    if (data.speciesInfo) {
        console.log(`${colors.bright}Selected Species:${colors.reset} ${data.speciesInfo.scientificName} (${data.speciesInfo.commonName})`);
        if (data.speciesInfo.sourcePapers) {
            console.log(`${colors.dim}Literature Source:${colors.reset} ${data.speciesInfo.sourcePapers.join(', ')}`);
        }
        console.log("--------------------------------------------------");
    }

    switch (tool) {
        case 'greenbelt-suitability-index':
            console.log(`Ascorbic Acid:     ${data.inputs.ascorbicAcid} mg/g`);
            console.log(`Total Chlorophyll: ${data.inputs.totalChlorophyll} mg/g`);
            console.log(`Leaf Extract pH:   ${data.inputs.pH}`);
            console.log(`Relative Water:    ${data.inputs.rwc}%`);
            console.log(`Growth Form:       ${data.inputs.growthHabit}`);
            console.log(`Seasonality:       ${data.inputs.evergreen ? 'Evergreen' : 'Deciduous'}`);
            console.log(`Utility Value:     ${data.inputs.economicValue.toUpperCase()}`);
            console.log("--------------------------------------------------");
            console.log(`${colors.bright}Air Pollution Tolerance Index (APTI):${colors.reset} ${data.apti.score}`);
            console.log(`Tolerance Class:   ${getStatusFormatted(data.apti.classification, data.apti.cssClass)}`);
            console.log(`${colors.bright}Anticipated Performance Index (API):${colors.reset}  ${data.api.score} / 16`);
            console.log(`Suitability Grade: ${getStatusFormatted(data.api.grade, data.api.stars.includes('★') && !data.api.stars.includes('☆') ? 'healthy' : (data.api.stars.includes('★★★★★') ? 'healthy' : 'warning'))} [${data.api.stars}]`);
            break;
            
        case 'heavy-metal-tea-risk':
            console.log(`Analyzed Heavy Metal:  ${data.metal}`);
            console.log(`Soil Concentration:    ${data.soilConcentrationMgKg} mg/kg`);
            console.log(`Translocation Factor:  ${data.translocationFactor}`);
            console.log(`Resulting Leaf Conc:   ${data.calculatedLeafConcMgKg} mg/kg dry weight`);
            console.log("--- Infusion Steeping Profile ---");
            console.log(`Dry Leaves Steeped:    ${data.inputs.leafWeightGrams} g`);
            console.log(`Water Transfer Rate:   ${data.inputs.extractionRatePercent}%`);
            console.log(`Water Steep Volume:    ${data.inputs.steepWaterVolL} L`);
            console.log(`Daily Intake Volume:   ${data.inputs.dailyIntakeL} L`);
            console.log(`Consumer Body Weight:  ${data.inputs.bodyWeightKg} kg`);
            console.log("--------------------------------------------------");
            console.log(`${colors.bright}Daily Intake of Metal (DIM):${colors.reset} ${data.risk.dailyIntakeOfMetal} mg/kg/day`);
            console.log(`${colors.bright}Hazard Quotient (HQ):${colors.reset}        ${data.risk.hazardQuotient}`);
            console.log(`Toxicological Status:       ${getStatusFormatted(data.risk.riskStatus, data.risk.riskStatus.includes('TOXIC') ? 'danger' : (data.risk.riskStatus.includes('ELEVATED') ? 'warning' : 'healthy'))}`);
            console.log(`\n${colors.bright}Management Guidance:${colors.reset}\n${data.risk.warning}`);
            break;

        case 'pm-deposition-velocity':
            console.log(`Aerodynamic Fraction:     ${data.inputs.pmSize}`);
            console.log(`Local Wind Speed:          ${data.inputs.windSpeedMs} m/s`);
            console.log(`Leaf Area Index (LAI):     ${data.inputs.leafAreaIndex}`);
            console.log(`Leaf Pubescence (Hairs):   ${data.speciesInfo.isPubescent ? 'Yes (Hairy)' : 'No (Glabrous)'}`);
            console.log(`Leaf Shape:                ${data.speciesInfo.morphology.toUpperCase()}`);
            console.log(`Ambient PM Conc:           ${data.inputs.ambientConcentrationUgM3} µg/m³`);
            console.log(`Greenbelt Canopy Area:     ${data.inputs.canopyAreaM2} m²`);
            console.log(`Exposure Duration:         ${data.inputs.durationHours} hours`);
            console.log(`Greenbelt Barrier Width:   ${data.inputs.barrierWidthMeters} m`);
            console.log("--------------------------------------------------");
            console.log(`${colors.bright}Deposition Velocity (Vd):${colors.reset}       ${data.simulation.vd} cm/s`);
            console.log(`${colors.bright}Particulate Deposition Flux (F):${colors.reset} ${data.simulation.depositionFlux} µg/m²·s`);
            console.log(`${colors.bright}Total PM Mass Removed:${colors.reset}          ${data.simulation.massRemovedGrams.toFixed(2)} grams`);
            console.log(`${colors.bright}Downwind PM Concentration:${colors.reset}      ${data.simulation.downwindConcentration} µg/m³`);
            console.log(`${colors.bright}Scrubbing Removal Efficiency:${colors.reset}   ${data.simulation.removalEfficiencyPercent}%`);
            break;

        case 'dermal-skin-air-partition':
            console.log(`Organic Contaminant:       ${data.compound}`);
            console.log(`Skin Lipid Volume:         ${data.inputs.skinLipidVolMl} mL`);
            console.log(`Ambient Air Concentration:  ${data.inputs.airConcUgM3} µg/m³`);
            console.log(`Exposure Duration:         ${data.inputs.exposureHours} hours`);
            console.log("--------------------------------------------------");
            console.log(`${colors.bright}Skin-Air Partition Coefficient (K_skin_air):${colors.reset} ${data.result.kSkinAir}`);
            console.log(`${colors.bright}Max Dermal Equilibrium Capacity:${colors.reset}             ${data.result.maxCapacityUg} µg`);
            console.log(`${colors.bright}Cumulative Dermal Dose Absorbed:${colors.reset}             ${data.result.massAbsorbedUg} µg`);
            console.log(`Dermal Exposure Status:                       ${getStatusFormatted(data.result.status, data.result.cssClass)}`);
            console.log(`\n${colors.bright}Occupational Health Alert:${colors.reset}\n${data.result.warning}`);
            break;

        case 'pesticide-spray-retention':
            console.log(`Mapped Crop Profile:         ${data.mappedCropProfile}`);
            console.log(`Active Ingredient Conc:      ${data.inputs.concentrationMgL} mg/L`);
            console.log(`Applied Spray Volume:        ${data.inputs.sprayVolL} L`);
            console.log(`Precipitation Depth:         ${data.inputs.rainfallMm} mm`);
            console.log(`Foliar Adjuvant Additive:    ${data.inputs.adjuvant.toUpperCase()}`);
            console.log("--------------------------------------------------");
            console.log(`${colors.bright}Initial Foliar Intercepted Mass:${colors.reset} ${data.washoff.initialLoadMg} mg`);
            console.log(`${colors.bright}Rain Wash-off Fraction:${colors.reset}          ${data.washoff.washOffPercent}%`);
            console.log(`${colors.bright}Leached Runoff to Local Soil:${colors.reset}    ${data.washoff.leachedToSoilMg} mg`);
            console.log(`${colors.bright}Retained Pesticide on Crop:${colors.reset}      ${data.washoff.retainedMg} mg`);
            console.log(`Eco-Toxicological Safety:                 ${getStatusFormatted(data.washoff.status, data.washoff.cssClass)}`);
            console.log(`\n${colors.bright}Runoff Guidance:${colors.reset}\n${data.washoff.warning}`);
            break;

        case 'hvac-filter-clog-energy':
            console.log(`HVAC Filter Grade:          ${data.filterGrade}`);
            console.log(`Ambient PM Concentration:   ${data.inputs.pmConcUgM3} µg/m³`);
            console.log(`System Air Flow Volume:     ${data.inputs.flowRateM3H} m³/h`);
            console.log(`Operational Run Time:       ${data.inputs.exposureHours} hours`);
            console.log("--------------------------------------------------");
            console.log(`${colors.bright}Filter Dust Cake Captured:${colors.reset}   ${data.clogging.dustCapturedMg} mg`);
            console.log(`${colors.bright}Filter Clogging Fraction:${colors.reset}    ${data.clogging.cloggingPercent}%`);
            console.log(`${colors.bright}Clogged Pressure Resistance:${colors.reset} ${data.clogging.pressureDropPa} Pa`);
            console.log(`${colors.bright}Incremental Fan Power Draw:${colors.reset}  ${data.clogging.fanPowerIncreaseWatts} Watts`);
            console.log(`${colors.bright}Excess Energy Overhead:${colors.reset}      ${data.clogging.energyOverheadKwh} kWh`);
            console.log(`HVAC Maintenance Status:                 ${getStatusFormatted(data.clogging.status, data.clogging.cssClass)}`);
            console.log(`\n${colors.bright}Service Guidance:${colors.reset}\n${data.clogging.warning}`);
            break;

        case 'phytoremediation-sizing-roi':
            console.log(`Initial Soil Metal Level:    ${data.inputs.soilConcInitMgKg} mg/kg`);
            console.log(`Target Cleanup Safety Limit:  ${data.inputs.soilConcTargetMgKg} mg/kg`);
            console.log(`Site Surface Area:            ${data.inputs.siteAreaM2} m²`);
            console.log(`Contaminated Soil Depth:      ${data.inputs.soilDepthM} m`);
            console.log(`Foliar Bioconcentration (BCF): ${data.speciesInfo.bioconcentrationFactor}`);
            console.log(`Dry Biomass Annual Yield:     ${data.speciesInfo.biomassYieldKgHa} kg/ha/year`);
            console.log(`Planting/Disposal Cost:       $${data.inputs.costPerCycleHa} / hectare / cycle`);
            console.log("--------------------------------------------------");
            console.log(`${colors.bright}Total Contaminated Soil Mass:${colors.reset} ${data.cleanup.soilMassTons} metric tons`);
            console.log(`${colors.bright}Remediation Cycles Required:${colors.reset}  ${data.cleanup.cyclesRequired} years/cycles`);
            console.log(`${colors.bright}Estimated Phytoremediation Cost:${colors.reset} $${data.cleanup.phytoCost.toFixed(2)}`);
            console.log(`${colors.bright}Estimated Excavation Cost (Dump):${colors.reset} $${data.cleanup.excavationCost.toFixed(2)}`);
            console.log(`${colors.bright}Projected Financial Savings:${colors.reset}     $${data.cleanup.savingsDollars.toFixed(2)} (${data.cleanup.savingsPercent}%)`);
            console.log(`Feasibility Index:                       ${getStatusFormatted(data.cleanup.status, data.cleanup.status.includes('HIGHLY') ? 'healthy' : (data.cleanup.status.includes('NOT') ? 'danger' : 'warning'))}`);
            console.log(`\n${colors.bright}Financial & Sizing Outlook:${colors.reset}\n${data.cleanup.warning}`);
            break;

        case 'green-wall-hvac-offset':
            console.log(`Vertical Wall Surface Area:   ${data.inputs.wallAreaM2} m²`);
            console.log(`Green Wall Leaf Area Index:   ${data.inputs.solarHeatGainReductionPercent ? data.inputs.leafAreaIndex : '4.0'}`);
            console.log(`Species Transpiration Rate:   ${data.speciesInfo.transpirationRateLPerM2Day} L/m²·day`);
            console.log(`Air Conditioner System COP:   ${data.inputs.copCooling}`);
            console.log(`Utility Electricity Cost:     $${data.inputs.electricityCostPerKwh} / kWh`);
            console.log(`Direct Solar Load Shielding:  ${data.inputs.solarHeatGainReductionPercent}%`);
            console.log("--------------------------------------------------");
            console.log(`${colors.bright}Daily Water Transpired:${colors.reset}         ${data.offset.dailyWaterTranspiredL} Liters`);
            console.log(`${colors.bright}Latent Evaporative Cooling Load:${colors.reset} ${data.offset.latentCoolingKwh} kWh/day`);
            console.log(`${colors.bright}Solar Heat Shading Offset:${colors.reset}      ${data.offset.shadingSavingsKwh} kWh/day`);
            console.log(`${colors.bright}Cumulative Thermal Load Offset:${colors.reset} ${data.offset.totalThermalKwh} kWh/day`);
            console.log(`${colors.bright}HVAC Electricity Mitigated:${colors.reset}     ${data.offset.hvacElectricalKwhSaved} kWh/day`);
            console.log(`${colors.bright}Daily Financial Saving:${colors.reset}         $${data.offset.dailySavingsDollars.toFixed(2)}`);
            console.log(`${colors.bright}Daily Carbon Emission Offset:${colors.reset}   ${data.offset.dailyCo2MitigatedKg} kg CO2`);
            console.log(`Green Wall Impact Tier:                  ${getStatusFormatted(data.offset.status, data.offset.efficiencyClass.includes('APEX') ? 'healthy' : (data.offset.efficiencyClass.includes('NEGLIGIBLE') ? 'danger' : 'warning'))}`);
            console.log(`Performance Class:                       ${colors.bright}${data.offset.efficiencyClass}${colors.reset}`);
            break;
    }
    console.log("==================================================\n");
}

// Interactive Prompter
function runInteractive() {
    logHeader("ViridiMetrics Premium Interactive Panel");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

    const list = engine.getSpeciesList();

    const mainFlow = async () => {
        console.log("Select a tool to run:");
        console.log("  [1] EcoCanopy (Air Pollution Tolerance Classifier - APTI-API)");
        console.log("  [2] PhytoBrew (Heavy Metal Translocation & Dietary Exposure - HM-DETM)");
        console.log("  [3] PlumeScrub (Canopy Deposition Velocity & Plume Mitigation - CDVPMS)");
        console.log("  [4] SkinBarrier (Skin Dermal Partition & Chemical Exposure - SDPEM)");
        console.log("  [5] PestiWash (Pesticide Spray Retention & Washoff - APSRWM)");
        console.log("  [6] BlowerStrain (HVAC Filter Clogging & Fan Power Overhead - HFCFPEP)");
        console.log("  [7] PhytoClean (Soil Heavy Metal Phytoremediation Sizing & ROI - SHMPS)");
        console.log("  [8] TranspiraCool (Vertical Green Wall Thermal Cooling & HVAC Offset - GWECB)");
        console.log("  [9] Estimate Parameters for Unlisted Species (k-NN RAG & Neural Network)");
        console.log("  [10] Learn Dynamic System Equations (SINDy Symbolic Regression)");
        console.log("  [11] Exit CLI");
        
        const toolChoice = (await askQuestion("\nEnter option number (1-11): ")).trim();
        
        if (toolChoice === '11') {
            console.log("Goodbye!");
            rl.close();
            return;
        }

        const toolsMap = {
            '1': 'greenbelt-suitability-index',
            '2': 'heavy-metal-tea-risk',
            '3': 'pm-deposition-velocity',
            '4': 'dermal-skin-air-partition',
            '5': 'pesticide-spray-retention',
            '6': 'hvac-filter-clog-energy',
            '7': 'phytoremediation-sizing-roi',
            '8': 'green-wall-hvac-offset',
            '9': 'rag',
            '10': 'sindy'
        };

        const tool = toolsMap[toolChoice];
        if (!tool) {
            LogError("Invalid tool selection. Restarting interactive session...");
            await new Promise(r => setTimeout(r, 1000));
            return mainFlow();
        }

        // Check if we need to select a plant species (applicable to tools 1, 2, 3, 5, 7, 8)
        let speciesKey = '';
        if (['greenbelt-suitability-index', 'heavy-metal-tea-risk', 'pm-deposition-velocity', 'pesticide-spray-retention', 'phytoremediation-sizing-roi', 'green-wall-hvac-offset'].includes(tool)) {
            console.log("\nAvailable Plant Species:");
            list.forEach((s, idx) => {
                console.log(`  [${idx + 1}] ${s.scientificName} (${s.commonName})`);
            });
            
            const speciesIdxStr = (await askQuestion(`\nSelect plant species (1-${list.length}): `)).trim();
            const speciesIdx = parseInt(speciesIdxStr, 10) - 1;
            if (isNaN(speciesIdx) || speciesIdx < 0 || speciesIdx >= list.length) {
                LogError("Invalid species selection. Restarting...");
                return mainFlow();
            }
            speciesKey = list[speciesIdx].speciesKey;
        }

        try {
            if (tool === 'greenbelt-suitability-index') {
                const result = engine.runAptiApi(speciesKey);
                printReport('greenbelt-suitability-index', result);
            } else if (tool === 'heavy-metal-tea-risk') {
                console.log("\nSelect metal type:");
                const metals = ['lead', 'cadmium', 'chromium', 'nickel', 'copper', 'zinc'];
                metals.forEach((m, i) => console.log(`  [${i+1}] ${m.toUpperCase()}`));
                const metalIdx = parseInt(await askQuestion(`Option (1-${metals.length}): `), 10) - 1;
                const metal = metals[metalIdx] || 'lead';
                
                const soil = parseFloat(await askQuestion("Soil Concentration in mg/kg (Default 100): ")) || 100.0;
                const weight = parseFloat(await askQuestion("Foliar mass steeped in tea in grams (Default 2.0): ")) || 2.0;
                const water = parseFloat(await askQuestion("Infusion steeping water volume in L (Default 0.2): ")) || 0.2;
                const intake = parseFloat(await askQuestion("Daily volume of tea consumed in L (Default 0.2): ")) || 0.2;
                const weightBody = parseFloat(await askQuestion("Consumer body weight in kg (Default 70): ")) || 70.0;
                
                const result = engine.runHeavyMetalRisk(speciesKey, metal, soil, weight, water, intake, weightBody);
                printReport('heavy-metal-tea-risk', result);
            } else if (tool === 'pm-deposition-velocity') {
                console.log("\nSelect particulate size fraction:");
                const sizes = ['pm10', 'pm25', 'pm02'];
                sizes.forEach((s, i) => console.log(`  [${i+1}] ${s.toUpperCase()}`));
                const sizeIdx = parseInt(await askQuestion(`Option (1-${sizes.length}): `), 10) - 1;
                const size = sizes[sizeIdx] || 'pm25';

                const wind = parseFloat(await askQuestion("Local wind velocity in m/s (Default 2.0): ")) || 2.0;
                const lai = parseFloat(await askQuestion("Canopy Leaf Area Index (LAI) (Default 3.5): ")) || 3.5;
                const ambient = parseFloat(await askQuestion("Ambient PM concentration in µg/m³ (Default 100): ")) || 100.0;
                const area = parseFloat(await askQuestion("Canopy land surface area in m² (Default 5000): ")) || 5000.0;
                const hours = parseFloat(await askQuestion("Plume exposure duration in hours (Default 10): ")) || 10.0;
                const width = parseFloat(await askQuestion("Greenbelt barrier width along wind vector in m (Default 30): ")) || 30.0;

                const result = engine.runCanopyDeposition(speciesKey, size, wind, lai, ambient, area, hours, width);
                printReport('pm-deposition-velocity', result);
            } else if (tool === 'dermal-skin-air-partition') {
                console.log("\nSelect chemical compound:");
                const compounds = ['phenanthrene', 'benzo_a_pyrene', 'toluene'];
                compounds.forEach((c, i) => console.log(`  [${i+1}] ${c.toUpperCase()}`));
                const compIdx = parseInt(await askQuestion(`Option (1-${compounds.length}): `), 10) - 1;
                const compound = compounds[compIdx] || 'phenanthrene';

                const lipid = parseFloat(await askQuestion("Worker skin surface lipid volume in mL (Default 1.0): ")) || 1.0;
                const air = parseFloat(await askQuestion("Workplace air concentration in µg/m³ (Default 100): ")) || 100.0;
                const hours = parseFloat(await askQuestion("Operational exposure duration in hours (Default 8): ")) || 8.0;

                const result = engine.runDermalPartition(compound, lipid, air, hours);
                printReport('dermal-skin-air-partition', result);
            } else if (tool === 'pesticide-spray-retention') {
                const conc = parseFloat(await askQuestion("Pesticide spray concentration in mg/L (Default 200): ")) || 200.0;
                const vol = parseFloat(await askQuestion("Spray applied volume on crop canopy in L (Default 2.0): ")) || 2.0;
                const rain = parseFloat(await askQuestion("Rainfall depth in mm (Default 10): ")) || 10.0;
                
                console.log("\nSelect pesticide adjuvant additive:");
                const adjuvants = ['none', 'surfactant', 'sticker'];
                adjuvants.forEach((a, i) => console.log(`  [${i+1}] ${a.toUpperCase()}`));
                const adjIdx = parseInt(await askQuestion(`Option (1-${adjuvants.length}): `), 10) - 1;
                const adjuvant = adjuvants[adjIdx] || 'none';

                const result = engine.runPesticideWashoff(speciesKey, conc, vol, rain, adjuvant);
                printReport('pesticide-spray-retention', result);
            } else if (tool === 'hvac-filter-clog-energy') {
                console.log("\nSelect commercial HVAC filter grade:");
                const filters = ['merv8', 'merv13', 'hepa'];
                filters.forEach((f, i) => console.log(`  [${i+1}] ${f.toUpperCase()}`));
                const filtIdx = parseInt(await askQuestion(`Option (1-${filters.length}): `), 10) - 1;
                const filter = filters[filtIdx] || 'merv13';

                const pm = parseFloat(await askQuestion("Ambient air PM concentration in µg/m³ (Default 100): ")) || 100.0;
                const flow = parseFloat(await askQuestion("Blower air flow volume rate in m³/h (Default 2000): ")) || 2000.0;
                const hours = parseFloat(await askQuestion("Blower operational hours (Default 240): ")) || 240.0;

                const result = engine.runFilterClogging(filter, pm, flow, hours);
                printReport('hvac-filter-clog-energy', result);
            } else if (tool === 'phytoremediation-sizing-roi') {
                const soilInit = parseFloat(await askQuestion("Initial soil metal level in mg/kg (Default 150): ")) || 150.0;
                const soilTarget = parseFloat(await askQuestion("Regulatory safety threshold in mg/kg (Default 15): ")) || 15.0;
                const area = parseFloat(await askQuestion("Site surface area in m² (Default 5000): ")) || 5000.0;
                const depth = parseFloat(await askQuestion("Contaminated soil depth in m (Default 0.5): ")) || 0.5;
                const cost = parseFloat(await askQuestion("Planting, harvesting, and ash disposal cost/ha/cycle in $ (Default 2000): ")) || 2000.0;

                const result = engine.runPhytoremediation(speciesKey, soilInit, soilTarget, area, depth, cost);
                printReport('phytoremediation-sizing-roi', result);
            } else if (tool === 'green-wall-hvac-offset') {
                const area = parseFloat(await askQuestion("Vertical green wall surface area in m² (Default 150): ")) || 150.0;
                const lai = parseFloat(await askQuestion("Green wall Leaf Area Index (LAI) (Default 4.0): ")) || 4.0;
                const cop = parseFloat(await askQuestion("Building AC coefficient of performance (COP) (Default 3.0): ")) || 3.0;
                const elec = parseFloat(await askQuestion("Local electricity utility rate in $/kWh (Default 0.15): ")) || 0.15;
                const reduction = parseFloat(await askQuestion("Vegetative shading solar load block percentage (%) (Default 30): ")) || 30.0;

                const result = engine.runGreenWallThermal(speciesKey, area, lai, cop, elec, reduction);
                printReport('green-wall-hvac-offset', result);
            } else if (tool === 'rag') {
                const { SpeciesRAGEngine } = require('./predictive_engine');
                console.log("\n--- UNLISTED SPECIES TRAIT ESTIMATOR (k-NN RAG) ---");
                const morphologies = ['planar', 'lanceolate', 'elliptic', 'obovate', 'acicular'];
                const habits = ['tree_dense', 'tree_open', 'shrub'];
                
                console.log("Select Morphology:");
                morphologies.forEach((m, idx) => console.log(`  [${idx+1}] ${m}`));
                const mChoice = parseInt(await askQuestion("Option (1-5): ")) - 1;
                const morphology = morphologies[mChoice] || 'planar';

                console.log("\nSelect Growth Habit:");
                habits.forEach((h, idx) => console.log(`  [${idx+1}] ${h}`));
                const hChoice = parseInt(await askQuestion("Option (1-3): ")) - 1;
                const growthHabit = habits[hChoice] || 'tree_dense';

                const evergreen = (await askQuestion("\nIs it Evergreen? (y/n): ")).toLowerCase().startsWith('y');
                const isPubescent = (await askQuestion("Is it Pubescent (hairy leaves)? (y/n): ")).toLowerCase().startsWith('y');
                const epicuticularWax = parseFloat(await askQuestion("Epicuticular Wax density in µg/cm² (Default 100): ")) || 100.0;

                const query = { morphology, growthHabit, evergreen, isPubescent, epicuticularWax };
                
                console.log("\nRunning Cosine Distance-Weighted k-NN RAG Search...");
                const result = SpeciesRAGEngine.predictTraits(query, 3);
                
                logHeader("RAG Trait Prediction Report");
                console.log(`${colors.bright}Top 3 Similar Retrieved Species:${colors.reset}`);
                result.similarMatches.forEach((m, i) => {
                    console.log(`  [${i+1}] ${m.scientificName} (${m.commonName}) - Similarity: ${m.similarity}`);
                    console.log(`      Literature: ${m.sourcePapers.join(', ')}`);
                });
                console.log("\n" + colors.bright + "Synthesized/Predicted Biochemical and Physical Traits:" + colors.reset);
                console.log(`  Ascorbic Acid:           ${result.predictedTraits.ascorbicAcid} mg/g`);
                console.log(`  Total Chlorophyll:       ${result.predictedTraits.totalChlorophyll} mg/g`);
                console.log(`  Leaf Extract pH:         ${result.predictedTraits.pH}`);
                console.log(`  Relative Water Content:  ${result.predictedTraits.rwc}%`);
                console.log(`  Transpiration Rate:      ${result.predictedTraits.transpirationRate} L/m²·day`);
                console.log(`  Bioconcentration BCF:    ${result.predictedTraits.bcf}`);
                console.log(`  Biomass Yield:           ${result.predictedTraits.biomassYieldKgHa} kg/ha/year`);
                console.log("  Heavy Metal Translocation Factors (TF):");
                console.log(`    Pb: ${result.predictedTraits.heavyMetalTF.lead.toFixed(4)}, Cd: ${result.predictedTraits.heavyMetalTF.cadmium.toFixed(4)}, Cr: ${result.predictedTraits.heavyMetalTF.chromium.toFixed(4)}`);
                console.log(`    Ni: ${result.predictedTraits.heavyMetalTF.nickel.toFixed(4)}, Cu: ${result.predictedTraits.heavyMetalTF.copper.toFixed(4)}, Zn: ${result.predictedTraits.heavyMetalTF.zinc.toFixed(4)}`);
            } else if (tool === 'sindy') {
                const { SindyDynamicsLearner } = require('./predictive_engine');
                console.log("\n--- SINDY SPARSE IDENTIFICATION OF DYNAMICS SOLVER ---");
                console.log("This tool discovers the underlying sparse governing equation from experimental observations.");
                console.log("Let's identify the pressure drop equation for MERV 13 filters under dust cake loading.");
                console.log("Observations generated from baseline testing:\n");
                
                const xValues = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
                const yValues = [120, 129.6, 158.4, 206.4, 273.6, 360]; // 120 * (1 + 8 * C^2)
                
                console.log("  Clog Fraction (X): [" + xValues.join(', ') + "]");
                console.log("  Observed dP (Y):   [" + yValues.join(', ') + "] Pascals");
 
                console.log("\nEvaluating library functions: [1, X, X^2, sin(X)]");
                const library = [
                    x => 1.0,
                    x => x,
                    x => x * x,
                    x => Math.sin(x)
                ];

                const xi = SindyDynamicsLearner.fit(xValues, yValues, library, 0.1);
                
                logHeader("SINDy Equation Identification Results");
                console.log(`Discovered Equation: dP(C) = ${xi[0]} * 1 + ${xi[1]} * C + ${xi[2]} * C² + ${xi[3]} * sin(C)`);
                console.log("--------------------------------------------------");
                console.log(`Identified Coefficients:`);
                console.log(`  Base clean pressure drop (1):  ${xi[0]} Pa  (True value: 120)`);
                console.log(`  Linear clogging factor (C):    ${xi[1]}     (True value: 0)`);
                console.log(`  Quadratic cake factor (C²):    ${xi[2]}     (True value: 960, since 120 * 8 = 960)`);
                console.log(`  Oscillatory factor (sin(C)):   ${xi[3]}     (True value: 0)`);
                console.log("==================================================\n");
            }
        } catch (err) {
            LogError(err.message);
        }

        console.log("--------------------------------------------------");
        await askQuestion("Press ENTER to return to menu...");
        console.clear();
        mainFlow();
    };

    mainFlow();
}

// Execute batch run via parsed arguments
function executeBatch(args) {
    if (!args.tool) {
        LogError("No tool specified. Use --tool <name> to run a batch simulation.");
        printHelp();
        process.exit(1);
    }

    const tool = args.tool.toLowerCase().trim();

    try {
        if (tool === 'greenbelt-suitability-index') {
            const species = args.species || 'ficus_religiosa';
            const res = engine.runAptiApi(species);
            printReport('greenbelt-suitability-index', res);
        } else if (tool === 'heavy-metal-tea-risk') {
            const species = args.species || 'tilia_cordata';
            const metal = args.metal || 'lead';
            const soil = args['soil-conc'] !== undefined ? args['soil-conc'] : 100.0;
            const weight = args['leaf-weight'] !== undefined ? args['leaf-weight'] : 2.0;
            const water = args['water-vol'] !== undefined ? args['water-vol'] : 0.2;
            const intake = args['daily-intake'] !== undefined ? args['daily-intake'] : 0.2;
            const body = args['body-weight'] !== undefined ? args['body-weight'] : 70.0;

            const res = engine.runHeavyMetalRisk(species, metal, soil, weight, water, intake, body);
            printReport('heavy-metal-tea-risk', res);
        } else if (tool === 'pm-deposition-velocity') {
            const species = args.species || 'pinus_sylvestris';
            const pm = args.pm || 'pm25';
            const wind = args.wind !== undefined ? args.wind : 2.0;
            const lai = args.lai !== undefined ? args.lai : 3.5;
            const ambient = args.ambient !== undefined ? args.ambient : 100.0;
            const area = args.area !== undefined ? args.area : 5000.0;
            const hours = args.hours !== undefined ? args.hours : 10.0;
            const width = args.width !== undefined ? args.width : 30.0;

            const res = engine.runCanopyDeposition(species, pm, wind, lai, ambient, area, hours, width);
            printReport('pm-deposition-velocity', res);
        } else if (tool === 'dermal-skin-air-partition') {
            const compound = args.compound || 'phenanthrene';
            const lipid = args.lipid !== undefined ? args.lipid : 1.0;
            const air = args.air !== undefined ? args.air : 100.0;
            const hours = args.hours !== undefined ? args.hours : 8.0;

            const res = engine.runDermalPartition(compound, lipid, air, hours);
            printReport('dermal-skin-air-partition', res);
        } else if (tool === 'pesticide-spray-retention') {
            const species = args.species || 'morus_alba';
            const conc = args.conc !== undefined ? args.conc : 200.0;
            const vol = args.vol !== undefined ? args.vol : 2.0;
            const rain = args.rain !== undefined ? args.rain : 10.0;
            const adjuvant = args.adjuvant || 'none';

            const res = engine.runPesticideWashoff(species, conc, vol, rain, adjuvant);
            printReport('pesticide-spray-retention', res);
        } else if (tool === 'hvac-filter-clog-energy') {
            const filter = args.filter || 'merv13';
            const pm = args.pm !== undefined ? args.pm : 100.0;
            const flow = args.flow !== undefined ? args.flow : 2000.0;
            const hours = args.hours !== undefined ? args.hours : 240.0;

            const res = engine.runFilterClogging(filter, pm, flow, hours);
            printReport('hvac-filter-clog-energy', res);
        } else if (tool === 'phytoremediation-sizing-roi') {
            const species = args.species || 'ficus_religiosa';
            const soilInit = args['soil-init'] !== undefined ? args['soil-init'] : 150.0;
            const soilTarget = args['soil-target'] !== undefined ? args['soil-target'] : 15.0;
            const area = args.area !== undefined ? args.area : 5000.0;
            const depth = args.depth !== undefined ? args.depth : 0.5;
            const cost = args.cost !== undefined ? args.cost : 2000.0;

            const res = engine.runPhytoremediation(species, soilInit, soilTarget, area, depth, cost);
            printReport('phytoremediation-sizing-roi', res);
        } else if (tool === 'green-wall-hvac-offset') {
            const species = args.species || 'hedera_helix';
            const area = args.area !== undefined ? args.area : 150.0;
            const lai = args.lai !== undefined ? args.lai : 4.0;
            const cop = args.cop !== undefined ? args.cop : 3.0;
            const elec = args.elec !== undefined ? args.elec : 0.15;
            const reduction = args.reduction !== undefined ? args.reduction : 30.0;

            const res = engine.runGreenWallThermal(species, area, lai, cop, elec, reduction);
            printReport('green-wall-hvac-offset', res);
        } else {
            LogError(`Unknown tool name: "${tool}". Options are: greenbelt-suitability-index, heavy-metal-tea-risk, pm-deposition-velocity, dermal-skin-air-partition, pesticide-spray-retention, hvac-filter-clog-energy, phytoremediation-sizing-roi, green-wall-hvac-offset.`);
            process.exit(1);
        }
    } catch (e) {
        LogError(e.message);
        process.exit(1);
    }
}

// Master Runner
function run() {
    const args = parseArgs();

    if (args.help) {
        printHelp();
        process.exit(0);
    }

    if (args.listSpecies) {
        logHeader("Literature Species database Catalog");
        const list = engine.getSpeciesList();
        console.log(`Total Compiled Species: ${list.length}`);
        console.log("--------------------------------------------------");
        list.forEach((s, idx) => {
            console.log(`${idx + 1}. Key: ${colors.fgMagenta}${s.speciesKey}${colors.reset}`);
            console.log(`   Scientific Name: ${colors.bright}${s.scientificName}${colors.reset}`);
            console.log(`   Common Name:     ${s.commonName}`);
            console.log(`   Source Papers:   ${s.sourcePapers.join(', ')}`);
            console.log("--------------------------------------------------");
        });
        process.exit(0);
    }

    if (args.interactive || Object.keys(args).length === 0) {
        runInteractive();
    } else {
        executeBatch(args);
    }
}

// Run CLI
run();
