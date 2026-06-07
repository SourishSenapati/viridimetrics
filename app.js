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
// Literature database has been removed.

// Analytical Tools initialization and helper routines


// 8. Municipal Planner Logic
const speciesDatabase = [
    {
        name: "Scots Pine",
        sci: "Pinus sylvestris",
        canopy: "upper",
        traffic: ["heavy", "moderate"],
        rain: "high",
        targetPm: ["ultrafine", "fine"],
        advantage: "Extremely high epicuticular wax volume (715.6 µg/cm²). Needle bundle geometries create drag turbulence to capture fine particles and seal them internally as WPM.",
        suitability: "Apex Upper-Canopy Monitor"
    },
    {
        name: "Silver Birch",
        sci: "Betula pendula",
        canopy: "upper",
        traffic: ["heavy", "moderate"],
        rain: "high",
        targetPm: ["fine", "coarse"],
        advantage: "Top performing broadleaf species. Smooth lanceolate drag traits minimize leaf fluttering and promote stable long-term epicuticular PM encapsulation.",
        suitability: "Best Deciduous Tree"
    },
    {
        name: "Lace Shrub",
        sci: "Stephanandra incisa",
        canopy: "ground",
        traffic: ["heavy", "moderate"],
        rain: "high",
        targetPm: ["coarse", "fine"],
        advantage: "Low growth pattern acts as a primary filter for resuspended road dust directly at the roadside carriage. Topographical roughness rating is high (4/5).",
        suitability: "Apex Roadside Shrub"
    },
    {
        name: "Coast Banksia",
        sci: "Banksia integrifolia",
        canopy: "ground",
        traffic: ["heavy"],
        rain: "low",
        targetPm: ["coarse"],
        advantage: "Whorled foliage arrangement capturing large volumes of mineral markers (Al and Fe) under arid, dry dust conditions. Rigid geometry prevents particle shedding.",
        suitability: "Best Arid Coarse Monitor"
    },
    {
        name: "Coast Westringia",
        sci: "Westringia fruticosa",
        canopy: "ground",
        traffic: ["heavy", "moderate"],
        rain: "low",
        targetPm: ["fine", "coarse"],
        advantage: "Extremely high density of foliar trichomes (hairs) trapping large traffic soot aggregates before they can settle near pedestrian corridors.",
        suitability: "Best Hairy Shrub"
    },
    {
        name: "Dwarf Mountain Pine",
        sci: "Pinus mugo",
        canopy: "ground",
        traffic: ["heavy", "moderate"],
        rain: "high",
        targetPm: ["ultrafine", "fine"],
        advantage: "Shrubby coniferous architecture maintaining massive epicuticular wax quantities to trap sub-micron PM0.2 directly in the lower breathing zone.",
        suitability: "Apex Lower-level Conifer"
    },
    {
        name: "Parramatta Wattle",
        sci: "Acacia parramattensis",
        canopy: "upper",
        traffic: ["industrial"],
        rain: "low",
        targetPm: ["fine"],
        advantage: "Proven capability to accumulate toxic heavy metals, specifically Chromium (0.51 mg/kg) under roadside exposure. Deep cellular tolerances prevents metal toxicity.",
        suitability: "Industrial Heavy Metal Monitor"
    }
];

function runPlannerRecommendation() {
    const canopy = document.getElementById('param-canopy').value;
    const traffic = document.getElementById('param-traffic').value;
    const rain = document.getElementById('param-rain').value;
    const targetPm = document.getElementById('param-target-pm').value;

    const container = document.getElementById('planner-recommendations-list');
    container.innerHTML = '';

    // Scoring and filtering algorithm
    const scoredSpecies = speciesDatabase.map(spec => {
        let score = 0;
        
        // Exact canopy match is a prerequisite or heavily weighted
        if (spec.canopy === canopy) score += 5;
        
        // Traffic profile support
        if (spec.traffic.includes(traffic)) score += 3;
        
        // Rain wash-off resistance: high-wax pine is ideal for high rain
        if (rain === 'high' && spec.name.includes("Pine")) score += 2;
        if (rain === 'low' && (spec.name.includes("Banksia") || spec.name.includes("Westringia"))) score += 2;
        
        // Target particle match
        if (spec.targetPm.includes(targetPm)) score += 3;

        return { ...spec, score };
    });

    // Sort by score and display top 3 matches
    const recommendations = scoredSpecies
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    recommendations.forEach(rec => {
        const card = document.createElement('div');
        card.classList.add('rec-card');
        card.innerHTML = `
            <div class="rec-card-header">
                <h4>${rec.name} <span>(${rec.sci})</span></h4>
                <span class="suitability-badge">${rec.suitability}</span>
            </div>
            <div class="rec-card-body">
                <p>${rec.advantage}</p>
            </div>
            <div class="rec-card-footer">
                <span class="rec-meta-item">Stratum: <strong>${rec.canopy === 'upper' ? 'Upper Canopy' : 'Ground/Shrub'}</strong></span>
                <span class="rec-meta-item">Primary Target: <strong>${rec.targetPm.join(', ').toUpperCase()}</strong></span>
                <span class="rec-meta-item">Sim Score: <strong>${rec.score} pts</strong></span>
            </div>
        `;
        container.appendChild(card);
    });
}

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
    runPlannerRecommendation();
    
    // Initialize new analytical tools calculations
    runLapdnCalculation();
    runFdsprpCalculation();
    runLldtlsCalculation();
});
