/**
 * Air Pollution Tolerance Index & Anticipated Performance Index (APTI-API) Classifier
 * Core mathematical engine with robust type safety and boundary checking.
 */

function safeNum(val, fallback) {
    if (val === null || val === undefined || typeof val === 'boolean' || typeof val === 'object' || Array.isArray(val)) {
        return fallback;
    }
    const num = Number(val);
    return isNaN(num) ? fallback : num;
}

function safeNumClamped(val, fallback, min = null, max = null) {
    let num = safeNum(val, fallback);
    if (min !== null && num < min) num = min;
    if (max !== null && num > max) num = max;
    return num;
}

function safeStr(val, fallback) {
    if (typeof val !== 'string') return fallback;
    return val.trim().toLowerCase();
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
        // Enforce boundary conditions and type conversions
        const aa = safeNumClamped(ascorbicAcid, 2.0, 0, 1000);
        const tc = safeNumClamped(totalChlorophyll, 1.5, 0, 1000);
        const phVal = safeNumClamped(pH, 7.0, 1.0, 14.0);
        const rwcVal = safeNumClamped(rwc, 70.0, 0.0, 100.0);

        const score = (aa * (tc + phVal) + rwcVal) / 10;
        const roundedScore = parseFloat(score.toFixed(2));

        let classification = "Sensitive";
        let cssClass = "status-danger";

        if (roundedScore >= 30.0) {
            classification = "Highly Tolerant (Ideal Bio-filter)";
            cssClass = "status-healthy";
        } else if (roundedScore >= 17.0) {
            classification = "Tolerant";
            cssClass = "status-warning";
        } else if (roundedScore >= 11.0) {
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
        const apti = safeNumClamped(aptiScore, 10.0, 0, 1000);
        let score = 0;

        // 1. APTI points
        if (apti > 25) {
            score += 8;
        } else if (apti >= 21) {
            score += 6;
        } else if (apti >= 16) {
            score += 4;
        } else if (apti >= 10) {
            score += 2;
        } else {
            score += 0;
        }

        // 2. Growth habit points
        const habit = safeStr(growthHabit, 'shrub');
        if (habit.includes('dense')) {
            score += 4;
        } else if (habit.includes('open')) {
            score += 2;
        } else if (habit.includes('shrub')) {
            score += 1;
        } else {
            // Default to shrub / ground cover if unrecognized but valid type
            score += 1;
        }

        // 3. Foliage seasonality
        // Handle potential string boolean equivalents like 'true' / 'false'
        let isEvergreen = false;
        if (typeof evergreen === 'boolean') {
            isEvergreen = evergreen;
        } else if (typeof evergreen === 'string') {
            isEvergreen = evergreen.trim().toLowerCase() === 'true';
        }

        if (isEvergreen) {
            score += 2;
        } else {
            score += 1;
        }

        // 4. Economic value points
        const econ = safeStr(economicValue, 'low');
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

module.exports = { AptiApiClassifier };
