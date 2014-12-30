var edge = require('edge');
var http = require('http');

//All callbacks should expect error and results parameters, typical of node.js
var poi = exports

poi.getChanges = function (timestamp, callback) {
	if (!timestamp) {
		timestamp = '2014-01-01'
	}

	var sqlGetChanges = edge.func('sql', function () {/*
    select Operation, FeatureId from POI_PT_ChangeLog_For_NPPlaces 
    where TimeStamp > @isoDate
    Order By Operation, TimeStamp
	*/});

	sqlGetChanges({ isoDate: timestamp }, function (error, result) {
		if (error) {
			return callback({errorCode : 300, errorMessage : error.message});
		}
    var answer = {'deletes':[], 'adds':[], 'updates':[]};
    result.forEach(function(row) {
      if (row.Operation == 'Delete') { answer.deletes.push(row.FeatureId);};
      if (row.Operation == 'Insert') { answer.adds.push(row.FeatureId);};
      if (row.Operation == 'Update') { answer.updates.push(row.FeatureId);};
    });
    callback (null, answer);
	});
}

poi.getFeature = function (featureId, callback) {

  // test: featureId = 'CB65B39F-FD14-4EC8-9B99-0BD27813F380'
  
  //Sanitize featureId to preclude URL corruption
  if (!featureId.match(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/)) {
    //console.log('Invalid format for featureId: ' + featureId);
    return 	callback(null,null); //return an empty result => 404 error
  }
	// Query ArcGIS Server feature service
  var service = 'http://inpakrovmais:6080/arcgis/rest/services/Places/FeatureServer/0/query'
  var query = '?where=GlobalID%3D%27%7B' + featureId + '%7D%27&outFields=Place_Type%2CPlace_Name%2CSource_Database_ID_Value&outSR=4326&f=json'
  url = service + query

  http.get(url, function(res) {
    if (res.statusCode != 200) {
      console.log('Server response ' + res.statusCode + ' ' + res);
      return callback({errorCode : 300, errorMessage : 'Failure communicating with feature service (http status code:'+res.statusCode+')'});
    } else {
      var str = "";
      res.setEncoding('utf8');
      res.on('data', function(data) { str += data; });
      res.on('end', function() {
        //console.log(str);
        try {
          data = JSON.parse(str)
        }
        catch (e) {
          if (e instanceof SyntaxError) {
            return callback({errorCode : 300, errorMessage : 'Malformed response (not valid JSON) from feature Service'});
          } else {
            var msg = 'Unexpected error processing feature service response as JSON: ' + e.name + ' - ' + e.message;
            console.log(msg);
            return callback({errorCode : 300, errorMessage : msg});
          }
        }
        if (!data || !data.features) {
          msg = 'Response from feature server was unexpected: ' + str;
          console.log(msg);
          return callback({errorCode : 300, errorMessage : msg});
        }
        if (data.features.length == 0) {
          return callback(null,null);
        }
        answer = {
          'id'      : data.features[0].attributes.Source_Database_ID_Value,
          'name'    : data.features[0].attributes.Place_Name,
          'type'    : data.features[0].attributes.Place_Type,
          'geometry': data.features[0].geometry
        };
        callback (null, answer);      
      });
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    return callback({errorCode : 300, errorMessage : 'Failure communicating with feature service (http error message:' + e.message+')'});
  });
}

poi.getRequest = function (requestId, callback) {

	var sqlGetRequest = edge.func('sql', function () {/*
		select TOP 1 Action AS status, Comment AS comment from POI_PT_ChangeRequestStatus_For_NPPlaces 
		where RequestId = @requestId
		ORDER BY TimeStamp DESC
	*/});

	sqlGetRequest({ requestId : requestId }, function (error, result) {
		if (error) {
			return callback({errorCode : 300, errorMessage : error.message});
		}
		if (result.length == 0) {
		    callback (null, null);
		} else {
		  var answer = { 'status' : (result[0].status ? result[0].status : 'open')}
		  if (result[0].comment) {
			answer.comment = result[0].comment
		  }
		  callback (null, answer);
		}
	});
}

poi.postRequest = function (request, callback) {
	// Validate the request; returning appropriate error messages if necessary
	// Submit the request to the database
	callback({errorCode : 300, errorMessage : 'No database connection'});
}
