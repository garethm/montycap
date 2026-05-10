'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
const simulation = fs.readFileSync(path.join(root, 'src/simulation.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui.js'), 'utf8');

function stripModuleSyntax(code) {
    return code
        .replace(/^export /gm, '')
        .replace(/^import .+\n/gm, '');
}

const js = stripModuleSyntax(simulation) + '\n' + stripModuleSyntax(ui);
let output = template.replace('/* @@BUILD_JS@@ */', js);

// Hash the inline script content (text between <script> and </script> after substitution)
const scriptContent = '\n' + js + '\n    ';
const scriptHash = crypto.createHash('sha256').update(scriptContent, 'utf8').digest('base64');

// Extract SRI hashes from external <script integrity="..."> tags so the CSP
// pins exact file content rather than allowing the whole CDN host.
const externalScriptHashes = [...template.matchAll(/<script[^>]+integrity="([^"]+)"/g)]
    .map(m => `'${m[1]}'`);

const csp = [
    "default-src 'none'",
    `script-src 'sha256-${scriptHash}' ${externalScriptHashes.join(' ')}`,
    "style-src 'unsafe-inline'",
    "img-src data: blob:",
    "base-uri 'none'",
    "form-action 'none'",
].join('; ');

output = output.replace('<!-- @@CSP@@ -->', `<meta http-equiv="Content-Security-Policy" content="${csp}">`);

const outputPath = path.join(root, 'web/index.html');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(`Built: ${outputPath}`);
