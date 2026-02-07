const express = require('express');
const router = express.Router();
const trackViews = require('../middleware/trackViews');
const blogPostController = require('../controllers/blogPostController');

// Route to retrieve blog Post
router.get('/', trackViews, blogPostController.getBlogPost);
// Route to get a blog post Stats
// Route to retrieve blog Post
// router.get('/blogPostStats/:blogPostId', blogPostController.getBlogPostStats);

module.exports = router;