const User = require('./../model/userModel');
const catchAsync = require('./catchAsync');
const jwt = require('jsonwebtoken');
const sendWelcomeEmail = require('../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'super-secret-key-for-jwt-that-needs-to-be-long', {
        expiresIn: '90d'
    });
};

exports.signIN = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
        user = await User.create(req.body);
        isNewUser = true;
    }

    if (isNewUser) {
        await sendWelcomeEmail({ email: user.email, name: user.name });
    }

    const token = signToken(user._id);

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
});