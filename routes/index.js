const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    //res.render('index', { user: req.user });
    res.redirect('/blog/ublog/ublog');
});
// Example API endpoint
router.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Express API!' });
});
module.exports = router;