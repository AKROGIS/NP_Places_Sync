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

	// Query ArcGIS Server feature service
	callback({errorCode : 300, errorMessage : 'No database connection'});
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
