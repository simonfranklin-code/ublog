// lib/renderer.js
const cheerio = require('cheerio');
const less = require('less');

function safeEval(expr, params) {
    try {
        const fn = new Function('params', `with (params) { return (${expr}); }`);
        return fn(params);
    } catch (e) {
        return undefined;
    }
}

function parseObjectLiteralLike(str) {
    try {
        // normalize keys and quotes
        const jsonish = str
            .replace(/([a-zA-Z0-9_-]+)\s*:/g, '"$1":') // unquoted keys → quoted
            .replace(/'/g, '"');                      // single quotes → double quotes
        return JSON.parse(jsonish);
    } catch {
        return {};
    }
}

async function compileStyles(rawLess, params, cid) {
    // Build a map of variables from params
    const modifyVars = {};



    await flattenParams(params);
    async function flattenParams(obj, prefix = '') {
        for (const [key, val] of Object.entries(obj)) {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                flattenParams(val, prefix ? `${prefix}-${key}` : key);
            } else {
                const varName = prefix ? `${prefix}-${key}` : key;

                if (typeof val === 'string') {
                    // replace @PROJECT_PATH@ placeholders and quote
                    const safeVal = val.replace(/@PROJECT_PATH@\//g, '');
                    modifyVars[varName] = `"${safeVal}"`;
                } else {
                    modifyVars[varName] = val;
                }
            }
        }
    }
    // Wrap with component scope
    const scopedLess = `.cid-${cid} { ${rawLess} }`;

    const out = await less.render(scopedLess, { modifyVars });
    return out.css;
}

/* Parse mbr-class expression into [ [className, conditionExpr], ... ].
   This handles quoted keys and arbitrary condition expressions (commas inside parens/strings are ignored). */
function parseMbrClassPairs(expr) {
    if (!expr || typeof expr !== 'string') return [];

    // strip outer braces if present
    let s = expr.trim();
    if (s.startsWith('{') && s.endsWith('}')) s = s.slice(1, -1);

    const tokens = [];
    let cur = '';
    let depth = 0;
    let quote = null;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (quote) {
            cur += ch;
            if (ch === quote) quote = null;
            continue;
        }
        if (ch === '"' || ch === "'") {
            cur += ch;
            quote = ch;
            continue;
        }
        if (ch === '(' || ch === '[' || ch === '{') {
            depth++;
            cur += ch;
            continue;
        }
        if (ch === ')' || ch === ']' || ch === '}') {
            depth--;
            cur += ch;
            continue;
        }
        // split on commas at top level
        if (ch === ',' && depth === 0) {
            tokens.push(cur);
            cur = '';
            continue;
        }
        cur += ch;
    }
    if (cur.trim()) tokens.push(cur);

    const pairs = [];
    for (const token of tokens) {
        // find top-level colon (not inside quotes/parens)
        let idx = -1;
        let d = 0;
        let q = null;
        for (let i = 0; i < token.length; i++) {
            const ch = token[i];
            if (q) {
                if (ch === q) q = null;
                continue;
            }
            if (ch === '"' || ch === "'") { q = ch; continue; }
            if (ch === '(' || ch === '[' || ch === '{') { d++; continue; }
            if (ch === ')' || ch === ']' || ch === '}') { d--; continue; }
            if (ch === ':' && d === 0) { idx = i; break; }
        }
        if (idx === -1) continue; // malformed
        const rawKey = token.slice(0, idx).trim();
        let key = rawKey;
        // strip quotes from key if present
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
            key = key.slice(1, -1);
        }
        const valueExpr = token.slice(idx + 1).trim();
        pairs.push([key, valueExpr]);
    }

    return pairs;
}

async function renderCustomHTML(customHTML, params = {}, { PROJECT_PATH = '', styles = null, cid = null } = {}) {

    const $ = cheerio.load(customHTML, { decodeEntities: false });

    // Remove <mbr-parameters> block
    $('mbr-parameters').remove();

    // Replace @PROJECT_PATH@ only in safe attributes
    const PATH_ATTRS = ['src', 'href', 'data-src', 'data-bg', 'data-poster'];

    $(' *').each((_, el) => {
        const $el = $(el);
        for (const [k, v] of Object.entries(el.attribs || {})) {
            if (typeof v === 'string' && v.includes('@PROJECT_PATH@/') && PATH_ATTRS.includes(k)) {
                $el.attr(k, v.replace(/@PROJECT_PATH@\//g, PROJECT_PATH));
            }
        }
    });

    // Replace {{expr}} tokens in attributes
    $(' *').each((_, el) => {
        const $el = $(el);
        for (const [k, v] of Object.entries(el.attribs || {})) {
            if (!v) continue;
            const replaced = v.replace(/{{([^}]+)}}/g, (_, expr) => {
                const out = safeEval(expr, params);
                return out == null ? '' : String(out);
            });
            if (replaced !== v) $el.attr(k, replaced);
        }
    });

    // Replace {{expr}} in attributes (including class and style)
    $('*').each((_, el) => {
        const $el = $(el);
        for (const [k, v] of Object.entries(el.attribs || {})) {
            if (!v) continue;
            const replaced = v.replace(/{{([^}]+)}}/g, (_, expr) => {
                const out = safeEval(expr, params);
                return out == null ? '' : String(out);
            });
            if (replaced !== v) $el.attr(k, replaced);
        }
    });

    // Handle mbr-if
    $('[mbr-if]').each((_, el) => {
        const $el = $(el);
        const cond = $el.attr('mbr-if');
        const ok = !!safeEval(cond, params);
        if (!ok) $el.remove();
        else $el.removeAttr('mbr-if');
    });

    // Handle mbr-class (robust parser + evaluator)
    $('[mbr-class]').each((_, el) => {
        const $el = $(el);
        const expr = $el.attr('mbr-class') || '';
        const pairs = parseMbrClassPairs(expr);

        for (const [cls, condExpr] of pairs) {
            let val = false;
            try {
                val = !!safeEval(condExpr, params);
            } catch (e) {
                val = false;
            }

            if (val) {
                // add if not present
                const cur = ($el.attr('class') || '').split(/\s+/).filter(Boolean);
                if (!cur.includes(cls)) $el.addClass(cls);
            } else {
                // remove if present
                $el.removeClass(cls);
            }
        }

        $el.removeAttr('mbr-class');
    });


    // Handle mbr-style
    $('[mbr-style]').each((_, el) => {
        const $el = $(el);
        const expr = $el.attr('mbr-style');
        const map = parseObjectLiteralLike(expr);
        const stylesInline = [];
        Object.entries(map).forEach(([prop, v]) => {
            const val = typeof v === 'string' ? safeEval(v, params) : v;
            if (val !== undefined && val !== '') stylesInline.push(`${prop}: ${val}`);
        });
        if (stylesInline.length) {
            $el.attr(
                'style',
                (el.attribs?.style ? el.attribs.style + '; ' : '') + stylesInline.join('; ')
            );
        }
        $el.removeAttr('mbr-style');
    });

    // Replace {{expr}} in attributes and text nodes (supports nested params)
    $(' *').each((_, el) => {
        const $el = $(el);

        // Attributes
        for (const [k, v] of Object.entries(el.attribs || {})) {
            if (!v) continue;
            const replaced = v.replace(/{{([^}]+)}}/g, (_, expr) => {
                const out = safeEval(expr.trim(), params); // handles bg.value, overlay.opacity
                return out == null ? '' : String(out);
            });
            if (replaced !== v) $el.attr(k, replaced);
        }

        // Text nodes
        $el.contents().filter((__, node) => node.type === 'text').each((__, node) => {
            node.data = node.data.replace(/{{([^}]+)}}/g, (_, expr) => {
                const out = safeEval(expr.trim(), params);
                return out == null ? '' : String(out);
            });
        });
    });

    // Handle mbr-theme-style (apply value as class)
    $('[mbr-theme-style]').each((_, el) => {
        const $el = $(el);
        const className = $el.attr('mbr-theme-style');
        if (className) {
            $el.addClass(className);
        }
        $el.removeAttr('mbr-theme-style');
    });

    // Add cid-XXX class to top-level <section>
    if (cid) {
        const $root = $('body').children().first();
        if ($root.length && $root.is('section')) {
            $root.addClass(`cid-${cid}`);
        }
    }

    let html = $('body').children().first().toString();


    let css = '';
    if (styles && cid) {
        const vars = Object.entries(params)
            .map(([k, v]) => (typeof v === 'object' ? '' : `@${k}: ${v};`))
            .join('\\n');
        try {
            const out = await compileStyles(json2css(styles), params, cid);
            css = out;
        } catch (e) {
            console.error('LESS compile error', e);
        }
    }

    return { html, css };
}
function json2css(json) {
    var css = "";
    var prevdepth = 0;

    function eachRecursive(obj, depth = 0) {
        for (var k in obj) {
            // Indentation
            var spaces = " ".repeat(depth * 2);

            // If we're getting another hash, dive deeper
            if (typeof obj[k] == "object" && obj[k] !== null) {
                // Let's not have a white line as first line
                css += (css ? "\n" : "");

                // Open brackets
                css += spaces + k + " {\n";

                // Dive deeper
                eachRecursive(obj[k], depth + 1);
            } else {
                // Write the css
                css += spaces + k + ": " + obj[k] + ";\n";
            }

            // If current depth is less than previous depth, we've exited a hash, so let's place a closing bracket
            if (depth < prevdepth || JSON.stringify(obj[k]) == "{}") {
                css += spaces + "}\n";
            }
            prevdepth = depth;
        }
    }

    // Go!
    eachRecursive(json);

    // Return beautiful css :)
    return css.trim();
}

module.exports = { renderCustomHTML };
