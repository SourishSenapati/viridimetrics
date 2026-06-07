const fs = require('fs');
const https = require('https');

const DOIs = [
    { name: "Saebo_2012", doi: "10.1016/j.scitotenv.2012.03.084" },
    { name: "Leonard_2016", doi: "10.1016/j.ufug.2016.09.008" },
    { name: "Corada_2021", doi: "10.1016/j.envpol.2020.116104" },
    { name: "Dzierzanowski_2011", doi: "10.1080/15226514.2011.552929" },
    { name: "Przybysz_2014", doi: "10.1016/j.scitotenv.2014.02.072" },
    { name: "Parmar_2016", doi: "10.1080/21553769.2016.1162753" },
    { name: "Bealey_2007", doi: "10.1016/j.jenvman.2006.07.007" },
    { name: "Nowak_2006", doi: "10.1016/j.ufug.2006.01.007" },
    { name: "Hammad_2026", doi: "10.1016/j.envres.2026.124423" },
    { name: "Xue_2026", doi: "10.1016/j.envpol.2026.127675" }
];

function fetchEuropePmc(item) {
    return new Promise((resolve) => {
        const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:${encodeURIComponent(item.doi)}&format=json`;
        https.get(url, { headers: { 'User-Agent': 'node.js' } }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const list = data.resultList && data.resultList.result;
                    if (list && list.length > 0) {
                        const r = list[0];
                        resolve({
                            name: item.name,
                            doi: item.doi,
                            pmcid: r.pmcid || null,
                            pmid: r.id || null,
                            isOpenAccess: r.isOpenAccess || null,
                            inEPMC: r.inEPMC || null,
                            hasPDF: r.hasPDF || null
                        });
                    } else {
                        resolve({ name: item.name, doi: item.doi, found: false });
                    }
                } catch (e) {
                    resolve({ name: item.name, doi: item.doi, error: 'JSON parse error' });
                }
            });
        }).on('error', (err) => {
            resolve({ name: item.name, doi: item.doi, error: err.message });
        });
    });
}

async function run() {
    console.log("Checking Europe PMC...");
    const results = [];
    for (const item of DOIs) {
        console.log(`Checking ${item.name}...`);
        const res = await fetchEuropePmc(item);
        results.push(res);
        await new Promise(r => setTimeout(r, 500));
    }
    console.log("\nResults:\n", JSON.stringify(results, null, 2));
}

run();
