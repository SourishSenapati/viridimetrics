/**
 * Plant Biomonitoring Premium Predictive Engine
 * Implements:
 * 1. A Custom Multilayer Perceptron (MLP) Neural Network with backpropagation.
 * 2. A k-NN / Cosine Similarity Retrieval-Augmented Generation (RAG) parameter lookup.
 * 3. A Sparse Identification of Non-linear Dynamics (SINDy) symbolic regression solver.
 * 
 * Author: Sourish Senapati
 * Date: June 2, 2026
 */

const fs = require('fs');
const path = require('path');

// Load database
const dbPath = path.join(__dirname, 'open_source_data.json');
let database = { species: [] };
try {
    database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
} catch (e) {
    // Fallback if file isn't found during direct runs
}

// Helper: Normalize value
function normalize(val, min, max) {
    const v = Number(val) || 0;
    const mn = Number(min) || 0;
    const mx = Number(max) || 100;
    if (Math.abs(mx - mn) < 1e-9) return 0.5;
    return (v - mn) / (mx - mn);
}

// Helper: Denormalize value
function denormalize(norm, min, max) {
    const n = Number(norm) || 0;
    const mn = Number(min) || 0;
    const mx = Number(max) || 100;
    return n * (mx - mn) + mn;
}

/**
 * 1. MULTILAYER PERCEPTRON (MLP) NEURAL NETWORK
 * 3-layer feedforward network with Backpropagation.
 */
class SimpleNeuralNetwork {
    constructor(inputDim, hiddenDim, outputDim) {
        this.inputDim = inputDim;
        this.hiddenDim = hiddenDim;
        this.outputDim = outputDim;

        // Weight matrices
        this.w1 = Array.from({ length: inputDim }, () => 
            Array.from({ length: hiddenDim }, () => Math.random() * 2 - 1)
        );
        this.w2 = Array.from({ length: hiddenDim }, () => 
            Array.from({ length: outputDim }, () => Math.random() * 2 - 1)
        );

        // Biases
        this.b1 = Array(hiddenDim).fill(0).map(() => Math.random() * 2 - 1);
        this.b2 = Array(outputDim).fill(0).map(() => Math.random() * 2 - 1);
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    sigmoidDeriv(y) {
        return y * (1 - y);
    }

    forward(input) {
        this.input = input;
        
        // Input -> Hidden
        this.hidden = Array(this.hiddenDim).fill(0);
        for (let j = 0; j < this.hiddenDim; j++) {
            let sum = this.b1[j];
            for (let i = 0; i < this.inputDim; i++) {
                sum += input[i] * this.w1[i][j];
            }
            this.hidden[j] = this.sigmoid(sum);
        }

        // Hidden -> Output
        this.output = Array(this.outputDim).fill(0);
        for (let k = 0; k < this.outputDim; k++) {
            let sum = this.b2[k];
            for (let j = 0; j < this.hiddenDim; j++) {
                sum += this.hidden[j] * this.w2[j][k];
            }
            this.output[k] = this.sigmoid(sum);
        }

        return this.output;
    }

    backward(target, learningRate = 0.1) {
        // Output layer error gradients
        const dOutput = Array(this.outputDim).fill(0);
        for (let k = 0; k < this.outputDim; k++) {
            const err = target[k] - this.output[k];
            dOutput[k] = err * this.sigmoidDeriv(this.output[k]);
        }

        // Hidden layer error gradients
        const dHidden = Array(this.hiddenDim).fill(0);
        for (let j = 0; j < this.hiddenDim; j++) {
            let err = 0;
            for (let k = 0; k < this.outputDim; k++) {
                err += dOutput[k] * this.w2[j][k];
            }
            dHidden[j] = err * this.sigmoidDeriv(this.hidden[j]);
        }

        // Update weights w2 & biases b2 (Hidden -> Output)
        for (let k = 0; k < this.outputDim; k++) {
            this.b2[k] += learningRate * dOutput[k];
            for (let j = 0; j < this.hiddenDim; j++) {
                this.w2[j][k] += learningRate * dOutput[k] * this.hidden[j];
            }
        }

        // Update weights w1 & biases b1 (Input -> Hidden)
        for (let j = 0; j < this.hiddenDim; j++) {
            this.b1[j] += learningRate * dHidden[j];
            for (let i = 0; i < this.inputDim; i++) {
                this.w1[i][j] += learningRate * dHidden[j] * this.input[i];
            }
        }
    }

    train(inputs, targets, epochs = 1000, lr = 0.1) {
        for (let epoch = 0; epoch < epochs; epoch++) {
            for (let i = 0; i < inputs.length; i++) {
                this.forward(inputs[i]);
                this.backward(targets[i], lr);
            }
        }
    }
}

/**
 * 2. SPECIES RETRIEVAL-AUGMENTED GENERATION (RAG) RETRIEVAL ENGINE
 * Custom Cosine/Jaccard similarity search over the plant database.
 */
class SpeciesRAGEngine {
    static encodeSpecies(species, limits) {
        // One-hot encode Categoricals
        const morphologies = ['planar', 'lanceolate', 'elliptic', 'obovate', 'acicular'];
        const habits = ['tree_dense', 'tree_open', 'shrub'];

        const morphVec = morphologies.map(m => species.morphology === m ? 1.0 : 0.0);
        const habitVec = habits.map(h => species.growthHabit === h ? 1.0 : 0.0);
        
        const evergreenVal = species.evergreen ? 1.0 : 0.0;
        const pubescentVal = species.isPubescent ? 1.0 : 0.0;

        // Normalized numerical properties
        const waxVal = normalize(species.epicuticularWax || 100, limits.waxMin, limits.waxMax);

        return [
            ...morphVec,      // 5 values
            ...habitVec,      // 3 values
            evergreenVal,     // 1 value
            pubescentVal,     // 1 value
            waxVal            // 1 value
        ];                    // Total 11-dimension vector
    }

    static cosineSimilarity(v1, v2) {
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < v1.length; i++) {
            dot += v1[i] * v2[i];
            normA += v1[i] * v1[i];
            normB += v2[i] * v2[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Finds the top K most similar species in the database to a set of query traits.
     */
    static retrieveClosestSpecies(queryTraits, k = 3) {
        if (!database.species || database.species.length === 0) return [];

        // Determine min/max values for wax normalization
        const waxes = database.species.map(s => s.epicuticularWax || 100);
        const limits = {
            waxMin: Math.min(...waxes),
            waxMax: Math.max(...waxes)
        };

        const queryVec = this.encodeSpecies(queryTraits, limits);

        const scored = database.species.map(s => {
            const sVec = this.encodeSpecies(s, limits);
            const sim = this.cosineSimilarity(queryVec, sVec);
            return { species: s, similarity: sim };
        });

        // Sort by similarity descending
        scored.sort((a, b) => b.similarity - a.similarity);
        return scored.slice(0, k);
    }

    /**
     * Estimates missing parameters for a species query using similarity-weighted RAG aggregation.
     */
    static predictTraits(queryTraits, k = 3) {
        const matches = this.retrieveClosestSpecies(queryTraits, k);
        if (matches.length === 0) return {};

        const results = {
            ascorbicAcid: 0,
            totalChlorophyll: 0,
            pH: 0,
            rwc: 0,
            transpirationRate: 0,
            bcf: 0,
            biomassYieldKgHa: 0,
            heavyMetalTF: { lead: 0, cadmium: 0, chromium: 0, nickel: 0, copper: 0, zinc: 0 },
            heavyMetalExtractionRate: { lead: 0, cadmium: 0, chromium: 0, nickel: 0, copper: 0, zinc: 0 }
        };

        let simSum = 0;
        matches.forEach(m => {
            const sim = Math.max(0.001, m.similarity);
            simSum += sim;

            results.ascorbicAcid += m.species.ascorbicAcid * sim;
            results.totalChlorophyll += m.species.totalChlorophyll * sim;
            results.pH += m.species.pH * sim;
            results.rwc += m.species.rwc * sim;
            results.transpirationRate += m.species.transpirationRate * sim;
            results.bcf += m.species.bcf * sim;
            results.biomassYieldKgHa += m.species.biomassYieldKgHa * sim;

            // Metals
            for (const key of Object.keys(results.heavyMetalTF)) {
                results.heavyMetalTF[key] += m.species.heavyMetalTF[key] * sim;
                results.heavyMetalExtractionRate[key] += m.species.heavyMetalExtractionRate[key] * sim;
            }
        });

        // Normalize by similarity sum
        results.ascorbicAcid = parseFloat((results.ascorbicAcid / simSum).toFixed(2));
        results.totalChlorophyll = parseFloat((results.totalChlorophyll / simSum).toFixed(3));
        results.pH = parseFloat((results.pH / simSum).toFixed(2));
        results.rwc = parseFloat((results.rwc / simSum).toFixed(1));
        results.transpirationRate = parseFloat((results.transpirationRate / simSum).toFixed(2));
        results.bcf = parseFloat((results.bcf / simSum).toFixed(2));
        results.biomassYieldKgHa = Math.round(results.biomassYieldKgHa / simSum);

        for (const key of Object.keys(results.heavyMetalTF)) {
            results.heavyMetalTF[key] = parseFloat((results.heavyMetalTF[key] / simSum).toFixed(4));
            results.heavyMetalExtractionRate[key] = parseFloat((results.heavyMetalExtractionRate[key] / simSum).toFixed(1));
        }

        return {
            predictedTraits: results,
            similarMatches: matches.map(m => ({
                scientificName: m.scientificName || m.species.scientificName,
                commonName: m.commonName || m.species.commonName,
                similarity: parseFloat((m.similarity * 100).toFixed(1)) + '%',
                sourcePapers: m.species.sourcePapers
            }))
        };
    }
}

/**
 * 3. SPARSE IDENTIFICATION OF NON-LINEAR DYNAMICS (SINDy)
 * Finds sparse representation of non-linear equations from time-series observations.
 * Model: Y = Theta(X) * Xi
 */
class SindyDynamicsLearner {
    /**
     * Solves least-squares problem to identify sparse coefficients of dynamic systems.
     * @param {Array<number>} xValues - Independent variable coordinates.
     * @param {Array<number>} yValues - Dependent variable coordinates (observations).
     * @param {Array<Function>} libraryFunctions - Functions to evaluate on X (e.g. x => 1, x => x, x => x^2).
     * @param {number} threshold - Sparsity threshold below which coefficients are set to zero.
     */
    static fit(xValues, yValues, libraryFunctions, threshold = 0.05) {
        const N = xValues.length;
        const M = libraryFunctions.length;

        // Construct Theta matrix (N x M)
        const Theta = [];
        for (let i = 0; i < N; i++) {
            const row = [];
            for (let j = 0; j < M; j++) {
                row.push(libraryFunctions[j](xValues[i]));
            }
            Theta.push(row);
        }

        // Solve standard linear least squares: Theta_T * Theta * Xi = Theta_T * Y
        // Since we are zero-dependency, let's solve using normal equation for low dimensional libraries.
        // transpose(Theta) (M x N)
        const ThetaT = Array.from({ length: M }, () => Array(N).fill(0));
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < M; j++) {
                ThetaT[j][i] = Theta[i][j];
            }
        }

        // ThetaT * Theta (M x M)
        const ThetaTTheta = Array.from({ length: M }, () => Array(M).fill(0));
        for (let i = 0; i < M; i++) {
            for (let j = 0; j < M; j++) {
                let sum = 0;
                for (let k = 0; k < N; k++) {
                    sum += ThetaT[i][k] * Theta[k][j];
                }
                ThetaTTheta[i][j] = sum;
            }
        }

        // ThetaT * Y (M x 1)
        const ThetaTY = Array(M).fill(0);
        for (let i = 0; i < M; i++) {
            let sum = 0;
            for (let k = 0; k < N; k++) {
                sum += ThetaT[i][k] * yValues[k];
            }
            ThetaTY[i] = sum;
        }

        // Solve using Gaussian Elimination
        let Xi = this.solveLinearSystem(ThetaTTheta, ThetaTY);

        // Apply Sparsity Thresholding (Sequentially Thresholded Least Squares)
        for (let iter = 0; iter < 5; iter++) {
            const activeIndices = [];
            for (let j = 0; j < M; j++) {
                if (Math.abs(Xi[j]) >= threshold) {
                    activeIndices.push(j);
                } else {
                    Xi[j] = 0; // Set sparse terms to zero
                }
            }

            if (activeIndices.length === 0) break;

            // Re-solve least squares on active parameters
            const K = activeIndices.length;
            const ThetaSub = Theta.map(row => activeIndices.map(idx => row[idx]));
            const ThetaSubT = Array.from({ length: K }, () => Array(N).fill(0));
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < K; j++) {
                    ThetaSubT[j][i] = ThetaSub[i][j];
                }
            }

            const TST = Array.from({ length: K }, () => Array(K).fill(0));
            for (let i = 0; i < K; i++) {
                for (let j = 0; j < K; j++) {
                    let sum = 0;
                    for (let n = 0; n < N; n++) {
                        sum += ThetaSubT[i][n] * ThetaSub[n][j];
                    }
                    TST[i][j] = sum;
                }
            }

            const TSY = Array(K).fill(0);
            for (let i = 0; i < K; i++) {
                let sum = 0;
                for (let n = 0; n < N; n++) {
                    sum += ThetaSubT[i][n] * yValues[n];
                }
                TSY[i] = sum;
            }

            const XiSub = this.solveLinearSystem(TST, TSY);
            
            // Map back to global Xi array
            Xi = Array(M).fill(0);
            for (let j = 0; j < K; j++) {
                Xi[activeIndices[j]] = XiSub[j];
            }
        }

        return Xi.map(coeff => parseFloat(coeff.toFixed(4)));
    }

    static solveLinearSystem(A, B) {
        const n = B.length;
        const M = A.map((row, idx) => [...row, B[idx]]); // Augmented matrix

        for (let i = 0; i < n; i++) {
            // Find pivot row
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
                    maxRow = k;
                }
            }

            // Swap rows
            const temp = M[i];
            M[i] = M[maxRow];
            M[maxRow] = temp;

            // Zero out pivot column for subsequent rows
            for (let k = i + 1; k < n; k++) {
                const divisor = Math.abs(M[i][i]) < 1e-9 ? 1e-9 : M[i][i];
                const factor = M[k][i] / divisor;
                for (let j = i; j <= n; j++) {
                    M[k][j] -= factor * M[i][j];
                }
            }
        }

        // Back substitution
        const x = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = M[i][n];
            for (let j = i + 1; j < n; j++) {
                sum -= M[i][j] * x[j];
            }
            const divisor = Math.abs(M[i][i]) < 1e-9 ? 1e-9 : M[i][i];
            x[i] = sum / divisor;
        }

        return x;
    }
}

module.exports = {
    SimpleNeuralNetwork,
    SpeciesRAGEngine,
    SindyDynamicsLearner
};
