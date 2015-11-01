var restify = require('restify'),
	connectionManager = require('node-nm-vpn');

var server = restify.createServer({
	name: 'nm-vpn-rest',
	version: '0.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

/**
 * Adds links to a connection object
 * @param {Connection} The connection to which links are to be added
 * @return {Connection} The connection, with links added
 */
var injectLinksIntoConnection = function(connection) {
	connection._links = [
		{
			rel: 'self',
			href: '/connections/'  + connection.id
		}
	];

	return connection;
};

server.get('/connections', function (req, res, next) {
	res.send(connectionManager.connections.map(function (connection) {
		return injectLinksIntoConnection(connection);
	}));
	return next();
});

server.get('/connections/:id', function (req, res, next) {
	var connection = connectionManager.getById(req.params.id);
	if (connection) {
		res.send(injectLinksIntoConnection(connection));
	} else {
		res.status(404);
		res.send(null);
	}
});

server.put('/connections/:id', function (req, res, next) {
	var connection = connectionManager.getById(req.params.id);

	if (connection && typeof req.body.up !== 'undefined') {
		if (req.body.up) {
			// Drop active connection first
			if (connectionManager.active) connectionManager.down(connectionManager.active.id);
			// Bring up requested connection
			connectionManager.up(connection.id);
			// Get the new state
			connection = connectionManager.getById(connection.id);
			// Send it back down
			res.send(connection);
		} else {
			// Drop the connection
			connectionManager.down(connection.id);
			// Get the new state
			connection = connectionManager.getById(connection.id);
			// Send it back down
			res.send(connection);
		}
	}
});

server.listen(8080, function () {
	console.log('%s listening at %s', server.name, server.url);
});

