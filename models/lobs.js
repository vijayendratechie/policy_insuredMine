const mongoose = require('mongoose')

const lobSchema = mongoose.Schema({
    category_name: {
        type: String
    }
})

module.exports = mongoose.model('lobs', lobSchema)