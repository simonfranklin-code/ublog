const express = require('express');
const router = express.Router();
const HtmlSectionController = require('../controllers/htmlSectionController');
const Upload = require('../utils/upload');

const upload = Upload.getUpload();

// Image upload endpoint
router.post('/uploadImage', upload.single('image'), HtmlSectionController.uploadImage);


module.exports = router;
