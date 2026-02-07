const db = require('./db');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const BlogPost = require('./BlogPost');
const Blog = require('./Blog');
const MobiriseProject = require('./MobiriseProject');
const { renderCustomHTML } = require('../lib/renderer');
const { extractDefaultParams } = require('../lib/defaultParams');
// Create the HtmlSections table if it doesn't exist
db.serialize(() => {
    db.run(`

        CREATE TABLE IF NOT EXISTS "HtmlSections" (
	        "HtmlSectionID"	INTEGER NOT NULL UNIQUE,
	        "Html"	TEXT,
	        "BlogPostId"	INTEGER NOT NULL,
	        "DateCreated"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	        "DateUpdated"	DATETIME,
	        "ViewIndex"	INTEGER,
	        "Anchor"	TEXT NOT NULL,
	        "Slug"	TEXT,
	        "UserId"	INTEGER,
	        "Page"	TEXT,
	        "Header"	TEXT,
	        "Body"	TEXT,
	        "Component"	TEXT,
            "Css"	TEXT,
	        "ParamsJson"	TEXT,
	        PRIMARY KEY("HtmlSectionID" AUTOINCREMENT),
	        CONSTRAINT "FK_HtmlSections_BlogPosts_BlogPostId" FOREIGN KEY("BlogPostId") REFERENCES "BlogPosts"("BlogPostId") ON DELETE CASCADE
        );
    `);
});

class HtmlSection {



    static add(html, blogPostId, viewIndex, anchor, slug, page, header, body, component, css, paramsJson) {
        const dateCreated = new Date().toLocaleString();
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO HtmlSections (Html, BlogPostId, ViewIndex, Anchor, Slug, Page, Header, Body, Component, Css, ParamsJson) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [html, blogPostId, viewIndex, anchor, slug, page, header, body, component, css, paramsJson], function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                });
        });
    }

    static async editComponentSet(htmlSectionId, anchor, component) {
        let customHtml = component._customHTML;
        let styles = component._styles;
        let cid = component._cid;
        let params = extractDefaultParams(customHtml);

        const { html, css } = await renderCustomHTML(customHtml, params, {
            PROJECT_PATH: '',
            styles: styles,
            cid: cid,
            anchor: anchor
        });
        return new Promise((resolve, reject) => {
            db.run(`UPDATE HtmlSections SET Component = ?, Css = ?, Html = ?, ParamsJson = ? WHERE HtmlSectionID = ?`,
                [JSON.stringify(component), css, html, JSON.stringify(params), htmlSectionId], function (err) {
                    if (err) return reject(err);
                    resolve(this.changes);
                });
        });
    }

    static edit(htmlSectionId, html, viewIndex, anchor, slug, page, header, body, component, css, paramsJson) {
        const dateUpdated = new Date().toISOString();
        return new Promise((resolve, reject) => {
            db.run(`UPDATE HtmlSections SET Html = ?, ViewIndex = ?, Anchor = ?, Slug = ?, Page = ?, Header = ?, Body = ?, DateUpdated = ?, Component = ?, Css = ?, ParamsJson = ?  WHERE HtmlSectionID = ?`,
                [html, viewIndex, anchor, slug, page, header, body, dateUpdated, component, css, paramsJson, htmlSectionId], function (err) {
                    if (err)
                        return reject(err);
                    resolve(this.changes);
                });
        });
    }

    static deleteBySlug(slug) {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM HtmlSections WHERE Slug = ?`,
                [slug], function (err) {
                    if (err) return reject(err);
                    resolve(this.changes);
                });
        });
    }

    static delete(htmlSectionId) {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM HtmlSections WHERE HtmlSectionID = ?`, [htmlSectionId], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }

    static get(htmlSectionId) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM HtmlSections WHERE HtmlSectionID = ?`, [htmlSectionId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    static getComponentFromHtmlSection(htmlSectionId) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT Component FROM HtmlSections WHERE HtmlSectionID = ?`, [htmlSectionId], (err, row) => {
                if (err) return reject(err);
                resolve(row.Component);
            });
        });
    }

    static async getAll(page = 1, limit = 5, sortField = 'ViewIndex', sortOrder = 'DESC', filters = {}) {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [];
        if (filters.anchor) {
            whereClause += ' AND Anchor LIKE ?';
            params.push(`%${filters.anchor}%`);
        }
        if (filters.blogPostId) {
            whereClause += ' AND BlogPostId = ?';
            params.push(filters.blogPostId);
        }
        const query = `SELECT * FROM HtmlSections WHERE 1=1${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
        return new Promise((resolve, reject) => {
            db.all(query, [...params, limit, offset], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static async getWitsecSearchDb() {

        const query = `SELECT Page AS page, Anchor AS anchor, Header AS header, Body AS body FROM HtmlSections`;
        return new Promise((resolve, reject) => {
            db.all(query, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static async getAllInternal(blogPostId) {

        const query = `SELECT * FROM HtmlSections WHERE BlogPostId = ? ORDER BY ViewIndex ASC`;
        return new Promise((resolve, reject) => {
            db.all(query, [blogPostId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static getHtmlSectionsCount(filter = {}) {
        let query = 'SELECT COUNT(*) AS count FROM HtmlSections WHERE 1=1';
        const params = [];

        if (filter.name) {
            query += ' AND name LIKE ?';
            params.push(`%${filter.name}%`);
        }

        if (filter.blogPostId) {
            query += ' AND BlogPostId = ?';
            params.push(`${filter.blogPostId}`);
        }

        return new Promise((resolve, reject) => {
            db.get(query, params, (err, row) => {
                if (err) {
                    this.logError(err);
                    return reject(err);
                }
                resolve(row.count);
            });
        });
    }

    // Fetch HTML content from the given URL
    static async fetchHTML(htmlFilePath) {
        try {
            // Read the file content
            const html = await fs.readFile(htmlFilePath, 'utf-8');
            //console.log('HTML Content:', html);
            return html;
        } catch (error) {
            console.error(`Error fetching the file: ${htmlFilePath}:`, error);
            throw error;
        }

    }

    // Extract a single HTML section based on its id attribute using cheerio
    static extractHtmlSectionById(html, id) {
        const $ = cheerio.load(html);
        const section = $(`section#${id}`);

        if (section.length > 0) {
            return [$.html(section), section.attr('id')];
        }

        return null;
    }

    // Extract HTML section using cheerio
    static extractHtmlSections(html) {
        const $ = cheerio.load(html);
        const sections = [];

        $('section').each((index, element) => {
            sections.push([$.html(element), $(element).attr('id')]);
        });

        return sections;
    }

    // Update HTML sections in the database
    static async insertHtmlSections(blogPostId, htmlSections, blogSlug, slug, pageName) {

        await this.deleteBySlug(slug);
        let data = [];
        let i = 0;
        let paramsJson = {};
        if (htmlSections !== 'undefined' && htmlSections.length > 0) {
            data = JSON.parse(await fs.readFile(`./public/${blogSlug}/assets/witsec-search/search.json`, 'utf-8'));


            for await (const section of htmlSections) {
                i++;

                let _item = {};
                let htmlContent = section[0]; // Destructure the outer HTML and id (anchor) from each sub-array
                let anchor = section[1];
                let lastId = 0;
                try {
                    for (const item of data) {
                        if (item.page.toLowerCase() === slug.toLowerCase() + '.html' && item.anchor === anchor) {
                            _item.page = item.page;
                            _item.anchor = item.anchor;
                            _item.header = item.header;
                            _item.body = item.body;

                        }
                    }
                } catch (error) {
                    console.error(`Error updating HtmlSection ${anchor}`, error);
                }

                try {
                    if (_item === null) {
                        
                        let css = null;
                        let component = await MobiriseProject.findComponentByPage(pageName, anchor);
                        if (component) {
                            lastId = await this.add(htmlContent, blogPostId, i, anchor, slug, pageName, '', '', JSON.stringify(component));
                            console.log(`HtmlSection ${anchor} inserted successfully.`);


                        }
                    } else {
                        let component = null;
                        let css = null;
                        component = await MobiriseProject.findComponentByPage(pageName, anchor);
                        if (component) {
                            component._customHTML = component._customHTML.replace("@PROJECT_PATH@/", "");
                            lastId = await this.add(htmlContent, blogPostId, i, anchor, slug, pageName, _item.header || '', _item.body || '', JSON.stringify(component));
                            console.log(`HtmlSection ${anchor} inserted successfully.`);


                        }
                    }

                    if (lastId > 0) {
                        let component = await MobiriseProject.findComponentByPage(pageName, anchor);
                        let customHtml = component._customHTML;
                        let styles = component._styles;
                        let cid = component._cid;
                        let params = extractDefaultParams(customHtml);

                        const { html, css } = await renderCustomHTML(customHtml, params, {
                            PROJECT_PATH: '',
                            styles: styles,
                            cid: cid,
                            anchor: anchor
                        });
                        
                        if (_item === null) {
                            this.edit(lastId, html, i, anchor, slug, pageName, '', '', JSON.stringify(component), css, JSON.stringify(paramsJson));
                        } else {
                            this.edit(lastId, html, i, anchor, slug, _item.page, _item.header, _item.body, JSON.stringify(component), css, JSON.stringify(params));
                        }

                        //if (_item === null) {
                        //    this.edit(lastId, htmlContent, i, anchor, slug, pageName, '', '', JSON.stringify(component), css, JSON.stringify(paramsJson));
                        //} else {
                        //    this.edit(lastId, htmlContent, i, anchor, slug, _item.page, _item.header, _item.body, JSON.stringify(component), css, JSON.stringify(params));
                        //}

                    }
                } catch (error) {
                    console.error(`Error updating HtmlSection ${anchor}`, error);
                }
            }




        }

    }

    // Main function to execute the steps
    static async importHtml(url, blogPostId, blogSlug, slug, pageName) {
        try {
            const html = await this.fetchHTML(url);
            const htmlSections = await this.extractHtmlSections(html);
            await this.insertHtmlSections(blogPostId, htmlSections, blogSlug.Slug, slug, pageName);
            return new Promise((resolve, reject) => {
                if (htmlSections === 'undefined') {
                    reject(new Error('htmlSections is undefined'));
                } else if (htmlSections.length <= 0) {
                    reject(new Error('htmlSections is <= 0'));
                } else {

                    resolve(htmlSections);
                }
            });

        } catch (error) {
            console.error('Error in main function', error);
        }
    }

    // Main function to execute the steps
    static async importSingleHtmlSection(url, id) {
        try {
            const html = await HtmlSection.fetchHTML(url);
            const htmlSections = await HtmlSection.extractHtmlSectionById(html, id);
            //await HtmlSection.updateHtmlSections(blogPostId, htmlSections);
            return new Promise((resolve, reject) => {
                if (htmlSections === 'undefined') {
                    reject(new Error('htmlSections is undefined'));
                } else if (htmlSections.length <= 0) {
                    reject(new Error('htmlSections is <= 0'));
                } else {

                    resolve(htmlSections);
                }
            });

        } catch (error) {
            console.error('Error in main function', error);
        }
    }

    static logError(err) {
        const errorMessage = `${new Date().toISOString()} - Error: ${err.message}\n`;
        fs.appendFile('error.log', errorMessage, (fsErr) => {
            if (fsErr) {
                console.error('Failed to write to log file:', fsErr);
            }
        });
    }

}

module.exports = HtmlSection;