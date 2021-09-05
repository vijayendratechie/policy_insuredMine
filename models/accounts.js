const mongoose = require('mongoose')

const accountSchema = mongoose.Schema({
    name: {
        type: String
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
})

module.exports = mongoose.model('accounts', accountSchema)