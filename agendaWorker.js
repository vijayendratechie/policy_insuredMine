const agenda = require('./config/agenda')
const mongoose = require('mongoose')
require("./config/db")()

const MessagesSource = require('./models/messagesSources')
const MessagesDest = require('./models/messagesDests')

agenda.on('ready', function (job) {
    console.log(' Agenda Worker started')
    agenda.start()
})

agenda.on('success', function (job) {
    console.log(' Agenda Job completed %s : %s : %s', job.attrs._id.toString(), job.attrs.name, JSON.stringify(job.attrs.data))
})

agenda.define('event', (job, done) => {
    console.log(' Agenda Job started %s : %s : %s', job.attrs._id.toString(), job.attrs.name, JSON.stringify(job.attrs.data))
    MessagesSource.findById(JSON.parse(job.attrs.data.sourceMessageId),{_id: 1,message: 1}).exec()
    .then(messageObj => {
        let messageDest = new MessagesDest({message: messageObj['message']})
        messageDest.save()
        .then(() => {
            done()
        })
        .catch(err => {
            console.log("==Error occurred while processing job: ",err);
            done()
        })
    })
    .catch(err => {
        console.log("==Error occurred while processing job: ",err);
        done()
    })
})