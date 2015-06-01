var fs = require('fs'),
    xml2js = require('xml2js'),
    config = require('./config'),
    secret = require('./secret'),
    http = require('http');
    text = '',
    command = 'api/capabilities',
    command = 'api/0.6/changesets?closed=true&time=2015-02-24T19:47:00'
    command = 'user/josm'
    
var parser = new xml2js.Parser();

http.get(config.url + command, function(res) {
  //console.log("Got response: " + res.statusCode);
  //console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function(data) {
    text += data;
  });
  res.on('error', console.error);
  res.on('end', function() {
    //console.log(text.length);
    console.log(text);
    parser.parseString(text, function (err, result) {
        console.dir(result);
        //console.dir(result.osm.api[0].version)
        //console.log('Done');
    });    
  });
});

/*
fs.readFile(__dirname + '/foo.xml', function(err, data) {
    parser.parseString(data, function (err, result) {
        console.dir(result);
        console.log('Done');
    });
});
*/