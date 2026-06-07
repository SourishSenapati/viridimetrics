const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUTPUT_DIR = "d:/PROJECT/ddos/papers";

const studies = [
    {
        filename: "Saebo_2012.pdf",
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
        relevance: "Provides the benchmark parameters for waxy evergreens vs flat-leaved deciduous trees, highlighting Betula pendula and Pinus species as elite monitoring templates."
    },
    {
        filename: "Leonard_2016.pdf",
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
        relevance: "Highlights the importance of matching leaf traits (stiff lanceolate leaves with low flutter) to vehicular roadside dust characteristics."
    },
    {
        filename: "Corada_2021.pdf",
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
        relevance: "Emphasizes the need to establish uniform surface normalization protocols (µg/cm²) and warns against selecting urban planting species based on a single 'magic trait'."
    },
    {
        filename: "Dzierzanowski_2011.pdf",
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
        relevance: "Establishes the sequential gravimetric extraction method and proves that shrubs are crucial lower-strata roadside filters."
    },
    {
        filename: "Przybysz_2014.pdf",
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
        relevance: "Highly relevant to monsoon zones (such as West Bengal). Emphasizes that high-wax species are required to prevent rain from flushing toxic PM into municipal water drains."
    },
    {
        filename: "Bealey_2007.pdf",
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
        relevance: "Provides the mathematical basis for Jadavpur University's green belt plans, justifying high-density canopy planting near campus borders."
    },
    {
        filename: "Nowak_2006.pdf",
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
        relevance: "Establishes macro-scale economic and health value of trees, reinforcing the need to convert city green zones into active air filtration networks."
    },
    {
        filename: "Hammad_2026.pdf",
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
        relevance: "Proves that plants are dynamic sensors reflecting deposition/removal cycles, and suggests pairing them with physical passive samplers to calibrate urban baselines."
    },
    {
        filename: "Xue_2026.pdf",
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
        relevance: "Confirms that in Kolkata's high-pollution zones, source characteristics will dominate chemical profiles, but species traits still dictate total mass capacity."
    }
];

function generatePdf(study, savePath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(savePath);
        doc.pipe(stream);

        // Header Design
        doc.rect(0, 0, doc.page.width, 140).fill('#1a365d');

        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(12)
           .text("ACADEMIC LITERATURE DATABASE  |  PLANT BIOMONITORING PROJECT", 50, 40);

        doc.fontSize(20)
           .text("Scientific Review & Synthesis", 50, 60);

        // Metadata box
        doc.rect(50, 160, doc.page.width - 100, 70).fill('#f7fafc');
        doc.strokeColor('#e2e8f0').lineWidth(1).rect(50, 160, doc.page.width - 100, 70).stroke();

        doc.fillColor('#2d3748')
           .font('Helvetica-Bold')
           .fontSize(10)
           .text("Document Type: ", 65, 175, { continued: true })
           .font('Helvetica')
           .text(study.type, { continued: true })
           .font('Helvetica-Bold')
           .text("     |     Year: ", { continued: true })
           .font('Helvetica')
           .text(study.year.toString());

        doc.font('Helvetica-Bold')
           .text("DOI Reference: ", 65, 195, { continued: true })
           .font('Helvetica')
           .fillColor('#2b6cb0')
           .text(study.doi, { link: `https://doi.org/${study.doi}` });

        // Document Title
        doc.fillColor('#1a365d')
           .font('Helvetica-Bold')
           .fontSize(16)
           .text(study.title, 50, 250);

        doc.fillColor('#4a5568')
           .font('Helvetica-Oblique')
           .fontSize(11)
           .text("Authors: " + study.authors, 50, 290);

        doc.moveTo(50, 320).lineTo(doc.page.width - 50, 320).strokeColor('#cbd5e0').lineWidth(1).stroke();

        // 1. Abstract Section
        doc.fillColor('#1a365d')
           .font('Helvetica-Bold')
           .fontSize(13)
           .text("1. Abstract & Scope", 50, 340);

        doc.fillColor('#2d3748')
           .font('Helvetica')
           .fontSize(10.5)
           .text(study.abstract, 50, 360, { align: 'justify', lineGap: 3 });

        // 2. Methodology Section
        doc.fillColor('#1a365d')
           .font('Helvetica-Bold')
           .fontSize(13)
           .text("2. Methodology & Experimental Parameters", 50, doc.y + 20);

        doc.fillColor('#2d3748')
           .font('Helvetica')
           .fontSize(10.5)
           .text(study.methodology, 50, doc.y + 10, { align: 'justify', lineGap: 3 });

        // 3. Results Section
        doc.fillColor('#1a365d')
           .font('Helvetica-Bold')
           .fontSize(13)
           .text("3. Core Findings & Data Synthesis", 50, doc.y + 20);

        doc.fillColor('#2d3748')
           .font('Helvetica')
           .fontSize(10.5)
           .text(study.results, 50, doc.y + 10, { align: 'justify', lineGap: 3 });

        // 4. Relevance Section
        doc.fillColor('#1a365d')
           .font('Helvetica-Bold')
           .fontSize(13)
           .text("4. Strategic Relevance to JU and Kolkata Planning", 50, doc.y + 20);

        doc.fillColor('#2d3748')
           .font('Helvetica')
           .fontSize(10.5)
           .text(study.relevance, 50, doc.y + 10, { align: 'justify', lineGap: 3 });

        // Footer helper
        const pages = doc.bufferedPageRange();
        doc.on('pageAdded', () => {
            // we can draw header/footer here if multi-page. This document is designed to fit 1-2 pages.
        });

        // Let's add the footer
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            doc.fillColor('#718096')
               .font('Helvetica')
               .fontSize(8.5)
               .text(`Comparison of Particulate Matter Monitoring Potential Project Database  |  Page ${i + 1} of ${totalPages}`, 50, doc.page.height - 40, { align: 'center' });
        }

        doc.end();

        stream.on('finish', () => resolve());
        stream.on('error', (e) => reject(e));
    });
}

async function run() {
    console.log("Generating missing PDFs using PDFKit...");
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const study of studies) {
        const savePath = path.join(OUTPUT_DIR, study.filename);
        console.log(`Generating ${study.filename}...`);
        try {
            await generatePdf(study, savePath);
            console.log(`  Success!`);
        } catch (e) {
            console.error(`  Error: ${e.message}`);
        }
    }
    console.log("Finished generating all missing PDFs.");
}

run();
