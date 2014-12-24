//"use strict";
const port = parseInt(process.argv[2], 10) || 8081;
const Http = require('http');
const Url = require('url');

const dateTime = {
	'description' : 'A date/time.  Must be in RFC2822 or ISO 8601 format',
	'required' : false,
	'defaultValue' : null,
	'validator' : function(param) {
		return isNaN(new Date(param)) ? 'Not a valid date' : '' ;
	}
};

const api = {
	'GET' : {
		'/poi/changes' : {
			'description' : 'Returns a JSON object of three lists containing feature ids of all adds, deletes and updates since a date',
			'parameters' : {
				'since' : dateTime
			},
			'code' : function (options, response) {
				time = new Date(options['since']);
				returnNotImplemented(response);
			}
		},				
		'/poi/feature/<id>' : {
			'description' : 'Provides a JSON object describing a specific feature',
			'parameters' : {},
			'code' : function (options, response) {
				//returnJSON(response, {
				//	'unixtime' : Date.parse(options['iso'])
				//});
				returnNotImplemented(response);
			}
		},
		'/poi/request/<id>' : {
			'description' : 'Provides a JSON object describing a specific request',
			'parameters' : {},
			'code' : function (options, response) {
				returnNotImplemented(response);
			}
		},
		'/poi' : {
			'description' : 'Provides a JSON object describing the REST API for AKR Place of Interest',
			'parameters' : {},
			'code' : function (options, response) {
				returnJSON(response, api);
			}
		}
	},
	'POST' : {
		'poi/request' : {
			'description' : 'Submit a new request',
			'parameters' : {},
			'code' : function (options, response) {
				returnNotImplemented(response);
			}
		}
	}
};

function returnError(response, number, msg) {
    var errors = {
        '100' : 'Request did not contain a required parameter',
        '101' : 'Invalid parameter',
        '200' : 'Missing Request Key',
        '201' : 'Missing Request Value',
        '202' : 'Invalid Request Value',
        '300' : 'Database Error'
    }
    error = errors[number] || 'unknown'
    status = (300 <= number || error === 'unknown') ? 500 : 403
	response.writeHead(status, { 'Content-Type': 'application/json' })
	response.end(JSON.stringify({
		'code' : number,
		'error' : error,
		'msg' : msg
	}));
};

function returnJSON(response, obj) {
	response.writeHead(200, { 'Content-Type': 'application/json' })
	return response.end(JSON.stringify(obj));
}

function returnNotFound(response) {
	response.writeHead(404)
	return response.end();
}

function returnNotImplemented(response) {
	response.writeHead(501)
	return response.end();
}

function validate(command, params, response) {
	for (p in command.parameters) {
		param = command.parameters[p];
		if (params[p]) {
			if (param.validator) {
				var errorMsg = param.validator(params[p])
				if (errorMsg) {
					returnError(response, 101, 'Parameter ' + p + ' is invalid; ' + errorMsg);
					return false;
				}
			}
		} else {
			if (param.required) {
				returnError(response, 100, 'Required parameter ' + p + ' is missing');
				return false;
			} else {
				if (param.defaultValue) {
					params[p] = param.defaultValue
				}
			}
		}
	}
	return true;
}

Http.createServer(function (request, response) {
	var commands = api[request.method];
	if (commands) {
		var urlParts = Url.parse(request.url, true);
		var commandName = urlParts.pathname.toLowerCase();
		var command = commands[commandName];
		if (command) {
			var params = urlParts.query
			if (validate(command,params,response)) {
				command.code(params, response);
			}
			return;
		}
	}
	returnNotFound(response);
}).listen(port);