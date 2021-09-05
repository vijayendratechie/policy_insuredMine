const mongoose = require('mongoose')

const carrierSchema = mongoose.Schema({
    company_name: {
        type: String
    }
})

module.exports = mongoose.model('carriers', carrierSchema)