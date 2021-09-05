const pm2 = require('pm2')

//Fucntion to check process cpu utilization with 5 seconds interval.
//Restart server if cpu utilization exceeds 70%
setInterval(function () {
    pm2.connect(function(err) {
        if (err) {
          console.error(err)
          process.exit(2)
        }
      
        pm2.list((err, list) => {
          if(err) {
              console.log("==Error occurred while getting process list")
              process.exit(2)
          } else {
              if(!Array.isArray(list) || !list.length) {
                  console.log("==No process running")
                  process.exit(2)       
              } else {
                  let presentFlag = false;
                  for(let i=0;i<list.length;i++) {
                      if(list[i]['name'] == 'app') {
                        console.log("===cpu utilization: ",list[i]['monit']['cpu'])
                        if(list[i]['monit']['cpu'] > 70) {
                            console.log("===RESTARTING PROCESS===")
                            pm2.restart('app', function callback(err, data) {
                                if(err) {
                                    console.log("==Error occurred while restarting server")
                                } else {
                                    console.log("====PROCESS RESTARTED====")
                                }
                            })
                        }
                        presentFlag = true
                        break;
                      }
                  }
      
                  if(!presentFlag) {
                      console.log("==Required process not found")
                      process.exit(2)     
                  }
             }
          }
        })
    })
},5000)