const express = require('express');
const router = express.Router();

// Route to retrieve users
router.get('/register', (req, res) => res.render('register'));

router.post('/addUser', async (req, res) => {
    const { Username, Email, Password, DateCreated, DateModified } = req.body;
    let errors = [];

    if (!Username || !Email || !Password) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', { errors, Username, Email, Password, DateCreated, DateModified  });
    } else {
        try {
            await User.create(username, Email, Password);
            res.redirect('/users/login');
        } catch (err) {
            res.render('register', { errors: [{ msg: 'Email already exists' }], Username, Email, Password });
        }
    }
});

// Login
router.get('/login', (req, res) => res.render('login'));

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/users/profile',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Profile
router.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }
    res.render('profile', { user: req.user });
});


module.exports = router;