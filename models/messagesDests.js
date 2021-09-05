const mongoose = require('mongoose')

const messagesSchema = mongoose.Schema({
    message: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('messagesDests', messagesSchema)