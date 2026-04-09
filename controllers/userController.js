const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const transporter = require('../config/nodemailer');
const ActivityLog = require('../models/ActivityLog');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger'); // Import the logger

exports.registerGet = (req, res) => {
    res.render('register');
};

exports.userDashboard = (req, res) => {
    res.render('user/dashboard');
};


exports.registerPost = async (req, res) => {
    const { username, email, password, role } = req.body;
    let errors = [];

    if (!username || !email || !password) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', { errors, username, email, password });
    } else {
        try {
            await User.create(username, email, password, role);
            req.flash('success_msg', 'You are now registered and can log in');
            res.redirect('/users/login');
        } catch (err) {
            res.render('register', { errors: [{ msg: 'Email already exists' }], username, email, password });
        }
    }
};

exports.passwordResetRequestGet = (req, res) => {
    res.render('password-reset-request');
};

exports.passwordResetRequestPost = async (req, res) => {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
        return res.render('password-reset-request', { error: 'No account with that email address exists.' });
    }

    const token = await PasswordResetToken.create(email);

    const mailOptions = {
        to: email,
        from: 'simonfranklin80@gmail.com',
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/users/password-reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            console.error('Error sending email:', err);
            return res.render('password-reset-request', { error: 'Error sending email. Please try again later.' });
        }
        req.flash('success_msg', 'An email has been sent to ' + email + ' with further instructions.');
        res.render('password-reset-request', { message: 'An email has been sent to ' + email + ' with further instructions.' });
    });
};

exports.passwordResetGet = (req, res) => {
    const { token } = req.params;
    res.render('password-reset', { token });
};

exports.passwordResetPost = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    let errors = [];

    if (!password) {
        errors.push({ msg: 'Please enter a new password' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        return res.render('password-reset', { errors, token });
    }

    const resetToken = await PasswordResetToken.findByToken(token);
    if (!resetToken) {
        return res.render('password-reset', { errors: [{ msg: 'Password reset token is invalid or has expired' }], token });
    }

    const user = await User.findByEmail(resetToken.email);
    if (!user) {
        return res.render('password-reset', { errors: [{ msg: 'No account with that email address exists' }], token });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await User.updatePassword(user.email, user.password);
    await PasswordResetToken.deleteByEmail(resetToken.email);
    req.flash('success_msg', 'Password has been successfully reset. You can now log in with your new password.');
    res.render('password-reset', { message: 'Password has been successfully reset. You can now log in with your new password.' });
};

exports.loginGet = (req, res) => {
    res.render('login');
};

exports.loginPost = (req, res, next) => {

    passport.authenticate('local', {
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, async () => {

        //await ActivityLog.log(req.user.id, 'Logged in');
        if (req.user.role === 'user') {
            res.redirect('/users/dashboard');
        } else if (req.user.role === 'admin') {
            res.redirect('/users/dashboard');
        }
    });
};
//exports.loginPost = (req, res, next) => {
//    passport.authenticate('local', async (err, user, info) => {
//        try {
//            if (err) {
//                logger.error('Authentication error:', err);
//                return next(err);
//            }

//            if (!user) {
//                logger.warn(`Login failed for email: ${req.body.email}, reason: ${info.message}`);
//                return res.redirect('/blog-post/digital-marketing-guru');
//            }

//            logger.info(`User logged in: ${user.email}`);

//            req.logIn(user, (err) => {
//                if (err) {
//                    logger.error('Error logging in user:', err);
//                    return next(err);
//                }

//                if (user.role === 'user') {
//                    return res.redirect('/blog-post/digital-marketing-guru');
//                } else if (user.role === 'admin') {
//                    return res.redirect('/admin/dashboard');
//                }
//            });
//        } catch (error) {
//            logger.error('Unexpected error during login:', error);
//            return next(error);
//        }
//    })(req, res, next);
//};



exports.profileGet = (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Please log in to view this resource');
        return res.redirect('/users/login');
    }
    res.render('user/profile', { user: req.user });
};

exports.logout = (req, res) => {
    const userId = req.user.id;
    req.logout(err => {
        if (err) {
            return next(err);
        }
        ActivityLog.log(userId, 'Logged out', 'User');
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });
};

exports.getUserProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const stats = await User.getUserStatistics(userId);

        res.render('user/profile', {
            user,
            stats
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};