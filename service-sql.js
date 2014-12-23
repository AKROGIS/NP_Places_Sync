// npm install edge
// npm install edge-sql
// Only works in Windows, requires an environment variable EDGE_SQL_CONNECTION_STRING
// in powershell use: $env:EDGE_SQL_CONNECTION_STRING="Data Source=inpakrovmais;Initial Catalog=akr_socio;Integrated Security=True"
// in cmd use set EDGE_SQL_CONNECTION_STRING="Data Source=inpakrovmais;Initial Catalog=akr_socio;Integrated Security=True"

var edge = require('edge');
var http = require('http');

//Service #1 POST request

var insertChangeRequest = edge.func('sql', function () {/*
    INSERT INTO [dbo].[POI_PT_ChangeRequest_For_NPPlaces]
      ([Operation],[Requestor],[FeatureJSON])
      VALUES (@operation, @requestor, @feature)
*/});
/*
insertChangeRequest({ operation: 'delete', requestor: 'test', feature : '{"id":"test"}'}, function (error, result) {
    if (error) throw error;
    console.log(result);
});
*/

//Service #2 GET request/<request_id>

var getRequest = edge.func('sql', function () {/*
    select TOP 1 Action AS status, Comment AS comment from POI_PT_ChangeRequestStatus_For_NPPlaces 
    where RequestId = @requestId
    ORDER BY TimeStamp DESC
*/});

getRequest({ requestId: 9 }, function (error, result) {
    if (error) throw error;
    if (result.length == 0) {
      var error = {'code' : 100, 'message' : 'Request not found'};
      console.log(error);
    } else {
      var answer = { 'status' : (result[0].status ? result[0].status : 'open')}
      if (result[0].comment) {
        answer.comment = result[0].comment
      }
      console.log(answer);
    }
});


//Service #3 GET changes?since=iso-date

var getChanges = edge.func('sql', function () {/*
    select Operation, FeatureId from POI_PT_ChangeLog_For_NPPlaces 
    where TimeStamp > @isoDate
    Order By Operation, TimeStamp
*/});

getChanges({ isoDate: '2015-12-19T21:50:00' }, function (error, result) {
    if (error) throw error;
    var answer = {'deletes':[], 'adds':[], 'updates':[]};
    result.forEach(function(row) {
      if (row.Operation == 'Delete') { answer.deletes.push(row.FeatureId);};
      if (row.Operation == 'Insert') { answer.adds.push(row.FeatureId);};
      if (row.Operation == 'Update') { answer.updates.push(row.FeatureId);};
    });
    console.log(answer);
});

//Service #4 GET feature/<AKR_Feature_Id>
// Use the feature service

var feature = 'CB65B39F-FD14-4EC8-9B99-0BD27813F380'
var feature = '05645C74-A1AC-4249-A68D-BA0ED0D3F256'
var service = 'http://inpakrovmais:6080/arcgis/rest/services/Places/FeatureServer/0/query'
var query = '?where=GlobalID%3D%27%7B' + feature + '%7D%27&outFields=Place_Type%2CPlace_Name&outSR=4326&f=json'
url = service + query

http.get(url, function(res) {
  if (res.statusCode != 200) {
    console.log('Server response ' + res.statusCode + ' ' + res);
  } else {
    res.pipe(process.stdout)
    /*data = JSON.parse(str)
    if (data.features.length == 0) {
      console.log('No feature with that id');
    }*/
  }
}).on('error', function(e) {
  console.log("Got error: " + e.message);
});

/*    data = json.load(response)
    print('uid,lat,lon,type,name')
    for feature in data['features']:
        #handle features without geometry
        try:
            lat = feature['geometry']['y']
            lon = feature['geometry']['x']
        except KeyError:
            lat = None
            lon = None
        name = feature['attributes']['Place_Name']
        kind = feature['attributes']['Place_Type']
        uid = feature['attributes']['OBJECTID']
        print('{0},{1},{2},{3},{4}'.format(uid, lat, lon, kind, name))
*/


