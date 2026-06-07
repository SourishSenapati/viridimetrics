// Interactive JavaScript Core - Plant Biomonitors Explorer

function switchTab(tabId) {
    // Update active tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTabBtn = document.getElementById(`tab-btn-${tabId}`);
    if (activeTabBtn) activeTabBtn.classList.add('active');

    // Update active content panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`tab-content-${tabId}`);
    if (activePanel) activePanel.classList.add('active');
}

// 2. Interactive PM Size & Scaling Explorer
function updatePMScale() {
    const zoom = parseFloat(document.getElementById('pm-zoom-slider').value);
    document.getElementById('zoom-value').textContent = zoom.toFixed(1) + 'x';

    // Base Dimensions at 1.0x
    const baseHairWidth = 200;
    const basePM10Radius = 30;
    const basePM25Radius = 7.5;
    const basePM02Radius = 2.0;

    // Apply scaling
    const hairGroup = document.getElementById('hair-group');
    const pm10Group = document.getElementById('pm10-group');
    const pm25Group = document.getElementById('pm25-group');
    const pm02Group = document.getElementById('pm02-group');

    // Adjust Hair width dynamically (clamped to prevent SVG overflow)
    const hairWidth = baseHairWidth * zoom;
    hairGroup.querySelector('rect').setAttribute('width', Math.min(hairWidth, 400));
    hairGroup.querySelector('text').setAttribute('x', Math.min(hairWidth / 2 + 20, 220));

    // Shift PM positions based on Hair expansion to prevent overlapping
    const hairRightBound = 20 + Math.min(hairWidth, 400);
    
    // Calculate new positions
    const pm10X = hairRightBound + 80;
    const pm25X = pm10X + 100 + (basePM10Radius * zoom);
    const pm02X = pm25X + 70 + (basePM25Radius * zoom);

    // Update PM10
    pm10Group.querySelector('circle').setAttribute('cx', pm10X);
    pm10Group.querySelector('circle').setAttribute('r', basePM10Radius * zoom);
    pm10Group.querySelector('text').setAttribute('x', pm10X);

    // Update PM2.5
    pm25Group.querySelector('circle').setAttribute('cx', pm25X);
    pm25Group.querySelector('circle').setAttribute('r', basePM25Radius * zoom);
    pm25Group.querySelector('text').setAttribute('x', pm25X);

    // Update PM0.2
    pm02Group.querySelector('circle').setAttribute('cx', pm02X);
    pm02Group.querySelector('circle').setAttribute('r', Math.max(basePM02Radius * zoom, 1.5)); // Ensure it stays visible
    pm02Group.querySelector('text').setAttribute('x', pm02X);
}

// 3. Anatomical Pathogenesis Display
const pathologyData = {
    upper: {
        title: "Upper Airway (Nose & Throat Entry)",
        pmType: "PM₁₀ (Coarse Particles &bull; 10 µm)",
        penetration: "Physically blocked by nasal vibrissae (hairs) and mucous membranes in the upper respiratory tract.",
        risk: "Chronic physical irritation of mucosal tissues, triggering local inflammatory responses, sinusitis, and persistent coughs.",
        clinical: "Exacerbates upper airway pathologies and chronic allergic rhinitis. Serves as a minor gateway, but most coarse mass is trapped here before deep pulmonary penetration."
    },
    lungs: {
        title: "Lower Respiratory Tract (Lungs & Alveoli)",
        pmType: "PM₂.₅ (Fine Particles &bull; 2.5 µm)",
        penetration: "Easily bypasses upper airways, traversing the trachea and bronchioles to settle deep inside the alveoli.",
        risk: "Triggers intense cellular oxidative stress, chronic alveolar wall irritation, macrophage damage, and tissue scarring (fibrosis).",
        clinical: "Significantly worsens chronic obstructive pulmonary disease (COPD), acute asthma attacks, pulmonary emphysema, and lung cancer morbidity."
    },
    vascular: {
        title: "Cardiovascular & Bloodstream Integration",
        pmType: "PM₀.₂ (Ultrafine Particles &bull; 0.2 µm)",
        penetration: "Crosses the extremely thin blood-air alveolar barrier directly into the systemic pulmonary circulation.",
        risk: "Initiates immediate cellular inflammation, vascular endothelial dysfunction, plaque destabilization, and autonomic nervous imbalances.",
        clinical: "Directly increases the clinical risk of acute myocardial infarction (heart attacks), stroke, vascular thrombosis, and fatal cardiac arrhythmias."
    }
};

function showPathology(zone) {
    // Reset selected states on SVG
    document.querySelectorAll('.anatomy-zone').forEach(z => z.classList.remove('selected'));
    document.querySelectorAll('.anatomy-zone-line').forEach(l => l.classList.remove('highlight'));
    
    // Highlight target zone
    const targetElement = document.getElementById(`zone-${zone}`);
    if (targetElement) targetElement.classList.add('selected');
    
    if (zone === 'vascular') {
        const lineElement = document.getElementById('zone-vascular');
        if (lineElement) lineElement.classList.add('highlight');
        const heartElement = document.getElementById('zone-heart');
        if (heartElement) heartElement.classList.add('selected');
    }

    // Populate info details
    const data = pathologyData[zone];
    const infoBox = document.getElementById('pathology-details-box');
    
    let colorClass = "txt-amber";
    if (zone === "lungs") colorClass = "txt-cyan";
    if (zone === "vascular") colorClass = "txt-violet";

    infoBox.innerHTML = `
        <div class="pathology-detail-content">
            <h4 class="${colorClass}">${data.title}</h4>
            <p><strong>Primary Vector:</strong> <span class="${colorClass}">${data.pmType}</span></p>
            <p><strong>Penetration Limit:</strong> ${data.penetration}</p>
            <p><strong>Pathogenic Action:</strong> ${data.risk}</p>
            <p><strong>Clinical Outcomes:</strong> <strong>${data.clinical}</strong></p>
        </div>
    `;
}

// 4. Retention Mechanics - Rain Simulator
let isRaining = false;
let rainInterval = null;

function changeRainSpeciesProfile() {
    const species = document.getElementById('rain-species-select').value;
    const waxLayer = document.getElementById('leaf-wax-layer');
    const feedback = document.getElementById('rain-feedback-msg');
    
    // Reset any washed particles
    resetRainSimulation();

    if (species === 'scots-pine') {
        // High wax (thick layer, many embedded particles, few surface particles)
        waxLayer.setAttribute('height', '38');
        waxLayer.setAttribute('y', '47');
        
        // Show particles inside wax, few on surface
        setupParticles(3, 8); // 3 surface, 8 embedded
        feedback.innerHTML = `<p><strong>Scots Pine (Pinus sylvestris)</strong>: Massive wax layer (715.6 µg/cm²). Traps the majority of its PM load internally as WPM (Wax-embedded Particulate Matter). <em>Very low vulnerability to hydraulic wash-off.</em></p>`;
    } else if (species === 'common-ivy') {
        // Low wax (thin layer, few embedded particles, many surface particles)
        waxLayer.setAttribute('height', '10');
        waxLayer.setAttribute('y', '75');
        
        setupParticles(12, 2); // 12 surface, 2 embedded
        feedback.innerHTML = `<p><strong>Common Ivy (Hedera helix)</strong>: Minimal wax layer (45.2 µg/cm²). PM sits loosely on the cuticle surface as SPM (Surface Particulate Matter). <em>Extremely vulnerable to precipitation wash-off.</em></p>`;
    } else {
        // Intermediate
        waxLayer.setAttribute('height', '24');
        waxLayer.setAttribute('y', '61');
        
        setupParticles(7, 5); // 7 surface, 5 embedded
        feedback.innerHTML = `<p><strong>Intermediate Taxa</strong>: Balanced epicuticular wax (approx. 250 µg/cm²). Steady partitioning between surface SPM and encapsulated WPM. <em>Moderate retention stability.</em></p>`;
    }
}

function setupParticles(surfaceCount, embeddedCount) {
    const svg = document.getElementById('leaf-cross-section');
    
    // Remove existing dynamic particles
    document.querySelectorAll('.dynamic-p').forEach(p => p.remove());

    // Get wax layer coordinates
    const waxLayer = document.getElementById('leaf-wax-layer');
    const waxY = parseFloat(waxLayer.getAttribute('y'));
    const waxHeight = parseFloat(waxLayer.getAttribute('height'));

    // Generate Surface Particles (SPM) - placed above the wax layer
    for (let i = 0; i < surfaceCount; i++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const cx = 30 + (i * (440 / surfaceCount)) + (Math.random() * 15);
        const cy = waxY - 5 - (Math.random() * 8);
        const size = Math.random() > 0.4 ? 6 : 3.5; // coarse vs fine
        const color = size > 4 ? '#ff9f43' : '#00d2d3'; // orange vs cyan
        
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', size);
        circle.setAttribute('fill', color);
        circle.setAttribute('class', 'spm-particle dynamic-p');
        
        svg.appendChild(circle);
    }

    // Generate Embedded Particles (WPM) - placed inside the wax layer
    for (let i = 0; i < embeddedCount; i++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const cx = 20 + (i * (460 / embeddedCount)) + (Math.random() * 15);
        const cy = waxY + 2 + (Math.random() * (waxHeight - 6));
        const size = Math.random() > 0.3 ? 2 : 1.2; // fine vs ultrafine
        const color = size > 1.5 ? '#00d2d3' : '#a55eea'; // cyan vs violet
        
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', size);
        circle.setAttribute('fill', color);
        circle.setAttribute('class', 'wpm-particle dynamic-p');
        
        svg.appendChild(circle);
    }
}

function toggleRainSimulation() {
    if (isRaining) {
        stopRainSimulation();
        return;
    }

    isRaining = true;
    const triggerBtn = document.getElementById('rain-trigger-btn');
    triggerBtn.textContent = "Stop Simulation";
    triggerBtn.style.background = "#e74c3c";
    triggerBtn.style.boxShadow = "0 4px 10px rgba(231, 76, 60, 0.2)";

    const container = document.getElementById('rain-overlay');
    const species = document.getElementById('rain-species-select').value;
    const feedback = document.getElementById('rain-feedback-msg');

    feedback.innerHTML = `<p><strong>Precipitation active...</strong> Rain droplets creating hydraulic shear forces on the leaf surface cuticle. Surface particles (SPM) are beginning to detach.</p>`;

    // Start falling rain droplets
    rainInterval = setInterval(() => {
        const drop = document.createElement('div');
        drop.classList.add('rain-drop');
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = (0.5 + Math.random() * 0.4) + 's';
        container.appendChild(drop);

        // Remove drop after animation completes
        setTimeout(() => {
            drop.remove();
        }, 900);
    }, 40);

    // Wash away SPM particles after 2 seconds
    setTimeout(() => {
        if (!isRaining) return; // check if simulation was stopped
        
        document.querySelectorAll('.spm-particle').forEach(p => {
            p.classList.add('washed');
        });

        if (species === 'scots-pine') {
            feedback.innerHTML = `<p><strong>Rain wash-off complete:</strong> Only a tiny fraction of total PM was on the surface (SPM) and got washed away. The bulk <strong>WPM (Wax-embedded) fine particles remain securely trapped</strong> inside the lipophilic wax matrix. <em>Sustained biomonitoring efficacy: 85%</em></p>`;
        } else if (species === 'common-ivy') {
            feedback.innerHTML = `<p><strong>Rain wash-off complete:</strong> Due to minimal wax presence, almost all PM sat on the surface. <strong>The leaf has been washed clean of nearly 90% of its accumulated load</strong>. <em>Sustained biomonitoring efficacy: 10% (Data wiped by rain)</em></p>`;
        } else {
            feedback.innerHTML = `<p><strong>Rain wash-off complete:</strong> Loose surface-deposited particles (SPM) washed off. Intermediate wax levels successfully preserved embedded particles. <em>Sustained biomonitoring efficacy: 55%</em></p>`;
        }
    }, 2000);
}

function stopRainSimulation() {
    isRaining = false;
    const triggerBtn = document.getElementById('rain-trigger-btn');
    triggerBtn.textContent = "Simulate Heavy Rainfall";
    triggerBtn.style.background = "var(--color-emerald)";
    triggerBtn.style.boxShadow = "0 4px 10px rgba(16, 185, 129, 0.2)";

    clearInterval(rainInterval);
    const container = document.getElementById('rain-overlay');
    container.innerHTML = '';
}

function resetRainSimulation() {
    stopRainSimulation();
    
    // Reset washed particles
    document.querySelectorAll('.spm-particle').forEach(p => {
        p.classList.remove('washed');
    });

    const species = document.getElementById('rain-species-select').value;
    const feedback = document.getElementById('rain-feedback-msg');
    
    if (species === 'scots-pine') {
        feedback.innerHTML = `<p><strong>Particles reset.</strong> Scots Pine is loaded with both SPM and WPM fractions prior to rain.</p>`;
    } else if (species === 'common-ivy') {
        feedback.innerHTML = `<p><strong>Particles reset.</strong> Common Ivy foliage loaded, with almost all PM exposed on the surface.</p>`;
    } else {
        feedback.innerHTML = `<p><strong>Particles reset.</strong> Intermediate foliage loaded with partitioned PM fractions.</p>`;
    }
}

// 5. Species Morphometric Regression Simulator
function runRegressionSimulation() {
    const wax = parseFloat(document.getElementById('reg-wax-slider').value);
    const hair = parseFloat(document.getElementById('reg-hair-slider').value);
    const sla = parseFloat(document.getElementById('reg-sla-slider').value);

    // Update value labels
    document.getElementById('wax-slider-val').textContent = wax.toFixed(1) + ' µg/cm²';
    document.getElementById('hair-slider-val').textContent = 'Score ' + hair.toFixed(1) + ' / 5';
    document.getElementById('sla-slider-val').textContent = sla.toFixed(1) + ' cm²/g';

    // Normalize inputs into [0, 1] relative to their bounds
    const wNorm = (wax - 10) / 790;       // Wax bounds: 10 - 800
    const hNorm = (hair - 1) / 4;          // Hair bounds: 1 - 5
    const sNorm = (sla - 20) / 230;        // SLA bounds: 20 - 250 (Negative correlation)

    // Sæbø's Regression Coefficients:
    // Wax (β = 0.66, p=0.000), Hair (β = 0.31, p=0.003), SLA (β = -0.34, p=0.002) for Total PM
    // PM0.2: Wax (β = 0.78, p=0.000), Hair (β = 0.20, p=0.185 - void), SLA (β = -0.36)

    // Calculate simulated outputs (mapped to empirical ranges of 5 to 60 µg/cm²)
    const rawTotalPM = (0.66 * wNorm) + (0.31 * hNorm) - (0.35 * sNorm);
    const totalPM = 5.0 + Math.max(0, rawTotalPM + 0.35) * 45.0; // Scaled to [5, 60] range

    // PM10 (coarse): heavily dependent on hairs and negative SLA
    const rawPM10 = (0.59 * wNorm) + (0.31 * hNorm) - (0.35 * sNorm);
    const pm10 = 4.0 + Math.max(0, rawPM10 + 0.35) * 35.0;

    // PM2.5 (fine): dependent on hairs and wax
    const rawPM25 = (0.66 * wNorm) + (0.45 * hNorm) - (0.35 * sNorm);
    const pm25 = 1.0 + Math.max(0, rawPM25 + 0.35) * 8.0;

    // PM0.2 (ultrafine): strictly driven by wax, hair is statistically void (beta coefficient lowered)
    const rawPM02 = (0.78 * wNorm) + (0.10 * hNorm) - (0.36 * sNorm);
    const pm02 = 0.1 + Math.max(0, rawPM02 + 0.36) * 4.5;

    // Update DOM
    document.getElementById('reg-total-pm').textContent = totalPM.toFixed(2);
    document.getElementById('reg-pm10').textContent = pm10.toFixed(2);
    document.getElementById('reg-pm25').textContent = pm25.toFixed(2);
    document.getElementById('reg-pm02').textContent = pm02.toFixed(2);
}
// 8. SimCity Greenbelt & Air Quality Grid Simulator
let activeTool = 'road';
const gridRows = 6;
const gridCols = 8;
let gridMapState = [];
let simWindSpeed = 2.0;
let simAmbientPm = 120.0;
let simRainfall = 150.0;
let simAdjuvant = 'none';

// Plant metadata properties for calculations
const simPlantsDb = {
    pine: { name: 'Scots Pine', sci: 'Pinus sylvestris', lai: 4.5, wax: 715.6, isPubescent: false, metalBcf: 0.15, ligninRatio: 45 },
    birch: { name: 'Silver Birch', sci: 'Betula pendula', lai: 3.5, wax: 220.0, isPubescent: true, metalBcf: 0.42, ligninRatio: 30 },
    ivy: { name: 'Common Ivy', sci: 'Hedera helix', lai: 4.0, wax: 45.2, isPubescent: false, metalBcf: 0.12, ligninRatio: 28 }
};

// Initial/default zoning layout
const defaultZoningLayout = [
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
    ['industrial', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
    ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
    ['path', 'path', 'path', 'path', 'path', 'path', 'path', 'path'],
    ['comm', 'empty', 'empty', 'comm', 'empty', 'empty', 'comm', 'empty'],
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty']
];

function initSimGrid() {
    gridMapState = [];
    for (let r = 0; r < gridRows; r++) {
        const row = [];
        for (let c = 0; c < gridCols; c++) {
            row.push({
                type: defaultZoningLayout[r][c],
                row: r,
                col: c,
                pmLevel: 20.0,
                soilConc: 0.0 // starts clean
            });
        }
        gridMapState.push(row);
    }
    renderSimGrid();
    runSimCalculation();
}

function selectPaletteTool(toolId) {
    activeTool = toolId;
    document.querySelectorAll('.palette-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const selectedBtn = document.getElementById(`palette-btn-${toolId}`);
    if (selectedBtn) selectedBtn.classList.add('active');
}

function handleGridCellClick(row, col) {
    const cell = gridMapState[row][col];
    
    // Prevent invalid combinations (e.g. green wall 'ivy' can only be placed on a building 'comm')
    if (activeTool === 'ivy') {
        if (cell.type !== 'comm' && cell.type !== 'ivy') {
            alert("Green walls can only be planted on Building cells!");
            return;
        }
        cell.type = 'ivy';
    } else if (cell.type === 'ivy' && activeTool === 'clear') {
        cell.type = 'comm'; // Bulldoze green wall back to building
    } else if (activeTool === 'comm' && cell.type === 'ivy') {
        // Do nothing, already has a building base
    } else {
        cell.type = activeTool === 'clear' ? 'empty' : activeTool;
    }
    
    renderSimGrid();
    runSimCalculation();
}

function updateSimParameters() {
    simWindSpeed = parseFloat(document.getElementById('sim-wind').value) || 2.0;
    simAmbientPm = parseFloat(document.getElementById('sim-ambient-pm').value) || 120.0;
    simRainfall = parseFloat(document.getElementById('sim-rain').value) || 150.0;
    
    document.getElementById('sim-wind-val').textContent = simWindSpeed.toFixed(1) + ' m/s';
    document.getElementById('sim-pm-val').textContent = simAmbientPm.toFixed(0) + ' µg/m³';
    document.getElementById('sim-rain-val').textContent = simRainfall.toFixed(0) + ' mm/mo';
    
    runSimCalculation();
}

function resetSimGrid() {
    initSimGrid();
}

function runSimCalculation() {
    // 1D row advection-deposition wind model (wind blows from column 0 to 7)
    // Wind dilution scaling: lower wind speed = higher concentrated emissions
    const windSpeed = simWindSpeed;
    const pmSourceBase = simAmbientPm;
    
    // Reset/calculate PM levels across the grid
    for (let r = 0; r < gridRows; r++) {
        let currentPm = 20.0; // background clean air boundary
        
        for (let c = 0; c < gridCols; c++) {
            const cell = gridMapState[r][c];
            
            // 1. Emission contributions
            if (cell.type === 'road') {
                currentPm += (pmSourceBase * (2.0 / windSpeed)); // traffic emissions inversely proportional to wind speed
            } else if (cell.type === 'industrial') {
                currentPm += (250.0 * (2.0 / windSpeed)); // industrial emissions
            }
            
            // 2. Vegetative dry deposition scrubbing
            if (cell.type === 'pine' || cell.type === 'birch') {
                const plantInfo = simPlantsDb[cell.type];
                const pmFraction = 'pm25';
                
                // Calculate deposition velocity from models.js
                const vd = CanopyDepositionSimulator.calculateVd(
                    pmFraction,
                    windSpeed,
                    plantInfo.lai,
                    plantInfo.isPubescent
                );
                
                // Exponent decay calculation: Barrier width W = 10m, mixing height H = 10m
                // decay = exp(-Vd * LAI * W / (H * u))
                // with W/H = 1, decay = exp(-Vd * 0.01 * LAI / u)
                const decayExponent = (vd * 0.01 * plantInfo.lai) / windSpeed;
                currentPm = currentPm * Math.exp(-decayExponent);
            }
            
            cell.pmLevel = currentPm;
        }
    }
    
    // Calculate dashboard statistics
    let totalWalkways = 0;
    let safeWalkways = 0;
    let totalScrubbedGrams = 0;
    let totalCoolingOffsetDollars = 0;
    let totalCo2MitigatedKg = 0;
    
    // Track count of trees on grid for litter leaching calculations
    let pineCount = 0;
    let birchCount = 0;
    
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = gridMapState[r][c];
            
            if (cell.type === 'path') {
                totalWalkways++;
                if (cell.pmLevel < 35.0) {
                    safeWalkways++;
                }
            } else if (cell.type === 'pine' || cell.type === 'birch') {
                if (cell.type === 'pine') pineCount++;
                if (cell.type === 'birch') birchCount++;
                
                const plantInfo = simPlantsDb[cell.type];
                const vd = CanopyDepositionSimulator.calculateVd('pm25', windSpeed, plantInfo.lai, plantInfo.isPubescent);
                const depositionFlux = vd * cell.pmLevel * 0.01; // ug / (m2 * s)
                
                // Mass removed grams/day = flux * cell_area (100 m2) * 86400 seconds * 10^-6 g/ug
                const cellScrubbedGrams = depositionFlux * 100 * 86400 * 0.000001;
                totalScrubbedGrams += cellScrubbedGrams;
                
            } else if (cell.type === 'ivy') {
                // Building green wall HVAC offset
                // Wall area = 120 m2, COP = 3.0, electricity = 0.15, shading reduction = 35%
                const plantInfo = simPlantsDb.ivy;
                const offset = GreenWallThermalPredictor.simulateThermalOffset(
                    120, 
                    plantInfo.lai, 
                    1.5, // transpiration L/m2/day
                    3.0, // COP
                    0.15, // $/kWh electricity
                    35.0 // % shading block
                );
                totalCoolingOffsetDollars += offset.dailySavingsDollars;
                totalCo2MitigatedKg += offset.dailyCo2MitigatedKg;
            }
        }
    }
    
    // Update city breathing index
    const breathingIndex = totalWalkways > 0 ? (safeWalkways / totalWalkways) * 100 : 100.0;
    document.getElementById('sim-stat-breathing').textContent = breathingIndex.toFixed(1);
    
    const breathingDesc = document.getElementById('sim-stat-breathing-desc');
    if (breathingIndex >= 90) {
        breathingDesc.textContent = "Excellent: Almost all walking zones are protected by buffers.";
        breathingDesc.style.color = "#55efc4";
    } else if (breathingIndex >= 50) {
        breathingDesc.textContent = "Caution: Downwind sidewalk cells are exposed to traffic exhaust.";
        breathingDesc.style.color = "#ffeaa7";
    } else {
        breathingDesc.textContent = "Hazardous: Pedestrians are inhaling direct source emissions!";
        breathingDesc.style.color = "#ff7675";
    }
    
    // Update daily PM scrubbed
    document.getElementById('sim-stat-scrubbed').textContent = totalScrubbedGrams.toFixed(2);
    document.getElementById('sim-stat-scrubbed-desc').textContent = `Foliar interception removes ${(totalScrubbedGrams/1000).toFixed(4)} kg of particulate matter daily.`;
    
    // Update cooling offsets
    document.getElementById('sim-stat-cooling').textContent = totalCoolingOffsetDollars.toFixed(2);
    document.getElementById('sim-stat-cooling-desc').textContent = `Green walls mitigate ${totalCo2MitigatedKg.toFixed(1)} kg CO₂ emissions daily.`;
    
    // Update Soil Runoff & Leaching Safety from Litter Decay
    // Models litter leaching kinetics for the entire grid based on placed plants
    simAdjuvant = document.getElementById('sim-pest-adjuvant').value;
    
    let simulatedTeqLeached = 0.0;
    let simulatedTeqRemaining = 0.0;
    let runoffStatus = "SAFE RUNOFF";
    let alertClass = "badge-safe";
    let runoffText = "Decaying foliage leachate remains below toxicity hazard levels.";
    
    if (pineCount > 0 || birchCount > 0) {
        // Assume baseline heavy traffic pesticide/PAH loads on leaves
        const baseLmw = (pineCount * 45) + (birchCount * 30);
        const baseHmw = (pineCount * 60) + (birchCount * 40);
        const basePcb = (pineCount * 8) + (birchCount * 5);
        
        // Use Pinus profile to estimate litter decay stage
        const leach = LitterLeacher.simulateLeaching(
            'pinus',
            28, // Kolkata mean temp
            simRainfall,
            12, // 1 year timeline
            baseLmw,
            baseHmw,
            basePcb
        );
        
        // Adjuvant adjustments to runoff leached fraction
        let adjuvantF = 1.0;
        if (simAdjuvant === 'surfactant') adjuvantF = 0.6;
        if (simAdjuvant === 'sticker') adjuvantF = 0.25;
        
        simulatedTeqLeached = leach.leachedTeq * adjuvantF;
        simulatedTeqRemaining = leach.remainingTeq;
        
        if (simulatedTeqLeached >= 5.0) {
            runoffStatus = "TOXIC RUNOFF HAZARD";
            alertClass = "badge-danger";
            runoffText = `CRITICAL: Heavy rain has leached carcinogenic PAH compounds to soil. TEQ: ${simulatedTeqLeached.toFixed(2)} ng/g.`;
        } else if (simulatedTeqLeached >= 1.0) {
            runoffStatus = "MODERATE POLLUTION";
            alertClass = "badge-warning";
            runoffText = `CAUTION: Rain wash-off contains elevated PAH/pesticide levels. Runoff TEQ: ${simulatedTeqLeached.toFixed(2)} ng/g.`;
        } else {
            runoffStatus = "SAFE RUNOFF";
            alertClass = "badge-safe";
            runoffText = `Optimal. Rainwater leachate is safe. Soil runoff TEQ: ${simulatedTeqLeached.toFixed(2)} ng/g.`;
        }
    }
    
    const runoffStatusEl = document.getElementById('sim-stat-runoff-status');
    runoffStatusEl.textContent = runoffStatus;
    if (runoffStatus === "TOXIC RUNOFF HAZARD") {
        runoffStatusEl.style.color = "#ff7675";
    } else if (runoffStatus === "MODERATE POLLUTION") {
        runoffStatusEl.style.color = "#ffeaa7";
    } else {
        runoffStatusEl.style.color = "#55efc4";
    }
    document.getElementById('sim-stat-runoff-desc').textContent = runoffText;
    
    // Render safety badges inside path cells
    renderCellBadges();
}

function renderSimGrid() {
    const gridContainer = document.getElementById('sim-map-grid');
    gridContainer.innerHTML = '';
    
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = gridMapState[r][c];
            const cellDiv = document.createElement('div');
            cellDiv.className = `map-grid-cell cell-${cell.type}`;
            cellDiv.id = `cell-${r}-${c}`;
            cellDiv.setAttribute('onclick', `handleGridCellClick(${r}, ${c})`);
            
            // Name label
            const labelSpan = document.createElement('span');
            labelSpan.className = 'cell-name-label';
            labelSpan.textContent = cell.type === 'empty' ? '' : cell.type;
            cellDiv.appendChild(labelSpan);
            
            // PM concentration value badge (added later in renderCellBadges)
            const badgeSpan = document.createElement('span');
            badgeSpan.className = 'cell-pm-badge';
            badgeSpan.id = `badge-${r}-${c}`;
            cellDiv.appendChild(badgeSpan);
            
            gridContainer.appendChild(cellDiv);
        }
    }
}

function renderCellBadges() {
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = gridMapState[r][c];
            const badge = document.getElementById(`badge-${r}-${c}`);
            if (badge) {
                if (cell.type === 'road' || cell.type === 'path' || cell.type === 'comm' || cell.type === 'ivy' || cell.type === 'industrial') {
                    const pm = cell.pmLevel;
                    badge.textContent = Math.round(pm) + ' µg';
                    badge.className = 'cell-pm-badge';
                    if (pm < 35.0) {
                        badge.classList.add('badge-safe');
                    } else if (pm < 75.0) {
                        badge.classList.add('badge-warning');
                    } else {
                        badge.classList.add('badge-danger');
                    }
                } else {
                    badge.textContent = '';
                }
            }
        }
    }
}

let isSimRaining = false;
let simRainInterval = null;

function triggerSimRainfall() {
    if (isSimRaining) return;
    
    isSimRaining = true;
    const rainBtn = document.getElementById('sim-rain-btn');
    rainBtn.textContent = "Storm Active...";
    rainBtn.style.background = "#e74c3c";
    
    const overlay = document.getElementById('sim-rain-overlay');
    overlay.style.display = 'block';
    overlay.innerHTML = '';
    
    // Spawn falling rain droplets
    simRainInterval = setInterval(() => {
        const drop = document.createElement('div');
        drop.classList.add('sim-rain-drop');
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = (0.4 + Math.random() * 0.3) + 's';
        overlay.appendChild(drop);
        
        setTimeout(() => {
            drop.remove();
        }, 800);
    }, 25);
    
    // Stop after 3.5 seconds
    setTimeout(() => {
        clearInterval(simRainInterval);
        isSimRaining = false;
        overlay.style.display = 'none';
        overlay.innerHTML = '';
        
        rainBtn.textContent = "Simulate Heavy Storm";
        rainBtn.style.background = "var(--color-emerald)";
        
        // Soil leaching calculation updates
        alert("Rainstorm simulation complete! Folia surface particulates (SPM) washed off into local soils. Runoff toxicity safety updated on the dashboard.");
        runSimCalculation();
    }, 3500);
}

// Make functions globally accessible for inline html event handlers
window.updateSimParameters = updateSimParameters;
window.resetSimGrid = resetSimGrid;
window.selectPaletteTool = selectPaletteTool;
window.handleGridCellClick = handleGridCellClick;
window.triggerSimRainfall = triggerSimRainfall;

// 9. Advanced Biomonitoring Analytical Tools UI Bindings
function switchToolTab(toolId) {
    // Hide all panels
    document.querySelectorAll('.tool-panel').forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
    });
    
    // De-activate all tab buttons
    document.querySelectorAll('.tool-tabs .nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show target panel
    const targetPanel = document.getElementById(`tool-panel-${toolId}`);
    if (targetPanel) {
        targetPanel.style.display = 'block';
        targetPanel.classList.add('active');
    }
    
    // Activate target tab button
    const targetBtn = document.getElementById(`tool-tab-btn-${toolId}`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
}

function runLapdnCalculation() {
    const morph = document.getElementById('lapdn-morph').value;
    const length = parseFloat(document.getElementById('lapdn-length').value) || 0;
    const width = parseFloat(document.getElementById('lapdn-width').value) || 0;
    const count = parseInt(document.getElementById('lapdn-count').value) || 0;
    
    const spmTare = parseFloat(document.getElementById('lapdn-spm-tare').value) || 0;
    const spmFinal = parseFloat(document.getElementById('lapdn-spm-final').value) || 0;
    const wpmTare = parseFloat(document.getElementById('lapdn-wpm-tare').value) || 0;
    const wpmFinal = parseFloat(document.getElementById('lapdn-wpm-final').value) || 0;
    
    const rainfall = parseFloat(document.getElementById('lapdn-rainfall').value) || 0;
    
    // Leaf Normalizer logic from models.js
    const area = LeafNormalizer.calculateLeafArea(length, width, count, morph);
    const spm = LeafNormalizer.calculateDeposition(spmTare, spmFinal, area);
    const wpm = LeafNormalizer.calculateDeposition(wpmTare, wpmFinal, area);
    
    const ratio = wpm > 0 ? (spm / wpm) : 0;
    
    const rainShedding = LeafNormalizer.calculateRainShedding(spm, wpm, rainfall);
    const totalPm = spm + wpm;
    const rvf = totalPm > 0 ? (spm / totalPm) * (1 - Math.exp(-0.05 * rainfall)) : 0;
    
    // Update DOM
    document.getElementById('lapdn-out-area').textContent = area.toFixed(2);
    document.getElementById('lapdn-out-spm').textContent = spm.toFixed(2);
    document.getElementById('lapdn-out-wpm').textContent = wpm.toFixed(2);
    document.getElementById('lapdn-out-ratio').textContent = wpm > 0 ? ratio.toFixed(2) : "N/A";
    
    const rainEffectsEl = document.getElementById('lapdn-rain-effects');
    if (rainEffectsEl) {
        if (rainfall > 0) {
            rainEffectsEl.className = "alert-box alert-warning";
            rainEffectsEl.innerHTML = `
                <p><strong>Rain Wash-off Simulation (${rainfall}mm):</strong> washed off <strong>${rainShedding.washedSpm.toFixed(2)} µg/cm²</strong> of surface dust (<strong>${rainShedding.washOffPercent}%</strong> of SPM). Remaining SPM: <strong>${rainShedding.remainingSpm.toFixed(2)} µg/cm²</strong>. Wax-embedded PM (WPM) remains fully sequestered (<strong>${rainShedding.remainingWpm.toFixed(2)} µg/cm²</strong>). Total remaining PM on foliage: <strong>${rainShedding.totalRemainingPm.toFixed(2)} µg/cm²</strong>.<br><strong>Rain Vulnerability Factor (RVF):</strong> <strong>${rvf.toFixed(3)}</strong> (ratio of washed-off PM to total initial PM loading).</p>
            `;
        } else {
            rainEffectsEl.className = "alert-box alert-safe";
            rainEffectsEl.innerHTML = `
                <p><strong>No Simulated Rainfall:</strong> SPM and WPM remain completely stable on foliar surfaces (Total: <strong>${(spm + wpm).toFixed(2)} µg/cm²</strong>).</p>
            `;
        }
    }
}

function runFdsprpCalculation() {
    const species = document.getElementById('fdsprp-species').value;
    const dust = parseFloat(document.getElementById('fdsprp-dust').value) || 0;
    const days = parseInt(document.getElementById('fdsprp-days').value) || 0;
    
    // Predict resilience
    const res = ResiliencePredictor.predictResilience(species, dust, days);
    
    // Update DOM
    document.getElementById('fdsprp-out-status').textContent = res.healthStatus;
    document.getElementById('fdsprp-out-chl').textContent = res.chlorophyllRetention.toFixed(2);
    document.getElementById('fdsprp-out-stoma').textContent = res.stomatalReductionPercent.toFixed(2);
    document.getElementById('fdsprp-out-photo').textContent = res.photosynthesisReductionPercent.toFixed(2);
    
    // Update color classes on health status block
    const statusValEl = document.getElementById('fdsprp-out-status');
    statusValEl.className = "metric-val";
    if (res.statusClass === 'status-danger') {
        statusValEl.style.color = '#ff7675';
    } else if (res.statusClass === 'status-warning') {
        statusValEl.style.color = '#ffeaa7';
    } else {
        statusValEl.style.color = '#55efc4';
    }
    
    const warningEl = document.getElementById('fdsprp-out-warning');
    if (warningEl) {
        warningEl.className = `alert-box ${res.statusClass === 'status-danger' ? 'alert-danger' : (res.statusClass === 'status-warning' ? 'alert-warning' : 'alert-safe')}`;
        warningEl.innerHTML = `<p>${res.warning}</p>`;
    }
}

function runLldtlsCalculation() {
    const species = document.getElementById('lldtls-species').value;
    const temp = parseFloat(document.getElementById('lldtls-temp').value) || 0;
    const rain = parseFloat(document.getElementById('lldtls-rain').value) || 0;
    const time = parseFloat(document.getElementById('lldtls-time').value) || 0;
    
    const lmw = parseFloat(document.getElementById('lldtls-lmw').value) || 0;
    const hmw = parseFloat(document.getElementById('lldtls-hmw').value) || 0;
    const pcb = parseFloat(document.getElementById('lldtls-pcb').value) || 0;
    
    // Simulate leaching
    const res = LitterLeacher.simulateLeaching(species, temp, rain, time, lmw, hmw, pcb);
    
    // Update DOM
    document.getElementById('lldtls-out-mass').textContent = res.massRemainingPercent.toFixed(2);
    document.getElementById('lldtls-out-decomp').textContent = res.massDecomposedPercent.toFixed(2);
    
    document.getElementById('lldtls-out-lmw-l').textContent = res.leachedLmw.toFixed(2);
    document.getElementById('lldtls-out-lmw-r').textContent = res.remainingLmw.toFixed(2);
    
    document.getElementById('lldtls-out-hmw-l').textContent = res.leachedHmw.toFixed(2);
    document.getElementById('lldtls-out-hmw-r').textContent = res.remainingHmw.toFixed(2);
    
    document.getElementById('lldtls-out-pcb-l').textContent = res.leachedPcb.toFixed(2);
    document.getElementById('lldtls-out-pcb-r').textContent = res.remainingPcb.toFixed(2);
    
    document.getElementById('lldtls-out-teq-l').textContent = `${res.leachedTeq.toFixed(4)} ng/g`;
    document.getElementById('lldtls-out-teq-r').textContent = `${res.remainingTeq.toFixed(4)} ng/g`;
    
    const warningEl = document.getElementById('lldtls-out-warning');
    if (warningEl) {
        warningEl.className = `alert-box ${res.alertClass}`;
        warningEl.innerHTML = `<p><strong>${res.alert}:</strong> ${res.warning}</p>`;
    }
}

// Make functions globally accessible for inline html event handlers
window.switchToolTab = switchToolTab;
window.runLapdnCalculation = runLapdnCalculation;
window.runFdsprpCalculation = runFdsprpCalculation;
window.runLldtlsCalculation = runLldtlsCalculation;

// 10. Document Loading & Initializations
document.addEventListener('DOMContentLoaded', () => {
    // Initial display settings
    updatePMScale();
    showPathology('upper');
    changeRainSpeciesProfile();
    runRegressionSimulation();
    initSimGrid();
    
    // Initialize new analytical tools calculations
    runLapdnCalculation();
    runFdsprpCalculation();
    runLldtlsCalculation();
});
