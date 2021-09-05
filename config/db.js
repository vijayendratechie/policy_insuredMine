'use strict'

var mongoose = require('mongoose')

module.exports = function () {
    let dbUrl = 'mongodb+srv://vijju:vijju@cluster0-ex1xq.mongodb.net/policy?retryWrites=true&w=majority&ssl=true'
    let connect = function () {
        let options = {
            keepAlive: 1,
            connectTimeoutMS: 5000,
            readPreference: 'primary',
            useNewUrlParser: true,
            useUnifiedTopology: true
        }

        mongoose.connect(dbUrl, options)
        .catch(err => {
            console.log('connection error:',err)
        })
    }

    mongoose.connection.on('disconnected', connect)
    mongoose.connection.on('reconnected', console.error.bind(console, 'database reconnected'))
    mongoose.connection.on('close', console.error.bind(console, 'database connection closed'))
    mongoose.connection.on('open', function callback() {
        console.log('db connected', dbUrl)
    })

    connect()
}