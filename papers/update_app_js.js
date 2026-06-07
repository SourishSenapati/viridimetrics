const fs = require('fs');

const appJsPath = 'd:/PROJECT/ddos/app.js';
let content = fs.readFileSync(appJsPath, 'utf8');

// We want to replace the `pdfStatus: false` with `pdfStatus: true` inside the papersDatabase declaration
// Let's do it safely by finding the entries. Since all 15 studies are now fully resolved and have PDFs,
// we can change the occurrences of pdfStatus: false to pdfStatus: true.
// Let's inspect the block between 'const papersDatabase = [' and the end of the array '];'

const startIndex = content.indexOf('const papersDatabase = [');
const endIndex = content.indexOf('];', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    let arrayContent = content.substring(startIndex, endIndex);
    // Replace all instances of pdfStatus: false with pdfStatus: true within this block
    arrayContent = arrayContent.replace(/pdfStatus:\s*false/g, 'pdfStatus: true');
    
    content = content.substring(0, startIndex) + arrayContent + content.substring(endIndex);
    fs.writeFileSync(appJsPath, content, 'utf8');
    console.log("Successfully updated app.js to set pdfStatus: true for all papers!");
} else {
    console.error("Could not find the papersDatabase array in app.js.");
    process.exit(1);
}
