const fs = require('fs');
const path = require('path');
const less = require('less');
const PROJECT_PATH = path.join(__dirname, '../public/digital-marketing-dreams/project.mobirise');
const css = require('css');
const HtmlSection = require('./HtmlSection');
class MobiriseProject {
    static load() {
        const raw = fs.readFileSync(PROJECT_PATH, 'utf-8');
        return JSON.parse(raw);
    }

    static save(data) {
        fs.writeFileSync(PROJECT_PATH, JSON.stringify(data, null, 2));
    }


    static findComponent(project, anchor) {
        for (const page of project.pages) {
            for (const comp of page.components) {
                if (comp._anchor === anchor) return comp;
            }
        }
        return null;
    }



    static updateComponentInProject(anchor, newHtml, newStyles) {
        const project = this.loadProject();
        const component = this.findComponent(project, anchor);
        if (!component) {
            console.error(`Component with anchor '${anchor}' not found.`);
            return;
        }

        if (newHtml) component._customHTML = newHtml;
        if (newStyles) component._styles = JSON.parse(newStyles);
        this.saveProject(project);
        console.log(`Component '${anchor}' updated.`);
    }

    static extractMbrParameters(html) {
        const match = html.match(/<mbr-parameters>([\s\S]*?)<\/mbr-parameters>/);
        return match ? match[1].trim() : '';
    }

    static async compileComponentCSS(component) {
        const params = this.extractMbrParameters(component._customHTML || '');
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

    static async exportPages(project) {
        fs.mkdirSync(DIST_DIR, { recursive: true });

        for (const page of project.pages) {
            let html = `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>${page.settings.title}</title></head><body>\n`;

            for (const component of page.components) {
                const anchor = component._anchor || 'block';
                const compiledCss = await this.compileComponentCSS(component);
                html += `<div id="${anchor}">\n${compiledCss}\n${component._customHTML}\n</div>\n`;
            }

            html += '</body></html>';
            const fileName = `${page.settings.title.replace(/\s+/g, '-').toLowerCase()}.html`;
            fs.writeFileSync(path.join(DIST_DIR, fileName), html);
            console.log(`Exported: ${fileName}`);
        }
    }

    static listComponents() {
        const project = this.load();
        const result = [];
        for (const page of project.pages) {
            for (const comp of page.components) {
                result.push({
                    anchor: comp._anchor,
                    name: comp._name,
                    page: page.settings.title
                });
            }
        }
        return result;
    }

    static getPageList() {
        const project = this.load();
        return project.pages.map(page => ({
            title: page.settings.title,
            components: page.components.map(comp => ({
                anchor: comp._anchor,
                name: comp._name
            }))
        }));
    }

    static getComponent(anchor) {
        const project = this.load();
        for (const page of project.pages) {
            for (const comp of page.components) {
                if (comp._anchor === anchor) {
                    return comp;
                }
            }
        }
        return null;
    }

    static async updateComponent(pageName, anchor, component) {
        const project = this.load();

        if (!project.pages[pageName]) {
            throw new Error(`Page "${pageName}" not found`);
        }

        const page = project.pages[pageName];
        const _component = page.components.find(c => c._anchor === anchor);

        if (!_component) {
            throw new Error(`Component with anchor "${anchor}" not found`);
        }

        // Must be a raw HTML string
        _component._customHTML = component._customHTML;

        // Persist updated styles
        _component._styles = component._styles;

        this.save(project);
        return true;
    }

    static findComponent(pageIdentifier, anchor) {
        const project = this.load();

        // Case 1: direct pageKey lookup
        if (project.pages[pageIdentifier]) {
            const page = project.pages[pageIdentifier];
            return page.components.find(c => c._anchor === anchor) || null;
        }

        // Case 2: lookup by settings.title
        for (const [key, page] of Object.entries(project.pages)) {
            if (page.settings.title === pageIdentifier) {
                return page.components.find(c => c._anchor === anchor) || null;
            }
        }

        return null;
    }

    static async findComponentByPage(pageName, anchor) {
        const project = this.load();
        if (project.pages[pageName]) {
            const page = project.pages[pageName];

            return page.components.find(c => c._anchor === anchor) || null;
        }
        return null;
    }

    static getPages(project) {
        if (Array.isArray(project.pages)) {
            return project.pages;
        }
        return Object.values(project.pages);
    }

    static cssToJsonNested(cssString) {

        const ast = css.parse(cssString);

        function processRules(rules) {
            const result = {};

            for (const rule of rules) {
                if (rule.type === 'rule') {
                    for (const selector of rule.selectors) {
                        const styles = {};
                        for (const decl of rule.declarations) {
                            if (decl.type === 'declaration') {
                                styles[decl.property] = decl.value;
                            }
                        }
                        result[selector] = styles;
                    }
                }

                if (rule.type === 'media') {
                    result[`@media ${rule.media}`] = processRules(rule.rules);
                }
            }

            return result;
        }

        return processRules(ast.stylesheet.rules);
    }

    static loadProject() {
        if (!fs.existsSync(PROJECT_PATH)) {
            throw new Error(`Project file not found at ${PROJECT_PATH}`);
        }
        return this.load();
    }
    static saveProject(project) {
        this.save(project);
    }

    static cssToLessJson(cssString) {
        const ast = css.parse(cssString);

        function buildRuleObject(rules) {
            const result = {};

            for (const rule of rules) {
                if (rule.type === 'rule') {
                    for (const selector of rule.selectors) {
                        if (!result[selector]) result[selector] = {};

                        for (const decl of rule.declarations || []) {
                            if (decl.type === 'declaration') {
                                result[selector][decl.property] = decl.value;
                            }
                        }
                    }
                }

                if (rule.type === 'media') {
                    const mediaKey = `@media ${rule.media}`;
                    result[mediaKey] = buildRuleObject(rule.rules);
                }
            }

            return result;
        }

        return buildRuleObject(ast.stylesheet.rules);
    }
    static deleteComponent(anchor) {
        const project = this.load();
        for (const page of project.pages) {
            const index = page.components.findIndex(comp => comp._anchor === anchor);
            if (index !== -1) {
                page.components.splice(index, 1);
                this.save(project);
                return true;
            }
        }
        throw new Error(`Component with anchor "${anchor}" not found`);
    }
    static getComponentByAnchor(anchor) {
        const project = this.load();
        for (const page of project.pages) {
            for (const comp of page.components) {
                if (comp._anchor === anchor) {
                    return comp;
                }
            }
        }
        return null;
    }
    static getComponentStyles(anchor) {
        const component = this.getComponentByAnchor(anchor);
        if (!component) return null;
        const styles = component._styles || {};
        return this.cssToJsonNested(styles);
    }
    static getComponentHtml(anchor) {
        const component = this.getComponentByAnchor(anchor);
        if (!component) return null;
        return component._customHTML || '';
    }
    static getComponentStylesAsLess(anchor) {
        const component = this.getComponentByAnchor(anchor);
        if (!component) return null;
        const styles = component._styles || {};
        return this.cssToLessJson(styles);
    }

    static getComponentCode(anchor) {
        const component = this.getComponentByAnchor(anchor);
        if (!component) return null;
        const html = component._customHTML || '';
        const styles = this.getComponentStylesAsLess(anchor) || {};
        return {
            html: html,
            styles: styles
        };
    }

    static getComponentCodeByPage(pageName, anchor) {
        const project = this.load();
        const page = this.findComponentByPage(project, pageName, anchor);
        if (!page) return null;
        const component = this.findComponent(page, anchor);
        if (!component) return null;
        return {
            html: component._customHTML || '',
            styles: this.getComponentStylesAsLess(anchor) || {}
        };
    }
    /**
     * Get a component by its page name and anchor.
     * @param {string} pageName - The name of the page.
     * @param {string} anchor - The anchor of the component.
     * @returns {object|null} - The component object or null if not found.
     */
    static getComponentByPage(pageName, anchor) {
        const project = this.load();
        const page = this.findComponentByPage(project, pageName, anchor);
        if (!page) return null;
        return this.findComponent(page, anchor);
    }
    /**
     * Get a component by its page name and anchor.
     * @param {string} pageName - The name of the page.
     * @param {string} anchor - The anchor of the component.
     * @returns {object|null} - The component object or null if not found.
     */
    static getComponentByPageName(pageName, anchor) {
        const project = this.load();
        for (const page of project.pages) {
            if (page.settings.title === pageName) {
                return this.findComponent(page, anchor);
            }
        }
        return null;
    }
    /**
     * Get a component by its page name and anchor.
     * @param {string} pageName - The name of the page.
     * @param {string} anchor - The anchor of the component.
     * @returns {object|null} - The component object or null if not found.
     */
    static getComponentByPageNameAndAnchor(pageName, anchor) {
        const project = this.load();
        for (const page of project.pages) {
            if (page.settings.title === pageName) {
                return this.findComponent(page, anchor);
            }
        }
        return null;
    }





}

module.exports = MobiriseProject;
