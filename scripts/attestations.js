'use strict';

// Records the npm provenance attestation of every package in package-lock.json
// and checks it against the committed baseline in dependency-attestations.json.
//
//   node scripts/attestations.js           check against the baseline
//   node scripts/attestations.js --update  rewrite the baseline
//
// Cryptographic verification of signatures and attestations is done by
// `npm audit signatures`; this script tracks what the attestations say.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const LOCK_FILE = path.join(root, 'package-lock.json');
const BASELINE_FILE = path.join(root, 'dependency-attestations.json');
const REGISTRY = 'https://registry.npmjs.org';
const SLSA_PROVENANCE = 'https://slsa.dev/provenance/v1';
const CONCURRENCY = 8;

// Every registry package in the lock file, including optional platform-specific
// packages, so the result does not depend on the machine it runs on.
function lockPackages(lock) {
    const seen = new Map();
    for (const [location, entry] of Object.entries(lock.packages || {})) {
        if (!location || entry.link || !entry.resolved) continue;
        if (!entry.resolved.startsWith(REGISTRY + '/')) continue;
        const name = location.slice(location.lastIndexOf('node_modules/') + 'node_modules/'.length);
        const key = `${name}@${entry.version}`;
        if (!seen.has(key)) seen.set(key, { name, version: entry.version, integrity: entry.integrity });
    }
    return [...seen.values()].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
}

function keyOf(pkg) {
    return `${pkg.name}@${pkg.version}`;
}

function nameOf(key) {
    return key.slice(0, key.lastIndexOf('@'));
}

// Orders semver strings; a prerelease sorts before its release.
function compareVersions(a, b) {
    const [coreA, preA] = a.split('-', 2);
    const [coreB, preB] = b.split('-', 2);
    const partsA = coreA.split('.').map(Number);
    const partsB = coreB.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if (partsA[i] !== partsB[i]) return partsA[i] - partsB[i];
    }
    if (preA === preB) return 0;
    if (preA === undefined) return 1;
    if (preB === undefined) return -1;
    return preA.localeCompare(preB, undefined, { numeric: true });
}

function integrityToHex(integrity) {
    const match = /^sha512-(.+)$/.exec(integrity || '');
    return match ? Buffer.from(match[1], 'base64').toString('hex') : null;
}

function normaliseRepository(url) {
    return url
        .replace(/^git\+/, '')
        .replace(/^https?:\/\//, '')
        .replace(/@.*$/, '')
        .replace(/\.git$/, '');
}

// Extracts source repository, workflow and commit from the SLSA provenance
// statement in a registry attestations response. Returns null if there is none.
function parseProvenance(response) {
    const attestation = (response.attestations || []).find(a => a.predicateType === SLSA_PROVENANCE);
    if (!attestation) return null;

    const statement = JSON.parse(Buffer.from(attestation.bundle.dsseEnvelope.payload, 'base64').toString('utf8'));
    const build = statement.predicate.buildDefinition || {};
    const workflow = (build.externalParameters || {}).workflow || {};
    const source = (build.resolvedDependencies || [])[0] || {};

    return {
        repository: normaliseRepository(workflow.repository || source.uri || ''),
        workflow: workflow.path || null,
        commit: (source.digest || {}).gitCommit || null,
        digest: ((statement.subject || [])[0] || {}).digest?.sha512 || null,
    };
}

// Names and versions come from the lock file, so encode them in full: a
// malformed entry must not be able to change which registry path is queried.
function attestationUrl(pkg) {
    return `${REGISTRY}/-/npm/v1/attestations/${encodeURIComponent(pkg.name)}@${encodeURIComponent(pkg.version)}`;
}

async function fetchProvenance(pkg) {
    const response = await fetch(attestationUrl(pkg), { signal: AbortSignal.timeout(15000) });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`${keyOf(pkg)}: registry returned ${response.status}`);

    const provenance = parseProvenance(await response.json());
    if (!provenance) return null;

    // The attestation must describe the tarball the lock file pins.
    const expected = integrityToHex(pkg.integrity);
    if (expected && provenance.digest !== expected) {
        throw new Error(`${keyOf(pkg)}: attestation digest does not match lock file integrity`);
    }
    return { repository: provenance.repository, workflow: provenance.workflow, commit: provenance.commit };
}

async function collect(packages) {
    const result = {};
    let next = 0;
    async function worker() {
        while (next < packages.length) {
            const pkg = packages[next++];
            result[keyOf(pkg)] = await fetchProvenance(pkg);
        }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    return Object.fromEntries(Object.keys(result).sort().map(key => [key, result[key]]));
}

// Compares current provenance with the baseline, matching by package name so a
// version bump is checked against what earlier versions of the package had.
// An older version without provenance installed alongside a newer one with it
// is not a regression: provenance only counts as lost going forwards.
function compare(baseline, current) {
    const errors = [];
    const notices = [];
    const attestedByName = new Map();
    for (const [key, provenance] of Object.entries(baseline)) {
        if (!provenance) continue;
        const name = nameOf(key);
        if (!attestedByName.has(name)) attestedByName.set(name, []);
        attestedByName.get(name).push({ key, ...provenance });
    }

    for (const [key, provenance] of Object.entries(current)) {
        const previous = attestedByName.get(nameOf(key)) || [];
        const version = key.slice(nameOf(key).length + 1);
        const older = previous.filter(p => compareVersions(p.key.slice(nameOf(p.key).length + 1), version) <= 0);
        if (!provenance && older.length) {
            errors.push(`${key} has no provenance, but ${older.map(p => p.key).join(', ')} did`);
        }
        for (const p of previous) {
            if (provenance && provenance.repository !== p.repository) {
                errors.push(`${key} was built from ${provenance.repository}, but ${p.key} was built from ${p.repository}`);
            } else if (provenance && provenance.workflow !== p.workflow) {
                notices.push(`${key} was published by ${provenance.workflow}, but ${p.key} by ${p.workflow}`);
            }
        }
        if (!(key in baseline)) {
            notices.push(`${key} is not in the baseline (${provenance ? 'has provenance' : 'no provenance'})`);
        }
    }

    for (const key of Object.keys(baseline)) {
        if (!(key in current)) notices.push(`${key} is in the baseline but no longer in the lock file`);
    }
    return { errors, notices };
}

async function main() {
    const update = process.argv.includes('--update');
    const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
    const baseline = fs.existsSync(BASELINE_FILE)
        ? JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')).packages
        : {};

    const current = await collect(lockPackages(lock));
    const { errors, notices } = compare(baseline, current);
    const attested = Object.values(current).filter(Boolean).length;
    console.log(`${attested} of ${Object.keys(current).length} packages have provenance attestations`);

    if (!update) for (const notice of notices) console.log(`notice: ${notice}`);
    for (const error of errors) console.log(`${update ? 'accepted' : 'error'}: ${error}`);

    if (update) {
        fs.writeFileSync(BASELINE_FILE, JSON.stringify({ packages: current }, null, 2) + '\n');
        console.log(`Baseline written to ${path.relative(root, BASELINE_FILE)}`);
    } else if (errors.length) {
        console.log('\nProvenance regressed. Investigate before merging; if the change is legitimate, '
            + 'run `npm run attestations:update` and record the reason in the PR.');
        process.exitCode = 1;
    } else if (notices.length) {
        console.log('\nBaseline is out of date; run `npm run attestations:update` to refresh it.');
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = { lockPackages, attestationUrl, parseProvenance, compare, compareVersions, integrityToHex };
