
"use strict"
// requiring packages
const express = require('express')
const shell = require('shelljs')
const https = require('https')
const xml2js = require('xml2js')
const parser = new xml2js.Parser()

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
    let liveSite = req.param('site')
    liveSite = liveSite.replace(/(^\w+:|^)\/\//, '') // striping out the http(s)
    let stagingSite = 'staging.' + liveSite
    console.log("liveSite: " + liveSite)
    console.log("stagingSite: " + stagingSite)
    https.get({
        hostname: liveSite,
        port: 443,
        path: '/page-sitemap.xml',
        agent: false  // create a new agent just for this one request
      }, function(GETRes) {
          console.log('Response code for GET on ' + liveSite + ': ' + GETRes.statusCode)

          if(GETRes.statusCode == 200){ // sitemap was found
            let xml = '';
            GETRes.on('data', function(chunk) { // concatenating all the XML data
                xml += chunk
            })

            GETRes.on('end', function() {
                parser.parseString(xml, function(err, sitemap) {
                    res.send('JS object of response: ' + JSON.stringify(sitemap))
                })
            })

            // res.sendFile(path + 'submission.html')
          } else{ // sitemap was not found
              res.send('Sitemap was not present. Please check the site settings and validate that the sitemap exists.')
          }
          
      }).on('error', function(err) {
          console.log('Error in https.get: ' + err)
      })
})

parser.on('error', function(e){ console.log('Parser error: ' +  e) })

app.use('/', router)
app.listen(port, () => console.log('Example app listening on port ' + port + '!'))