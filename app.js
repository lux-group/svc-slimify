var express = require('express')
var bodyParser = require('body-parser')
var routes = require('./src/routes')
var port = process.env.PORT || 8080

var app = express()

app.use(bodyParser.urlencoded({ extended: false }));
routes.mount(app)

app.listen(port, function () {
  console.log(`App listening on port ${port}!`)
})

module.exports = app
