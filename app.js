// Including libraries

var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	static = require('node-static'); // for serving files

// This will make all the files in the current folder
// accessible from the web
var fileServer = new static.Server('./');

// make an array to hold all the segment values from ALL the users
var linesDrawn ={lines: []},
	lineSegment = []; // array holds each line segment end of segment marked by 'end'

// This is the port for our web server.
// you will need to go to http://localhost:8080 to see it
app.listen(8080);


// If the URL of the socket server is opened in a browser
function handler (request, response) {
	request.addListener('end', function () {
        fileServer.serve(request, response);
    });
    //You need this line for it to work
    request.resume();
}

// Delete this row if you want to see debug messages
io.set('log level', 1);

// Listen for connections; print to console
io.sockets.on('connection', function(socket){	
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  }); 
});


// Listen for incoming connections from clients
// store drawn lines into lineSegment array
io.sockets.on('connection', function (socket) {

	socket.emit('drawExistingLines', linesDrawn);

	// Start listening for mouse move events
	socket.on('mousemove', function (data) {

		// clear canvas (linesDrawn[]) every hour
		var d = new Date();
		var mins = d.getMinutes();
		var secs = d.getSeconds();
		if(mins == 0){
			linesDrawn.lines = [];
		}

		if(data.drawing){
			lineSegment.push(data.x, data.y);
		}
		if(!data.drawing && lineSegment.length > 0){
			lineSegment.push('end');
			linesDrawn.lines.push(lineSegment);

		console.log(lineSegment.toString());
		console.log(linesDrawn.lines.toString());	
		
		lineSegment = [];	
		}

		// This line sends the event (broadcasts it)
		// to everyone except the originating client.
		socket.broadcast.emit('moving', data);
	});
});