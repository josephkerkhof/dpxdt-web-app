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

router.get('/', function (req, res){
    res.sendFile(path + 'index.html')
})

app.use('/', router)
app.listen(port, () => console.log('Example app listening on port ' + port + '!'))