const Permission = require('../models/Permission');

module.exports.ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/users/login');
};

module.exports.ensureRole = (role) => {
    return (req, res, next) => {
        if (req.user.role === role) {
            return next();
        }
        req.flash('error_msg', 'You do not have permission to view that resource');
        res.redirect('/admin/dashboard');
    };
};

module.exports.ensureRoles = (roles) => {
    return (req, res, next) => {
        if (roles.includes(req.user.role)) {
            return next();
        }
        req.flash('error_msg', 'You do not have permission to view that resource');
        res.redirect('/admin/dashboard');
    };
};

module.exports.ensurePermission = (permission) => {
    return async (req, res, next) => {
        try {
            const hasPermission = await Permission.hasPermission(req.user.role, permission);
            if (hasPermission) {
                return next();
            } else {
                req.flash('error_msg', 'You do not have permission to perform that action');
                res.redirect('/admin/dashboard');
            }
        } catch (err) {
            Permission.logError(err);
            req.flash('error_msg', 'Error checking permissions');
            res.redirect('/admin/dashboard');
        }
    };
};



