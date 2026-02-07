// models/Component.js
const { getDB } = require('../models/db');

module.exports = {
    findById(id) {
        const db = getDB();
        return db.prepare('SELECT * FROM HtmlSections WHERE HtmlSectionID = ?').get(id);
    },
    update(id, { component, html, css }) {
        const db = getDB();
        db.prepare(`
      UPDATE HtmlSections
      SET Component = ?, Html = ?, css = ?, DateUpdated = datetime('now')
      WHERE id = ?
    `).run(component, html, css, id);
    }
};
