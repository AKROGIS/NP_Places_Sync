const port = parseInt(process.argv[2], 10) || 8081;
const http = require('http');
const url = require('url');
const poiDb = require('./poi-db');

const dateTime = {
	'description' : 'A date/time.  Must be in RFC2822 or ISO 8601 format',
	'required' : false,
	'defaultValue' : '2014-01-01', //Beginning of time (for this project)
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
			'code' : function (request, options, response) {
				time = new Date(options['since']);
				poiDb.getChanges(time, function(error, results) {
					if (error) {
						returnError(response, error.errorCode, error.errorMessage);
					} else {
						returnJSON(response, results);
					}			
				});
			}
		},				
		'/poi/feature/<id>' : {
			'description' : 'Returns a JSON object describing the feature identified',
			'parameters' : {},
			'code' : function (request, options, response) {
				poiDb.getFeature(this.id, function(error, results) {
					if (error) {
						returnError(response, error.errorCode, error.errorMessage);
					} else {
						if (results) {
							returnJSON(response, results);
						} else {
							returnNotFound(response);
						}
					}			
				});
			}
		},
		'/poi/change/request/<id>/status' : {
			'description' : 'Returns a JSON object describing the status of the change request identified',
			'parameters' : {},
			'code' : function (request, options, response) {
				poiDb.getRequest(this.id, function(error, results) {
					if (error) {
						returnError(response, error.errorCode, error.errorMessage);
					} else {
						if (results) {
							returnJSON(response, results);
						} else {
							returnNotFound(response);
						}
					}			
				});
			}
		},
		'/poi' : {
			'description' : 'Provides a JSON object describing the REST API for AKR Place of Interest',
			'parameters' : {},
			'code' : function (request, options, response) {
				returnJSON(response, api);
			}
		}
	},
	'POST' : {
		'/poi/change/request' : {
			'description' : 'Submit a new change request.  Body of post must contain a JSON object describing the change',
			'parameters' : {},
			'code' : function (request, options, response) {
        processPost(request, response, function () {
          poiDb.postRequest(request.postBody, function(error, results) {
            if (error) {
              returnError(response, error.errorCode, error.errorMessage);
            } else {
              returnJSON(response, results);
            }			
          });
        });
			}
		}
	}
};

function processPost(request, response, callback) {
    var postBody = "";
    if(typeof callback !== 'function') return null;
    request.setEncoding('utf8');
    
    request.on('data', function(data) {
        postBody += data;
        if(postBody.length > 1e6) {
            postBody = "";
            response.writeHead(413).end();
            request.connection.destroy();
        }
    });

    request.on('end', function() {
        request.postBody = postBody;
        callback();
    });
}


function returnError(response, number, msg) {
  var errors = {
      '100' : 'Request did not contain a required parameter',
      '101' : 'Invalid parameter',
      '200' : 'Malformed request body',
      '201' : 'Missing value in request body',
      '202' : 'Invalid value in request body',
      '300' : 'Database error'
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
	// add the matching data to the command as new properties
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
				command.code(request, params, response);
			}
			return;
		}
	}
	returnNotFound(response);
}).listen(port);