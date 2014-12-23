//"use strict";
const port = parseInt(process.argv[2], 10);
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
// get list of feature ids for new,updated,deleted features since a date
// get feature
// post request to add, update or delete a feature
// get request
//    id : ID of the request
//	  type : add/update/delete
//    feature : feature object to add, update or delete (feature object need provide only the pertinent properties) 
//    request date : iso formated date in UTC
//    requestor : name or id of the requestor
//    action: null or action id (request is considered new/open until it has an action - which is described in the request actions)
//    action date : iso formated date in UTC
//    comment : text explaining status (optional, usually only used when the request was rejected)
// get request action
//    id : UUID of the request
//
//	  
//    partially accepted
//    rejected - 


const api = {
	'GET' : {
		'/poi/requests' : {
			'description' : 'Returns a JSON list of all request ids since a specific date',
			'parameters' : {
				'since' : dateTime
			},
			'code' : function (options, response) {
				time = new Date(options['iso']);
				returnJSON(response, {
					'hour' : time.getHours(),
					'minute' : time.getMinutes(),
					'second' : time.getSeconds()
				});
			}
		},
		'/poi/requests/closed' : {
			'description' : 'Returns a JSON list of all request ids since a specific date',
			'parameters' : {
				'since' : dateTime
			},
			'code' : function (options, response) {
				time = new Date(options['iso']);
				returnJSON(response, {
					'hour' : time.getHours(),
					'minute' : time.getMinutes(),
					'second' : time.getSeconds()
				});
			}
		},				
		'/poi/requests/<id>' : {
			'description' : 'Provides a JSON object describing a specific request',
			'parameters' : {
				'iso' : dateTime
			},
			'code' : function (options, response) {
				returnJSON(response, {
					'unixtime' : Date.parse(options['iso'])
				});
			}
		},
		'/poi' : {
			'description' : 'Provides a JSON object describing the REST API for Place of Interest',
			'parameters' : {},
			'code' : function (options, response) {
				returnJSON(response, api);
			}
		}
	},
	'POST' : {
		'poi/request' : {
			'description' : 'Submits a new request',
			'parameters' : {},
			'code' : function (options, response) {
				returnJSON(response, {
					'unixtime' : Date.parse(options['iso'])
				});
			}
		},
		'poi/action' : {
			'description' : 'Submits a new action to a request',
			'parameters' : {},
			'code' : function (options, response) {
				returnJSON(response, {
					'unixtime' : Date.parse(options['iso'])
				});
			}
		},
	}
};

function error100 (response, msg) {
	response.writeHead(403, { 'Content-Type': 'application/json' })
	response.end(JSON.stringify({
		'code' : 100,
		'error' : 'Request did not contain required parameters',
		'msg' : msg
	}));
};

function error101 (response, msg) {
	response.writeHead(403, { 'Content-Type': 'application/json' })
	response.end(JSON.stringify({
		'code' : 101,
		'error' : 'Invalid parameter',
		'msg' : msg
	}));
};

function returnJSON(response, obj) {
	response.writeHead(200, { 'Content-Type': 'application/json' })
	return response.end(JSON.stringify(obj));
}

function validate(command, params, response) {
	for (p in command.parameters) {
		param = command.parameters[p];
		if (params[p]) {
			if (param.validator) {
				var errorMsg = param.validator(params[p])
				if (errorMsg) {
					error101(response, 'Parameter ' + p + ' is invalid; ' + errorMsg);
					return false;
				}
			}
		} else {
			if (param.required) {
				error100(response, 'Required parameter ' + p + ' is missing');
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
	response.writeHead(404);
	response.end();
}).listen(port);