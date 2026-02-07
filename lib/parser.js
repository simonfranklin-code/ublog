// lib/parser.js
const cheerio = require('cheerio');

function attrBool(val) {
    if (val === '' || val === true || val === 'true' || val === 'checked') return true;
    if (val === 'false' || val === undefined) return false;
    return !!val;
}

function parseMbrParameters(customHTML) {
    const $ = cheerio.load(customHTML, { xmlMode: false, decodeEntities: true });
    const $params = $('mbr-parameters');
    const controls = [];
    if ($params.length === 0) return { controls, meta: { found: false } };

    $params.children().each((_, el) => {
        const tag = el.tagName?.toLowerCase();
        const $el = $(el);
        if (tag === 'header') {
            controls.push({ kind: 'header', title: $el.text().trim(), attrs: { condition: $el.attr('condition') || null } });
            return;
        }
        if (tag === 'input') {
            const type = ($el.attr('type') || 'text').toLowerCase();
            controls.push({
                kind: type,
                name: $el.attr('name') || null,
                title: $el.attr('title') || null,
                value: $el.attr('value') ?? null,
                attrs: {
                    condition: $el.attr('condition') || null,
                    min: $el.attr('min') || null,
                    max: $el.attr('max') || null,
                    step: $el.attr('step') || null,
                    inline: attrBool($el.attr('inline')),
                    selected: attrBool($el.attr('selected')),
                    checked: attrBool($el.attr('checked')),
                },
            });
            return;
        }
        if (tag === 'select') {
            const options = [];
            $el.children('option').each((__, opt) => {
                const $opt = $(opt);
                options.push({
                    label: $opt.text().trim(),
                    value: $opt.attr('value') ?? $opt.text().trim(),
                    selected: attrBool($opt.attr('selected')),
                });
            });
            controls.push({
                kind: 'select',
                name: $el.attr('name') || null,
                title: $el.attr('title') || null,
                value:
                    options.find((o) => o.selected)?.value ??
                    options[0]?.value ??
                    null,
                options,
            });
            return;
        }

        if (tag === 'fieldset') {
            const fType = ($el.attr('type') || '').toLowerCase();
            const name = $el.attr('name') || null;
            const parallax = attrBool($el.attr('parallax'));
            const children = [];
            $el.children('input').each((__, child) => {
                const $c = $(child);
                children.push({
                    kind: ($c.attr('type') || 'text').toLowerCase(),
                    name: $c.attr('name') || null,
                    title: $c.attr('title') || null,
                    value: $c.attr('value') ?? null,
                    attrs: { selected: attrBool($c.attr('selected')), condition: $c.attr('condition') || null },
                });
            });
            controls.push({ kind: fType || 'fieldset', name, title: name, attrs: { parallax }, options: children });
        }
    });

    return { controls, meta: { found: true, count: controls.length } };
}

module.exports = { parseMbrParameters };
