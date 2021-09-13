// You can try it from browser's console after initialize presenter
var streamer = false;

// Scope for <sf-m name="streamer">
streamer = this;
this.active = false;

// Save the stream instance for every presenter
// This will become RepeatedProperty datatype
this.listening = {/*
		presenterID: {
			instance: new ScarletsAudioStreamer(),
			recvBytes: 0
		}
	*/};

function StartStreaming (socket_id) {
    create(socket_id);
}

// Request bufferHeader to presenter, or create new streaming instance first
function create(presenterID) {
    if (this.listening[presenterID] === undefined) {
        // Set latency to 100ms (Equal with presenter)
        var streamer = {
            instance: new ScarletsAudioStreamer(50),
            recvBytes: 0,
            bufferHeader: false
        };

        this.active = true;

        // Set object property
		sf.Obj.set(this.listening, presenterID, streamer);
        streamer.instance.playStream();

        console.log("New streamer instance was created");
    }

    console.log("Sending request to presenter with ID:", presenterID);

    // Let's send bufferHeader request to the presenter
    _socket.emit('bufferHeader', {
        type: 'request',
        targetID: presenterID
    });
}

this.setBufferHeader = function (fromID, packet) {
    // Add status that we have added the buffer header to this streamer (just for HTML interface)
    // Now we can play the presenter's stream
    this.listening[fromID].bufferHeader = true;

    // Set buffer header to the streaming instance
    this.listening[fromID].instance.setBufferHeader(packet);
}

this.receiveBuffer = function (presenterID, packet) {
    var presenter = this.listening[presenterID];

    if (presenter === void 0)
        return console.log("Why we receive buffer from ID:", presenterID, "?");

    // For watching received bytes length
    presenter.recvBytes = packet[0].byteLength;

    // Let the packet played by the streamer instance
    presenter.instance.receiveBuffer(packet);
    // presenter.instance.realtimeBufferPlay(packet);
}
