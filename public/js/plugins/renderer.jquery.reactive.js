/* renderer.jquery.reactive.js
   Browser-global jQuery plugin (load with <script> tag).
   Provides: $(selector).renderCustomHTML(html, params, opts)
   If opts.reactive === true the call returns a Proxy(params) which
   will trigger re-render whenever you set props on it.
   Requires jQuery and less.js loaded before this file.
*/
(function ($) {
    // Main plugin
    $.fn.renderCustomHTML = async function (customHTML, params = {}, opts = {}) {
        const { PROJECT_PATH = "", styles = null, cid = null, anchor = null, reactive = false, ifrEditors = null, curr = null, compEl = null } = opts;
        const $container = $(this);
        let renderTimer;
        const triggerRender = () => {
            clearTimeout(renderTimer);
            renderTimer = setTimeout(doRender, 100); // small debounce
        };
        // Render function rebuilds DOM and (re)compiles LESS
        async function doRender() {
            // parse input HTML
            const doc = new DOMParser().parseFromString(customHTML, 'text/html');
            const $parsed = $(doc).find('body').children().first();

            const PATH_ATTRS = ['src', 'href', 'data-src', 'data-bg', 'data-poster'];

            // Hide <mbr-parameters>
            $parsed.find('mbr-parameters').remove();

            // Replace @PROJECT_PATH@ in safe attributes
            $parsed.find('*').each(function () {
                const $el = $(this);
                $.each(this.attributes, function (_, attr) {
                    if (!attr || !attr.value) return;
                    if (attr.value.includes('@PROJECT_PATH@/') && PATH_ATTRS.includes(attr.name)) {
                        $el.attr(attr.name, attr.value.replace(/@PROJECT_PATH@\//g, PROJECT_PATH));
                    }
                });
            });

            // Replace {{expr}} in attributes and text nodes
            $parsed.find('*').each(function () {
                const $el = $(this);

                // Attributes
                $.each(this.attributes, function (_, attr) {
                    if (!attr || !attr.value) return;
                    const replaced = attr.value.replace(/{{([^}]+)}}/g, (_, expr) => {
                        const out = safeEval(expr.trim(), params);
                        return out == null ? '' : String(out);
                    });
                    if (replaced !== attr.value) $el.attr(attr.name, replaced);
                });

                // Text nodes
                $el.contents().filter(function () {
                    return this.nodeType === Node.TEXT_NODE;
                }).each(function () {
                    this.nodeValue = this.nodeValue.replace(/{{([^}]+)}}/g, (_, expr) => {
                        const out = safeEval(expr.trim(), params);
                        return out == null ? '' : String(out);
                    });
                });
            });

            // mbr-if
            $parsed.find('[mbr-if]').each(function () {
                const $el = $(this);
                const cond = $el.attr('mbr-if');
                const ok = !!safeEval(cond, params);
                if (!ok) $el.remove();
                else $el.removeAttr('mbr-if');
            });


            // mbr-class
            $parsed.find('[mbr-class]').each(function () {
                const $el = $(this);
                const expr = $el.attr('mbr-class') || '';
                const pairs = parseMbrClassPairs(expr);
                for (const [cls, condExpr] of pairs) {
                    let val = false;
                    try { val = !!safeEval(condExpr, params); } catch (e) { val = false; }
                    if (val) $el.addClass(cls); else $el.removeClass(cls);
                }
                $el.removeAttr('mbr-class');
            });

            // mbr-style (inline)
            $parsed.find('[mbr-style]').each(function () {
                const $el = $(this);
                const expr = $el.attr('mbr-style') || '';
                const map = parseObjectLiteralLike(expr);
                const stylesInline = [];
                $.each(map, function (prop, v) {
                    const val = (typeof v === 'string') ? safeEval(v, params) : v;
                    if (val !== undefined && val !== '') stylesInline.push(`${prop}: ${val}`);
                });
                if (stylesInline.length) {
                    const cur = $el.attr('style') || '';
                    $el.attr('style', (cur ? cur + '; ' : '') + stylesInline.join('; '));
                }
                $el.removeAttr('mbr-style');
            });

            // mbr-theme-style
            $parsed.find('[mbr-theme-style]').each(function () {
                const $el = $(this);
                const className = $el.attr('mbr-theme-style');
                if (className) $el.addClass(className);
                $el.removeAttr('mbr-theme-style');
            });

            // Add cid class and optional anchor/id
            if (cid && $parsed.is('section')) {
                $parsed.addClass(`cid-${cid}`);
                if (anchor) $parsed.attr('id', anchor);
            }

            // Inject into container
            $container.empty().append($parsed);
            // ---- Overlay patch ----
            $container.find('.mbr-overlay').each(function () {
                const $el = $(this);

                const opacity = $el.attr('opacity');
                let color = $el.attr('bg-color');

                if (!opacity && !color) return;

                if (color && color.startsWith('#')) {
                    color = hexToRgb(color);
                }

                const styleParts = [];
                if (opacity) styleParts.push(`opacity: ${opacity}`);
                if (color) styleParts.push(`background-color: ${color}`);

                const existing = $el.attr('style');
                const newStyle = (existing ? existing + '; ' : '') + styleParts.join('; ') + ';';
                $el.attr('style', newStyle);

                $el.removeAttr('opacity');
                $el.removeAttr('bg-color');
            });

            function hexToRgb(hex) {
                hex = hex.replace('#', '');
                const int = parseInt(hex, 16);
                return `rgb(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255})`;
            }

            // Compile LESS styles if available
            if (styles && cid && typeof less !== 'undefined' && less.render) {
                try {
                    if (params.bg) { params.bg.value = params.bg.value.replace('@PROJECT_PATH@/', ''); }
                    const css = await compileLess(styles, params, cid);
                    const $form = $("#controls");
                    const $compObj = $form.data("component");  // JS object (Mobirise component)
                    $compEl = $form.data("componentEl"); // jQuery DOM element (actual section)
                    $compObj._customHTML = $compEl[0].outerHTML;
                    //if (!css) return;
                    if (ifrEditors) {
                        ifrEditors.json.setValue(JSON.stringify(curr, null, 4));
                        ifrEditors.html.setValue($compEl[0].outerHTML);	// Escape closing script tag to prevent bad things from happening
                        ifrEditors.css.setValue(css);
                        ifrEditors.less.setValue(json2css(curr._styles));
                        ifrEditors.rendered.setValue($container.html())
                        ifrEditors.params.setValue(JSON.stringify(params, null, 4));
                    }
                    const styleId = `style-cid-${cid}`;
                    // replace previous style
                    $(`#${styleId}`).remove();
                    $('<style>', { id: styleId, text: css }).appendTo('head');
                } catch (e) {
                    console.error('LESS compile error:', e);
                }
            }
        } // doRender

        // initial render
        await doRender();

        if (reactive) {
            const createReactive = (obj) => {
                return new Proxy(obj, {
                    get(target, prop) {
                        const value = target[prop];
                        // Recursively proxy nested objects
                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                            return createReactive(value);
                        }
                        return value;
                    },
                    set(target, prop, value) {
                        target[prop] = value;
                        triggerRender();
                        return true;
                    },
                    deleteProperty(target, prop) {
                        delete target[prop];
                        triggerRender();
                        return true;
                    }
                });
            };

            const proxyParams = createReactive(params);
            await doRender(); // render once before returning proxy
            return proxyParams;
        }


        // Otherwise return jQuery object (chainable)
        return this;
    }; // $.fn.renderCustomHTML

    // ------------------ utilities ------------------
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
            const jsonish = String(str || '')
                .replace(/([a-zA-Z0-9_-]+)\s*:/g, '"$1":')
                .replace(/'/g, '"'); 
            return JSON.parse(jsonish);
        } catch {
            
            return {};
        }
    }

    function parseMbrClassPairs(expr) {
        if (!expr || typeof expr !== 'string') return [];
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
            if (ch === '"' || ch === "'") { cur += ch; quote = ch; continue; }
            if (ch === '(' || ch === '[' || ch === '{') { depth++; cur += ch; continue; }
            if (ch === ')' || ch === ']' || ch === '}') { depth--; cur += ch; continue; }
            if (ch === ',' && depth === 0) { tokens.push(cur); cur = ''; continue; }
            cur += ch;
        }
        if (cur.trim()) tokens.push(cur);
        const pairs = [];
        for (const token of tokens) {
            let idx = -1, d = 0, q = null;
            for (let i = 0; i < token.length; i++) {
                const ch = token[i];
                if (q) { if (ch === q) q = null; continue; }
                if (ch === '"' || ch === "'") { q = ch; continue; }
                if (ch === '(' || ch === '[' || ch === '{') { d++; continue; }
                if (ch === ')' || ch === ']' || ch === '}') { d--; continue; }
                if (ch === ':' && d === 0) { idx = i; break; }
            }
            if (idx === -1) continue;
            let key = token.slice(0, idx).trim();
            if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) key = key.slice(1, -1);
            const valueExpr = token.slice(idx + 1).trim();
            pairs.push([key, valueExpr]);
        }
        return pairs;
    }

    async function compileLess(rawLessObj, params, cid) {
        const modifyVars = {};
        //// Ensure required LESS vars always exist
        //const REQUIRED_VARS = {
        //    fullScreen: false,
        //    fullWidth: false,
        //    paddingTop: 0,
        //    paddingBottom: 0,
        //    bg: { type: '', value: '' },
        //    fallBackImage: '',
        //};

        //for (const [key, defVal] of Object.entries(REQUIRED_VARS)) {
        //    if (!(key in params)) {
        //        params[key] = defVal;
        //    }
        //}

        // If params.bg is an object, expose bg-type and bg-value to the flattening logic
        if (params.bg && typeof params.bg === 'object') {
            // normalize keys used by your LESS template
            params['bg-type'] = params.bg.type || '';
            if (params.bg.type === 'color') {
                params['bg-value'] = params.bg.value != null ? params.bg.value : '';
            } else {
                params['bg-value'] = params.bg.value != null ? String(params.bg.value) : '';
            }

        }

        // Flatten params safely, quote strings where necessary
        (function flatten(obj, prefix = '') {
            for (const [key, val] of Object.entries(obj || {})) {
                if (val && typeof val === 'object' && !Array.isArray(val)) {
                    flatten(val, prefix ? `${prefix}-${key}` : key);
                } else {
                    const varName = prefix ? `${prefix}-${key}` : key;

                    let v = val;
                    if (params && Object.prototype.hasOwnProperty.call(params, varName)) {
                        v = params[varName];
                    }

                    if (typeof v === 'string') {
                        const safeVal = v.replace(/@PROJECT_PATH@\//g, '');

                        // Determine if it's numeric (integer or decimal)
                        const isNumeric = /^-?\d+(\.\d+)?$/.test(safeVal);

                        // Helper: detect color tokens we should NOT quote
                        const isHexColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(safeVal.trim());
                        const isRgb = /^\s*rgba?\(/i.test(safeVal);
                        const isNamedColor = /^[a-zA-Z]+$/.test(safeVal.trim()); // simple color names like 'white'

                        if (
                            ['hamburgerColor', 'menuBgColor', 'overlayColor', 'cardColor', 'tColor', 'bgColor'].includes(varName)
                        ) {
                            // These are color tokens — keep raw (no extra quoting)
                            modifyVars[varName] = `${safeVal}`;
                        } else if (varName === 'bg-value') {
                            // bg-value may be a hex, rgb(), named color, or an image path.
                            if (isHexColor || isRgb || isNamedColor) {
                                // color token — do not quote
                                modifyVars[varName] = `${safeVal}`;
                            } else {
                                // not a color — likely an image path. Keep as a quoted string (so it can be used with url()).
                                // If your LESS later does `background-image: url(@bg-value);` and expects a quoted path,
                                // quoting here keeps it safe. Example: url("assets/..")
                                modifyVars[varName] = `"${safeVal}"`;
                            }
                        } else if (isNumeric) {
                            modifyVars[varName] = Number(safeVal); // Keep numbers unquoted
                        } else {
                            // default: quote ordinary strings so less treats them as strings
                            modifyVars[varName] = `"${safeVal}"`;
                        }
                    } else {
                        // HANDLE numbers, booleans, null, etc.
                        modifyVars[varName] = v;
                    }

                }
            }
        })(params || {});

        // Convert JSON to CSS string, scope it by .cid-{cid}
        const scopedLess = `.cid-${cid} { ${json2css(rawLessObj)} }`;
        try {
            const result = await less.render(scopedLess, { modifyVars });
            return result.css;
        } catch (err) {
            console.error('LESS compile error:', err, { scopedLess, modifyVars });
            return '';
        }
    }



    function json2css(json) {
        let css = '';
        const eachRecursive = (obj, depth = 0) => {
            for (const key in obj) {
                const val = obj[key];
                const indent = '  '.repeat(depth);
                if (typeof val === 'object' && val !== null) {
                    css += `${indent}${key} {\n`;
                    eachRecursive(val, depth + 1);
                    css += `${indent}}\n`;
                } else {
                    css += `${indent}${key}: ${val};\n`;
                }
            }
        };
        eachRecursive(json);
        return css.trim();
    }
})(jQuery);
