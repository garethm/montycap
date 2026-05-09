'use strict';

const fs = require('fs');
const path = require('path');

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
const output = template.replace('/* @@BUILD_JS@@ */', js);

const outputPath = path.join(root, 'web/index.html');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(`Built: ${outputPath}`);
