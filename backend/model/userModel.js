const mongoose = require('mongoose')
const validator = require('validator')

const userSchema = mongoose.Schema({
    name : {
        type : String,
        required : [true, 'Please enter your Name']
    },
    email : {
        type : String,
        validate : [validator.isEmail, 'Enter a valid  email'],
        unique : true
    },
    DOB : {
        type : String
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;