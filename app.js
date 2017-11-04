
"use strict"
// requiring packages
const express = require('express')
const shell = require('shelljs')

// definitions
const app = express()
const router = express.Router()
const port = 80
const path = __dirname + '/views/'

router.use(function (req,res,next) {
    console.log("/" + req.method);
    next();
})

// getting to the dpxdt directory
shell.cd('../dpxdt')

app.get('/', function (req, res){
    res.sendFile(path + 'index.html')
})

app.get('/submission', function(req, res){
    let liveSite = req.param('liveSite')
    let stagingSite = req.param('stagingSite')
    console.log("liveSite: " + liveSite)
    console.log("stagingSite: " + stagingSite)
    res.send()
})

app.use('/', router)
app.listen(port, () => console.log('Example app listening on port ' + port + '!'))