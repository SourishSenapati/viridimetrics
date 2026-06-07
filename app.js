// Interactive JavaScript Core - Plant Biomonitors Explorer

// 1. Navigation & Tab Management
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

    // Special trigger for chart rendering since canvas size relies on visible parent
    if (tabId === 'literature') {
        setTimeout(initCharts, 100);
    }
}

function switchSubTab(subTabId) {
    document.querySelectorAll('.sub-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`subnav-btn-${subTabId}`).classList.add('active');

    document.querySelectorAll('.subtab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`subtab-content-${subTabId}`).classList.add('active');
    
    // Trigger specific chart resize
    if (subTabId === 'saebo' && saeboChart) {
        saeboChart.resize();
    } else if (subTabId === 'leonard' && metalsChart) {
        metalsChart.resize();
    }
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

// 6. Literature Review Master Database (15 Papers)
const papersDatabase = [
    {
        id: 1,
        title: "Plant species differences in particulate matter accumulation on leaf surfaces",
        authors: "Arne Sæbø, Robert Popek, Bianka Nawrot, Hans Martin Hanslin, Helena Gawrońska, Stanisław W. Gawroński",
        year: 2012,
        doi: "10.1016/j.scitotenv.2012.03.084",
        type: "Foundational Study",
        wax: "High Correlation (β = 0.78 for PM₀.₂)",
        trichomes: "Coarse Capture (β = 0.31 for PM₁₀)",
        shape: "Lanceolate (High Stability)",
        abstract: "Poor urban air quality continues to pose severe risks to public health. Deploying vegetation serves as a highly effective complementary remediation strategy. Tree canopies naturally promote air turbulence, which, combined with specific leaf surface traits, facilitates the deposition and retention of particles. This study evaluated a cohort of 47 woody species (22 trees and 25 shrubs) grown at high-exposure motorway and low-exposure rural plots in Norway and Poland. Epicuticular wax was isolated to separate Surface PM (SPM) and Wax-embedded PM (WPM). Results document that accumulation varies 10- to 20-fold among common species. Total epicuticular wax volume was the strongest predictor of ultrafine (PM₀.₂) particle trapping, while foliar trichomes (hairs) enhanced coarse (PM₁₀) capture but had no significant effect on sub-micron particles.",
        methodology: "Foliage agitated in water (SPM) followed by chloroform rinse (WPM) to solubilize epicuticular waxes. Cascade filtration on Type 91 (10 µm), Type 42 (2.5 µm), and PTFE (0.2 µm) membranes. Normalization via digital scanning.",
        results: "High-capacity taxa (Betula pendula, Pinus mugo, Pinus sylvestris) accumulated 24-55 µg/cm² total PM, while low-capacity taxa (Acer platanoides, Tilia cordata) were limited to 6-13 µg/cm². Epicuticular wax volume dominated PM₀.₂ capture.",
        relevance: "Provides the benchmark parameters for waxy evergreens vs flat-leaved deciduous trees, highlighting Betula pendula and Pinus species as elite monitoring templates.",
        pdfStatus: true
    },
    {
        id: 2,
        title: "Particulate matter deposition on roadside plants and the importance of leaf trait combinations",
        authors: "Robert J. Leonard, Clare McArthur, Dieter F. Hochuli",
        year: 2016,
        doi: "10.1016/j.ufug.2016.09.008",
        type: "Foundational Study",
        wax: "Moderate (Hydrophobic clash)",
        trichomes: "High Influence (U = 4295, p = 0.03)",
        shape: "Lanceolate shape outperforming (p < 0.001)",
        abstract: "Vehicular traffic is a primary source of urban particulate matter (PM), which accumulates on roadside plants. We evaluated the relative influence of species-specific leaf traits and trait combinations on PM deposition on 16 native plant species in Sydney, Australia. Leaves were Agitated in water to measure SPM. Heavy metals (Cu, Cr, Mn, Al, Fe) were analyzed using ICP-AES. Results show significant differences in PM deposition among species. Leaf shape was the strongest predictor of deposition, with lanceolate-leaved species accumulating more PM than other shapes. While foliar trichomes (hairs) generally increased PM capture, their effect was sometimes overridden by leaf cuticular waxes, which create a hydrophobic barrier preventing initial wet deposition.",
        methodology: "Roadside sampling within 2m of arterial lanes in Sydney. 60-second reverse-osmosis water wash-off. Cascade vacuum filtration. Trace metal extraction via nitric/hydrochloric acid digestion and ICP-AES analysis.",
        results: "Westringia fruticosa (pubescent lanceolate shrub) accumulated the highest PM loads. PERSOONIA and DODONAEA (long-petioled, large leaves) had high wind flutter and low retention. Acacia parramattensis accumulated significant Chromium (0.51 mg/kg).",
        relevance: "Highlights the importance of matching leaf traits (stiff lanceolate leaves with low flutter) to vehicular roadside dust characteristics.",
        pdfStatus: true
    },
    {
        id: 3,
        title: "A systematic review of the leaf traits considered to contribute to removal of airborne particulate matter pollution in urban areas",
        authors: "Karina Corada, Huw Woodward, Hiba Alaraj, C. Matilda Collins, Audrey de Nazelle",
        year: 2021,
        doi: "10.1016/j.envpol.2020.116104",
        type: "Foundational Study",
        wax: "High Correlation (Fine PM)",
        trichomes: "High Correlation (Coarse PM)",
        shape: "Needles & Lanceolate promoted",
        abstract: "Vegetation removes particulate matter (PM) from the atmosphere, providing a crucial ecosystem service in urban areas. This systematic review synthesized global research on the leaf traits that contribute to PM removal. Coniferous needle leaves, waxy coatings, high trichome density, and narrow lanceolate leaf shapes were identified as key traits that promote PM capture. However, the review highlighted a profound lack of quantitative consensus across the literature due to methodological fragmentation (different washing techniques, gravimetric vs SEM vs image processing) and a failure to normalize background pollution levels.",
        methodology: "Systematic search across Web of Science, Scopus, and PubMed databases. Categorization of leaf traits (coniferous needle, epicuticular wax, trichomes, leaf shape, petiole length) and critical analysis of research methods.",
        results: "Needle leaves and waxy foliage consistently outperform flat broadleaves. Identified major research gaps, including lack of standardized extraction protocols and ignoring localized microclimate context (wind speed and humidity).",
        relevance: "Emphasizes the need to establish uniform surface normalization protocols (µg/cm²) and warns against selecting urban planting species based on a single 'magic trait'.",
        pdfStatus: true
    },
    {
        id: 4,
        title: "Deposition of Particulate Matter of Different Size Fractions on Leaf Surfaces and in Waxes of Urban Forest Species",
        authors: "K. Dzierżanowski, Robert Popek, H. Gawrońska, Arne Sæbø, S.W. Gawronski",
        year: 2011,
        doi: "10.1080/15226514.2011.552929",
        type: "Foundational Study",
        wax: "High Partitioning (Fine WPM)",
        trichomes: "Coarse Interception",
        shape: "Diverse broadleaved/shrubby",
        abstract: "Particulate matter (PM) is a major urban pollutant. This study compared four tree species (Acer campestre, Fraxinus excelsior, Platanus x hispanica, Tilia cordata), three shrubs (Forsythia x intermedia, Physocarpus opulifolius, Spiraea japonica), and one climber (Hedera helix) commonly cultivated along streets in Warsaw, Poland. Separate gravimetric analyses quantified PM deposited on leaf surfaces (SPM) and trapped in waxes (WPM) across three size fractions (10-100 µm, 2.5-10 µm, and 0.2-2.5 µm). Significant species-specific differences in PM capture were found. Shrubs, particularly Spiraea japonica, accumulated the highest total PM load, whereas Platanus was the least effective. Waxes were shown to permanently encapsulate fine and ultrafine particles, protecting them from rain wash-off.",
        methodology: "Sequential gravimetric washing (water followed by chloroform). Cascade vacuum filtration on Whatman filters. Normalization per unit leaf area.",
        results: "Spiraea japonica was the most effective accumulator; Platanus x hispanica was the least. PM10-100 represents the bulk of mass, but the fine PM2.5 fraction was concentrated within the epicuticular wax layer. No linear correlation existed between wax weight and total PM.",
        relevance: "Establishes the sequential gravimetric extraction method and proves that shrubs are crucial lower-strata roadside filters.",
        pdfStatus: true
    },
    {
        id: 5,
        title: "Accumulation of particulate matter and trace elements on vegetation as affected by pollution level, rainfall and the passage of time",
        authors: "Arkadiusz Przybysz, Arne Sæbø, Hans Martin Hanslin, Stanisław W. Gawroński",
        year: 2014,
        doi: "10.1016/j.scitotenv.2014.02.072",
        type: "Foundational Study",
        wax: "High Sequestration (Pinus)",
        trichomes: "Low Influence (Glabrous evergreen)",
        shape: "Needle matrix vs Planar climber",
        abstract: "Air pollution is a major environmental threat. We evaluated PM and trace element accumulation on Pinus sylvestris (Scots pine) and Hedera helix (common ivy) over time, and the impact of heavy rainfall and pollution levels in Norway and Poland. Conifers with thick epicuticular wax (715.6 µg/cm² on pine) acted as permanent sinks that retained over 85% of PM against rainfall. Ivy (wax content 45.2 µg/cm²) experienced rapid cuticular saturation and lost up to 90% of its accumulated PM (SPM) during precipitation. Rainfall strips coarse surface particles but leaves the wax-embedded fraction unaffected.",
        methodology: "Longitudinal sampling at industrial, traffic, and clean locations. Monitoring before and after natural rain events. Gravimetric filtration and acid digestion.",
        results: "Pinus sylvestris accumulated up to 417.6 µg/cm² and ivy up to 140.6 µg/cm² of PM. Rain washed off 30-41% of coarse surface particles, but wax-embedded fine particles were shielded from hydraulic shear.",
        relevance: "Highly relevant to monsoon zones (such as West Bengal). Emphasizes that high-wax species are required to prevent rain from flushing toxic PM into municipal water drains.",
        pdfStatus: true
    },
    {
        id: 6,
        title: "Bioindicators: the natural indicator of environmental pollution",
        authors: "T. K. Parmar, D. Rawtani, Y. K. Agrawal",
        year: 2016,
        doi: "10.1080/21553769.2016.1162753",
        type: "Foundational Study",
        wax: "Absent (in cryptogams)",
        trichomes: "Absent (in cryptogams)",
        shape: "High surface-to-volume ratio",
        abstract: "Environmental pollution is a global issue. Bioindicators are organisms (plants, animals, microbes) that assess ecosystem health and monitor pollution levels. In the context of air quality, non-vascular plants like mosses (Hylocomium splendens) and lichens are highly effective passive bioindicators for heavy metals. Lacking root systems and protective cuticles, they absorb nutrients and pollutants directly from the air. Lichen absence ('lichen deserts') serves as a diagnostic biomarker for elevated sulfur dioxide (SO₂) and nitrogen oxides (NOₓ).",
        methodology: "Literature review of environmental monitoring case studies using lichens, mosses, and vascular tree leaves for heavy metal and gaseous plume tracking.",
        results: "Moss tissues successfully mapped industrial zinc ore plumes over a 75 km transport corridor, showing direct spatial correlation between tissue concentrations and source proximity.",
        relevance: "Establishes a baseline for passive biological sensors, validating the transition to using vascular evergreen leaves as local air quality maps.",
        pdfStatus: true
    },
    {
        id: 7,
        title: "Estimating the reduction of urban PM10 concentrations by trees within an environmental information system for planners",
        authors: "W. J. Bealey, A. G. McDonald, E. Nemitz, R. Donovan, U. Dragosits, T. R. Duffy, D. Fowler",
        year: 2007,
        doi: "10.1016/j.jenvman.2006.07.007",
        type: "Foundational Study",
        wax: "Coniferous high surface area",
        trichomes: "Low Influence in Model",
        shape: "Needle pack vs Broadleaved canopy",
        abstract: "Urban trees remove particulate matter (PM₁₀) from the air, but the magnitude of this effect is highly variable. We modeled PM₁₀ deposition velocities (Vd) across the West Midlands, UK, using different planting scenarios (coniferous vs. deciduous trees) and meteorological datasets. The model integrated canopy structure, wind speed, and tree density. Coniferous species (Pinus nigra, Cupressocyparis leylandii) exhibited deposition velocities up to three times higher than deciduous species. Increasing canopy cover by 25% was estimated to reduce urban PM₁₀ concentrations by 2% to 10%, leading to significant health benefits.",
        methodology: "Atmospheric deposition velocity modeling (Vd) integrated into a Geographic Information System (GIS) and coupled with urban boundary layer models.",
        results: "Coniferous canopies are highly efficient due to year-round leaf retention and high aerodynamic roughness. Broadleaved species are limited by leaf shedding and planar geometries.",
        relevance: "Provides the mathematical basis for Jadavpur University's green belt plans, justifying high-density canopy planting near campus borders.",
        pdfStatus: true
    },
    {
        id: 8,
        title: "Air pollution removal by urban trees and shrubs in the United States",
        authors: "David J. Nowak, Daniel E. Crane, Jack C. Stevens",
        year: 2006,
        doi: "10.1016/j.ufug.2006.01.007",
        type: "Foundational Study",
        wax: "Canopy scale integration",
        trichomes: "Canopy scale integration",
        shape: "Mixed forest canopies",
        abstract: "Air pollution is a major threat in US cities. This study modeled the annual removal of air pollutants (PM₁₀, O₃, NO₂, SO₂, CO) by urban trees across the United States. Combining field surveys from 55 cities with hourly weather and pollution datasets in the Urban Forest Effects (UFORE) model, we estimated that urban trees remove 711,000 metric tons of pollutants annually, with PM₁₀ removal representing a major fraction (215,000 metric tons). While average local air quality improvement was small (0.51%), local PM reduction in dense forest patches exceeded 10%.",
        methodology: "UFORE model application combining field plot data, leaf area index (LAI), hourly weather observations, and EPA pollution monitor telemetry.",
        results: "Urban trees provide massive economic value through air filtration, with pollution removal rates directly proportional to canopy coverage and growing season length.",
        relevance: "Establishes macro-scale economic and health value of trees, reinforcing the need to convert city green zones into active air filtration networks.",
        pdfStatus: true
    },
    {
        id: 9,
        title: "Vegetation-driven and passive monitoring of urban particulate matter: Comparative field assessment in Fukuoka, Japan",
        authors: "Duha S. Hammad, František Mikšík, Kyaw Thu, Takahiko Miyazaki",
        year: 2026,
        doi: "10.1016/j.envres.2026.124423",
        type: "Recent Advance",
        wax: "Moderate Correlation",
        trichomes: "Hairs and margins dominant",
        shape: "Rough, grooved leaf surfaces",
        abstract: "Urban particulate matter (PM) poses a severe health hazard. This study compared vegetation-based PM capture with an environmentally friendly, Ferm-type passive diffusive sampler under identical roadside conditions in Fukuoka, Japan. Foliar PM accumulation was quantified for three roadside plant functional types: Elaeagnus pungens (shrub), Dioscorea japonica (climber), and Cirsium vulgare (herb). The passive sampler accumulated significantly higher PM mass and showed enrichment in smaller particle fractions than the foliage. This was due to the sampler's physical stability, which avoided the particle shedding and rain wash-off experienced by leaves. The study concluded that vegetation reflects real-world, dynamic deposition and wash-off cycles, while passive samplers provide stable, long-term integrated measurements.",
        methodology: "Roadside sampling in Fukuoka. Foliar wash-off vs. starch-based passive sampler capture. Scanning Electron Microscopy (SEM) mapping of leaf topography and gravimetric analysis.",
        results: "Foliar capture was driven by micromorphology (grooves, margins, hairs) rather than leaf area. The passive sampler provided higher stability and smaller fraction enrichment.",
        relevance: "Proves that plants are dynamic sensors reflecting deposition/removal cycles, and suggests pairing them with physical passive samplers to calibrate urban baselines.",
        pdfStatus: true
    },
    {
        id: 10,
        title: "A green, fast protocol to estimate the accumulation of airborne anthropogenic microfibers in Pittosporum tobira in urban areas",
        authors: "Anna Gaglione, Angelo Granata, Fiore Capozzi, Antonio Rallo, Simonetta Giordano, Maria Cristina Sorrentino, Valeria Spagnuolo",
        year: 2026,
        doi: "10.7717/peerj.20558",
        type: "Recent Advance",
        wax: "High Summer Wax Retention",
        trichomes: "Glandular hairs (Summer peak)",
        shape: "Obovate, thick glossy leaves",
        abstract: "Airborne plastic pollution is a rising concern. We investigated the ability of Pittosporum tobira leaves to biomonitor anthropogenic microfibers (MFs) across six sites in Naples, Italy (industrial, urban, and green). Using a fast adhesive tape-tearing protocol on 1g leaf samples, we isolated MFs. Accumulation was significantly higher in the dry summer than in the wet winter. The summer development of glandular hairs (trichomes) enhanced MF adhesion under low-rainfall conditions. Unsheltered transplants exposed to heavy rain showed significantly lower MF counts than sheltered ones, proving that precipitation actively washes away accumulated fibers.",
        methodology: "Tape-tearing extraction on 1g composite leaf samples. Visual counting of microfibers under stereomicroscopy. Sheltered vs. unsheltered transplant comparisons.",
        results: "Summer MF counts reflected land-use gradients (industrial: 160, urban: 84-125, green: 48-54 MFs/g). Dry seasons maximize foliar microfiber retention, while winter rains wash them away.",
        relevance: "Highlights the role of glandular hairs in trapping microplastics, warning that monsoon seasons in Kolkata will experience severe microfiber wash-off.",
        pdfStatus: true
    },
    {
        id: 11,
        title: "Responses of tree defoliators to traffic-derived particulate matter and trace elements along a roadside pollution gradient",
        authors: "Hanna Moniuszko, Robert Popek, Arkadiusz Przybysz, Adrian Łukowski",
        year: 2026,
        doi: "10.1038/s41598-026-41296-7",
        type: "Recent Advance",
        wax: "Low relevance to insect choice",
        trichomes: "High PM and TE accumulation",
        shape: "Broadleaved deciduous host plants",
        abstract: "Traffic-derived particulate matter (PM) and trace elements (TEs) are pervasive roadside stressors. We examined the responses of Yponomeuta padella (moth larvae) reared on Crataegus monogyna and Prunus cerasifera leaves collected along traffic gradients (control, sidewalk, roadside) in Warsaw, Poland. PM load and trace elements (Cu, Fe, Sr) followed control < sidewalk < roadside trends. Choice tests revealed strong larval avoidance of contaminated roadside foliage. Emergence dynamics showed slower growth rates and later eclosion inflection points, with eclosion success declining from 90.1% (control) to 82.5% (sidewalk) and 77.1% (roadside). Roadside diets also reduced adult body mass.",
        methodology: "Larval rearing trials using polluted roadside leaves. Choices assays, emergence logistics modeling, leaf toughness, SLA, and ICP-MS trace element analyses.",
        results: "High roadside PM and heavy metals are toxic to defoliating insects. Eclosion success collapsed by 13% under high traffic exposure, demonstrating high ecological costs.",
        relevance: "Warns that high-capacity roadside bio-monitors can degrade insect food webs, suggesting the use of non-food-source evergreen species along major corridors.",
        pdfStatus: true
    },
    {
        id: 12,
        title: "Molecular and Environmental Elucidation of Heavy Metal Transfer in Tilia spp.",
        authors: "Petrică Tudor Moțiu, Florin-Dumitru Bora, et al.",
        year: 2026,
        doi: "PMC12940536",
        type: "Recent Advance",
        wax: "High absorption (leaves and flowers)",
        trichomes: "High particulate interception",
        shape: "Broadleaved linden canopies",
        abstract: "This study investigated the bioaccumulation of heavy metals from PM and soil in Tilia species (linden trees) along urban-forest gradients in Romania, and the safety of consuming herbal infusions from these trees. Twelve elements (Pb, Cd, Zn, Cu, Ni, Cr, Mn, Co, As, Hg, Al, V) were analyzed. Results show significantly higher metal concentrations in urban environments compared to forest sites. Metal transfer from environmental compartments (soil and air) into leaves, flowers, and ultimately into hot water infusions (teas) was verified. Transfer efficiency was element-specific, with Al, Cr, and Ni showing high extractability (>80%), while Zn and Cu were low (<10%). Daily intake levels remained below toxic safety limits.",
        methodology: "Analytical chemical assays of soil, bark, leaves, and flowers. Hot-water infusion extraction and ICP-MS analysis of 12 elements. Estimated Daily Intake (EDI) modeling.",
        results: "Urban Tilia trees act as robust bioindicators for air/soil metal deposition. Metals transfer to herbal tea infusions, with Ni, Cr, Co, Al, and V showing high extraction rates (>80%). Linden tea remains safe under realistic intake.",
        relevance: "Highlighting that roadside agriculture or foraging in Kolkata poses direct health pathways through foliar PM heavy metal transfer.",
        pdfStatus: true
    },
    {
        id: 13,
        title: "Context-dependent dominance: Pollution sources vs. tree species in shaping leaf-deposited PM characteristics",
        authors: "Wujun Xue, Dele Chen, Jingli Yan, Yuchong Long, Wen Sun, Shan Yin",
        year: 2026,
        doi: "10.1016/j.envpol.2026.127675",
        type: "Recent Advance",
        wax: "Low relevance in high-pollution sites",
        trichomes: "Low relevance in high-pollution sites",
        shape: "Broadleaved evergreens in Shanghai",
        abstract: "Particulate matter (PM) characteristics are shaped by both biological and environmental variables. This study used neural-network source apportionment to determine whether the chemical characteristics of leaf-deposited PM are driven by regional pollution sources or species-specific traits. We sampled Cinnamomum camphora and Sabina chinensis leaves across Shanghai (industrial, traffic, residential, agricultural). In high-pollution traffic and industrial zones, pollution source characteristics completely overtook tree species traits, depositing uniform EC/OC (carbonaceous) chemical signatures on leaves. Species traits only dominated in low-pollution zones.",
        methodology: "Foliar PM extraction. Analysis of carbonaceous fractions (EC/OC), water-soluble ions, and trace metals. Back-propagation neural network modeling for source apportionment.",
        results: "Pollution source dominance overrides plant species traits in high-exposure zones. Disparate species accumulated uniform chemical profiles near highways. Species traits only dictate the chemical profile in clean zones.",
        relevance: "Confirms that in Kolkata's high-pollution zones, source characteristics will dominate chemical profiles, but species traits still dictate total mass capacity.",
        pdfStatus: true
    },
    {
        id: 14,
        title: "Physiochemical screening of road avenue plants in highly polluted urbanized city Lahore",
        authors: "Bushra Munam, Sohaib Muhammad, Muhammad Tayyab, Hafiza Komal Hanif, Muhammad Majeed, Sarah Maryam Malik, Muhammad Bilal",
        year: 2025,
        doi: "10.7717/peerj.20121",
        type: "Recent Advance",
        wax: "High wax protects from stress",
        trichomes: "High dust accumulation",
        shape: "Mixed native and introduced avenue trees",
        abstract: "Lahore is frequently ranked the world's most polluted city. We evaluated how extreme roadside PM pollution stresses 12 prevalent avenue species (including Alstonia scholaris, Ficus religiosa, Polyalthia longifolia, Eucalyptus globulus, Morus alba) along seven busiest roads. Variation in biochemical parameters (chlorophyll a, b, total, carotenoids) and physiological indicators (stomatal conductance, transpiration, photosynthetic rates) were measured. Dust load was highest on Alstonia scholaris, Ficus religiosa, and Morus alba. High pollution stress induced severe chlorophyll reduction and photosynthetic suppression in Alstonia scholaris and Polyalthia longifolia. Eucalyptus globulus, Ficus benjamina, and Ficus religiosa showed high chlorophyll retention and superior physiological resilience.",
        methodology: "Triplicate foliar sampling across Lahore traffic gradients. Chlorophyll, carotenoid spectrophotometry. Stomatal conductance and transpiration rate measurements.",
        results: "Dust load maximum on Alstonia scholaris and Ficus religiosa (0.02 g/cm²). Alstonia and Polyalthia longifolia suffered severe stress. Eucalyptus and Ficus religiosa proved highly tolerant.",
        relevance: "Direct taxonomic transferability to Kolkata. Recommend selecting Ficus religiosa and avoiding Polyalthia longifolia on highly polluted corridors.",
        pdfStatus: true
    },
    {
        id: 15,
        title: "Quantitative source-oriented, bioaccumulation and toxicity of organic pollutants in a formerly mining area",
        authors: "Constantin Nechita, Elisabeta-Irina Geană, Roxana Elena Ionete, Corina Teodora Ciucure, İsmail Koç, J. Julio Camarero",
        year: 2026,
        doi: "10.1007/s10653-026-03093-z",
        type: "Recent Advance",
        wax: "High PAH and PCB lipid dissolution",
        trichomes: "Co-precipitation trapping",
        shape: "Forest tree evergreens and deciduous canopies",
        abstract: "Persistent organic pollutants (POPs) are major environmental hazards. We assessed contamination and sources of 14 PCBs and 15 PAHs deposited on leaves of native Quercus robur, Fagus sylvatica, Pinus sylvestris, Taxus baccata, and introduced Chamaecyparis lawsoniana near a former mining center in Romania. In C. lawsoniana and Q. robur, total PAHs and PCBs were the highest. Carcinogenic high-molecular-weight PAHs induced moderate to high toxic risks on Quercus robur leaves (10.45 ng/g), which increased to 71.55 ng/g in decaying leaf litter.",
        methodology: "Foliar and soil extraction. Quantification of 14 PCBs and 15 PAHs via gas chromatography-mass spectrometry (GC-MS). Toxic equivalency factor (TEF) calculations.",
        results: "Quercus robur and Chamaecyparis lawsoniana are excellent indicators for organic toxins. Carcinogenic PAHs accumulate heavily on leaves and concentrate in leaf litter, representing potential soil/runoff toxicity pathways.",
        relevance: "Highlights the necessity of treating fallen leaf litter from high-pollution corridors as hazardous waste to prevent organic toxin leaching.",
        pdfStatus: true
    }
];

// 7. Initialize Literature Explorer Sidebar and Details Panel
function initLiteratureExplorer() {
    const container = document.getElementById('lit-study-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    papersDatabase.forEach(paper => {
        const card = document.createElement('div');
        card.classList.add('lit-study-card');
        card.id = `lit-card-${paper.id}`;
        card.onclick = () => selectStudy(paper.id);
        
        card.innerHTML = `
            <h4>${paper.id}. ${paper.author || paper.authors.split(',')[0].split(' ').pop()} (${paper.year})</h4>
            <div class="lit-meta">
                <span>${paper.type}</span>
                <span class="pdf-status-badge ${paper.pdfStatus ? '' : 'missing'}">${paper.pdfStatus ? 'PDF' : 'NO PDF'}</span>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Select first study by default
    selectStudy(1);
}

function selectStudy(id) {
    // Update active class in sidebar
    document.querySelectorAll('.lit-study-card').forEach(card => {
        card.classList.remove('active');
    });
    const activeCard = document.getElementById(`lit-card-${id}`);
    if (activeCard) activeCard.classList.add('active');
    
    const paper = papersDatabase.find(p => p.id === id);
    if (!paper) return;
    
    const detailContainer = document.getElementById('lit-detail-view-container');
    if (!detailContainer) return;
    
    let chartHtml = '';
    // Embed specific charts or tools for Study 1 & 2
    if (id === 1) {
        chartHtml = `
            <div class="chart-integrated-container">
                <h4>Sæbø et al. Site Contrast Chart</h4>
                <div class="chart-wrapper">
                    <canvas id="saeboSiteChart"></canvas>
                </div>
                <div class="chart-caption">
                    <p><strong>Norway vs Poland Contrast:</strong> Higher baseline pollution multiplies overall mass deposition, but species-specific rankings remain highly stable. <em>Betula pendula</em> is an apex broadleaf accumulator across both settings.</p>
                </div>
            </div>
            
            <div class="interactive-clusters" style="margin-top: 1rem;">
                <h4>K-Means Performance Clusters (Sæbø et al.)</h4>
                <p class="helper-text">Select a performance cluster to filter the 47-species cohort:</p>
                <div class="cluster-toggles" style="flex-direction: row; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="action-btn" onclick="filterClusters('high')">High (24-55 µg/cm²)</button>
                    <button class="action-btn secondary" onclick="filterClusters('intermediate')">Intermediate</button>
                    <button class="action-btn secondary" onclick="filterClusters('low')">Low (6-13 µg/cm²)</button>
                </div>
                <div class="cluster-species-list" id="cluster-species-container" style="margin-top: 0.75rem;">
                    <!-- Populated dynamically -->
                </div>
            </div>
        `;
    } else if (id === 2) {
        chartHtml = `
            <div class="chart-integrated-container">
                <h4>Foliar Trace Metal Profiles (ICP-AES)</h4>
                <div class="chart-wrapper">
                    <canvas id="leonardMetalsChart"></canvas>
                </div>
                <div class="chart-caption">
                    <p><strong>ICP-AES Metal Profiles (mg/kg dry weight):</strong> Acacia parramattensis accumulates significant Chromium (0.51 mg/kg). Extreme Al and Fe values suggest road dust resuspension is the main PM source rather than direct exhaust.</p>
                </div>
            </div>
            
            <div class="aerodynamic-flutter-tool" style="margin-top: 1rem;">
                <h4>Leaf Shape & Wind Flutter Simulator (Leonard et al.)</h4>
                <p class="helper-text">Select a leaf profile to simulate aerodynamic drag and petiole stability:</p>
                <div class="shape-selectors">
                    <div class="leaf-shape-card" id="shape-lanceolate" onclick="simulateFlutter('lanceolate')">
                        <div class="shape-preview">
                            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <path d="M50 15 C35 40 42 70 50 85 C58 70 65 40 50 15 Z" fill="#2d6a4f" stroke="#52b788" stroke-width="1.5"/>
                                <line x1="50" y1="85" x2="50" y2="95" stroke="#52b788" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <h4>Lanceolate</h4>
                    </div>
                    <div class="leaf-shape-card" id="shape-elliptic" onclick="simulateFlutter('elliptic')">
                        <div class="shape-preview">
                            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <path d="M50 15 C20 30 20 70 50 85 C80 70 80 30 50 15 Z" fill="#2d6a4f" stroke="#52b788" stroke-width="1.5"/>
                                <line x1="50" y1="85" x2="50" y2="95" stroke="#52b788" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <h4>Elliptic</h4>
                    </div>
                    <div class="leaf-shape-card" id="shape-needle" onclick="simulateFlutter('needle')">
                        <div class="shape-preview">
                            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <path d="M48 10 L52 10 L52 85 L48 85 Z" fill="#2d6a4f" stroke="#52b788" stroke-width="1.5"/>
                                <line x1="50" y1="85" x2="50" y2="95" stroke="#52b788" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <h4>Needle-like</h4>
                    </div>
                </div>
                <div class="aerodynamic-feedback" id="aerodynamic-result-box">
                    <p>Click a geometry to calculate drag and shedding frequency.</p>
                </div>
            </div>
        `;
    } else if (id === 3) {
        chartHtml = `
            <div class="corada-grid">
                <div class="corada-card">
                    <div class="card-icon glow-cyan">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <h3>Promoted Traits</h3>
                    <p>Waxy, rough, needle, pubescent, and lanceolate traits promote PM capture.</p>
                </div>
                <div class="corada-card">
                    <div class="card-icon glow-amber">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <h3>The "Lack of Consensus"</h3>
                    <p>Due to methodological fragmentation, no single trait can be isolated as the universal master controller.</p>
                </div>
                <div class="corada-card">
                    <div class="card-icon glow-violet">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <h3>GI Recommendation</h3>
                    <p>Planners must select species matching local environmental constraints, avoiding one-size-fits-all rules.</p>
                </div>
            </div>
        `;
    }

    detailContainer.innerHTML = `
        <div class="lit-paper-header">
            <h2>${paper.title}</h2>
            <div class="authors"><strong>Authors:</strong> ${paper.authors}</div>
            <div class="header-meta-row">
                <span class="suitability-badge">${paper.type}</span>
                <span class="pdf-status-badge ${paper.pdfStatus ? '' : 'missing'}">${paper.pdfStatus ? 'PDF AVAILABLE' : 'NO PDF'}</span>
                ${paper.doi ? `<a href="https://doi.org/${paper.doi.replace('https://doi.org/', '')}" target="_blank" class="doi-badge">DOI: ${paper.doi.replace('https://doi.org/', '')}</a>` : ''}
            </div>
        </div>
        
        <div class="lit-key-metrics">
            <div class="metric-pill highlight-emerald">
                <span class="label">Epicuticular Wax Impact</span>
                <span class="value">${paper.wax}</span>
            </div>
            <div class="metric-pill highlight-cyan">
                <span class="label">Trichome Impact</span>
                <span class="value">${paper.trichomes}</span>
            </div>
            <div class="metric-pill highlight-amber">
                <span class="label">Aerodynamic Leaf Shape</span>
                <span class="value">${paper.shape}</span>
            </div>
        </div>
        
        <div class="lit-abstract-box">
            <h4>Abstract Summary</h4>
            <p>${paper.abstract}</p>
        </div>
        
        <div class="lit-body-sections">
            <div class="lit-body-section">
                <h4>Methodology & Setup</h4>
                <p>${paper.methodology}</p>
            </div>
            <div class="lit-body-section">
                <h4>Key Findings & Results</h4>
                <p>${paper.results}</p>
            </div>
        </div>
        
        <div class="lit-body-sections" style="grid-template-columns: 1fr;">
            <div class="lit-body-section">
                <h4>Relevance to Jadavpur University & Kolkata Planning</h4>
                <p>${paper.relevance}</p>
            </div>
        </div>
        
        ${chartHtml}
    `;
    
    // Defer chart binding/creation to next tick so elements are rendered in DOM
    setTimeout(() => {
        if (id === 1) {
            saeboChart = null; // force recreation
            filterClusters('high');
            initSaeboSiteChart();
        } else if (id === 2) {
            metalsChart = null; // force recreation
            simulateFlutter('lanceolate');
            initMetalsChart();
        }
    }, 50);
}

// 8. Re-binding dynamic chart renderers
let saeboChart = null;
let metalsChart = null;

function initSaeboSiteChart() {
    const ctxSaebo = document.getElementById('saeboSiteChart');
    if (!ctxSaebo) return;
    saeboChart = new Chart(ctxSaebo, {
        type: 'bar',
        data: {
            labels: ['Betula pendula', 'Pinus sylvestris', 'Acer platanoides', 'Tilia cordata'],
            datasets: [
                {
                    label: 'Stavanger, Norway (High Traffic & Rain)',
                    data: [38.4, 45.2, 8.5, 9.1],
                    backgroundColor: 'rgba(16, 185, 129, 0.65)',
                    borderColor: 'var(--color-emerald)',
                    borderWidth: 1
                },
                {
                    label: 'Rural Poland (Low Traffic & Rain)',
                    data: [12.8, 15.6, 3.1, 2.8],
                    backgroundColor: 'rgba(6, 182, 212, 0.65)',
                    borderColor: 'var(--color-cyan)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#f8fafc', font: { family: 'Inter', size: 10 } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' },
                    title: {
                        display: true,
                        text: 'Total PM Accumulation (µg/cm²)',
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
}

function initMetalsChart() {
    const ctxLeonard = document.getElementById('leonardMetalsChart');
    if (!ctxLeonard) return;
    metalsChart = new Chart(ctxLeonard, {
        type: 'bar',
        data: {
            labels: ['Aluminium (Al)', 'Iron (Fe)', 'Copper (Cu)', 'Chromium (Cr)', 'Manganese (Mn)'],
            datasets: [
                {
                    label: 'Acacia parramattensis',
                    data: [289.4, 58.2, 1.21, 0.51, 0.85],
                    backgroundColor: 'rgba(139, 92, 246, 0.65)',
                    borderColor: 'var(--color-violet)',
                    borderWidth: 1
                },
                {
                    label: 'Acacia longifolia',
                    data: [252.1, 21.4, 4.49, 0.09, 0.62],
                    backgroundColor: 'rgba(245, 158, 11, 0.65)',
                    borderColor: 'var(--color-amber)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#f8fafc', font: { family: 'Inter', size: 10 } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    type: 'logarithmic',
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' },
                    title: {
                        display: true,
                        text: 'Concentration (mg/kg dry weight) - Log Scale',
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
}

// Dummy placeholder to catch old references
function initCharts() {
    // Deployed inside individual study load
}

const saeboSpeciesData = {
    high: [
        { name: "Scots Pine", sci: "Pinus sylvestris", metric: "24–55 µg/cm² PM", ratio: "SPM/WPM: 0.2 ± 0.1 (Apex Retention)" },
        { name: "Dwarf Mountain Pine", sci: "Pinus mugo", metric: "28–51 µg/cm² PM", ratio: "SPM/WPM: 0.3 ± 0.1" },
        { name: "Silver Birch", sci: "Betula pendula", metric: "38.4 µg/cm² PM", ratio: "SPM/WPM: 0.25 ± 0.1 (Apex Broadleaf)" },
        { name: "Grey Willow", sci: "Salix cinerea", metric: "25–48 µg/cm² PM", ratio: "SPM/WPM: 0.4 ± 0.15" },
        { name: "Japanese Skimmia", sci: "Skimmia japonica", metric: "24–42 µg/cm² PM", ratio: "SPM/WPM: 0.3 ± 0.1" },
        { name: "Lace Shrub", sci: "Stephanandra incisa", metric: "30–55 µg/cm² PM", ratio: "SPM/WPM: 0.35 ± 0.12 (Ground-level)" }
    ],
    intermediate: [
        { name: "Yew", sci: "Taxus baccata", metric: "18–28 µg/cm² PM", ratio: "SPM/WPM: 0.8 ± 0.3" },
        { name: "Hybrid Yew", sci: "Taxus media", metric: "16–25 µg/cm² PM", ratio: "SPM/WPM: 0.9 ± 0.2" },
        { name: "Spaeth Alder", sci: "Alnus spaethii", metric: "14–22 µg/cm² PM", ratio: "SPM/WPM: 1.2 ± 0.4" },
        { name: "Common Ash", sci: "Fraxinus excelsior", metric: "12–20 µg/cm² PM", ratio: "SPM/WPM: 1.5 ± 0.5" },
        { name: "European Beech", sci: "Fagus silvatica", metric: "13–21 µg/cm² PM", ratio: "SPM/WPM: 3.2 ± 1.3 (Shedding Vulnerable)" }
    ],
    low: [
        { name: "Norway Maple", sci: "Acer platanoides", metric: "6–12 µg/cm² PM", ratio: "SPM/WPM: 4.8 ± 1.8" },
        { name: "Sweet Cherry", sci: "Prunus avium", metric: "7–13 µg/cm² PM", ratio: "SPM/WPM: 5.1 ± 2.0" },
        { name: "Cherry Laurel", sci: "Prunus laurocerasus", metric: "6–11 µg/cm² PM", ratio: "SPM/WPM: 6.2 ± 2.4" },
        { name: "Bird Cherry", sci: "Prunus padus", metric: "8–13 µg/cm² PM", ratio: "SPM/WPM: 4.5 ± 1.5" },
        { name: "Snowberry", sci: "Symphoricarpos albus", metric: "6–10 µg/cm² PM", ratio: "SPM/WPM: 5.5 ± 1.8" },
        { name: "Small-leaved Lime", sci: "Tilia cordata", metric: "6–12 µg/cm² PM", ratio: "SPM/WPM: 4.2 ± 1.6" }
    ]
};

function filterClusters(cluster) {
    const container = document.getElementById('cluster-species-container');
    if (!container) return;
    
    // Update button states
    document.querySelectorAll('.interactive-clusters .action-btn').forEach(btn => {
        btn.classList.add('secondary');
        if (btn.textContent.toLowerCase().includes(cluster)) btn.classList.remove('secondary');
    });

    container.innerHTML = '';
    saeboSpeciesData[cluster].forEach(species => {
        const card = document.createElement('div');
        card.classList.add('species-card');
        card.innerHTML = `
            <h4>${species.name}</h4>
            <span class="sci-name">${species.sci}</span>
            <span class="spec-metric">${species.metric}</span>
            <span class="spec-ratio">${species.ratio}</span>
        `;
        container.appendChild(card);
    });
}

const shapeFeedbackData = {
    lanceolate: {
        title: "Lanceolate Shapes (Narrow-tapered Base)",
        drag: "Drag Coefficient: Cd = 0.45",
        shedding: "Flutter Frequency: High-frequency erratic oscillation",
        mechanism: "The tapered leaf base induces boundary turbulence, causing the leaf to flutter in traffic wind streams. This shakes off coarse dust (SPM) but increases sub-micron particle trapping inside wax matrices."
    },
    elliptic: {
        title: "Elliptic/Obovate Shapes (Flat, Wide Profile)",
        drag: "Drag Coefficient: Cd = 0.85",
        shedding: "Flutter Frequency: Low-frequency heavy flapping",
        mechanism: "Wide planar leaves create thick laminar air envelopes. Wind gusts cause large flapping actions, shaking off surface-deposited particles before they migrate to epicuticular wax layers."
    },
    needle: {
        title: "Coniferous Needle Bundlings (3D Matrix)",
        drag: "Drag Coefficient: Cd = 1.15",
        shedding: "Flutter Frequency: Negligible (Rigid)",
        mechanism: "Coniferous needle matrices lack wind-flutter but create aerodynamic micro-vortices, channeling aerosols into the epicuticular wax layer. Highly efficient trap for fine PM."
    }
};

function simulateFlutter(shape) {
    document.querySelectorAll('.leaf-shape-card').forEach(c => c.classList.remove('active'));
    const targetCard = document.getElementById(`shape-${shape}`);
    if (targetCard) targetCard.classList.add('active');

    const data = shapeFeedbackData[shape];
    const feedbackBox = document.getElementById('aerodynamic-result-box');
    if (!feedbackBox) return;

    feedbackBox.innerHTML = `
        <div>
            <h4 class="txt-cyan" style="font-family: var(--font-heading); margin-bottom: 0.2rem;">${data.title}</h4>
            <p style="font-size: 0.75rem; margin-bottom: 0.3rem;"><strong>Metrics:</strong> ${data.drag} | ${data.shedding}</p>
            <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${data.mechanism}</p>
        </div>
    `;
}


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
    filterClusters('high');
    simulateFlutter('lanceolate');
    runPlannerRecommendation();
    initLiteratureExplorer();
    
    // Initialize new analytical tools calculations
    runLapdnCalculation();
    runFdsprpCalculation();
    runLldtlsCalculation();
});
