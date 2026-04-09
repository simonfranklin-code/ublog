const BlogPost = require('../models/BlogPost');
const Blog = require('../models/Blog');
const User = require('../models/User');
const HtmlSection = require('../models/HtmlSection');
const Notification = require('../models/Notification');
const Follower = require('../models/Follower');

var path = require('path');
const fs = require('fs');

exports.getBlogPostsPage = async (req, res) => {
    const usersLookup = await User.findAll();
    const blogsLookup = await Blog.getAll(1, 1000, 'BlogId', 'DESC', {})

    res.render('user/blogPosts', { users: usersLookup, blogs: blogsLookup, title: 'Blog Post Manager' });
};

exports.getBlogPosts = async (req, res) => {
    try {
        const filters = {};
        const { page = 1, limit = 10, sortField = 'Id', sortOrder = 'ASC', title, author, blogId } = req.query;
        const blogSlug = await Blog.getBlogSlugByBlogId(blogId);
        const blogs = await Blog.getAll(1, 1000, 'BlogId', 'DESC', {})
        const blogPosts = await BlogPost.getAll(page, parseInt(limit), sortField, sortOrder, { title, author, blogId });
        const totalBlogPosts = await BlogPost.getBlogPostsCount({ title });
        const totalPages = Math.ceil(totalBlogPosts / limit);
        res.json({ blogs, blogPosts, totalPages, totalBlogPosts, blogSlug });
    } catch (e) {
        req.io.emit('flash', { message: `An error occured :` + e.message, isError: true });
    }
};

exports.createBlogPost = async (req, res) => {
    try {
        const { title, slug, blogId, author, userId, content } = req.body;
        await BlogPost.add(title, slug, blogId, author, userId, content);
        req.flash('success_msg', `Your Blog post "${title}" has been created.`);
        // Emit flash message to connected clients
        const flashMessage = req.flash('success_msg');
        req.io.emit('flash', { message: flashMessage, isError: false });
        await Notification.createNotification(userId, flashMessage);
        // Notify followers
        const followers = await Follower.getFollowers(userId);
        followers.forEach(async follower => {
            const username = await User.findById(userId).username;
            req.flash('success_msg', `User ${username} has created a new blog post ${title}.`);
            // Emit flash message to connected clients
            const flashMessage = req.flash('success_msg');
            req.io.emit('flash', { message: flashMessage, isError: false });
            await Notification.createNotification(follower.FollowerUserId, flashMessage);
        });
        res.json({ success: true });
    } catch (e) {
        req.io.emit('flash', { message: `An error occured :` + e.message, isError: true });
        res.json({ success: false });
    }
};

exports.editBlogPost = async (req, res) => {
    try {
        const { title, slug, blogId, author, userId, content, metaDescription, metaKeywords, footer, publisher, draftPageName } = req.body;
        await BlogPost.edit(req.params.id, title, slug, blogId, author, userId, content, metaDescription, metaKeywords, footer, publisher, draftPageName);
        req.flash('success_msg', `Your Blog post "${title}" has been updated. by. ${req.user.username}`);
        // Emit flash message to connected clients
        const flashMessage = req.flash('success_msg');
        req.io.emit('flash', { message: flashMessage, isError: false });
        await Notification.createNotification(userId, `Your Blog post "${title}" has been updated. by ${req.user.username}`);
        // Notify followers
        const followers = await Follower.getFollowers(userId);
        followers.forEach(async follower => {
            await Notification.createNotification(follower.FollowerUserId, `User ${req.user.username} has updated blog post "${title}".`);
        });
        res.json({ success: true });
    } catch (e) {
        req.io.emit('flash', { message: `An error occured :` + e.message, isError: true });
        res.json({ success: false });
    }
};

exports.deleteBlogPost = async (req, res) => {
    await BlogPost.delete(req.params.id);

    res.json({ success: true });
};

exports.getBlogPost = async (req, res) => {
    const blogPost = await BlogPost.get(req.params.id);
    res.json(blogPost);
};

exports.uploadHtmlFile = async (req, res) => {
    let blogPost = null;
    let blogSlug = null;
    let blogId = null;
    if (req.body.blogPostId) {
        
        blogPost = await BlogPost.get(req.body.blogPostId);
        blogId = blogPost.BlogId;
        blogSlug = await Blog.getBlogSlugByBlogId(blogId);
    }
    if (!req.files || !req.files.html) {
        return res.status(400).json({ success: false, message: 'No html file uploaded.' });
    }

    const htmlFile = req.files.html;
    const uploadDir = path.join(__dirname, '../public/uploads');

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    const htmlFilePath = path.join(uploadDir, htmlFile.name);

    htmlFile.mv(htmlFilePath, err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Html file upload failed.' });
        }
        const slug = htmlFile.name.replace('.html', '').toLowerCase();
        const url = htmlFilePath;


        const htmlSections = HtmlSection.importHtml(htmlFilePath, req.body.blogPostId, blogSlug, slug, htmlFile.name);
        
        res.json({ success: true });
    });




};

