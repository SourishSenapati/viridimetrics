const fs = require('fs');
const path = require('path');

const papersDir = 'd:/PROJECT/ddos/papers';
const files = fs.readdirSync(papersDir);

const studies = [];

files.forEach(file => {
    if (file.endsWith('_metadata.json')) {
        const filePath = path.join(papersDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            studies.push({
                file: file,
                title: data.title || '',
                doi: data.doi || '',
                oaUrl: data.oaUrl || '',
                pmcid: data.pmcid || '',
                pdfStatus: data.pdfStatus || false
            });
        } catch (e) {
            console.error(`Error reading ${file}:`, e);
        }
    }
});

console.log(JSON.stringify(studies, null, 2));
