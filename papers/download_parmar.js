const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const OUTPUT_DIR = "d:/PROJECT/ddos/papers";
const PMCID = "PMC5476313";
const SAVE_PATH = path.join(OUTPUT_DIR, "Parmar_2016.pdf");

function makeRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                ...headers
            }
        };

        https.get(options, (res) => {
            let data = [];
            res.on('data', (chunk) => { data.push(chunk); });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: Buffer.concat(data)
                });
            });
        }).on('error', (e) => reject(e));
    });
}

async function fetchWithRedirects(url, headers = {}, maxRedirects = 5) {
    let currentUrl = url;
    let redirectCount = 0;
    const history = [];
    while (redirectCount < maxRedirects) {
        const res = await makeRequest(currentUrl, headers);
        history.push({ url: currentUrl, statusCode: res.statusCode, headers: res.headers });
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
            let loc = res.headers.location;
            if (!loc.startsWith('http')) {
                const parsed = new URL(currentUrl);
                loc = parsed.origin + loc;
            }
            currentUrl = loc;
            redirectCount++;
        } else {
            return { res, history };
        }
    }
    throw new Error("Too many redirects during fetch");
}

function solvePow(challenge, difficulty) {
    const prefix = '0'.repeat(difficulty);
    let nonce = 0;
    while (true) {
        const data = challenge + nonce.toString();
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        if (hash.startsWith(prefix)) {
            return nonce;
        }
        nonce++;
    }
}

async function downloadPmcPdf(pmcid, savePath) {
    const initialUrl = `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/pdf/`;
    const { res: res1, history } = await fetchWithRedirects(initialUrl);
    const finalUrl = history[history.length - 1].url;
    
    if (res1.headers['content-type'] === 'application/pdf' || res1.body.slice(0, 4).toString() === '%PDF') {
        fs.writeFileSync(savePath, res1.body);
        return res1.body.length;
    }
    
    const html = res1.body.toString('utf8');
    const challengeMatch = html.match(/const POW_CHALLENGE = "([^"]+)"/);
    const difficultyMatch = html.match(/const POW_DIFFICULTY = "([^"]+)"/);
    const cookieNameMatch = html.match(/const POW_COOKIE_NAME = "([^"]+)"/);
    
    if (!challengeMatch || !difficultyMatch || !cookieNameMatch) {
        throw new Error(`Could not find PoW variables. Status: ${res1.statusCode}, Content-Type: ${res1.headers['content-type']}`);
    }
    
    const challenge = challengeMatch[1];
    const difficulty = parseInt(difficultyMatch[1], 10);
    const cookieName = cookieNameMatch[1];
    
    const nonce = solvePow(challenge, difficulty);
    const cookieValue = `${challenge},${nonce}`;
    const cookieHeader = `${cookieName}=${cookieValue}`;
    
    const { res: res2 } = await fetchWithRedirects(finalUrl, { 'Cookie': cookieHeader });
    
    if (res2.headers['content-type'] === 'application/pdf' || res2.body.slice(0, 4).toString() === '%PDF') {
        fs.writeFileSync(savePath, res2.body);
        return res2.body.length;
    } else {
        throw new Error(`Failed to get PDF after solving PoW. Status: ${res2.statusCode}, Content-Type: ${res2.headers['content-type']}`);
    }
}

async function main() {
    console.log(`Downloading Parmar_2016 (${PMCID})...`);
    try {
        const bytes = await downloadPmcPdf(PMCID, SAVE_PATH);
        console.log(`Success! Size: ${bytes} bytes`);
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

main();
