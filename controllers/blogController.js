const Blog = require('../models/Blog');
const Notification = require('../models/Notification');
const Follower = require('../models/Follower');

exports.getBlogsPage = (req, res) => {
    res.render('admin/blogs', {title: 'Manage Your Blogs'});
};

exports.getBlogs = async (req, res) => {
    const filters = {};
    const { page = 1, limit = 1, sortField = 'dateCreated', sortOrder = 'DESC', title, owner } = req.query;
    const blogs = await Blog.getAll(page, parseInt(limit), sortField, sortOrder, { title, owner });
    const totalBlogs = await Blog.getBlogsCount({ filters });
    const totalPages = Math.ceil(totalBlogs / limit);
    res.json({ blogs, totalPages, totalBlogs });
};

exports.createBlog = async (req, res) => {
    const { title, description, author } = req.body;
    await Blog.add(title, description, author);
    const UserId = req.user.id;
    await Notification.createNotification(UserId, `Your Blog "${title}" has been created.`, req.io);
    // Notify followers
    const followers = await Follower.getFollowers(UserId);
    followers.forEach(async follower => {
        await Notification.createNotification(follower.FollowerUserId, `User ${req.user.username} has created a new blog "${title}".`, req.io);
    });

    res.json({ success: true });
};

exports.editBlog = async (req, res) => {
    const { title, description, owner, userId, baseDirectory, metaKeywords, metaDescription, headStylesBlock, headScriptsBlock, slug, blogHeader, blogFooter } = req.body;
    await Blog.edit(req.params.id, title, description, owner, userId, baseDirectory, metaKeywords, metaDescription, headStylesBlock, headScriptsBlock, slug, blogHeader, blogFooter);
    const UserId = req.user.id;
    await Notification.createNotification(UserId, `Your Blog "${title}" has been updated.`, req.io);
    // Notify followers
    const followers = await Follower.getFollowers(UserId);
    followers.forEach(async follower => {
        await Notification.createNotification(follower.FollowerUserId, `User ${req.user.username} has updated blog "${title}".`, req.io);
    });
    res.json({ success: true });
};

exports.deleteBlog = async (req, res) => {
    await Blog.delete(req.params.id);
    res.json({ success: true });
};

exports.getBlog = async (req, res) => {
    const blog = await Blog.get(req.params.id);
    res.json(blog);
};
