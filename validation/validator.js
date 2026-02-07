const { check, validationResult } = require('express-validator');

exports.validateCommentOrReply = [
    check('Email').isEmail().normalizeEmail(),
    check('Text').isLength({ min: 1 }),
    check('Author').isLength({ min: 1 }),
    // Add more validation rules as needed
];