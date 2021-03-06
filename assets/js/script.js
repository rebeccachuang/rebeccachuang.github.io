$(function(){

	// This demo depends on the canvas element
	if(!('getContext' in document.createElement('canvas'))){
		alert('Sorry, it looks like your browser does not support canvas!');
		return false;
	}

	// The URL of your web server (the port is set in app.js)
	// var url = 'http://localhost:8080';
	var url = 'http://192.168.2.38:8080';

	var doc = $(document),
		win = $(window),
		canvas = $('#paper'),
		ctx = canvas[0].getContext('2d'),
		instructions = $('#instructions');

	// Generate an unique ID
	var id = Math.round($.now()*Math.random());

	// A flag for drawing activity
	var drawing = false;


	var clients = {};
	var cursors = {};

	var socket = io.connect(url);

	
	socket.on('drawExistingLines', function (linesDrawn) {

	console.log(linesDrawn.lines.toString());
	
	var lines = [];
	var temp = '';

	for(var a = 0; a < linesDrawn.lines.toString().length; a++){
		if(linesDrawn.lines.toString().charAt(a) === ','){	
			lines.push(temp);
			temp = '';
		}
		else
			temp += linesDrawn.lines.toString().charAt(a);
	}
	lines.push('end');
	

	console.log('lines[]: ' + lines.toString());
	console.log('lines.length: ' + lines.length);



	for(i = 0; i < lines.length;){
	
		console.log('i: ' + i);

	    
		if(lines[i] === 'end'){
			i++;
	    	}
	    	else{
      			if(lines[i+2] === 'end'){
	
				console.log('last point in segment');	
				//drawLine(0,0,200,200);	//temp

		        	drawLine(lines[i],lines[i+1],lines[i],lines[i+1]);
     			}
	      		else{

				console.log('regular part of segment');
				//drawLine(200,200,0,400); //temp

		        	drawLine(lines[i],lines[i+1],lines[i+2],lines[i+3]);
      			}
			i+=2;
    	   	 }
  	  }	

	});

	socket.on('moving', function (data) {

		if(! (data.id in clients)){
			// a new user has come online. create a cursor for them
			cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
		}

		// Move the mouse pointer
		cursors[data.id].css({
			'left' : data.x,
			'top' : data.y
		});

		// Is the user drawing?
		if(data.drawing && clients[data.id]){

			// Draw a line on the canvas. clients[data.id] holds
			// the previous position of this user's mouse pointer

			drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
		}
 
		// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = $.now();
	});

	var prev = {};

    // To manage touch events
    // http://ross.posterous.com/2008/08/19/iphone-touch-events-in-javascript/

    document.addEventListener("touchstart", touchHandler, true);
    document.addEventListener("touchmove", touchHandler, true);
    document.addEventListener("touchend", touchHandler, true);
    document.addEventListener("touchcancel", touchHandler, true);

    function touchHandler(event)
    {
        var touches = event.changedTouches,
            first = touches[0],
            type = '';
        switch(event.type)
        {
            case "touchstart":
                type = "mousedown";
                break;
            case "touchmove":
                type = "mousemove";
                break;
            case "touchend":
                type = "mouseup";
                break;
            case "touchcancel":
                type = "mouseup";
                break;
            default:
                return;
        }

        var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent(type, true, true, window, 1,
            first.screenX, first.screenY,
            first.clientX, first.clientY, false,
            false, false, false, 0/*left*/, null);

        first.target.dispatchEvent(simulatedEvent);
        event.preventDefault();
    }

	canvas.on('mousedown',function(e){
		e.preventDefault();
		drawing = true;
		prev.x = e.pageX;
		prev.y = e.pageY;

		// Hide the instructions
		instructions.fadeOut();
	});

	doc.bind('mouseup mouseleave',function(){
		drawing = false;
	});

	var lastEmit = $.now();

	doc.on('mousemove',function(e){
		if($.now() - lastEmit > 30){
			socket.emit('mousemove',{
				'x': e.pageX,
				'y': e.pageY,
				'drawing': drawing,
				'id': id
			});
			lastEmit = $.now();
		}

		// Draw a line for the current user's movement, as it is
		// not received in the socket.on('moving') event above

		if(drawing){

			drawLine(prev.x, prev.y, e.pageX, e.pageY);

			prev.x = e.pageX;
			prev.y = e.pageY;
		}
	});

	// Remove inactive clients after 10 seconds of inactivity
	setInterval(function(){

		for(ident in clients){
			if($.now() - clients[ident].updated > 10000){

				// Last update was more than 10 seconds ago.
				// This user has probably closed the page

				cursors[ident].remove();
				delete clients[ident];
				delete cursors[ident];
			}
		}

	},10000);

	function drawLine(fromx, fromy, tox, toy){
		ctx.lineWidth=5; 	
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		// set line color
		ctx.strokeStyle = '#BC9166';
		ctx.stroke();
	}
	
});