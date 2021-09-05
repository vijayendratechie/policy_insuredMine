const {parentPort} = require("worker_threads");

//Listen for message from parent
parentPort.on("message", data => {
    if(data.type === "segregateFile") {
        parentPort.postMessage(uploadFile(data.dataArr))
    } else if(data.type === "processPolicy") {
        parentPort.postMessage(processPolicy(data))
    }
})

//Segragate csv file data to different arrays to upload to different collections
function uploadFile(dataArr) {
    let lobArr = [], agentArr = [], userArr = [], carriersArr = []
    let lobNameArr = [], agentNameArr = [], userEmailArr= [], carriersNameArr = []
    for (var i = 0; i < dataArr.length; i++) {
        let obj = dataArr[i]
        
        lobArr.push({ updateOne :
            {
                "filter": {"category_name": obj["category_name"]},
                "update": {},
                "upsert": true
            }            
        })
        lobNameArr.push(obj["category_name"])

        agentArr.push({ updateOne :
            {
                "filter": {"name": obj["agent"]},
                "update": {},
                "upsert": true
            }
        })
        agentNameArr.push(obj["agent"])

        userArr.push({ updateOne :
            {
                "filter": {"email": obj["email"]},
                "update": {$set: {firstName: obj['firstname'], DOB: obj['dob'], address: obj['address'], phoneNumber: obj['phone'], state: obj['state'], zipCode: obj['zip'], gender: obj['gender'],userType: obj['userType']}},
                "upsert": true
            }
        })
        userEmailArr.push(obj['email'])

        carriersArr.push({ updateOne :
            {
                "filter": {"company_name": obj["company_name"]},
                "update": {},
                "upsert": true
            }
        })
        carriersNameArr.push(obj["company_name"])



    }
    return { agentArr, agentNameArr, lobArr, lobNameArr, 
             userArr, userEmailArr, carriersArr, carriersNameArr,
             type: "segregateFile" }
}

//Processing data to insert in collection with other collection references
function processPolicy(data) {
    let agentDetails = JSON.parse(data.agentDetails);
    let lobDetails = JSON.parse(data.lobDetails);
    let userDetails = JSON.parse(data.userDetails); 
    let carrierDetails = JSON.parse(data.carrierDetails)

    let policyArr = [], userAccountArr = [];
    let agentMap = {}, lobMap = {}, userMap = {}, carrierMap = {}

    agentDetails.map(agent => {
        agentMap[agent['name']] = agent['_id']
    })

    lobDetails.map(lob => {
        lobMap[lob['category_name']] = lob['_id']
    })

    userDetails.map(user => {
        userMap[user['email']] = user['_id']
    })

    carrierDetails.map(carrier => {
        carrierMap[carrier['company_name']] = carrier['_id']
    })
    for (var i = 0; i < data.dataArr.length; i++) {
        let obj = data.dataArr[i]

        userAccountArr.push({ updateOne :
            {
                "filter": {"name": obj["account_name"]},
                "update": {$set: {userId: userMap[obj['email']]}},
                "upsert": true
            }
        })
        policyArr.push({ updateOne :
            {
                "filter": {"policyNumber": obj["policy_number"]},
                "update": {$set: {startDate: obj["policy_start_date"], endDate: obj["policy_end_date"], policyCategoryId: lobMap[obj['category_name']], policyCarrierId: carrierMap[obj['company_name']], userId: userMap[obj['email']]}},
                "upsert": true
            }
        })
    }

    return {type: "processPolicy", userAccountArr, policyArr}
}