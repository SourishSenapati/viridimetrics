const fs = require('fs');
const path = require('path');

const filePath = 'd:/PROJECT/ddos/chemicalfinalproject.md';
const content = fs.readFileSync(filePath, 'utf8');

// Let's print out lines around search matches for study headings
const lines = content.split('\n');
console.log("Total lines:", lines.length);

// Let's find line numbers matching numbers from 1 to 15 that stand alone or are followed by titles
const matches = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^\d+$/.test(line) && parseInt(line) >= 1 && parseInt(line) <= 15) {
        matches.push({ lineNum: i + 1, content: line, nextLine: lines[i+1] ? lines[i+1].trim() : '' });
    }
}

console.log("Matches for stand-alone numbers 1-15:");
console.log(JSON.stringify(matches, null, 2));
