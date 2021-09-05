const mongoose = require('mongoose')

const agentSchema = mongoose.Schema({
    name: {
        type: String
    }
})

module.exports = mongoose.model('agents', agentSchema)