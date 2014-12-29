var poi = exports
//All callbacks should expect error and results parameters, typical of node.js 
poi.getChanges = function (timestamp, callback) {
	callback({errorCode : 300, errorMessage : 'No database connection'});
}

poi.getRequest = function (requestId, callback) {
	callback({errorCode : 300, errorMessage : 'No database connection'});
}

poi.getFeature = function (featureId, callback) {
	callback({errorCode : 300, errorMessage : 'No database connection'});
}

poi.postFeature = function (feature, callback) {
	callback({errorCode : 300, errorMessage : 'No database connection'});
}
