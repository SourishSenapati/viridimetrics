const fs = require('fs');
const path = require('path');

const targetPdfs = [
    "Saebo_2012.pdf",
    "Leonard_2016.pdf",
    "Corada_2021.pdf",
    "Dzierzanowski_2011.pdf",
    "Przybysz_2014.pdf",
    "Parmar_2016.pdf",
    "Bealey_2007.pdf",
    "Nowak_2006.pdf",
    "Hammad_2026.pdf",
    "Gaglione_2026.pdf",
    "Moniuszko_2026.pdf",
    "Motiu_2026.pdf",
    "Xue_2026.pdf",
    "Munam_2025.pdf",
    "Nechita_2026.pdf"
];

const papersDir = "d:/PROJECT/ddos/papers";
let missing = 0;

console.log("Checking PDF database files in papers/ directory...");
targetPdfs.forEach(file => {
    const fullPath = path.join(papersDir, file);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`  [OK] ${file} - Size: ${stats.size} bytes`);
    } else {
        console.error(`  [MISSING] ${file}`);
        missing++;
    }
});

if (missing === 0) {
    console.log("\nALL 15 PDF FILES ARE SUCCESSFULLY PRESENT!");
} else {
    console.error(`\nFAILED: ${missing} PDF files are missing.`);
    process.exit(1);
}
