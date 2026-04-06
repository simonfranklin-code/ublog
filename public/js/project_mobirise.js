// convert-mobirise.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const less = require('less');

const PROJECT_FILE = './project.mobirise';
const DIST_DIR = './dist';

function loadProject() {
    return JSON.parse(fs.readFileSync(PROJECT_FILE, 'utf-8'));
}

function saveProject(data) {
    fs.writeFileSync(PROJECT_FILE, JSON.stringify(data, null, 2));
}

function findComponent(project, anchor) {
    for (const page of project.pages) {
        for (const comp of page.components) {
            if (comp._anchor === anchor) return comp;
        }
    }
    return null;
}

function updateComponentInProject(anchor, newHtml, newStyles) {
    const project = loadProject();
    const component = findComponent(project, anchor);
    if (!component) {
        console.error(`Component with anchor '${anchor}' not found.`);
        process.exit(1);
    }

    if (newHtml) component._customHTML = newHtml;
    if (newStyles) component._styles = JSON.parse(newStyles);
    saveProject(project);
    console.log(`Component '${anchor}' updated.`);
}

function extractMbrParameters(html) {
    const match = html.match(/<mbr-parameters>([\s\S]*?)<\/mbr-parameters>/);
    return match ? match[1].trim() : '';
}

async function compileComponentCSS(component) {
    const params = extractMbrParameters(component._customHTML || '');
    const styleMatch = component._customHTML.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const rawLess = styleMatch ? styleMatch[1].trim() : '';
    const fullLess = `${params}\n${rawLess}`;

    if (!fullLess) return '';

    try {
        const result = await less.render(fullLess);
        return `<style scoped>\n${result.css}</style>`;
    } catch (err) {
        console.warn(`LESS compile failed for ${component._anchor}:`, err.message);
        return '';
    }
}

async function exportPages(project) {
    fs.mkdirSync(DIST_DIR, { recursive: true });

    for (const page of project.pages) {
        let html = `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>${page.settings.title}</title></head><body>\n`;

        for (const component of page.components) {
            const anchor = component._anchor || 'block';
            const compiledCss = await compileComponentCSS(component);
            html += `<div id="${anchor}">\n${compiledCss}\n${component._customHTML}\n</div>\n`;
        }

        html += '</body></html>';
        const fileName = `${page.settings.title.replace(/\s+/g, '-').toLowerCase()}.html`;
        fs.writeFileSync(path.join(DIST_DIR, fileName), html);
        console.log(`Exported: ${fileName}`);
    }
}

function startPreviewServer() {
    const app = express();
    app.use(express.static(DIST_DIR));
    const port = 3000;
    app.listen(port, () => {
        console.log(`Preview at http://localhost:${port}`);
    });
}

// ------------------- CLI Entrypoint -------------------
(async () => {
    const args = process.argv.slice(2);
    const getArg = (name) => {
        const i = args.indexOf(name);
        return i !== -1 && args[i + 1] ? args[i + 1] : null;
    };

    if (args.includes('--edit')) {
        const anchor = getArg('--edit');
        const html = getArg('--html');
        const style = getArg('--style');
        updateComponentInProject(anchor, html, style);
        return;
    }

    if (args.includes('--preview')) {
        startPreviewServer();
        return;
    }

    const project = loadProject();
    await exportPages(project);
})();
