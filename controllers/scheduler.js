const express = require('express')
const router = express.Router()

const agenda = require('../config/agenda')

const MessagesSource = require("../models/messagesSources")

//Create a job which will trigger at the given date
async function createJob(data) {
    try {
        let job = agenda.create('event', data)
        job.schedule(data.scheduledDate)
        await job.save()
        return true
    } catch {
        return false
    }    
}

//Schedule Event
router.post("/scheduleEvent", function(req,res) {
    let scheduledDate;
    console.log("req: "+JSON.stringify(req.body))
    if(!req.body|| !req.body.message) {
        res.status(404).send({status: "Error", message: "Please provide message"})
        return
    }

    try {
        scheduledDate = req.body.date ? new Date(req.body.date) : new Date()
    } catch(err) {
        console.log("===Invalid Date: ",err)
        res.status(404).send({status: "Error", message: "Invalid Date"})
    }

    let messageSource = new MessagesSource({message: req.body.message})

    messageSource.save()
    .then((message) => {
        return createJob({sourceMessageId: JSON.stringify(message['_id']), scheduledDate: scheduledDate})
    })
    .then((flag) => {
        if(flag) {
            res.status(200).send({status: "Success", message: "Event scheduled successfully"})
        } else {
            res.status(404).send({status: "Error", message: "Something went wrong."})
        }
    })
    .catch(err => {
        console.log("===Error occured while creating job ",err)
        res.status(404).send({status: "Error", message: "Something went wrong."})
    })
})

module.exports = router