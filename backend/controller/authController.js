const User = require('./../model/userModel');

exports.signIN = async (req, res, next) => {
    try {
    const newUser = await User.create(req.body);
    console.log('User created successfully:', newUser);
    res.status(201).json({
        status : 'success',
        data : {
            user : newUser
        }
    });
 } catch(err) {
    console.error('Error creating user:', err);
    res.status(400).json({
        status : 'failed',
        message : err.message
    });
   }
}