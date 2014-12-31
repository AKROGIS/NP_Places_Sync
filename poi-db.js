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
  var data
  try {
    data = JSON.parse(request)
  }
  catch (e) {
    if (e instanceof SyntaxError) {
      return callback({errorCode : 200, errorMessage : 'Not valid JSON'});
    } else {
      var msg = 'Unexpected error processing feature service response as JSON: ' + e.name + ' - ' + e.message;
      console.log(msg);
      return callback({errorCode : 500, errorMessage : msg});
    }
  }
  if (!(typeof data === 'object')) {
    return callback({errorCode : 200, errorMessage : 'Not a JSON object'});
  }
  if (data.requestor === undefined) {
    return callback({errorCode : 200, errorMessage : '"requestor" missing from request'});
  }
  if (data.operation === undefined) {
    return callback({errorCode : 200, errorMessage : '"operation" missing from request'});
  }
  if (data.feature === undefined) {
    return callback({errorCode : 200, errorMessage : '"feature" missing from request'});
  }
  if (!data.requestor) {
    return callback({errorCode : 201, errorMessage : 'Value of "requestor" is empty'});
  }
  if (!data.operation) {
    return callback({errorCode : 201, errorMessage : 'Value of "operation" is empty'});
  }
  if (!data.feature) {
    return callback({errorCode : 201, errorMessage : 'Value of "feature" is empty'});
  }
  var requestor = (typeof data.requestor === 'number') ? data.requestor.toString() : data.requestor;
  if (typeof requestor !== 'string') {
    return callback({errorCode : 202, errorMessage : 'Value of "requestor" is not valid (must be a string or number)'});
  }
  var operation = data.operation;
  if (typeof operation !== 'string') {
    return callback({errorCode : 202, errorMessage : 'Value of "operation" is not valid (must be a string)'});
  }
  operation = operation.toLowerCase();
  var validOperations = ['add', 'delete', 'update', 'cancel'];
  if (validOperations.indexOf(operation) == -1) {
    return callback({errorCode : 202, errorMessage : 'Value of "operation" is not valid must be one of "add", "delete", "update", "cancel"'});
  }
  var feature = data.feature;
  if (typeof feature !== 'object') {
    return callback({errorCode : 202, errorMessage : 'Value of "feature" is not an object'});
  }
  //All operations require feature to have an id properties
  if (feature.id === undefined || !feature.id) {
    return callback({errorCode : 202, errorMessage : '"feature" provided does not have an "id"'});
  }
  //Add operation requires feature to have `name`, `type`, and `geometry` properties
  if (operation == 'add') {
    if (feature.name === undefined || !feature.name) {
      return callback({errorCode : 202, errorMessage : 'When adding a "feature" it must have a "name"'});
    }
    if (feature.type === undefined || !feature.type) {
      return callback({errorCode : 202, errorMessage : 'When adding a "feature" it must have a "type"'});
    }
    if (feature.geometry === undefined || typeof feature.geometry != 'object') {
      return callback({errorCode : 202, errorMessage : 'When adding a feature it must have a "geometry" object'});
    }
  }
  //Update operation requires feature to have one of `name`, `type`, or `geometry` properties
  if (operation == 'update') {
    if ((feature.name === undefined || !feature.name) &&
        (feature.type === undefined || !feature.type) &&
        (feature.geometry === undefined || typeof feature.geometry != 'object')) {
      return callback({errorCode : 202, errorMessage : 'When updating a feature it must have a "name" or a "type" or a "geometry" object'});
    }
  }
  
	// Submit the request to the database
  //   A simple insert will not work since we need to return the auto generated request id
  //   I use a stored procedure that returns a record set (of 1) with the 'NewRequestId'
  var sqlInsertChangeRequest = edge.func('sql', function () {/*
    EXEC [dbo].[POI_PT_ChangeRequest_For_NPPlaces_Insert]
  */});

  sqlInsertChangeRequest({ operation: operation, requestor: requestor, feature : JSON.stringify(feature)}, function (error, result) {
		if (error) {
			return callback({errorCode : 300, errorMessage : error.message});
		}
		if (result.length == 0) {
			return callback({errorCode : 300, errorMessage : 'Insert failed to return an id; no error message provided'});
		} else {
		  callback (null, { 'id' : result[0].NewRequestId });
		}
	});
}
