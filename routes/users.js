const express = require('express');
const router = express.Router();
const fs = require('fs');
const userblogController = require('../controllers/userblogController');
const userBlogPostController = require('../controllers/userBlogPostController');
const userController = require('../controllers/userController');
const userHtmlSectionController = require('../controllers/userHtmlSectionController');
const adminController = require('../controllers/adminController');
const permissionController = require('../controllers/permissionController');
const hljs = require('highlight.js');
const { ensureAuthenticated, ensureRole, ensureRoles, ensurePermission } = require('../middleware/permissionMiddleware');

// Register
router.get('/register', userController.registerGet);
router.post('/register', userController.registerPost);

// Login
router.get('/login', userController.loginGet);
router.post('/login', userController.loginPost);
// Logout
router.get('/logout', userController.logout);

// Route to get user profile
router.get('/profile', ensureAuthenticated, userController.getUserProfile);
// Manage Users
//router.get('/users', ensureAuthenticated, ensurePermission('manage_users'), adminController.getUsers);
router.get('/users/json', ensureAuthenticated, ensurePermission('manage_users'), adminController.getUsersJSON);
router.post('/users/edit/:id', ensureAuthenticated, ensurePermission('manage_users'), adminController.editUser);
router.post('/users/delete/:id', ensureAuthenticated, ensurePermission('manage_users'), adminController.deleteUser);


router.get('/users', ensureAuthenticated, ensureRole('admin'), (req, res) => {
    res.render('user/admin-users', { title: 'Manage Users' });
});

router.get('/api/users', ensureAuthenticated, ensureRole('admin'), adminController.getAllUsers);
router.post('/api/users', ensureAuthenticated, ensureRole('admin'), adminController.createUser);
router.put('/api/users', ensureAuthenticated, ensureRole('admin'), adminController.updateUser);
router.delete('/api/users', ensureAuthenticated, ensureRole('admin'), adminController.deleteUser);


// Activity Logs
router.get('/activity-logs', ensureAuthenticated, ensurePermission('view_activity_logs'), adminController.getActivityLogs);
router.get('/activity-logs/json', ensureAuthenticated, ensurePermission('view_activity_logs'), adminController.getActivityLogsJSON);

// Manage Permissions
router.get('/permissions', ensureAuthenticated, ensurePermission('manage_permissions'), permissionController.getPermissions);
router.post('/permissions/create', ensureAuthenticated, ensurePermission('create_permissions'), permissionController.createPermissionJSON);
router.post('/permissions/assign', ensureAuthenticated, ensureRoles(['admin']), permissionController.assignPermission);
router.get('/permissions/json', ensureAuthenticated, ensureRoles(['admin']), permissionController.getFilteredPermissions);
router.get('/permissions/role_permissions/json', ensureAuthenticated, ensurePermission('view_permissions'), permissionController.getRolePermissions);

// Admin route example
router.get('/admin', ensureAuthenticated, ensureRole('admin'), (req, res) => {
    res.send('Admin Dashboard');
});

// Password Reset Request
router.get('/password-reset-request', userController.passwordResetRequestGet);
router.post('/password-reset-request', userController.passwordResetRequestPost);

// Password Reset
router.get('/password-reset/:token', userController.passwordResetGet);
router.post('/password-reset/:token', userController.passwordResetPost);

// Admin Dashboard
router.get('/dashboard', ensureAuthenticated, userController.userDashboard);
// Manage Blogs
router.get('/blogs', ensureAuthenticated, ensurePermission('manage_blogs'), userblogController.getBlogsPage);
router.get('/blogs/api', ensureAuthenticated, ensurePermission('view_blogs'), userblogController.getBlogs);
router.post('/blogs/create', ensureAuthenticated, ensurePermission('add_blogs'), userblogController.createBlog);
router.post('/blogs/edit/:id', ensureAuthenticated, ensurePermission('edit_blogs'), userblogController.editBlog);
router.post('/blogs/delete/:id', ensureAuthenticated, ensurePermission('delete_blogs'), userblogController.deleteBlog);
router.get('/blogs/:id', ensureAuthenticated, ensurePermission('view_blogs'), userblogController.getBlog);

// Manage Blog Posts
router.get('/blogPosts', ensureAuthenticated, ensurePermission('manage_blogPosts'), userBlogPostController.getBlogPostsPage);
router.get('/blogPosts/api', ensureAuthenticated, ensurePermission('view_blogPosts'), userBlogPostController.getBlogPosts);
router.post('/blogPosts/create', ensureAuthenticated, ensurePermission('add_blogPosts'), userBlogPostController.createBlogPost);
router.post('/blogPosts/edit/:id', ensureAuthenticated, ensurePermission('edit_blogPosts'), userBlogPostController.editBlogPost);
router.post('/blogPosts/delete/:id', ensureAuthenticated, ensurePermission('delete_blogPosts'), userBlogPostController.deleteBlogPost);
router.get('/blogPosts/:id', ensureAuthenticated, ensurePermission('view_blogPosts'), userBlogPostController.getBlogPost);
router.post('/blogPosts/uploadHtmlFile', ensureAuthenticated, ensurePermission('add_blogPosts'), userBlogPostController.uploadHtmlFile);

// Manage HTML Sections
router.get('/witsecDb', ensureAuthenticated, ensurePermission('manage_htmlSections'), userHtmlSectionController.getWitsecSearchDb);
//router.get('/witsecDb/:slug', ensureAuthenticated, ensurePermission('manage_htmlSections'), userHtmlSectionController.getWitsecSearchDb);
router.get('/htmlSections/getBlogPosts/:BlogId', ensureAuthenticated, ensurePermission('manage_htmlSections'), userHtmlSectionController.getBlogPostsByBlogId);
router.get('/htmlSections', ensureAuthenticated, ensurePermission('manage_htmlSections'), userHtmlSectionController.getHtmlSectionsPage);
router.get('/htmlSections/api', ensureAuthenticated, ensurePermission('view_htmlSections'), userHtmlSectionController.getHtmlSections);
router.post('/htmlSections/create', ensureAuthenticated, ensurePermission('add_htmlSections'), userHtmlSectionController.createHtmlSection);
router.post('/htmlSections/edit/:id', ensureAuthenticated, ensurePermission('edit_htmlSections'), userHtmlSectionController.editHtmlSection);
router.post('/htmlSections/editComponentSet/:id', ensureAuthenticated, ensurePermission('edit_htmlSections'), userHtmlSectionController.editComponentSet);
router.post('/htmlSections/delete/:id', ensureAuthenticated, ensurePermission('delete_htmlSections'), userHtmlSectionController.deleteHtmlSection);
router.get('/htmlSections/:id', ensureAuthenticated, ensurePermission('view_htmlSections'), userHtmlSectionController.getHtmlSection);
router.get('/htmlSections/editor/:id', ensureAuthenticated, ensurePermission('view_htmlSections'), userHtmlSectionController.getHtmlSectionCodeEditor);
router.post('/htmlSections/update', ensureAuthenticated, ensurePermission('edit_htmlSections'), userHtmlSectionController.updateHtmlSection);
router.post('/htmlSections/updateBySectionId', ensureAuthenticated, ensurePermission('edit_htmlSections'), userHtmlSectionController.updateHtmlSectionByHtmlSectionId);
router.post('/htmlSections/uploadImage', ensureAuthenticated, ensurePermission('edit_htmlSections'), userHtmlSectionController.uploadImage);
router.get('/htmlSections/importHtml/:slug/:id', ensureAuthenticated, ensurePermission('edit_htmlSections'), userHtmlSectionController.importHtml);
router.get('/htmlSections/importSingleHtmlSectionById/:slug/:anchor', ensureAuthenticated, ensurePermission('edit_htmlSections'), userHtmlSectionController.importSingleHtmlSectionById);
router.post('/htmlSections/findAndReplace', ensureAuthenticated, ensurePermission('edit_htmlSections'), userHtmlSectionController.findAndReplace);
// Route to retrieve blog Post Anchor
router.get('/htmlSections/getIframeSrc/:blogSlug/:blogPostSlug/:anchor', ensureAuthenticated, ensurePermission('edit_htmlSections'), userHtmlSectionController.getIframeSrc);
router.get('/htmlSections/:blogSlug/:slug/:anchor', ensureAuthenticated, ensurePermission('edit_htmlSections'), userHtmlSectionController.getBlogPostSectionByAnchor);
function highlightCode(component) {
    const html = component?._customHTML;
    if (typeof html !== 'string') return 'No HTML';
    return hljs.highlight(html, { language: 'xml' }).value;
}

function highlightCodeLess(component) {
    const styles = component?._styles;
    if (!styles) return 'No Styles';
    const code = JSON.stringify(styles, null, 2);
    return hljs.highlight(code, { language: 'less' }).value;
}

router.get('/mobirise', (req, res) => {
    const data = JSON.parse(fs.readFileSync('./public/digital-marketing-dreams/project.mobirise', 'utf-8'));
    res.render('user/mobirise', {
        title: 'You-Blog CMS', mobiriseData: data, hljs: hljs,
        highlightCode,
        highlightCodeLess
    });
});




module.exports = router;