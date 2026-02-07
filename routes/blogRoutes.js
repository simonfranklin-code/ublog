// routes/blogRoutes.js
const express = require('express');
const blogController = require('../controllers/blogController');
const router = express.Router();

router.get('/', blogController.getBlogsPage);
router.get('/api', blogController.getBlogs);
router.post('/', blogController.createBlog);
router.post('/edit/:id', blogController.editBlog);
router.post('/delete/:id', blogController.deleteBlog);
router.get('/:id', blogController.getBlog);

module.exports = router;