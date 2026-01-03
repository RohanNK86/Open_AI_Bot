const User = require('./../model/userModel');
const catchAsync = require('./catchAsync');

exports.signIN = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);
    console.log('User created successfully:', newUser);
    res.status(201).json({
        status: 'success',
        data: {
            user: newUser
        }
    });
});