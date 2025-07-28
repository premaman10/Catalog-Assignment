const fs = require('fs');

function parseBase(value, base) {
    return BigInt(parseInt(value, base));
}

function readInput(filename) {
    const rawData = fs.readFileSync(filename);
    const data = JSON.parse(rawData);
    const { n, k } = data.keys;

    const points = [];

    for (const key in data) {
        if (key === 'keys') continue;
        const x = BigInt(key);
        const y = parseBase(data[key].value, parseInt(data[key].base));
        points.push([x, y]);
    }

    return { k, points };
}
function getCombinations(arr, k) {
    const result = [];
    const backtrack = (start, comb) => {
        if (comb.length === k) {
            result.push([...comb]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            comb.push(arr[i]);
            backtrack(i + 1, comb);
            comb.pop();
        }
    };
    backtrack(0, []);
    return result;
}
function modInverse(a, mod) {
    let m0 = mod, x0 = 0n, x1 = 1n;
    if (mod === 1n) return 0n;

    while (a > 1n) {
        const q = a / mod;
        [a, mod] = [mod, a % mod];
        [x0, x1] = [x1 - q * x0, x0];
    }

    return x1 < 0n ? x1 + m0 : x1;
}

function lagrangeInterpolation(points, primeMod = null) {
    let secret = 0n;
    const k = points.length;

    for (let i = 0; i < k; i++) {
        let xi = points[i][0];
        let yi = points[i][1];

        let numerator = 1n;
        let denominator = 1n;

        for (let j = 0; j < k; j++) {
            if (i !== j) {
                let xj = points[j][0];
                numerator *= -xj;
                denominator *= (xi - xj);
                if (primeMod) {
                    numerator %= primeMod;
                    denominator %= primeMod;
                }
            }
        }

        let inv = primeMod ? modInverse(denominator, primeMod) : denominator ** -1n;
        let term = yi * numerator * inv;

        if (primeMod) {
            term %= primeMod;
        }

        secret += term;
        if (primeMod) {
            secret %= primeMod;
        }
    }

    return secret;
}

function findBestSecret(shares, k) {
    const combinations = getCombinations(shares, k);
    const secrets = new Map();

    for (const comb of combinations) {
        const secret = lagrangeInterpolation(comb).toString();
        if (!secrets.has(secret)) secrets.set(secret, []);
        secrets.get(secret).push(comb);
    }

    let bestSecret = null;
    let maxCount = 0;

    for (const [key, combos] of secrets.entries()) {
        if (combos.length > maxCount) {
            maxCount = combos.length;
            bestSecret = { secret: key, combinations: combos };
        }
    }

    const usedPoints = new Set(bestSecret.combinations[0].map(([x, y]) => `${x}:${y}`));
    const wrongShares = shares.filter(([x, y]) => !usedPoints.has(`${x}:${y}`));

    return { secret: bestSecret.secret, wrongShares };
}

function solveFromFile(filename, label) {
    const { k, points } = readInput(filename);
    const result = findBestSecret(points, k);

    console.log(`\n🔐 ${label} Secret (f(0)): ${result.secret}`);
    if (result.wrongShares.length > 0) {
        console.log(`⚠️ ${label} Wrong Shares Detected:`);
        result.wrongShares.forEach(([x, y]) => {
            console.log(`  x=${x}, y=${y}`);
        });
    } else {
        console.log(`✅ ${label} All shares are consistent.`);
    }
}

solveFromFile('testcase1.json', 'Testcase 1');
solveFromFile('testcase2.json', 'Testcase 2');
