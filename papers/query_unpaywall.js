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

function fetchDoi(item) {
    return new Promise((resolve) => {
        const url = `https://api.unpaywall.org/v2/${item.doi}?email=unpaywall-check@example.com`;
        https.get(url, { headers: { 'User-Agent': 'node.js' } }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const bestLocation = data.best_oa_location || {};
                    resolve({
                        name: item.name,
                        doi: item.doi,
                        isOa: data.is_oa,
                        pdfUrl: bestLocation.url_for_pdf || null,
                        landingPage: bestLocation.url_for_landing_page || null,
                        title: data.title
                    });
                } catch (e) {
                    resolve({ name: item.name, doi: item.doi, error: 'JSON parse error', body: body.substring(0, 100) });
                }
            });
        }).on('error', (err) => {
            resolve({ name: item.name, doi: item.doi, error: err.message });
        });
    });
}

async function run() {
    console.log("Checking Unpaywall for DOIs...");
    const results = [];
    for (const item of DOIs) {
        console.log(`Checking ${item.name} (${item.doi})...`);
        const res = await fetchDoi(item);
        results.push(res);
        // Wait a bit to avoid hitting rate limits
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log("\nResults:\n", JSON.stringify(results, null, 2));
}

run();
