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
        type : String,
        required : [true, 'Please enter your Date of Birth in dd-mm-yy format']
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;