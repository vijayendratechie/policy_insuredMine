const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

require("./config/db")()

var app = express()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // support json encoded bodies

const policyController = require('./controllers/policy')
const schedulerController = require('./controllers/scheduler')

mongoose.connection.on('open', function callback() {
    app.use('/policy', policyController)
    app.use('/scheduler', schedulerController)
})

const port=process.env.PORT || 3000
app.listen(port,function()
{
	console.log(`listen to port ${port}`);
});