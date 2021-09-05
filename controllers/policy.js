const express = require('express')
const router = express.Router()
const multer = require('multer')
const csv = require('csvtojson');
const {Worker} = require("worker_threads");

//Importing models
const Users = require("../models/users")
const Agents = require("../models/agents");
const Lob = require("../models/lobs");
const Carriers = require("../models/carriers");
const Policies = require("../models/policies");
const Accounts = require("../models/accounts");
const { aggregate } = require('../models/users');

const upload = multer({ storage: multer.memoryStorage() })

//Uploading csv file to db
router.post("/uploadData", upload.single("file"), function(req,res) {
    if(!req.file.mimetype.includes('csv')) {
        res.status(400).send({status: "Error", message: "Please upload csv file"})
    }
    
    csv().fromString(req.file.buffer.toString())
    .then(dataArr => {

        //Create new worker
        const worker = new Worker("./worker.js");

        //Sending csv file data to worker for processing
        worker.postMessage({dataArr: dataArr, type: "segregateFile"})

        //Listen for message from worker
        worker.on("message", segregatedData => {
            if(segregatedData['type'] === "segregateFile") {
                //Updating different db collections with segregated data received from worker
                let agents$ = Agents.bulkWrite(segregatedData.agentArr,{ ordered: false})
                let lob$ = Lob.bulkWrite(segregatedData.lobArr,{ ordered: false})
                let users$ = Users.bulkWrite(segregatedData.userArr,{ ordered: false})
                let carriers$ = Carriers.bulkWrite(segregatedData.carriersArr,{ ordered: false})
    
                Promise.all([agents$, lob$, users$, carriers$]).then(() => {
                    //Getting doc mongo references(Mongo Ids)
                    let agentDetails$ = Agents.find({name: {$in: segregatedData.agentNameArr}},{name: 1}).exec()
                    let lobDetails$ = Lob.find({name: {$in: segregatedData.lobNameArr}},{_id: 1, category_name: 1}).exec()
                    let userDetails$ = Users.find({email: {$in: segregatedData.userEmailArr}},{_id: 1, email: 1}).exec()
                    let carrierDetails$ = Carriers.find({name: {$in: segregatedData.carriersNameArr}},{_id: 1, company_name: 1}).exec()
    
                    Promise.all([agentDetails$, lobDetails$, userDetails$, carrierDetails$]).then(([agentDetails, lobDetails, userDetails, carrierDetails]) => {
                        let runObj = {
                            type: "processPolicy", dataArr: dataArr,
                            agentDetails: JSON.stringify(agentDetails), lobDetails: JSON.stringify(lobDetails),
                            userDetails: JSON.stringify(userDetails), carrierDetails: JSON.stringify(carrierDetails)
                        }
                        //Passing data to worker for processing
                        worker.postMessage(runObj)
                    })
                    .catch(err => {
                        worker.terminate();
                        res.status(400).send({status: "Error", message: `Something went wrong. Please try again. Err: ${err}`})
                    })
                })
                .catch(err => {
                    worker.terminate();
                    res.status(400).send({status: "Error", message: `Something went wrong. Please try again. Err: ${err}`})
                })
            } else if(segregatedData['type'] === "processPolicy") {
                //Updating db collection with data received from worker
                let policy$ = Policies.bulkWrite(segregatedData.policyArr,{ ordered: false})
                let userAccount$ = Accounts.bulkWrite(segregatedData.userAccountArr,{ ordered: false})

                Promise.all([policy$, userAccount$]).then(() => {
                    worker.terminate();
                    res.status(200).send({status: "Success", message: "Sheet inserted successfully in db"})
                })
                .catch(err => {
                    worker.terminate();
                    res.status(400).send({status: "Error", message: `Something went wrong. Please try again. Err: ${err}`})
                })
            }
        });

        //Listen for error from worker
        worker.on("error", error => {
            console.log(error);
            res.status(400).send({status: "Error", message: `Something went wrong. Please try again. Err: ${err}`})
        });

        //Listen for worker exist event
        worker.on("exit", exitCode => {
            console.log("Worker Terminated: ",exitCode);
        })
    
    })
})

//Get user's policy details searched by user's email
router.get("/search", function(req,res) {
    let email = req.query.email
    Users.findOne({email},{_id: 1}).exec()
    .then(user => {
        if(!user) {
            res.status(404).send({status: "Error", message: "User not found"})
        } else {
            Policies.aggregate([
                {
                    "$match": {
                        "userId": user["_id"]
                    }
                },
                { 
                    "$lookup": { 
                        "from": 'users', 
                        "localField": 'userId', 
                        "foreignField": '_id', 
                        "as": 'user' 
                    } 
                },
                { 
                    "$lookup": { 
                        "from": 'carriers', 
                        "localField": 'policyCarrierId', 
                        "foreignField": '_id', 
                        "as": 'carrier' 
                    } 
                },
                { 
                    "$lookup": { 
                        "from": 'lobs', 
                        "localField": 'policyCategoryId', 
                        "foreignField": '_id', 
                        "as": 'category' 
                    } 
                },
                {
                    "$unwind": '$user'
                },
                {
                    "$unwind": '$carrier'
                },
                {
                    "$unwind": '$category'
                }
            ]).exec()
            .then(userPolicy => {
                res.status(200).send({status: "Success", userPolicies: userPolicy || []})
            })
            .catch(err => {
                res.status(400).send({status: "Error", message: `Something went wrong. Please try again. Err: ${err}`})
            })
        }
    })
    .catch(err => {
        res.status(400).send({status: "Error", message: `Something went wrong. Please try again. Err: ${err}`})
    })
})

router.get("/allUsersPolicies", function(req, res) {
    Policies.aggregate([
        { 
            "$lookup": { 
                "from": 'users', 
                "localField": 'userId', 
                "foreignField": '_id', 
                "as": 'user' 
            } 
        },
        { 
            "$lookup": { 
                "from": 'carriers', 
                "localField": 'policyCarrierId', 
                "foreignField": '_id', 
                "as": 'carrier' 
            } 
        },
        { 
            "$lookup": { 
                "from": 'lobs', 
                "localField": 'policyCategoryId', 
                "foreignField": '_id', 
                "as": 'category' 
            } 
        },
        {
            "$unwind": '$user'
        },
        {
            "$unwind": '$carrier'
        },
        {
            "$unwind": '$category'
        },
        {
            $group : { _id : "$userId", policies: { $push: "$$ROOT" } }
        },
        {
            "$addFields": {
             "userEmail" : {$arrayElemAt: ["$policies.user.email", 0]}
            }  
        }
    ]).exec()
    .then(aggregatedPolicy => {
        res.status(200).send({status: "Success", aggregatedPolicy: aggregatedPolicy})
    })
    .catch(err => {
        res.status(400).send({status: "Error", message: `Something went wrong. Please try again. Err: ${err}`})
    })
})

//Route to test server restart code when cpu utilization exceeds 70%
router.get("/testcpu", function(req, res) {
    let fib = getFib(50)
    res.status(200).send({"status": "Success", data: fib})
})

function getFib(num) {
    if (num === 0) {
      return 0;
    }
    else if (num === 1) {
      return 1;
    }
    else {
      return getFib(num - 1) + getFib(num - 2);
    }
}

module.exports = router