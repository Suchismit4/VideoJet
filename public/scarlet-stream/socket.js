var _socket = io("http://localhost:8000", {transports:['websocket']});

_socket.on('welcome', function(){
	app.id = _socket.id;
	console.log("Connected to the server!");
});

// Handle BufferHeader request/response
_socket.on('bufferHeader', function(data){
	console.log("Buffer header ("+data.type+") by", data.fromID);

	// Is request from Streamer?
	if(data.type === 'request')
		presenter.requestBufferHeader(data.fromID);

	// Is response from Presenter?
	else if(data.type === 'received')
		streamer.setBufferHeader(data.fromID, data.packet);
});

// Handle buffer stream from the presenter to streaming instance
_socket.on('bufferStream', function(data){
	// From = data.presenterID

	streamer.receiveBuffer(data.presenterID, data.packet);
});

// Handle disconnected streamer
_socket.on('streamerGone', function(id){
	var i = app.presenter.listener.indexOf(id);

	if(i !== -1){
		app.presenter.listener.splice(i, 1);
		console.log("Listener with ID:", id, "was removed");
	}
});

// Handle disconnected presenter
_socket.on('presenterGone', function(id){
	if(app.streamer.listening[id] !== undefined){
		sf.Obj.delete(app.streamer.listening, id);
		console.log("Listener with ID:", id, "was removed");
	}
});

