var http = require('http');

var options = {
  hostname: 'localhost',
  port: 8081,
  path: '/poi/request',
  method: 'POST'
};

var task = {
  operation : 'delete',
  requestor : 'me',
  feature : {
    id : 13 /*,
    name : 'home',
    type : 'house',
    geometry : {
      x : -145.123,
      y : 61.456
    } */
  }
}

var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  //console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
var body = JSON.stringify(task)
//console.log(body)
req.write(body);
req.end();