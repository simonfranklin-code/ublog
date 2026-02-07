const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const permissionController = require('../controllers/permissionController');
const blogController = require('../controllers/blogController');
const blogPostAdminController = require('../controllers/blogPostAdminController');
const htmlSectionController = require('../controllers/htmlSectionController');
const fs = require('fs');

const mobiriseData = require('../models/project.mobirise');
const hljs = require('highlight.js');
const db = require('../models/db');
const { ensureAuthenticated, ensureRole, ensureRoles, ensurePermission } = require('../middleware/permissionMiddleware');

// Admin Dashboard
router.get('/dashboard', ensureAuthenticated, ensureRoles(['admin']), adminController.dashboard);
// Admin Profile
router.get('/profile', ensureAuthenticated, ensureRoles(['admin']), adminController.getAdminProfile);
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

// Manage Blogs
router.get('/blogs', ensureAuthenticated, ensurePermission('manage_blogs'), blogController.getBlogsPage);
router.get('/blogs/api', ensureAuthenticated, ensurePermission('view_blogs'), blogController.getBlogs);
router.post('/blogs/create', ensureAuthenticated, ensurePermission('add_blogs'), blogController.createBlog);
router.post('/blogs/edit/:id', ensureAuthenticated, ensurePermission('edit_blogs'), blogController.editBlog);
router.post('/blogs/delete/:id', ensureAuthenticated, ensurePermission('delete_blogs'), blogController.deleteBlog);
router.get('/blogs/:id', ensureAuthenticated, ensurePermission('view_blogs'), blogController.getBlog);

// Manage Blog Posts
router.get('/blogPosts', ensureAuthenticated, ensurePermission('manage_blogPosts'), blogPostAdminController.getBlogPostsPage);
router.get('/blogPosts/api', ensureAuthenticated, ensurePermission('view_blogPosts'), blogPostAdminController.getBlogPosts);
router.post('/blogPosts/create', ensureAuthenticated, ensurePermission('add_blogPosts'), blogPostAdminController.createBlogPost);
router.post('/blogPosts/edit/:id', ensureAuthenticated, ensurePermission('edit_blogPosts'), blogPostAdminController.editBlogPost);
router.post('/blogPosts/delete/:id', ensureAuthenticated, ensurePermission('delete_blogPosts'), blogPostAdminController.deleteBlogPost);
router.get('/blogPosts/:id', ensureAuthenticated, ensurePermission('view_blogPosts'), blogPostAdminController.getBlogPost);
router.post('/blogPosts/uploadHtmlFile', ensureAuthenticated, ensurePermission('add_blogPosts'), blogPostAdminController.uploadHtmlFile);


// Manage HTML Sections

router.get('/htmlSections', ensureAuthenticated, ensurePermission('manage_htmlSections'), htmlSectionController.getHtmlSectionsPage);
router.get('/htmlSections/api', ensureAuthenticated, ensurePermission('view_htmlSections'), htmlSectionController.getHtmlSections);
router.post('/htmlSections/create', ensureAuthenticated, ensurePermission('add_htmlSections'), htmlSectionController.createHtmlSection);
router.post('/htmlSections/edit/:id', ensureAuthenticated, ensurePermission('edit_htmlSections'), htmlSectionController.editHtmlSection);
router.post('/htmlSections/delete/:id', ensureAuthenticated, ensurePermission('delete_htmlSections'), htmlSectionController.deleteHtmlSection);
router.get('/htmlSections/:id', ensureAuthenticated, ensurePermission('view_htmlSections'), htmlSectionController.getHtmlSection);
router.post('/htmlSections/update', ensureAuthenticated, ensurePermission('edit_htmlSections'), htmlSectionController.updateHtmlSection);
router.post('/htmlSections/updateBySectionId', ensureAuthenticated, ensurePermission('edit_htmlSections'), htmlSectionController.updateHtmlSectionByHtmlSectionId);
router.post('/htmlSections/uploadImage', ensureAuthenticated, ensurePermission('edit_htmlSections'), htmlSectionController.uploadImage);
router.get('/htmlSections/importHtml/:slug/:id', ensureAuthenticated, ensurePermission('edit_htmlSections'), htmlSectionController.importHtml);
router.get('/htmlSections/importSingleHtmlSectionById/:slug/:anchor', ensureAuthenticated, ensurePermission('edit_htmlSections'), htmlSectionController.importSingleHtmlSectionById);
router.post('/htmlSections/findAndReplace', ensureAuthenticated, ensurePermission('edit_htmlSections'), htmlSectionController.findAndReplace);
// Route to retrieve blog Post Anchor
router.get('/htmlSections/getIframeSrc/:blogSlug/:blogPostSlug/:anchor', ensureAuthenticated, ensurePermission('edit_htmlSections'), htmlSectionController.getIframeSrc);
router.get('/htmlSections/:blogSlug/:slug/:anchor', ensureAuthenticated, ensurePermission('edit_htmlSections'), htmlSectionController.getBlogPostSectionByAnchor);
router.get('/mobirise', (req, res) => {
    const data = JSON.parse(fs.readFileSync('./public/ublog/project.mobirise', 'utf-8'));
    res.render('admin/mobirise', { title: 'You-Blog CMS', mobiriseData: data, hljs: hljs });
});


module.exports = router;





