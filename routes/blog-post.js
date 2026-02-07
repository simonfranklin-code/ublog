'use strict';
var express = require('express');
var router = express.Router();
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('C:\\Users\\Susana Rijo\\Source\\repos\\Smf\\YouBlog\\Server\\Digital-Marketing-Guru.db', (err) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
});

/* GET home page. */
router.get('/blog-post/:slug', function (req, res) {
    const slug = req.params.slug;
    let sql = 'SELECT * FROM HtmlSections WHERE Slug = ' + slug + ' ORDER BY ViewIndex';
    var htmlContent = "";
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            htmlContent += row["Html"];
        });
        res.render('blog-post', { htmlContent: htmlContent });
    });
    // close the database connection
    // db.close();

});

module.exports = router;
