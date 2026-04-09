exports.getAddUser = async (req, res) => {
    const passport = require('passport');
    const User = require('../models/User')

    const { Username, Email, Password, DateCreated, DateModified } = req.body;
    let errors = [];

    if (!Username || !Email || !Password) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', { errors, Username, Email, Password, DateCreated, DateModified });
    } else {
        try {
            await User.create(username, Email, Password);
            res.redirect('/users/login');
        } catch (err) {
            res.render('register', { errors: [{ msg: 'Email already exists' }], Username, Email, Password });
        }
    }

};