const https = require('https');

const DOIs = [
    "10.1016/j.scitotenv.2012.03.084",
    "10.1016/j.ufug.2016.09.008",
    "10.1016/j.envpol.2020.116104",
    "10.1080/15226514.2011.552929",
    "10.1016/j.scitotenv.2014.02.072",
    "10.1080/21553769.2016.1162753",
    "10.1016/j.jenvman.2006.07.007",
    "10.1016/j.ufug.2006.01.007",
    "10.1016/j.envres.2026.124423",
    "10.1016/j.envpol.2026.127675"
];

function checkNcbiIds() {
    const idsStr = encodeURIComponent(DOIs.join(','));
    const url = `https://pmc.ncbi.nlm.nih.gov/tools/idconv/api/v1/articles/?ids=${idsStr}&format=json&tool=my_tool&email=my_email@example.com`;
    
    https.get(url, { headers: { 'User-Agent': 'node.js' } }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log(JSON.stringify(data, null, 2));
            } catch (e) {
                console.error("JSON parse error:", e, body);
            }
        });
    }).on('error', (err) => {
        console.error("HTTP error:", err);
    });
}

checkNcbiIds();
