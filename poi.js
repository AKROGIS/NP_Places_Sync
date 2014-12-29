//"use strict";
const port = parseInt(process.argv[2], 10) || 8081;
const http = require('http');
const url = require('url');
const poiDb = require('./poi-db');

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
				answer = poiDb.getChanges(time);
				if (answer.errorcode) {
					returnError(response, answer.errorCode, answer.errorMessage);
				} else {
					returnJSON(response, answer);
				}			
			}
		},				
		'/poi/feature/<id>' : {
			'description' : 'Provides a JSON object describing a specific feature',
			'parameters' : {},
			'code' : function (options, response) {
				answer = poiDb.getFeature(this.id);
				if (answer.errorcode) {
					returnError(response, answer.errorCode, answer.errorMessage);
				} else {
					returnJSON(response, answer);
				}			
			}
		},
		'/poi/request/<id>' : {
			'description' : 'Provides a JSON object describing a specific request',
			'parameters' : {},
			'code' : function (options, response) {
				answer = poiDb.getRequest(this.id);
				if (answer.errorcode) {
					returnError(response, answer.errorCode, answer.errorMessage);
				} else {
					returnJSON(response, answer);
				}			
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
		'/poi/request' : {
			'description' : 'Submit a new request',
			'parameters' : {},
			'code' : function (options, response) {
				answer = poiDb.getRequest(this.id);
				if (answer.errorcode) {
					returnError(response, answer.errorCode, answer.errorMessage);
				} else {
					returnJSON(response, {id:answer.featureId});
				}			
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

function isKey(str) {
	return (str[0] === '<' && str.slice(-1) === '>') ? str.slice(1,-1) : false;
}

function checkCommand(commandName, command, givenName) {	
	var commandParts = commandName.split('/');
	var givenParts = givenName.split('/');
	if (commandParts.length != givenParts.length) {
		return undefined
	}
	var newCommand = {}
	for (var i=0; i < commandParts.length; i++) {
		if (commandParts[i] == givenParts[i]) {
			continue;
		}
		var key = isKey(commandParts[i])
		if (!key) {
			return undefined;
		}
		newCommand[key] = givenParts[i];
	}
	// We matched, add this commands properties to the new command and return it
	Object.keys(command).forEach( function (key) {
		newCommand[key] = command[key];
	});
	return newCommand;
}

function getCommand(commands, name) {
	var command = commands[name];
	if (command) {
		return command;
	}
	// Simple string match failed, look for matches using replacement for <*> in command
	// add the matches to the command as new properties
	var commandNames = Object.keys(commands)
	var command
	commandNames.some( function (commandName) {
		command = checkCommand(commandName, commands[commandName], name);
		return command;
	});
	return command;
}

http.createServer(function (request, response) {
	var commands = api[request.method];
	if (commands) {
		var urlParts = url.parse(request.url, true);
		var commandName = urlParts.pathname.toLowerCase();
		var command = getCommand(commands, commandName);
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