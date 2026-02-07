// controllers/componentController.js
const Component = require('../models/Component');
const { parseMbrParameters } = require('../lib/parser');
const { renderCustomHTML } = require('../lib/renderer');

exports.editor = (req, res) => {
    const section = Component.findById(req.params.id);
    if (!section) return res.status(404).send('Not found');
    let customHtml = JSON.parse(section.Component)._customHTML;
    const schema = parseMbrParameters(customHtml);
    res.render('editor', {
        title: section.title,
        id: section.id,
        schema: schema,
        params: JSON.parse(section.params_json || '{}'),
        rendered: section.rendered_html,
    });
};

exports.schema = (req, res) => {
    const section = Component.findById(req.params.id);
    if (!section) return res.status(404).json({ error: 'Not found' });
    const schema = parseMbrParameters(section.custom_html);
    res.json({ schema });
};

exports.updateParams = async (req, res) => {
    const section = Component.findById(req.params.id);
    if (!section) return res.status(404).json({ error: 'Not found' });

    const incoming = req.body.params || {};
    const current = JSON.parse(section.params_json || '{}');
    const params = { ...current, ...incoming };

    const { html, css } = await renderCustomHTML(section.custom_html, params, {
        PROJECT_PATH: '@PROJECT_PATH@/digital-marketing-dreams',
        styles: section.styles,
        cid: section.cid,
    });

    Component.update(section.id, {
        params_json: JSON.stringify(params),
        rendered_html: html,
        css,
    });

    res.json({ rendered_html: `<style>${css}</style>\\n${html}`, params });
};
