var http = require('http');

var api = 'http://inpakrovmais.nps.doi.net:8081/poi'
var changes = 'http://inpakrovmais.nps.doi.net:8081/poi/changes?since=2014-12-25'
var feature = 'http://inpakrovmais.nps.doi.net:8081/poi/feature/CB65B39F-FD14-4EC8-9B99-0BD27813F380'
var status = 'http://inpakrovmais.nps.doi.net:8081/poi/change/request/3/status'

function prettyPrint(url,callback) {
  http.get(url, function(res) {
    if (res.statusCode != 200) {
      console.log('Server response ' + res.statusCode + ' ' + res);
    } else {
      var str = "";
      res.setEncoding('utf8');
      res.on('data', function(data) { str += data; });
      res.on('end', function() {
        //pretty print str as JSON;
        console.log(JSON.stringify(JSON.parse(str),null,'  '));
        if (callback) {callback()};
      });
    }
  });
}

console.log('\nGET ' + api + '\nResponse:');
prettyPrint(api, function () {
  console.log('\nGET ' + changes + '\nResponse:');
  prettyPrint(changes, function() {
    console.log('\nGET ' + feature + '\nResponse:');
    prettyPrint(feature, function() {
      console.log('\nGET ' + status + '\nResponse:');
      prettyPrint(status, null);
    });
  });
});
