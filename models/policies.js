const mongoose = require('mongoose')

const policySchema = mongoose.Schema({
    policyNumber: {
        type: String
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    policyCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lobs',
    },
    policyCarrierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'carriers',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    }
})

module.exports = mongoose.model('policies', policySchema)
