/**
 * Plant Biomonitoring Open Source Integration Engine
 * Connects literature-derived species database traits to the mathematical models.
 * 
 * Author: Antigravity AI
 * Date: June 2, 2026
 */

const fs = require('fs');
const path = require('path');
const {
    LeafNormalizer,
    ResiliencePredictor,
    LitterLeacher,
    AptiApiClassifier,
    HeavyMetalTranslocator,
    CanopyDepositionSimulator,
    DermalPartitionSimulator,
    PesticideWashoffModeler,
    FilterCloggingEnergyPredictor,
    PhytoCleanupModeler,
    GreenWallThermalPredictor
} = require('./models');

// Load database
const dbPath = path.join(__dirname, 'open_source_data.json');
let database = { species: [] };
try {
    const rawData = fs.readFileSync(dbPath, 'utf8');
    database = JSON.parse(rawData);
} catch (error) {
    console.error("CRITICAL: Failed to load open_source_data.json:", error.message);
}

/**
 * Returns a list of all available species keys, scientific names, and common names.
 * @returns {Array} List of species basic info.
 */
function getSpeciesList() {
    return database.species.map(s => ({
        speciesKey: s.speciesKey,
        scientificName: s.scientificName,
        commonName: s.commonName,
        sourcePapers: s.sourcePapers
      }));
}

/**
 * Looks up a species by its key (case-insensitive).
 * @param {string} key - Species identifier.
 * @returns {Object|null} Species profile or null if not found.
 */
function getSpeciesByKey(key) {
    if (!key) return null;
    const lowerKey = key.toLowerCase().trim();
    return database.species.find(s => s.speciesKey.toLowerCase() === lowerKey) || null;
}

/**
 * Tool 1: Air Pollution Tolerance Index & Anticipated Performance Index (APTI-API) Classifier
 * @param {string} speciesKey - Species identifier.
 * @returns {Object} APTI and API classification results.
 */
function runAptiApi(speciesKey) {
    const species = getSpeciesByKey(speciesKey);
    if (!species) {
        throw new Error(`Species with key "${speciesKey}" not found in database.`);
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

    return {
        speciesInfo: {
            scientificName: species.scientificName,
            commonName: species.commonName,
            sourcePapers: species.sourcePapers
        },
        inputs: {
            ascorbicAcid: species.ascorbicAcid,
            totalChlorophyll: species.totalChlorophyll,
            pH: species.pH,
            rwc: species.rwc,
            growthHabit: species.growthHabit,
            evergreen: species.evergreen,
            economicValue: species.economicValue
        },
        apti: aptiResult,
        api: apiResult
    };
}

/**
 * Tool 2: Heavy Metal Translocation & Dietary Exposure Modeler (HM-DETM)
 * @param {string} speciesKey - Species identifier.
 * @param {string} metalKey - Metal type: 'lead', 'cadmium', 'chromium', 'nickel', 'copper', 'zinc'.
 * @param {number} soilConc - Soil concentration in mg/kg.
 * @param {number} leafWeight - Mass of leaves steeped (g).
 * @param {number} waterVol - Volume of water used for steeping (L).
 * @param {number} dailyIntake - Daily volume of tea consumed (L).
 * @param {number} bodyWeight - Body weight of consumer (kg).
 * @returns {Object} Translocation factor, translocated leaf concentration, and human health risk simulation.
 */
function runHeavyMetalRisk(speciesKey, metalKey, soilConc, leafWeight = 2.0, waterVol = 0.2, dailyIntake = 0.2, bodyWeight = 70) {
    const species = getSpeciesByKey(speciesKey);
    if (!species) {
        throw new Error(`Species with key "${speciesKey}" not found in database.`);
    }

    const metal = metalKey.toLowerCase().trim();
    const tf = species.heavyMetalTF[metal];
    const extractionRate = species.heavyMetalExtractionRate[metal];

    if (tf === undefined || extractionRate === undefined) {
        throw new Error(`Metal "${metalKey}" parameters not defined for species "${species.scientificName}".`);
    }

    // Calculate leaf concentration from soil concentration and translocation factor (TF)
    // plantConc = soilConc * TF
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

    return {
        speciesInfo: {
            scientificName: species.scientificName,
            commonName: species.commonName,
            sourcePapers: species.sourcePapers
        },
        metal: metal.toUpperCase(),
        soilConcentrationMgKg: soilConc,
        translocationFactor: tf,
        calculatedLeafConcMgKg: parseFloat(leafConc.toFixed(4)),
        inputs: {
            leafWeightGrams: leafWeight,
            extractionRatePercent: extractionRate,
            steepWaterVolL: waterVol,
            dailyIntakeL: dailyIntake,
            bodyWeightKg: bodyWeight
        },
        risk: riskResult
    };
}

/**
 * Tool 3: Canopy Deposition Velocity & Plume Mitigation Simulator (CDVPMS)
 * @param {string} speciesKey - Species identifier.
 * @param {string} pmSizeKey - PM category: 'pm10', 'pm25', 'pm02'.
 * @param {number} windSpeed - Wind speed in m/s.
 * @param {number} lai - Leaf Area Index.
 * @param {number} ambientConc - Ambient PM concentration in µg/m³.
 * @param {number} canopyArea - Canopy land surface area (m²).
 * @param {number} durationHours - Exposure duration in hours.
 * @param {number} barrierWidth - Width of the greenbelt (m).
 * @returns {Object} Deposition velocity, mass removed, and downwind mitigation efficiency.
 */
function runCanopyDeposition(speciesKey, pmSizeKey, windSpeed, lai, ambientConc, canopyArea, durationHours, barrierWidth) {
    const species = getSpeciesByKey(speciesKey);
    if (!species) {
        throw new Error(`Species with key "${speciesKey}" not found in database.`);
    }

    const size = pmSizeKey.toLowerCase().trim();
    const isPubescent = species.isPubescent;

    const simulation = CanopyDepositionSimulator.simulatePlumeScrubbing(
        size,
        lai,
        windSpeed,
        isPubescent,
        ambientConc,
        canopyArea,
        durationHours,
        barrierWidth
    );

    return {
        speciesInfo: {
            scientificName: species.scientificName,
            commonName: species.commonName,
            isPubescent: isPubescent,
            morphology: species.morphology
        },
        inputs: {
            pmSize: pmSizeKey.toUpperCase(),
            windSpeedMs: windSpeed,
            leafAreaIndex: lai,
            ambientConcentrationUgM3: ambientConc,
            canopyAreaM2: canopyArea,
            durationHours: durationHours,
            barrierWidthMeters: barrierWidth
        },
        simulation: simulation
    };
}

/**
 * Tool 4: Skin Dermal Partition & Exposure Modeler (SDPEM)
 * @param {string} compoundKey - Chemical species: 'phenanthrene', 'benzo_a_pyrene', 'toluene'.
 * @param {number} skinLipidVolMl - Volume of skin surface lipids (mL).
 * @param {number} airConcUgM3 - Ambient air concentration in µg/m³.
 * @param {number} exposureHours - Duration of exposure in hours.
 * @returns {Object} Dermal partition and absorption results.
 */
function runDermalPartition(compoundKey, skinLipidVolMl, airConcUgM3, exposureHours) {
    return {
        compound: compoundKey.toUpperCase(),
        inputs: {
            skinLipidVolMl: skinLipidVolMl,
            airConcUgM3: airConcUgM3,
            exposureHours: exposureHours
        },
        result: DermalPartitionSimulator.simulateDermalUptake(
            compoundKey,
            skinLipidVolMl,
            airConcUgM3,
            exposureHours
        )
    };
}

/**
 * Tool 5: Agricultural Pesticide Spray Retention & Washoff Modeler (APSRWM)
 * @param {string} speciesKey - Species identifier to map to crop profile.
 * @param {number} concentrationMgL - Active pesticide concentration in spray (mg/L).
 * @param {number} sprayVolL - Applied volume (L).
 * @param {number} rainfallMm - Precipitated rainfall volume (mm).
 * @param {string} adjuvant - Adjuvant type: 'none', 'surfactant', 'sticker'.
 * @returns {Object} Pesticide wash-off and soil runoff hazard results.
 */
function runPesticideWashoff(speciesKey, concentrationMgL, sprayVolL, rainfallMm, adjuvant = 'none') {
    const species = getSpeciesByKey(speciesKey);
    if (!species) {
        throw new Error(`Species with key "${speciesKey}" not found in database.`);
    }

    // Map species/morphology to crop profiles:
    // acicular -> 'coniferous', waxy characteristics -> 'waxy', planar/elliptic -> 'broadleaf'
    let cropKey = 'broadleaf';
    if (species.morphology === 'acicular') {
        cropKey = 'coniferous';
    } else if (species.epicuticularWax > 300 && !species.isPubescent) {
        // High wax can act superhydrophobic like waxy cabbage
        cropKey = 'waxy';
    }

    const washoff = PesticideWashoffModeler.simulateWashoff(
        cropKey,
        concentrationMgL,
        sprayVolL,
        rainfallMm,
        adjuvant
    );

    return {
        speciesInfo: {
            scientificName: species.scientificName,
            commonName: species.commonName,
            morphology: species.morphology,
            epicuticularWax: species.epicuticularWax
        },
        mappedCropProfile: cropKey.toUpperCase(),
        inputs: {
            concentrationMgL: concentrationMgL,
            sprayVolL: sprayVolL,
            rainfallMm: rainfallMm,
            adjuvant: adjuvant
        },
        washoff: washoff
    };
}

/**
 * Tool 6: HVAC Filter Clogging & Fan Power Energy Predictor (HFCFPEP)
 * @param {string} filterKey - Filter grade: 'merv8', 'merv13', 'hepa'.
 * @param {number} pmConcUgM3 - Ambient PM concentration in µg/m³.
 * @param {number} flowRateM3H - Air flow volume in m³/hour.
 * @param {number} exposureHours - Blower operational hours.
 * @returns {Object} Filter clogging progress and energy overhead results.
 */
function runFilterClogging(filterKey, pmConcUgM3, flowRateM3H, exposureHours) {
    return {
        filterGrade: filterKey.toUpperCase(),
        inputs: {
            pmConcUgM3: pmConcUgM3,
            flowRateM3H: flowRateM3H,
            exposureHours: exposureHours
        },
        clogging: FilterCloggingEnergyPredictor.simulateClogging(
            filterKey,
            pmConcUgM3,
            flowRateM3H,
            exposureHours
        )
    };
}

/**
 * Tool 7: Soil Heavy Metal Phytoremediation Sizing & ROI Estimator (SHMPS)
 * @param {string} speciesKey - Species identifier.
 * @param {number} soilConcInit - Initial soil metal concentration (mg/kg).
 * @param {number} soilConcTarget - Target safety threshold (mg/kg).
 * @param {number} siteAreaM2 - Land area of polluted site (m²).
 * @param {number} soilDepthM - Contaminated soil depth (m).
 * @param {number} costPerCycleHa - Cost per hectare per cycle ($).
 * @returns {Object} Cleanup cycles timeline, phyto costs, excavation costs, and feasibility rating.
 */
function runPhytoremediation(speciesKey, soilConcInit, soilConcTarget, siteAreaM2, soilDepthM = 0.5, costPerCycleHa = 2000) {
    const species = getSpeciesByKey(speciesKey);
    if (!species) {
        throw new Error(`Species with key "${speciesKey}" not found in database.`);
    }

    const bcf = species.bcf;
    const biomassYield = species.biomassYieldKgHa;

    const cleanup = PhytoCleanupModeler.simulateRemediation(
        soilConcInit,
        soilConcTarget,
        siteAreaM2,
        soilDepthM,
        biomassYield,
        bcf,
        costPerCycleHa
    );

    return {
        speciesInfo: {
            scientificName: species.scientificName,
            commonName: species.commonName,
            bioconcentrationFactor: bcf,
            biomassYieldKgHa: biomassYield
        },
        inputs: {
            soilConcInitMgKg: soilConcInit,
            soilConcTargetMgKg: soilConcTarget,
            siteAreaM2: siteAreaM2,
            soilDepthM: soilDepthM,
            costPerCycleHa: costPerCycleHa
        },
        cleanup: cleanup
    };
}

/**
 * Tool 8: Urban Green Wall Evapotranspirational Cooling & Building HVAC Offset Calculator (GWECB)
 * @param {string} speciesKey - Species identifier.
 * @param {number} wallAreaM2 - Vertical wall surface area covered by vegetation (m²).
 * @param {number} leafAreaIndex - Leaf Area Index of green wall canopy.
 * @param {number} copCooling - Coefficient of Performance of HVAC system.
 * @param {number} electricityCostPerKwh - Cost of electricity ($/kWh).
 * @param {number} solarHeatGainReductionPercent - Percentage of solar load blocked (%).
 * @returns {Object} Water transpired, thermal cooling offsets, and financial/carbon savings.
 */
function runGreenWallThermal(speciesKey, wallAreaM2, leafAreaIndex = 4.0, copCooling = 3.0, electricityCostPerKwh = 0.15, solarHeatGainReductionPercent = 30) {
    const species = getSpeciesByKey(speciesKey);
    if (!species) {
        throw new Error(`Species with key "${speciesKey}" not found in database.`);
    }

    const transpirationRate = species.transpirationRate;

    const offset = GreenWallThermalPredictor.simulateThermalOffset(
        wallAreaM2,
        leafAreaIndex,
        transpirationRate,
        copCooling,
        electricityCostPerKwh,
        solarHeatGainReductionPercent
    );

    return {
        speciesInfo: {
            scientificName: species.scientificName,
            commonName: species.commonName,
            transpirationRateLPerM2Day: transpirationRate
        },
        inputs: {
            wallAreaM2: wallAreaM2,
            leafAreaIndex: leafAreaIndex,
            copCooling: copCooling,
            electricityCostPerKwh: electricityCostPerKwh,
            solarHeatGainReductionPercent: solarHeatGainReductionPercent
        },
        offset: offset
    };
}

module.exports = {
    getSpeciesList,
    getSpeciesByKey,
    runAptiApi,
    runHeavyMetalRisk,
    runCanopyDeposition,
    runDermalPartition,
    runPesticideWashoff,
    runFilterClogging,
    runPhytoremediation,
    runGreenWallThermal
};
