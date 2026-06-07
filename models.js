/**
 * Plant Biomonitoring Analytical Models Module
 * Implements mathematical models for Leaf Area & Gravimetric PM Normalization (LAPDN),
 * Foliar Dust Stress & Photosynthetic Resilience (FDSPRP), and Leaf Litter Organic Pollutant Leaching (LLDTLS).
 * 
 * Author: Sourish Senapati
 * Date: May 28, 2026
 * Institution: Jadavpur University (JU)
 */

class LeafNormalizer {
    /**
     * Calculates the total leaf surface area based on shape-specific correction factors.
     * @param {number} length - Average leaf length in cm (positive number).
     * @param {number} width - Average leaf width in cm (positive number).
     * @param {number} count - Total count of leaves sampled (positive integer).
     * @param {string} morphology - Leaf morphology: 'acicular', 'lanceolate', 'elliptic', 'obovate', 'planar'.
     * @returns {number} Leaf surface area in cm².
     */
    static calculateLeafArea(length, width, count, morphology) {
        if (length <= 0 || width <= 0 || count <= 0) return 0;
        
        let cf = 0.78; // Default to standard planar leaf
        switch (morphology.toLowerCase()) {
            case 'acicular':
                cf = 0.05; // Thin needle cylinder approximation (pi * r * h)
                break;
            case 'lanceolate':
                cf = 0.65; // Tapered narrow leaf
                break;
            case 'elliptic':
            case 'obovate':
                cf = 0.72; // Rounded oval leaf
                break;
            case 'planar':
            default:
                cf = 0.78; // Flat broadleaf
                break;
        }
        
        return length * width * count * cf;
    }

    /**
     * Calculates the normalized deposition density of particulate matter on leaf surfaces.
     * @param {number} tareWeightMg - Initial tared weight of filter paper in mg.
     * @param {number} finalWeightMg - Final particulate-loaded filter weight in mg.
     * @param {number} leafAreaCm2 - Total leaf surface area in cm².
     * @returns {number} Particulate deposition density in µg/cm² (micrograms per squared cm).
     */
    static calculateDeposition(tareWeightMg, finalWeightMg, leafAreaCm2) {
        if (leafAreaCm2 <= 0) return 0;
        const deltaWeightMg = Math.max(0, finalWeightMg - tareWeightMg);
        
        // 1 mg = 1000 µg. Leaves are bilateral (adaxial + abaxial), so we divide by 2 * area.
        return (deltaWeightMg * 1000) / (2 * leafAreaCm2);
    }

    /**
     * Simulates rainfall wash-off and remaining PM sequestration.
     * @param {number} spm - Surface Particulate Matter density in µg/cm².
     * @param {number} wpm - Wax-embedded Particulate Matter density in µg/cm².
     * @param {number} rainfallMm - Rainfall intensity in mm.
     * @returns {Object} Wash-off details containing washed SPM, remaining SPM, and total remaining PM.
     */
    static calculateRainShedding(spm, wpm, rainfallMm) {
        if (spm < 0) spm = 0;
        if (wpm < 0) wpm = 0;
        if (rainfallMm <= 0) {
            return {
                washedSpm: 0,
                remainingSpm: spm,
                remainingWpm: wpm,
                totalRemainingPm: spm + wpm,
                washOffPercent: 0
            };
        }
        
        // Wash-off efficiency increases non-linearly with rainfall volume, asymptotically approaching 100% of SPM.
        // WPM remains 100% sequestered and untouched by rain wash-off.
        const washOffFraction = 1 - Math.exp(-0.05 * rainfallMm);
        const washedSpm = spm * washOffFraction;
        const remainingSpm = spm * (1 - washOffFraction);
        
        return {
            washedSpm: parseFloat(washedSpm.toFixed(4)),
            remainingSpm: parseFloat(remainingSpm.toFixed(4)),
            remainingWpm: wpm,
            totalRemainingPm: parseFloat((remainingSpm + wpm).toFixed(4)),
            washOffPercent: parseFloat((washOffFraction * 100).toFixed(2))
        };
    }
}

class ResiliencePredictor {
    /**
     * Predicts foliar dust stress and physiological degradation metrics.
     * @param {string} speciesKey - Species identifier: 'alstonia', 'polyalthia', 'ficus_religiosa', 'eucalyptus', 'morus', 'ficus_benjamina'.
     * @param {number} dustLoadMgCm2 - Accumulated dust loading in mg/cm² (typically 0.0 to 5.0).
     * @param {number} dryDays - Number of days without precipitation.
     * @returns {Object} Predicted physiological status and percentage reductions.
     */
    static predictResilience(speciesKey, dustLoadMgCm2, dryDays) {
        if (dustLoadMgCm2 < 0) dustLoadMgCm2 = 0;
        if (dryDays < 0) dryDays = 0;
        
        const speciesConfigs = {
            alstonia: { name: "Alstonia scholaris", kChl: 0.45, b: 1.5, tolerance: "High Sensitivity" },
            polyalthia: { name: "Polyalthia longifolia", kChl: 0.38, b: 1.2, tolerance: "High Sensitivity" },
            ficus_religiosa: { name: "Ficus religiosa", kChl: 0.08, b: 0.2, tolerance: "Highly Resilient" },
            eucalyptus: { name: "Eucalyptus globulus", kChl: 0.04, b: 0.15, tolerance: "Highly Resilient" },
            morus: { name: "Morus alba", kChl: 0.12, b: 0.45, tolerance: "Moderate Resilience" },
            ficus_benjamina: { name: "Ficus benjamina", kChl: 0.09, b: 0.3, tolerance: "High Resilience" }
        };
        
        const config = speciesConfigs[speciesKey.toLowerCase()] || speciesConfigs.ficus_religiosa;
        
        // 1. Chlorophyll Retention (decay formula)
        const chlRetention = Math.exp(-config.kChl * dustLoadMgCm2 * (dryDays / 10));
        const chlReductionPercent = (1 - chlRetention) * 100;
        
        // 2. Stomatal Conductance Reduction (clogging curve: modeled after hyperbola)
        // b parameter dictates stomatal clogging kinetics based on dust load
        const b = config.b;
        const stomatalConductanceReduction = 1 - (1 / (1 + b * dustLoadMgCm2));
        const stomatalReductionPercent = stomatalConductanceReduction * 100;
        
        // 3. Net Photosynthetic Reduction Percentage
        // Synergistic effect of stomatal clogging (limiting CO2 diffusion) and chlorophyll degradation (reducing light capture)
        const netPhotosynthesisReduction = 1 - (chlRetention * (1 - stomatalConductanceReduction));
        const photosynthesisReductionPercent = netPhotosynthesisReduction * 100;
        
        let status = "Healthy / Resilient";
        let statusClass = "status-healthy";
        let warningAlert = "Foliar health matches standard clean baseline parameters.";
        
        if (photosynthesisReductionPercent >= 50) {
            status = "Critical Physiological Collapse";
            statusClass = "status-danger";
            warningAlert = `CRITICAL WARNING: Severe chlorophyll degradation and stomatal pore blockage detected in ${config.name}. High risk of localized tissue necrosis and biological filtration failure. Immediate irrigation or street washing required to strip dust burden.`;
        } else if (photosynthesisReductionPercent >= 20) {
            status = "Moderate Stress";
            statusClass = "status-warning";
            warningAlert = `CAUTION: ${config.name} exhibits significant physiological stress. Transpiration and carbon assimilation rates are suppressed. Monitoring advised.`;
        }
        
        return {
            speciesName: config.name,
            toleranceLevel: config.tolerance,
            chlorophyllRetention: parseFloat((chlRetention * 100).toFixed(2)),
            chlorophyllReductionPercent: parseFloat(chlReductionPercent.toFixed(2)),
            stomatalReductionPercent: parseFloat(stomatalReductionPercent.toFixed(2)),
            photosynthesisReductionPercent: parseFloat(photosynthesisReductionPercent.toFixed(2)),
            healthStatus: status,
            statusClass: statusClass,
            warning: warningAlert
        };
    }
}

class LitterLeacher {
    /**
     * Simulates organic mass decay and persistent organic pollutant (POP) leaching rates.
     * @param {string} speciesKey - Species identifier: 'quercus', 'fagus', 'pinus', 'taxus', 'chamaecyparis'.
     * @param {number} tempCelsius - Mean temperature in °C.
     * @param {number} rainfallMm - Monthly rainfall in mm.
     * @param {number} timeMonths - Exposure time in months.
     * @param {number} initialPahLmw - Initial Low-Molecular-Weight PAH concentration in ng/g.
     * @param {number} initialPahHmw - Initial High-Molecular-Weight PAH concentration in ng/g.
     * @param {number} initialPcb - Initial PCB concentration in ng/g.
     * @returns {Object} Leaching dynamics and toxic runoff risk alerts.
     */
    static simulateLeaching(speciesKey, tempCelsius, rainfallMm, timeMonths, initialPahLmw, initialPahHmw, initialPcb) {
        if (timeMonths < 0) timeMonths = 0;
        if (initialPahLmw < 0) initialPahLmw = 0;
        if (initialPahHmw < 0) initialPahHmw = 0;
        if (initialPcb < 0) initialPcb = 0;
        
        const speciesDecay = {
            quercus: { name: "Quercus robur", ligninRatio: 35 },
            pinus: { name: "Pinus sylvestris", ligninRatio: 45 },
            fagus: { name: "Fagus sylvatica", ligninRatio: 30 },
            taxus: { name: "Taxus baccata", ligninRatio: 40 },
            chamaecyparis: { name: "Chamaecyparis lawsoniana", ligninRatio: 38 }
        };
        
        const config = speciesDecay[speciesKey.toLowerCase()] || speciesDecay.quercus;
        
        // 1. Organic Litter Decomposition Rate Constant (k)
        // Driven by temperature (Q10 rule), precipitation multiplier, and lignin content
        const kBase = 0.05; // Base decay rate per month
        const fT = Math.pow(2.0, (tempCelsius - 20) / 10); // Temperature multiplier
        const fP = rainfallMm / (rainfallMm + 50); // Moisture saturation curve
        const k = Math.max(0, kBase * fT * fP * (30 / config.ligninRatio));
        
        // Organic Mass Remaining Fraction
        const massRemainingFraction = Math.exp(-k * timeMonths);
        const massRemainingPercent = massRemainingFraction * 100;
        const massDecomposedPercent = 100 - massRemainingPercent;
        
        // 2. Pollutant Leaching Dynamics based on partition coefficients and decay stage
        // LMW PAHs are smaller and moderately soluble; they leach rapidly.
        // HMW PAHs and PCBs are extremely hydrophobic (high Kow) and remain bound to organic carbon.
        const kLeachLmw = 0.15 * (rainfallMm / (rainfallMm + 100));
        const kLeachHmw = 0.02 * (rainfallMm / (rainfallMm + 100));
        const kLeachPcb = 0.005 * (rainfallMm / (rainfallMm + 100));
        
        // Leached fractions are amplified as the litter structure decomposes
        const decompositionAmplifier = 1 + (massDecomposedPercent / 100);
        
        const fLeachLmw = Math.min(1.0, (1 - Math.exp(-kLeachLmw * timeMonths)) * decompositionAmplifier);
        const fLeachHmw = Math.min(1.0, (1 - Math.exp(-kLeachHmw * timeMonths)) * decompositionAmplifier);
        const fLeachPcb = Math.min(1.0, (1 - Math.exp(-kLeachPcb * timeMonths)) * decompositionAmplifier);
        
        // Leached quantities (ng/g equivalents)
        const leachedLmw = initialPahLmw * fLeachLmw;
        const leachedHmw = initialPahHmw * fLeachHmw;
        const leachedPcb = initialPcb * fLeachPcb;
        
        // Remaining quantities in litter
        const remainingLmw = Math.max(0, initialPahLmw - leachedLmw);
        const remainingHmw = Math.max(0, initialPahHmw - leachedHmw);
        const remainingPcb = Math.max(0, initialPcb - leachedPcb);
        
        // 3. Toxic Equivalency (TEQ) of Leached Runoff
        // TEFs: LMW = 0.001, HMW = 0.1 (weighted average of BaP, BbF, BaA), PCB = 0.03
        const teqLeached = (leachedLmw * 0.001) + (leachedHmw * 0.1) + (leachedPcb * 0.03);
        const teqRemaining = (remainingLmw * 0.001) + (remainingHmw * 0.1) + (remainingPcb * 0.03);
        
        let alertLevel = "SAFE / LOW RISK";
        let alertClass = "alert-safe";
        let warningText = "Organic pollutant leaching into local soils and water tables remains within safe baseline thresholds.";
        
        if (teqLeached >= 5.0) {
            alertLevel = "HAZARDOUS WATER RUNOFF WARNING";
            alertClass = "alert-danger";
            warningText = `CRITICAL HAZARD: Leached toxic equivalency (TEQ) is elevated at ${teqLeached.toFixed(2)} ng/g, primarily driven by carcinogenic HMW PAHs (BaA, BbF, BaP). High risk of organic toxins entering groundwater or local surface runoff. Leaf litter collection and hazardous waste incineration is strongly recommended for this corridor.`;
        } else if (teqLeached >= 1.0) {
            alertLevel = "MODERATE POLLUTION WARNING";
            alertClass = "alert-warning";
            warningText = `CAUTION: Cumulative leached TEQ reaches ${teqLeached.toFixed(2)} ng/g. Elevated levels of persistent pollutants are washing off. Plan seasonal clearing of decaying leaf mounds along roadsides to mitigate soil contamination.`;
        }
        
        return {
            speciesName: config.name,
            massRemainingPercent: parseFloat(massRemainingPercent.toFixed(2)),
            massDecomposedPercent: parseFloat(massDecomposedPercent.toFixed(2)),
            leachedLmw: parseFloat(leachedLmw.toFixed(2)),
            leachedHmw: parseFloat(leachedHmw.toFixed(2)),
            leachedPcb: parseFloat(leachedPcb.toFixed(2)),
            remainingLmw: parseFloat(remainingLmw.toFixed(2)),
            remainingHmw: parseFloat(remainingHmw.toFixed(2)),
            remainingPcb: parseFloat(remainingPcb.toFixed(2)),
            leachedTeq: parseFloat(teqLeached.toFixed(4)),
            remainingTeq: parseFloat(teqRemaining.toFixed(4)),
            alert: alertLevel,
            alertClass: alertClass,
            warning: warningText
        };
    }
}

class AptiApiClassifier {
    /**
     * Calculates the Air Pollution Tolerance Index (APTI) for a species.
     * @param {number} ascorbicAcid - Ascorbic acid content in mg/g.
     * @param {number} totalChlorophyll - Total chlorophyll content in mg/g.
     * @param {number} pH - Leaf extract pH.
     * @param {number} rwc - Relative water content in %.
     * @returns {Object} APTI score, classification, and css class.
     */
    static calculateApti(ascorbicAcid, totalChlorophyll, pH, rwc) {
        if (ascorbicAcid < 0) ascorbicAcid = 0;
        if (totalChlorophyll < 0) totalChlorophyll = 0;
        if (pH < 1) pH = 7.0; // Default neutral pH if invalid
        if (rwc < 0) rwc = 0;
        if (rwc > 100) rwc = 100;

        const score = (ascorbicAcid * (totalChlorophyll + pH) + rwc) / 10;
        const roundedScore = parseFloat(score.toFixed(1));

        let classification = "Sensitive";
        let cssClass = "status-danger";

        if (roundedScore >= 30) {
            classification = "Highly Tolerant (Ideal Bio-filter)";
            cssClass = "status-healthy";
        } else if (roundedScore >= 17) {
            classification = "Tolerant";
            cssClass = "status-warning";
        } else if (roundedScore >= 11) {
            classification = "Intermediate";
            cssClass = "status-warning";
        } else {
            classification = "Sensitive";
            cssClass = "status-danger";
        }

        return {
            score: roundedScore,
            classification: classification,
            cssClass: cssClass
        };
    }

    /**
     * Calculates the Anticipated Performance Index (API) for species suitability.
     * @param {number} aptiScore - APTI score.
     * @param {string} growthHabit - Growth form: 'tree_dense', 'tree_open', 'shrub', etc.
     * @param {boolean} evergreen - Foliage seasonality (true = evergreen, false = deciduous).
     * @param {string} economicValue - Socio-economic/urban utility: 'high', 'medium'/'moderate', 'low'.
     * @returns {Object} API score, suitability grade, and star rating.
     */
    static calculateApi(aptiScore, growthHabit, evergreen, economicValue) {
        let score = 0;

        // 1. APTI points
        if (aptiScore > 25) {
            score += 8;
        } else if (aptiScore >= 21) {
            score += 6;
        } else if (aptiScore >= 16) {
            score += 4;
        } else if (aptiScore >= 10) {
            score += 2;
        } else {
            score += 0;
        }

        // 2. Growth habit points
        const habit = (growthHabit || '').toLowerCase();
        if (habit.includes('dense')) {
            score += 4;
        } else if (habit.includes('open')) {
            score += 2;
        } else if (habit.includes('shrub')) {
            score += 1;
        }

        // 3. Foliage seasonality
        if (evergreen === true) {
            score += 2;
        } else {
            score += 1;
        }

        // 4. Economic value points
        const econ = (economicValue || '').toLowerCase();
        if (econ === 'high') {
            score += 2;
        } else if (econ === 'medium' || econ === 'moderate') {
            score += 1;
        } else {
            score += 0;
        }

        // Grading
        let grade = "Poor (Not Recommended)";
        let stars = "★☆☆☆☆";

        if (score >= 15) {
            grade = "Excellent (Apex Greenbelt Choice)";
            stars = "★★★★★";
        } else if (score >= 13) {
            grade = "Very Good (Highly Recommended)";
            stars = "★★★★☆";
        } else if (score >= 10) {
            grade = "Good (Recommended)";
            stars = "★★★☆☆";
        } else if (score >= 6) {
            grade = "Fair (Conditional Selection)";
            stars = "★★☆☆☆";
        } else {
            grade = "Poor (Not Recommended)";
            stars = "★☆☆☆☆";
        }

        return {
            score: score,
            grade: grade,
            stars: stars
        };
    }
}

class HeavyMetalTranslocator {
    /**
     * Calculates the Soil-to-Leaf Translocation Factor.
     * @param {number} soilConc - Heavy metal concentration in soil (mg/kg).
     * @param {number} plantConc - Heavy metal concentration in plant leaves (mg/kg).
     * @returns {number} Translocation factor.
     */
    static calculateTF(soilConc, plantConc) {
        if (soilConc <= 0) return 0;
        return parseFloat((plantConc / soilConc).toFixed(4));
    }

    /**
     * Models dietary ingestion risk of heavy metals via leaf-steeped herbal tea infusions.
     * @param {string} metalKey - Metal type: 'lead', 'cadmium', 'chromium', 'nickel', 'copper', 'zinc'.
     * @param {number} leafConc - Leaf metal concentration (mg/kg).
     * @param {number} leafWeight - Mass of leaves steeped (g).
     * @param {number} extractionRate - Transfer efficiency from leaf to water (%).
     * @param {number} waterVol - Volume of water used for steeping (L).
     * @param {number} dailyIntake - Daily volume of tea consumed (L).
     * @param {number} bodyWeight - Body weight of the consumer (kg).
     * @returns {Object} Daily intake, hazard quotient, risk status, and safety warning.
     */
    static simulateDietaryRisk(metalKey, leafConc, leafWeight, extractionRate, waterVol, dailyIntake, bodyWeight) {
        if (leafConc < 0) leafConc = 0;
        if (leafWeight < 0) leafWeight = 0;
        if (extractionRate < 0) extractionRate = 0;
        if (waterVol <= 0) waterVol = 0.2; // default cup
        if (dailyIntake < 0) dailyIntake = 0;
        if (bodyWeight <= 0) bodyWeight = 70; // default adult

        const rfdMap = {
            lead: 0.0035,
            cadmium: 0.0005,
            chromium: 0.0030,
            nickel: 0.0200,
            copper: 0.0400,
            zinc: 0.3000
        };

        const rfd = rfdMap[metalKey.toLowerCase()] || 0.0035;

        // DIM = (C_leaf * W_leaf_kg * extraction_fraction * V_intake) / (V_water * BW)
        const leafWeightKg = leafWeight / 1000;
        const extractionFraction = extractionRate / 100;
        const dim = (leafConc * leafWeightKg * extractionFraction * dailyIntake) / (waterVol * bodyWeight);

        const hq = dim / rfd;
        const roundedHq = parseFloat(hq.toFixed(3));

        let riskStatus = "SAFE / UNDER THRESHOLD";
        let warning = "Dietary risk from heavy metal ingestion is within safe baseline thresholds.";

        if (roundedHq >= 1.0) {
            riskStatus = "TOXIC INGESTION HAZARD";
            warning = `WARNING: Hazard Quotient is ${roundedHq.toFixed(2)}. Potential chronic toxic ingestion hazard from heavy metal concentration in infusion.`;
        } else if (roundedHq >= 0.2) {
            riskStatus = "ELEVATED RISK";
            warning = `CAUTION: Hazard Quotient is ${roundedHq.toFixed(2)}. Elevated exposure levels require monitoring and raw source assessment.`;
        }

        return {
            dailyIntakeOfMetal: parseFloat(dim.toFixed(7)),
            hazardQuotient: roundedHq,
            riskStatus: riskStatus,
            warning: warning
        };
    }
}

class CanopyDepositionSimulator {
    /**
     * Computes the Dry Deposition Velocity (Vd) of particulate matter onto a forest canopy.
     * @param {string} pmSizeKey - PM category: 'pm10', 'pm25', 'pm02'.
     * @param {number} windSpeed - Local wind velocity (m/s).
     * @param {number} lai - Leaf Area Index.
     * @param {boolean} isPubescent - Presence of leaf trichomes/hairs.
     * @returns {number} Deposition velocity in cm/s.
     */
    static calculateVd(pmSizeKey, windSpeed, lai, isPubescent) {
        if (windSpeed < 0) windSpeed = 0;
        if (lai < 0) lai = 0;

        const baseVdMap = {
            pm10: 0.64,
            pm25: 0.16,
            pm02: 0.04
        };

        const capMap = {
            pm10: 6.0,
            pm25: 2.5,
            pm02: 1.0
        };

        const key = pmSizeKey.toLowerCase();
        const baseVd = baseVdMap[key] || 0.16;
        const cap = capMap[key] || 2.5;
        const pFactor = isPubescent ? 0.45 : 0.0;

        const vd = baseVd * lai * (windSpeed / 2.0) * (1 + pFactor);
        const finalVd = Math.min(vd, cap);

        return parseFloat(finalVd.toFixed(2));
    }

    /**
     * Simulates PM mass removal and plume concentration reduction downwind of a greenbelt canopy.
     * @param {string} pmSizeKey - PM category: 'pm10', 'pm25', 'pm02'.
     * @param {number} lai - Leaf Area Index.
     * @param {number} windSpeed - Wind speed in m/s.
     * @param {boolean} isPubescent - Pubescent leaves indicator.
     * @param {number} ambientConc - Ambient PM concentration in µg/m³.
     * @param {number} canopyArea - Surface canopy land area in m².
     * @param {number} durationHours - Duration of exposure in hours.
     * @param {number} barrierWidth - Cross-sectional width of the greenbelt (m).
     * @returns {Object} Vd, deposition flux, mass removed, downwind concentration, and removal efficiency.
     */
    static simulatePlumeScrubbing(pmSizeKey, lai, windSpeed, isPubescent, ambientConc, canopyArea, durationHours, barrierWidth) {
        if (ambientConc < 0) ambientConc = 0;
        if (canopyArea < 0) canopyArea = 0;
        if (durationHours < 0) durationHours = 0;
        if (barrierWidth < 0) barrierWidth = 0;

        const vd = CanopyDepositionSimulator.calculateVd(pmSizeKey, windSpeed, lai, isPubescent);
        
        // Flux F = Vd (cm/s) * C (µg/m³) * 10^-2 = µg / (m² * s)
        const depositionFlux = vd * ambientConc * 0.01;

        // Mass M = F * Area * Time_seconds * 10^-6 grams
        const durationSeconds = durationHours * 3600;
        const massRemovedGrams = depositionFlux * canopyArea * durationSeconds * 0.000001;

        // Downwind concentration modeling: C_down = C_amb * exp(- (Vd_m_s * LAI * W) / (H * u) )
        // mixing height H = 10m
        const H = 10.0;
        const vdm = vd * 0.01; // convert cm/s to m/s
        
        let downwindConc = ambientConc;
        let removalEfficiency = 0.0;

        if (windSpeed > 0 && ambientConc > 0) {
            const exponent = (vdm * lai * barrierWidth) / (H * windSpeed);
            downwindConc = ambientConc * Math.exp(-exponent);
            removalEfficiency = ((ambientConc - downwindConc) / ambientConc) * 100;
        }

        return {
            vd: vd,
            depositionFlux: parseFloat(depositionFlux.toFixed(4)),
            massRemovedGrams: parseFloat(massRemovedGrams.toFixed(4)),
            downwindConcentration: parseFloat(downwindConc.toFixed(2)),
            removalEfficiencyPercent: parseFloat(removalEfficiency.toFixed(2))
        };
    }
}

class DermalPartitionSimulator {
    /**
     * Models compound partitioning from air to skin lipids and evaluates dermal uptake.
     * @param {string} compoundKey - Chemical species: 'phenanthrene', 'benzo_a_pyrene', 'toluene'.
     * @param {number} skinLipidVolMl - Volume of skin surface lipids (mL, typically 0.5 to 5.0).
     * @param {number} airConcUgM3 - Ambient air concentration in µg/m³.
     * @param {number} exposureHours - Duration of exposure in hours.
     * @returns {Object} Mass partitioned, skin concentration, absorption rate, and safety warnings.
     */
    static simulateDermalUptake(compoundKey, skinLipidVolMl, airConcUgM3, exposureHours) {
        if (skinLipidVolMl <= 0) skinLipidVolMl = 1.0;
        if (airConcUgM3 < 0) airConcUgM3 = 0;
        if (exposureHours < 0) exposureHours = 0;
        
        const partitionConfigs = {
            phenanthrene: { name: "Phenanthrene (LMW PAH)", logKow: 4.57, kAbsorb: 0.04 },
            benzo_a_pyrene: { name: "Benzo[a]pyrene (HMW PAH)", logKow: 6.13, kAbsorb: 0.01 },
            toluene: { name: "Toluene (VOC)", logKow: 2.73, kAbsorb: 0.25 }
        };
        
        const config = partitionConfigs[compoundKey.toLowerCase()] || partitionConfigs.phenanthrene;
        
        // K_skin_air partition coefficient approximated from logKow: K_skin_air = 10^(0.7 * logKow - 1.5)
        const kSkinAir = Math.pow(10, (0.7 * config.logKow) - 1.5);
        
        // Max equilibrium capacity (µg) = AirConc (µg/m³) * Vol_skin_lipid (converted to m³) * K_skin_air
        // 1 mL = 10^-6 m³
        const skinLipidVolM3 = skinLipidVolMl * 0.000001;
        const maxEquilibriumCapacityUg = airConcUgM3 * skinLipidVolM3 * kSkinAir;
        
        // Mass absorbed over time (µg) based on absorption rate constant (kAbsorb)
        const massAbsorbedUg = maxEquilibriumCapacityUg * (1 - Math.exp(-config.kAbsorb * exposureHours));
        
        let hazardStatus = "SAFE / NEGLIGIBLE DERMAL PENETRATION";
        let hazardClass = "alert-safe";
        let warningText = `Dermal uptake of ${config.name} remains within safe workplace boundaries. standard skin barrier functions are protective.`;
        
        // If dermal absorption exceeds 1.0 µg, flag workplace toxic caution
        if (massAbsorbedUg >= 5.0) {
            hazardStatus = "CRITICAL SKIN UPTAKE HAZARD";
            hazardClass = "alert-danger";
            warningText = `WARNING: Dermal dose reaches ${massAbsorbedUg.toFixed(2)} µg. High accumulation of lipophilic ${config.name} inside skin oils. Dermal absorption bypasses hepatic filtration. Protective barrier creams or chemical suits mandatory in this sector.`;
        } else if (massAbsorbedUg >= 1.0) {
            hazardStatus = "MODERATE DERMAL ACCUMULATION";
            hazardClass = "alert-warning";
            warningText = `CAUTION: Dermal accumulation reaches ${massAbsorbedUg.toFixed(2)} µg. Extended exposure may trigger cuticular wax swelling or contact dermatitis. Scheduled skin washing advised.`;
        }
        
        return {
            compoundName: config.name,
            kSkinAir: parseFloat(kSkinAir.toFixed(2)),
            maxCapacityUg: parseFloat(maxEquilibriumCapacityUg.toFixed(4)),
            massAbsorbedUg: parseFloat(massAbsorbedUg.toFixed(4)),
            status: hazardStatus,
            cssClass: hazardClass,
            warning: warningText
        };
    }
}

class PesticideWashoffModeler {
    /**
     * Models agricultural pesticide spray retention, crop cuticular absorption, and rain wash-off.
     * @param {string} cropKey - Crop profile: 'broadleaf' (e.g. soybean), 'waxy' (e.g. cabbage), 'coniferous' (orchard).
     * @param {number} concentrationMgL - Active pesticide concentration in spray (mg/L).
     * @param {number} sprayVolL - Applied volume (L).
     * @param {number} rainfallMm - Precipitated rainfall volume (mm).
     * @param {string} adjuvant - Adjuvant type: 'none', 'surfactant' (reduces wash-off), 'sticker' (rain-fast).
     * @returns {Object} Mass applied, retained mass, washed runoff, and soil hazard rating.
     */
    static simulateWashoff(cropKey, concentrationMgL, sprayVolL, rainfallMm, adjuvant) {
        if (concentrationMgL < 0) concentrationMgL = 0;
        if (sprayVolL < 0) sprayVolL = 0;
        if (rainfallMm < 0) rainfallMm = 0;
        
        const cropConfigs = {
            broadleaf: { name: "Broadleaf Crop (Soybean)", baseAdhesion: 0.70, betaWash: 0.08 },
            waxy: { name: "Waxy Crop (Cabbage)", baseAdhesion: 0.40, betaWash: 0.12 }, // lower adhesion due to superhydrophobicity, fast wash-off
            coniferous: { name: "Coniferous Orchard (Citrus)", baseAdhesion: 0.85, betaWash: 0.05 }
        };
        
        const crop = cropConfigs[cropKey.toLowerCase()] || cropConfigs.broadleaf;
        
        // 1. Initial chemical mass intercepted on foliage (mg)
        const totalPesticideMg = concentrationMgL * sprayVolL;
        const initialFoliarLoadMg = totalPesticideMg * crop.baseAdhesion;
        
        // Adjuvant adjustments
        let adjuvantMultiplier = 1.0;
        if (adjuvant.toLowerCase() === 'surfactant') {
            adjuvantMultiplier = 0.6; // reduces wash-off rate
        } else if (adjuvant.toLowerCase() === 'sticker') {
            adjuvantMultiplier = 0.25; // highly rain-fast formulation
        }
        
        // 2. Wash-off Fraction (F_washoff)
        // Wash-off efficiency increases non-linearly with rainfall volume
        const washOffFraction = 1 - Math.exp(-crop.betaWash * rainfallMm * adjuvantMultiplier);
        
        const leachedToSoilMg = initialFoliarLoadMg * washOffFraction;
        const retainedOnFoliageMg = initialFoliarLoadMg * (1 - washOffFraction);
        
        let hazardStatus = "SAFE RUNOFF";
        let hazardClass = "alert-safe";
        let warningText = "Pesticide foliar retention is within target limits. Soil and groundwater runoff contamination is minimal.";
        
        if (leachedToSoilMg >= 100.0) {
            hazardStatus = "CRITICAL ECO-TOXIC SOIL RUNOFF";
            hazardClass = "alert-danger";
            warningText = `CRITICAL HAZARD: Rain wash-off has flushed ${leachedToSoilMg.toFixed(1)} mg of pesticide active ingredient into localized soils. High risk of aquatic runoff and groundwater contamination. Immediate application of polymer stickers is recommended.`;
        } else if (leachedToSoilMg >= 25.0) {
            hazardStatus = "ELEVATED SOIL LEACHING";
            hazardClass = "alert-warning";
            warningText = `CAUTION: Pesticide leaching to soil reaches ${leachedToSoilMg.toFixed(1)} mg. Elevated crop protection loss. Delay pesticide spraying if heavy rain forecast within 48 hours.`;
        }
        
        return {
            cropName: crop.name,
            initialLoadMg: parseFloat(initialFoliarLoadMg.toFixed(2)),
            leachedToSoilMg: parseFloat(leachedToSoilMg.toFixed(2)),
            retainedMg: parseFloat(retainedOnFoliageMg.toFixed(2)),
            washOffPercent: parseFloat((washOffFraction * 100).toFixed(2)),
            status: hazardStatus,
            cssClass: hazardClass,
            warning: warningText
        };
    }
}

class FilterCloggingEnergyPredictor {
    /**
     * Models particulate capture in commercial air HVAC filters and predicts blower energy overheads.
     * @param {string} filterKey - Filter grade: 'merv8', 'merv13', 'hepa'.
     * @param {number} pmConcUgM3 - Ambient PM concentration in µg/m³.
     * @param {number} flowRateM3H - Air flow volume in m³/hour.
     * @param {number} exposureHours - Blower operational hours.
     * @returns {Object} Clogging percentage, pressure drop, fan power increase, and energy overhead.
     */
    static simulateClogging(filterKey, pmConcUgM3, flowRateM3H, exposureHours) {
        if (pmConcUgM3 < 0) pmConcUgM3 = 0;
        if (flowRateM3H < 0) flowRateM3H = 0;
        if (exposureHours < 0) exposureHours = 0;
        
        const filterConfigs = {
            merv8: { name: "MERV 8 (Coarse Pre-filter)", dpClean: 70, delta: 0.8, powerClean: 400 },
            merv13: { name: "MERV 13 (Medium Efficiency)", dpClean: 120, delta: 1.5, powerClean: 600 },
            hepa: { name: "HEPA H13 (Absolute Cleanroom)", dpClean: 250, delta: 3.5, powerClean: 1200 }
        };
        
        const filter = filterConfigs[filterKey.toLowerCase()] || filterConfigs.merv13;
        
        // 1. Cumulative dust mass captured in filter cake (mg)
        // Mass (mg) = AirConc (µg/m³) * FlowRate (m³/h) * Time (h) * 10^-6 g/µg * 10^3 mg/g
        // Mass = AirConc * FlowRate * Time * 10^-3 mg
        const cumulativeDustMg = pmConcUgM3 * flowRateM3H * exposureHours * 0.001;
        
        // 2. Clogging fraction: modeled after exponential cake filtration curves
        // Clogging coefficient delta scales the pressure build-up
        const cloggingFraction = 1 - Math.exp(-filter.delta * cumulativeDustMg * 0.00001);
        const cloggingPercent = cloggingFraction * 100;
        
        // 3. Pressure drop (dP, Pascals)
        // dP = dP_clean * (1 + 8 * C_clog^2) representing non-linear resistance of filter cake
        const dpClogged = filter.dpClean * (1 + 8 * Math.pow(cloggingFraction, 2));
        
        // 4. Blower Power increase (Watts) and energy overhead (kWh)
        // Power increases proportionally with pressure drop increase
        const deltaPowerWatts = filter.powerClean * ((dpClogged / filter.dpClean) - 1);
        const energyOverheadKwh = (deltaPowerWatts * exposureHours) / 1000;
        
        let maintenanceStatus = "OPTIMAL PRESSURE BALANCE";
        let statusClass = "alert-safe";
        let warningText = `Filter pressure drop is within optimal boundary limits (dP = ${dpClogged.toFixed(0)} Pa). Blower energy draw is normal.`;
        
        if (cloggingPercent >= 50) {
            maintenanceStatus = "CRITICAL PRESSURE RESISTANCE / REPLACE FILTER";
            statusClass = "alert-danger";
            warningText = `WARNING: Pre-filter is heavily clogged at ${cloggingPercent.toFixed(1)}%. Pressure drop has spiked to ${dpClogged.toFixed(0)} Pa. HVAC fan energy overhead is inflated by ${energyOverheadKwh.toFixed(2)} kWh. Immediate filter replacement required to prevent blower motor burnout.`;
        } else if (cloggingPercent >= 15) {
            maintenanceStatus = "ELEVATED CAKE DUST LEVEL / SCHEDULE SERVICE";
            statusClass = "alert-warning";
            warningText = `CAUTION: Filter is showing dust loading (clogged: ${cloggingPercent.toFixed(1)}%). Pressure drop reaches ${dpClogged.toFixed(0)} Pa. Fan energy draw is elevated by ${deltaPowerWatts.toFixed(0)} Watts. Schedule replacement within 72 operating hours.`;
        }
        
        return {
            filterName: filter.name,
            dustCapturedMg: parseFloat(cumulativeDustMg.toFixed(2)),
            cloggingPercent: parseFloat(cloggingPercent.toFixed(2)),
            pressureDropPa: parseFloat(dpClogged.toFixed(2)),
            fanPowerIncreaseWatts: parseFloat(deltaPowerWatts.toFixed(2)),
            energyOverheadKwh: parseFloat(energyOverheadKwh.toFixed(2)),
            status: maintenanceStatus,
            cssClass: statusClass,
            warning: warningText
        };
    }
}

class PhytoCleanupModeler {
    /**
     * Simulates heavy metal soil remediation cycles using phytoremediation hyperaccumulators and estimates ROI vs excavation.
     * @param {number} soilConcInit - Initial soil metal concentration (mg/kg).
     * @param {number} soilConcTarget - Target regulatory safety threshold (mg/kg).
     * @param {number} siteAreaM2 - Land area of the polluted site (m²).
     * @param {number} soilDepthM - Contaminated soil depth (m, typically 0.15 to 1.0).
     * @param {number} biomassYieldKgHa - Crop biomass dry yield per hectare per year (kg/ha/year).
     * @param {number} bcf - Bioconcentration Factor (Plant Conc / Soil Conc).
     * @param {number} costPerCycleHa - Cost of planting, harvesting, and ash disposal per hectare per cycle ($).
     * @returns {Object} Remediation timeline, cost, excavation comparison, and feasibility assessment.
     */
    static simulateRemediation(soilConcInit, soilConcTarget, siteAreaM2, soilDepthM, biomassYieldKgHa, bcf, costPerCycleHa) {
        if (soilConcInit <= 0) return { error: "Initial concentration must be greater than 0" };
        if (soilConcTarget <= 0) soilConcTarget = 0.1;
        if (soilConcTarget >= soilConcInit) {
            return {
                cyclesRequired: 0,
                phytoCost: 0,
                excavationCost: 0,
                savingsDollars: 0,
                savingsPercent: 0,
                status: "REMEDIATION ALREADY COMPLETED",
                warning: "Soil concentration is already below target safety threshold."
            };
        }

        // Soil mass calculation: Mass = Area * Depth * Density
        // Soil bulk density assumed at 1.3 g/cm3 = 1300 kg/m3
        const soilDensityKgM3 = 1300;
        const totalSoilMassKg = siteAreaM2 * soilDepthM * soilDensityKgM3;

        // Area in hectares (1 ha = 10,000 m²)
        const siteAreaHa = siteAreaM2 / 10000;

        // Annual biomass dry yield on the site (kg/year)
        const siteBiomassYieldKg = biomassYieldKgHa * siteAreaHa;

        // Iteratively calculate cleanup cycles to avoid floating point division issues, or use exact logarithmic solution
        // extractionFraction = (siteBiomassYieldKg * BCF) / totalSoilMassKg.
        // Let's cap the extraction fraction at 0.95 per cycle to remain conservative.
        const extractionFraction = Math.min(0.95, (siteBiomassYieldKg * bcf) / totalSoilMassKg);

        let cycles = 0;
        if (extractionFraction > 0) {
            // C_t = C_0 * (1 - extractionFraction)^cycles
            // cycles = ln(C_target / C_init) / ln(1 - extractionFraction)
            cycles = Math.log(soilConcTarget / soilConcInit) / Math.log(1 - extractionFraction);
            cycles = Math.ceil(cycles);
        } else {
            cycles = Infinity;
        }

        const phytoCost = siteAreaHa * costPerCycleHa * (isFinite(cycles) ? cycles : 0);

        // Excavation (dig-and-dump) cost calculation:
        // Soil mass in metric tons (1 metric ton = 1000 kg)
        const soilMassTons = totalSoilMassKg / 1000;
        // Cost: $50/ton dig + $60/ton hazardous landfill fee + $30/ton backfill = $140/ton
        const excavationCostPerTon = 140;
        const excavationCost = soilMassTons * excavationCostPerTon;

        const savingsDollars = excavationCost - phytoCost;
        const savingsPercent = excavationCost > 0 ? (savingsDollars / excavationCost) * 100 : 0;

        let status = "PHYTOREMEDIATION HIGHLY FEASIBLE";
        let warningText = `Phytoremediation is projected to take ${cycles} years/cycles. It saves $${savingsDollars.toFixed(0)} (${savingsPercent.toFixed(1)}%) compared to rapid excavation. Highly recommended for non-urgent site developments.`;

        if (cycles > 25) {
            status = "PHYTOREMEDIATION NOT RECOMMENDED / TIMELINE TOO LONG";
            warningText = `CAUTION: Cleanup timeline exceeds 25 years (${cycles} cycles required due to low biomass/BCF). Rapid excavation is recommended despite higher costs ($${excavationCost.toFixed(0)}) if site development is urgent.`;
        } else if (cycles > 10) {
            status = "PHYTOREMEDIATION CONDITIONALLY FEASIBLE";
            warningText = `NOTE: Moderate timeline of ${cycles} cycles required. Cost savings are substantial ($${savingsDollars.toFixed(0)}). Recommended as a low-cost holding strategy.`;
        }

        return {
            soilMassTons: parseFloat(soilMassTons.toFixed(2)),
            cyclesRequired: isFinite(cycles) ? cycles : 999,
            phytoCost: parseFloat(phytoCost.toFixed(2)),
            excavationCost: parseFloat(excavationCost.toFixed(2)),
            savingsDollars: parseFloat(savingsDollars.toFixed(2)),
            savingsPercent: parseFloat(savingsPercent.toFixed(2)),
            status: status,
            warning: warningText
        };
    }
}

class GreenWallThermalPredictor {
    /**
     * Simulates evapotranspirational cooling and solar shading energy savings of a green wall on building HVAC systems.
     * @param {number} wallAreaM2 - Vertical wall surface area covered by vegetation (m²).
     * @param {number} leafAreaIndex - Leaf Area Index of green wall canopy.
     * @param {number} transpirationRateLPerM2Day - Average transpiration rate (L water / m² leaf area per day).
     * @param {number} copCooling - Coefficient of Performance of building HVAC cooling system (typically 2.5 to 4.0).
     * @param {number} electricityCostPerKwh - Local cost of electricity in $/kWh.
     * @param {number} solarHeatGainReductionPercent - Percentage of direct solar radiation blocked by green wall shading (%).
     * @returns {Object} Transpiration water lost, cooling load offset, energy saved, monetary savings, and carbon reduction.
     */
    static simulateThermalOffset(wallAreaM2, leafAreaIndex, transpirationRateLPerM2Day, copCooling, electricityCostPerKwh, solarHeatGainReductionPercent) {
        if (wallAreaM2 < 0) wallAreaM2 = 0;
        if (leafAreaIndex < 0) leafAreaIndex = 0;
        if (transpirationRateLPerM2Day < 0) transpirationRateLPerM2Day = 0;
        if (copCooling <= 0) copCooling = 3.0; // default COP

        // 1. Water transpired per day (L) = Wall Area * LAI * TranspRate
        const leafAreaTotalM2 = wallAreaM2 * leafAreaIndex;
        const waterTranspiredDailyL = leafAreaTotalM2 * transpirationRateLPerM2Day;

        // 2. Latent Heat cooling energy offset
        // Latent heat of vaporization of water at 25C is ~2.45 MJ / L
        // 1 MJ = 0.277778 kWh
        const coolingEnergyMjDaily = waterTranspiredDailyL * 2.45;
        const coolingEnergyKwhDaily = coolingEnergyMjDaily * 0.277778;

        // 3. Solar shading cooling load offset
        // Assume base solar load on a bare wall is 4.0 kWh/m²/day
        // Shading reduction factor reduces this load directly
        const baseSolarHeatGainKwhDaily = wallAreaM2 * 4.0;
        const shadingEnergyKwhDaily = baseSolarHeatGainKwhDaily * (solarHeatGainReductionPercent / 100);

        const totalThermalEnergyOffsetKwhDaily = coolingEnergyKwhDaily + shadingEnergyKwhDaily;

        // 4. Actual HVAC electrical energy savings (kWh) = Thermal Offset / COP
        const electricalSavingsKwhDaily = totalThermalEnergyOffsetKwhDaily / copCooling;
        const monetarySavingsDaily = electricalSavingsKwhDaily * electricityCostPerKwh;

        // 5. Carbon emissions reduction: EPA average emission factor ~0.38 kg CO2 per kWh
        const co2MitigatedKgDaily = electricalSavingsKwhDaily * 0.38;

        let efficiencyClass = "EFFICIENT GREEN WALL THERMAL BARRIER";
        let status = "HIGH COOLING OFFSET";
        if (electricalSavingsKwhDaily < 5.0) {
            status = "LOW COOLING OFFSET";
            efficiencyClass = "NEGLIGIBLE THERMAL IMPACT";
        } else if (electricalSavingsKwhDaily > 30.0) {
            status = "EXCEPTIONAL COOLING OFFSET";
            efficiencyClass = "APEX ENERGY SAVING INFRASTRUCTURE";
        }

        return {
            dailyWaterTranspiredL: parseFloat(waterTranspiredDailyL.toFixed(1)),
            latentCoolingKwh: parseFloat(coolingEnergyKwhDaily.toFixed(2)),
            shadingSavingsKwh: parseFloat(shadingEnergyKwhDaily.toFixed(2)),
            totalThermalKwh: parseFloat(totalThermalEnergyOffsetKwhDaily.toFixed(2)),
            hvacElectricalKwhSaved: parseFloat(electricalSavingsKwhDaily.toFixed(2)),
            dailySavingsDollars: parseFloat(monetarySavingsDaily.toFixed(2)),
            dailyCo2MitigatedKg: parseFloat(co2MitigatedKgDaily.toFixed(2)),
            status: status,
            efficiencyClass: efficiencyClass
        };
    }
}

// Support Universal Module Definition (UMD) pattern
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { LeafNormalizer, ResiliencePredictor, LitterLeacher, AptiApiClassifier, HeavyMetalTranslocator, CanopyDepositionSimulator, DermalPartitionSimulator, PesticideWashoffModeler, FilterCloggingEnergyPredictor, PhytoCleanupModeler, GreenWallThermalPredictor };
} else {
    window.LeafNormalizer = LeafNormalizer;
    window.ResiliencePredictor = ResiliencePredictor;
    window.LitterLeacher = LitterLeacher;
    window.AptiApiClassifier = AptiApiClassifier;
    window.HeavyMetalTranslocator = HeavyMetalTranslocator;
    window.CanopyDepositionSimulator = CanopyDepositionSimulator;
    window.DermalPartitionSimulator = DermalPartitionSimulator;
    window.PesticideWashoffModeler = PesticideWashoffModeler;
    window.FilterCloggingEnergyPredictor = FilterCloggingEnergyPredictor;
    window.PhytoCleanupModeler = PhytoCleanupModeler;
    window.GreenWallThermalPredictor = GreenWallThermalPredictor;
}
