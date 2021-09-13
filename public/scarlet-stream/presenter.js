// You can try it from browser's console after initialize presenter
var presenter = false;
var presenterInstance = null;

// Scope for <sf-m name="presenter">
presenter = this;
broadcastBytes = 0;

// Save the streamer ID who listen to me..
// This will become RepeatedList datatype
listener = [/*
		streamerID1, streamerID2, ...
	*/];

// Every streamer must receive this bufferHeader data
bufferHeader = null;

// Start recording, or create instance first
started = false;
StartPresenting = function () {
	if (!presenterInstance)
		createInstance();

	presenterInstance.startRecording();
	started = true;
}
StopPresenting = function () {
	started = false;
	presenterInstance.stopRecording();
}

// We just need to create this once, and save the bufferHeader
function createInstance() {
	console.log("New presenter instance was created");

	var element;

	// Set this to true for recording an element
	if (false) {
		element = document.querySelector('#file_test');
		const audioContext = ScarletsMedia.audioContext;

		// Mute output to current device's speaker
		let sourceNode = audioContext.createMediaElementSource(element);
		let gainNode = audioContext.createGain();
		gainNode.gain.value = 0;

		sourceNode.connect(gainNode);
		gainNode.connect(audioContext.destination);

		// Let's play it, and it will be recorded
		element.play();
	}

	// Set latency to 100ms (Equal with streamer)
	const latency = 30;
	presenterInstance = new ScarletsMediaPresenter({
		mimeType: 'audio/webm;codecs=opus', // Optional
		element, // Optional
		audio: {
			channelCount: 1,
			echoCancellation: false
		},
		debug: true,
		// uncomment this for use OpusMediaRecorder polyfill as fallback
		// (find globally #2908210050 for all related references in this project)
		// alwaysUsePolyfill:false,  // Optional
		workerOptions: {
			OggOpusEncoderWasmPath: 'https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/OggOpusEncoder.wasm',
			WebMOpusEncoderWasmPath: 'https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/WebMOpusEncoder.wasm'
		}
	}, latency);

	presenterInstance.onRecordingReady = function (packet) {
		console.log("Recording started!");
		console.log("Header size:", packet.data.size, 'bytes');
		console.log('Mimetype:', presenterInstance.mediaRecorder.mimeType)
		_socket.emit('user-connected-broadcast', _socket.id);
		bufferHeader = packet;
	}

	presenterInstance.onBufferProcess = function (streamData) {
		broadcastBytes = streamData[0].size;
		_socket.emit('bufferStream', streamData);
	}
}

requestBufferHeader = function (streamerID) {
	if (!bufferHeader)
		return console.log("We haven't start presenting yet, but the streamer want to listen me?");

	console.log("Sending bufferHeader to streamer with ID:", streamerID);
	_socket.emit('bufferHeader', {
		targetID: streamerID,
		type: 'send',
		packet: bufferHeader
	});
}