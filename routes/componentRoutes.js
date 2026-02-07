// routes/componentRoutes.js
const express = require('express');
const componentController = require('../controllers/componentController');

const router = express.Router();

// UI editor
router.get('/:id', componentController.editor);

// API
router.get('/:id/schema', componentController.schema);
router.post('/:id/params', componentController.updateParams);

module.exports = router;