(function demo() {

    var finalhandler = require('finalhandler'),
        http = require('http'),
        open = require('open'),
        serveStatic = require('serve-static'),
        // Serve up root project folder
        serve = serveStatic('.', {'index': ['index.html', 'index.htm']}),
        server;

    // Create server
    server = http.createServer(onRequest);

    // Listen
    server.listen(8088);

    server.on('listening', onListening);

    /** Handles an incoming content request */
    function onRequest(req, res) {
        var done = finalhandler(req, res);
        serve(req, res, done);
    }

    /** Called once the serve has been started */
    function onListening() {
        open('http://localhost:8088/demo/index.html');
    }

}());
