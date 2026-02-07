const HtmlSection = require('../models/HtmlSection');
const Blog = require('../models/Blog');
const BlogPost = require('../models/BlogPost');
const db = require('../models/db');
const Notification = require('../models/Notification');
const Follower = require('../models/Follower');
const User = require('../models/User');
const Component = require('../models/Component');
const { parseMbrParameters } = require('../lib/parser');
const { renderCustomHTML } = require('../lib/renderer');
const { extractDefaultParams } = require('../lib/defaultParams');
var path = require('path');
const fs = require('fs');
let _BlogSlug = '';
let _BlogPostSlug = '';
let _Blogs = null;
let _BlogPost = null;

exports.getHtmlSectionsPage = async (req, res) => {
    _Blogs = await Blog.getAllBlogsLookup();
    if (_Blogs === null || _Blogs === 'undefined') {
        req.flash('error_msg', 'No blogs found');
        req.io.emit('flash', { message: 'No blogs found', isError: true });
        return res.redirect('/users/dashboard');
    }
    res.render('user/htmlSections', { title: 'Manage Html Sections', blogs: _Blogs });
};
exports.getBlogPostsByBlogId = async (req, res) => {
    const blogId = req.params.BlogId;
    if (!blogId || isNaN(blogId)) {
        return res.status(400).json({ error: 'Invalid BlogId' });
    }
    try {
        const blogPosts = await BlogPost.getAllBlogPostsByBlogIdLookup(blogId);
        if (!blogPosts || blogPosts.length === 0) {
            return res.status(404).json({ error: 'No blog posts found for this blog' });
        }
        res.json(blogPosts);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).json({ error: 'An error occurred while fetching blog posts' });
    }
};
exports.getHtmlSections = async (req, res) => {
    try {
        const filters = {};
        const { page = 1, limit = 5, sortField = 'ViewIndex', sortOrder = 'ASC', anchor, blogPostId } = req.query;
        if (blogPostId != 'undefined' && blogPostId > 0) {

            _BlogPost = await BlogPost.get(blogPostId);
            if (_BlogPost === null) {
                throw new Error('Blog Post not found');
            }
            _Blog = await Blog.get(_BlogPost.BlogId);
            _BlogSlug = _Blog.Slug;
            _BlogPostSlug = _BlogPost.Slug;
        }
        const htmlSections = await HtmlSection.getAll(page, parseInt(limit), sortField, sortOrder, { anchor, blogPostId });
        const totalHtmlSections = await HtmlSection.getHtmlSectionsCount({ blogPostId });
        const totalPages = Math.ceil(totalHtmlSections / limit);
        const blogPosts = await BlogPost.getAll(1, parseInt(100), 'BlogPostId', 'ASC', filters);
        res.json({ htmlSections, totalPages, totalHtmlSections, blogPosts, _BlogSlug, _BlogPostSlug });
    } catch (e) {
        req.io.emit('flash', { message: `An error occured :` + e.message, isError: true });
    }
};

exports.createHtmlSection = async (req, res) => {
    try {
        const { html, blogPostId, viewIndex, anchor, slug, page, header, body } = req.body;
        await HtmlSection.add(html, blogPostId, viewIndex, anchor, slug, page, header, body);
        req.flash('success_msg', `Html Section "${anchor}" has been created. by. ${req.user.username}`);
        // Emit flash message to connected clients
        const flashMessage = req.flash('success_msg');
        req.io.emit('flash', { message: flashMessage, isError: false });
        await Notification.createNotification(req.user.id, `Html Section "${anchor}" has been created.`);
        // Notify followers
        const followers = await Follower.getFollowers(req.user.id);
        followers.forEach(async follower => {
            const username = req.user.username;
            await Notification.createNotification(follower.FollowerUserId, `User ${username} has created a new html section "${anchor}".`);
        });
        res.json({ success: true });
    } catch (e) {
        req.io.emit('flash', { message: `An error occured :` + e.message, isError: true });
        res.json({ success: false });
    }
};

exports.editHtmlSection = async (req, res) => {
    try {
        const { html, viewIndex, anchor, slug, page, header, body, component, css, paramsJson } = req.body;
        await HtmlSection.edit(req.params.id, html, viewIndex, anchor, slug, page, header, body, component, css, paramsJson);
        req.flash('success_msg', `Html Section "${anchor}" has been edited by. ${req.user.username}`);
        // Emit flash message to connected clients
        const flashMessage = req.flash('success_msg');
        req.io.emit('flash', { message: flashMessage, isError: false });
        await Notification.createNotification(req.user.id, `Html Section "${anchor}" has been edited.`);
        // Notify followers
        const followers = await Follower.getFollowers(req.user.id);
        followers.forEach(async follower => {
            const username = await User.findById(req.user.id).username;
            await Notification.createNotification(follower.FollowerUserId, `Html Section "${anchor}" has been edited by. ${username}`);
        });
        res.json({ success: true });
    } catch (e) {
        req.io.emit('flash', { message: `An error occured :` + e.message, isError: true });
        res.json({ success: false });
    }
};

exports.editComponentSet = async (req, res) => {
    try {
        const {  anchor, component } = req.body;
        await HtmlSection.editComponentSet(req.params.id, component);
        req.flash('success_msg', `Html Section "${anchor}" has been edited by. ${req.user.username}`);
        // Emit flash message to connected clients
        const flashMessage = req.flash('success_msg');
        req.io.emit('flash', { message: flashMessage, isError: false });
        await Notification.createNotification(req.user.id, `Html Section "${anchor}" has been edited.`);
        // Notify followers
        const followers = await Follower.getFollowers(req.user.id);
        followers.forEach(async follower => {
            const username = await User.findById(req.user.id).username;
            await Notification.createNotification(follower.FollowerUserId, `Html Section "${anchor}" has been edited by. ${username}`);
        });
        res.json({ success: true });
    } catch (e) {
        req.io.emit('flash', { message: `An error occured :` + e.message, isError: true });
        res.json({ success: false });
    }
};

exports.deleteHtmlSection = async (req, res) => {
    await HtmlSection.delete(req.params.id);
    res.json({ success: true });
};

exports.getHtmlSection = async (req, res) => {
    const htmlSection = await HtmlSection.get(req.params.id);
    res.json(htmlSection);
};

exports.getHtmlSectionCodeEditor = async (req, res) => {
    res.render('user/htmlSectionCodeEditor', { id: req.params.id });
};

exports.updateHtmlSection = (req, res) => {
    const { HtmlSectionID, Html } = req.body;

    db.run(`UPDATE HtmlSections SET Html = ?, DateUpdated = ? WHERE HtmlSectionID = ?`, [Html, new Date().toLocaleDateString(), HtmlSectionID], function (err) {
        if (err) {
            console.error(err);
            HtmlSection.logError(err);
            req.flash('error_msg', 'Error updating HtmlSection');
            // Emit flash message to connected clients
            const flashMessage = req.flash('error_msg');
            req.io.emit('flash', { message: flashMessage, isError: true });
            res.json({ success: false });
        } else {
            req.flash('success_msg', 'Successfully updated HtmlSection');
            // Emit flash message to connected clients
            const flashMessage = req.flash('success_msg');
            req.io.emit('flash', { message: flashMessage, isError: false });
            res.json({ success: true, html: Html });
        }
    });
};

exports.updateHtmlSectionByHtmlSectionId = (req, res) => {
    const { BlogPostId, HtmlSectionID, Html } = req.body;

    db.run(`UPDATE HtmlSections SET Html = ?, DateUpdated = ? WHERE HtmlSectionID = ? AND BlogPostId = ?`, [Html, new Date().toISOString(), HtmlSectionID, BlogPostId], function (err) {
        if (err) {
            console.error(err);
            HtmlSection.logError(err);
            req.flash('error_msg', 'Error updatng HtmlSection');
            // Emit flash message to connected clients
            const flashMessage = req.flash('error_msg');
            req.io.emit('flash', { message: flashMessage, isError: true });
            res.json({ success: false });
        } else {
            req.flash('success_msg', 'Successfully updated HtmlSection');
            // Emit flash message to connected clients
            const flashMessage = req.flash('success_msg');
            req.io.emit('flash', { message: flashMessage, isError: false });
            res.json({ success: true });
        }
    });
};

exports.uploadImage = (req, res) => {
    if (!req.files || !req.files.image) {
        return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const image = req.files.image;
    const uploadDir = path.join(__dirname, '../public/uploads');

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    const imagePath = path.join(uploadDir, image.name);

    image.mv(imagePath, err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Image upload failed.' });
        }

        res.json({ success: true, imageUrl: `/uploads/${image.name}` });
    });
};

exports.importHtml = async (req, res) => {
    try {
        
        const slug = req.params.slug;
        const pageName = slug + '.html';
        const blogPostId = parseInt(req.params.id);
        const url = 'https://simonfranklin-code.github.io/' + slug + '.html';
        const htmlSections = await HtmlSection.importHtml(url, blogPostId, pageName);
        if (htmlSections === null || htmlSections === 'undefined') {
            throw new Error('importHtml failed');
        } else {
            res.json(htmlSections);
        }
    } catch (err) {
        res.json(err);
    }
};

exports.importSingleHtmlSectionById = async (req, res) => {
    try {
        const slug = req.params.slug;
        const anchor = req.params.anchor;
        const url = 'https://simonfranklin-code.github.io/' + slug + '.html';
        const htmlSections = await HtmlSection.importSingleHtmlSection(url, anchor);
        if (htmlSections === null || htmlSections === 'undefined') {
            throw new Error('importSingleHtmlSectionById failed');
        } else {
            res.json(htmlSections);
        }
    } catch (err) {
        res.json(err);
    }
};

exports.findAndReplace = async (req, res) => {
    try {
        let { find, replace, blogPostId } = req.body;
        let sql = '';
        // Enhanced validation
        if (find == null) {
            return res.status(400).json({ error: 'Missing required fields' });
        } else if (replace == null || replace == 'undefined') {
            replace = '';
        }
        if (blogPostId == null) {
            sql = `UPDATE HtmlSections SET Html = REPLACE(Html, ?, ?)`;
            db.run(sql, [find, replace], function (err) {
                if (err) {
                    console.error('Error executing SQL:', err.message);
                    return res.status(500).json({ error: 'An error occurred while updating the database' });
                }
                // Check the number of affected rows
                if (this.changes > 0) {
                    res.json({ success: true, message: `${this.changes} rows updated` });
                } else {
                    res.status(404).json({ success: false, message: 'No matching records found' });
                }
            });

        } else {
            sql = `UPDATE HtmlSections SET Html = REPLACE(Html, ?, ?) WHERE BlogPostId = ?`;
            db.run(sql, [find, replace, blogPostId], function (err) {
                if (err) {
                    console.error('Error executing SQL:', err.message);
                    return res.status(500).json({ error: 'An error occurred while updating the database' });
                }

                // Check the number of affected rows
                if (this.changes > 0) {
                    res.json({ success: true, message: `${this.changes} rows updated` });
                } else {
                    res.status(404).json({ success: false, message: 'No matching records found' });
                }
            });
        }



    } catch (err) {
        res.json(err);
    }
};

exports.getIframeSrc = async (req, res) => {
    const blogSlug = req.params.blogSlug;
    const blogPostSlug = req.params.blogPostSlug;
    const anchor = req.params.anchor;
    res.json({ src: `/admin/htmlSections/${blogSlug}/${blogPostSlug}/${anchor}` })
}

exports.getBlogPostSectionByAnchor = async (req, res) => {

    const blogSlug = req.params.blogSlug;
    const slug = req.params.slug;
    const anchor = req.params.anchor;
    const blogPostFromSlug = await BlogPost.getBlogPostBySlug(slug);
    const blogPostTitle = blogPostFromSlug.Title;

    const blogFromSlug = await Blog.getBlogBySlug(blogSlug);
    const footer = blogPostFromSlug.Footer;

    let htmlSectionId = null;
    let sql = 'SELECT * FROM HtmlSections WHERE Slug = ? AND Anchor = ? ORDER BY ViewIndex ASC';
    db.all(sql, [slug.toLowerCase(), anchor], async (err, rows) => {
        if (err) {
            throw err;
        }
        var htmlContent = "";
        var htmlPage = '';
        var row;
        let schema = null;
        let params = null;
        let rendered = null;
        let cid = '';
        let styles = null;
        let _css = '';
        let _params;
        let renderedHtml
        let component = null;
        if (rows && rows.length > 0) {
            row = rows[0];
            htmlContent += row.Html;
            htmlSectionId = row.HtmlSectionID;
            htmlContent += `<input type="hidden" id ="HtmlSectionID" name ="HtmlSectionID" value="${row.HtmlSectionID}">`;
            htmlPage = row.Page;

            if (row.Component !== null && row.Component !== 'undefined' && row.Component !== '') {
                component = JSON.parse(row.Component);
                let customHtml = component._customHTML;
                styles = component._styles;
                cid = component._cid;
                schema = parseMbrParameters(customHtml);
                params = extractDefaultParams(customHtml);
                const { html, css } = await renderCustomHTML(customHtml, params, {
                    PROJECT_PATH: "",
                    styles: styles,
                    cid: cid,
                });
                _css = css;
                renderedHtml = html;
            }
        }
        res.render('user/htmlSection', {
            htmlContent: htmlContent,
            title: blogPostTitle,
            blog: blogFromSlug,
            blogPost: blogPostFromSlug,
            htmlSectionId: htmlSectionId,
            anchor: anchor,
            footer: footer,
            htmlPage: htmlPage,
            id: htmlSectionId,
            schema: schema,
            params: params,
            css: _css,
            /*
            rendered: `<style>${_css}</style>\n${renderedHtml}`,
            */
            rendered: renderedHtml,
            component: component
        });

    });


}

exports.getWitsecSearchDb = async (req, res) => {
    let htmlSections = await HtmlSection.getWitsecSearchDb();
    res.json(htmlSections);
}