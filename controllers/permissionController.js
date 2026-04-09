const Permission = require('../models/Permission');

exports.getPermissions = async (req, res) => {
    try {
        const roles = await Permission.getRoles();
        let page = 1;
        /*const permissions = await Permission.getPermissions(page);*/
        const permissionsLookup = await Permission.getPermissionsLookup();
        res.render('user/permissions', { roles/*, permissions*/, permissionsLookup, title: 'Manage permissions' });
    } catch (err) {
        Permission.logError(err);
        req.flash('error_msg', 'Error retrieving permissions');
        //res.redirect('/admin/dashboard');
        // Emit flash message to connected clients
        const flashMessage = req.flash('error_msg');
        req.io.emit('flash', { message: flashMessage, isError: true } );  // Push flash message via Socket.IO
    }
};

exports.createPermissionJSON = async (req, res) => {
    const { name } = req.body;
    try {
        await Permission.createPermission(name);
        req.flash('success_msg', `Permission: ${name} created successfully`);
        // Emit flash message to connected clients
        const flashMessage = req.flash('success_msg');
        req.io.emit('flash', { message: flashMessage, isError: false });  // Push flash message via Socket.IO
        res.json({ message: 'Permission created successfully', isError: false});
    } catch (err) {
        //Permission.logError(err);
        req.flash('error_msg', `Error creating permission: (${err.message})`);

        res.json({ message: 'Error creating permission', isError: true });

        // Emit flash message to connected clients
        const flashMessage = req.flash('error_msg');
        req.io.emit('flash', { message: flashMessage, isError: true });  // Push flash message via Socket.IO
    }
};

exports.createPermission = async (req, res) => {
    const { name } = req.body;
    try {
        await Permission.createPermission(name);
        req.flash('success_msg', `Permission: ${name} created successfully`);
        //res.redirect('/admin/permissions');
        // Emit flash message to connected clients
        const flashMessage = req.flash('success_msg');
        req.io.emit('flash', { message: flashMessage, isError: false });  // Push flash message via Socket.IO
    } catch (err) {
        req.flash('error_msg', `Error creating permission: ${name} (${err.message})`);
        //res.redirect('/admin/permissions');
        // Emit flash message to connected clients
        const flashMessage = req.flash('error_msg');
        req.io.emit('flash', { message: flashMessage, isError: true });  // Push flash message via Socket.IO
    }
};

exports.assignPermission = async (req, res) => {
    const { role, permissionName } = req.body;
    try {
        await Permission.assignPermissionToRole(role, permissionName);
        req.flash('success_msg', `Permission ${permissionName} assigned to ${role} successfully`);
        //res.redirect('/admin/permissions');
        // Emit flash message to connected clients
        const flashMessage = req.flash('success_msg');
        req.io.emit('flash', { message: flashMessage, isError: false });  // Push flash message via Socket.IO
    } catch (err) {
        req.flash('error_msg', `Error assigning permission: ${permissionName} to role: ${role} (${err.message})`);
        //res.redirect('/admin/permissions');
        // Emit flash message to connected clients
        const flashMessage = req.flash('error_msg');
        req.io.emit('flash', { message: flashMessage, isError: true });  // Push flash message via Socket.IO
    }
};

exports.getRolePermissions = async (req, res) => {
    try {
        const { page, limit, sortField, sortOrder, role, permission } = req.query;
        const filter = { role, permission };
        const rolePermissions = await Permission.getRolePermissions({ page, limit, sortField, sortOrder, filter });
        const totalRolePermissions = await Permission.getRolePermissionsCount(filter);
        const totalPages = Math.ceil(totalRolePermissions / limit);
        res.json({ rolePermissions, totalRolePermissions, page, totalPages });
    } catch (err) {
        Permission.logError(err);
        req.flash('error_msg', `Error retrieving role permissions`);
        res.status(500).json({ error: 'Error retrieving role permissions' });
        // Emit flash message to connected clients
        const flashMessage = req.flash('error_msg');
        req.io.emit('flash', { message: flashMessage, isError: true });  // Push flash message via Socket.IO
    }
};

exports.getFilteredPermissions = async (req, res) => {
    try {
        const { page, limit, sortField, sortOrder, name } = req.query;
        const filter = { name };
        const permissions = await Permission.getPermissions({ page, limit, sortField, sortOrder, filter });
        const totalPermissions = await Permission.getPermissionsCount(filter);
        const totalPages = Math.ceil(totalPermissions / limit);
        res.json({ permissions, page, totalPages, totalPermissions });
    } catch (err) {
        Permission.logError(err);
        req.flash('error_msg', `Error retrieving permissions`);
        res.status(500).json({ error: 'Error retrieving permissions' });
        // Emit flash message to connected clients
        const flashMessage = req.flash('error_msg');
        req.io.emit('flash', { message: flashMessage, isError: true });  // Push flash message via Socket.IO
    }
};





