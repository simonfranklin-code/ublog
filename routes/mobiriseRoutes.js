const express = require('express');
const router = express.Router();
const mobiriseData = require('../models/project.mobirise');

// Endpoint to serve the JSON data
router.get('/mobirise', (req, res) => {
    res.render('admin/mobirise', { title: 'You-Blog CMS', mobiriseData: mobiriseData }); ();
});

module.exports = router;
