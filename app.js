
"use strict"
// requiring packages
const express = require('express')
const shell = require('shelljs')
const https = require('https')
const xml2js = require('xml2js')
const fs = require('fs')

// definitions
const app = express()
const router = express.Router()
const port = 80
const path = __dirname + '/views/'
const parser = new xml2js.Parser()

router.use(function (req,res,next) {
    console.log("/" + req.method);
    next();
})

// getting to the dpxdt directory
shell.cd('../dpxdt')

app.get('/', function (req, res){
    res.sendFile(path + 'index.html')
})

app.get('/submission', function(req, res, next){
    let site = req.param('site')
    let build_id = req.param('build_id')
    site = site.replace(/(^\w+:|^)\/\//, '') // striping out the http(s)
    console.log("site: " + site)
    https.get({
        hostname: site,
        port: 443,
        path: '/page-sitemap.xml',
        agent: false  // create a new agent just for this one request
      }, function(GETRes) {
          console.log('Response code for GET on ' + site + ': ' + GETRes.statusCode)

          if(GETRes.statusCode == 200){ // sitemap was found
            let xml = '';
            GETRes.on('data', function(chunk) { // concatenating all the XML data
                xml += chunk
            })

            GETRes.on('end', function() {
                parser.parseString(xml, function(err, sitemap) {
                    // parsing the live URLs
                    let live_urls = Array()
                    let urlset = sitemap.urlset.url
                    for(var i=0; i<urlset.length; i++){
                        let temp_url = urlset[i].loc[0]
                        temp_url = temp_url.replace(/(^\w+:|^)\/\//, '') // striping out the http(s)
                        live_urls.push(temp_url)
                    }

                    // parsing the staging URLs
                    let staging_urls = Array()
                    for(let i=0; i<live_urls.length; i++){
                        staging_urls.push('staging.' + live_urls[i])
                    }

                    // parsing to a combined array
                    let pages = Array()
                    for(let i=0; i<live_urls.length; i++){
                        let name = live_urls[i].replace(site, '')
                        let temp = {
                            "name": name,
                            "run_url": 'http://' + staging_urls[i],
                            "run_config": {
                                "viewportSize": {
                                    "width": 1024,
                                    "height": 768
                                }
                            },
                            "ref_url": 'http://' + live_urls[i],
                            "ref_config": {
                                "viewportSize": {
                                    "width": 1024,
                                    "height": 768
                                }
                            }
                        }
                        pages.push(temp)
                    }

                    let filePath = __dirname + '/json/' + site + '.json'
                    // checks if the file exists
                    if(fs.existsSync(filePath)){
                        console.log('Existing file found at: ' + filePath)
                        fs.unlinkSync(filePath) // deletes the file
                        console.log('Deleted file: ' + filePath)
                    }
                    fs.writeFileSync(filePath, JSON.stringify(pages)) // writes a new file
                    console.log('File written: ' + filePath)

                    let command = './run_diff_my_urls.sh \
                    --upload_build_id=' + build_id + ' \
                    --upload_release_name="' + new Date().toISOString() + '" \
                    --release_cut_url=localhost:5000 \
                    --tests_json_path=../web-app/json/' + site + '.json'
                    console.log(command)
                    shell.exec(command)

                    res.send('Your site compare was submitted successfully. You can view the results as they come in <a href="http://dpxdt.mio.uwosh.edu:5000">here</a>')
                })
            })

            // res.sendFile(path + 'submission.html')
          } else{ // sitemap was not found
              res.send('Sitemap was not present. Please check the site\'s settings and validate that the sitemap exists.')
          }
          
      }).on('error', function(err) {
          console.log('Error in https.get: ' + err)
      })
})

parser.on('error', function(e){ console.log('Parser error: ' +  e) })

app.use('/', router)
app.listen(port, () => console.log('Example app listening on port ' + port + '!'))