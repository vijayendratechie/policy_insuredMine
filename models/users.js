const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    firstName: {
        type: String
    },
    DOB: {
        type: Date
    },
    address: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    state: {
        type: String
    },
    zipCode: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    gender: {
        type: String
    },
    userType: {
        type: String
    }
})

module.exports = mongoose.model('users', userSchema)