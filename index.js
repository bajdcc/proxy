var fs = require('fs');
var http = require('http');
var httpProxy = require('http-proxy');
var request = require('request');
var log4js = require("log4js");

log4js.configure({
    appenders: [
        {type: 'console'}
    ],
    replaceConsole: true
});

//
// Setup our server to proxy standard HTTP requests
//
var proxy = httpProxy.createServer({
    target: {
        host: 'localhost',
        port: 8080
    },
    ws: true,
});

proxy.listen(8087);

//
// Listen for the `error` event on `proxy`.
proxy.on('error', function (err, req, res) {
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });

    res.end('Something went wrong. And we are reporting a custom error message.');
});

//
// Listen for the `proxyRes` event on `proxy`.
//
proxy.on('proxyRes', function (proxyRes, req, res) {
    console.log(req.method, res.statusCode, req.url);
});

//
// Listen to the `upgrade` event and proxy the
// WebSocket requests as well.
//
proxy.on('upgrade', function (req, socket, head) {
    proxy.ws(req, socket, head);
});

//
// Listen for the `open` event on `proxy`.
//
proxy.on('open', function (proxySocket) {
    // listen for messages coming FROM the target here
    proxySocket.on('data', hybiParseAndLogMessage);
});

//
// Listen for the `close` event on `proxy`.
//
proxy.on('close', function (res, socket, head) {
    // view disconnected websocket connections
    console.log('Client disconnected');
});

//
// Create your target server
//
http.createServer(function (req, res) {
    req.pipe(request('http://' + req.headers['host'] + req.url)).pipe(res);
}).listen(8080);