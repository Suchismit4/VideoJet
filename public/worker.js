const serverURL = "wss://zoomclone.ga/ws";
const videoGrid = document.getElementById("--video-grid");
let signalLocal = new Signal.IonSFUJSONRPCSignal(serverURL);
let clientLocal = new IonSDK.Client(signalLocal, {});
let connectedToAudio = false;
let connectedToServer = false;
let myVideoPublished = false;
let cameraState = false;
let inCooldown = false;
let remoteMedia = null;
let successInit = false;
let webCamStatus = false;
let muted = false;
let tasks = [];
let videoConnected = []
let audioConnected = []

function detectWebcam(callback) {
    let md = navigator.mediaDevices;
    if (!md || !md.enumerateDevices) return callback(false);
    md.enumerateDevices().then(devices => {
        callback(devices.some(device => 'videoinput' === device.kind));
    })
}


// initialize user
async function init() {
    if (!connectedToServer || successInit) return;
    detectWebcam(function (hasWebcam) {
        if (hasWebcam) {
            $("#--flag-imp-important").addClass('d-none')
            StartStreaming(true);
            connectedToAudio = true;
            if (i < tasks.length) {
                PerformAllTasks();
            } cameraState = true;
            webCamStatus = true;
        } else {
            alert("No web cam was detected..\n\nProceed to connect with only audio?");
            $("#web_cam_button").addClass('d-none');
            StartStreaming(false);
            connectedToAudio = true;
            if (i < tasks.length) {
                PerformAllTasks();
            } webCamStatus = false;
            $("#can-state").css('color', 'yellow');
        }
        successInit = true;
    })
}

async function ToggleCamera() {
    if (!webCamStatus) return;
    if (inCooldown) return;
    if (!connectedToServer || !connectedToAudio) return;

    if (!cameraState) {
        SetCooldown(1);
        socket.emit('user-videoOn', remoteMedia.id)
        remoteMedia.getVideoTracks()[0].enabled = true;
        document.getElementById(remoteMedia.id).classList.remove('d-none');
        $("#can-state").css('color', 'green');
        cameraState = true;
    } else {
        SetCooldown(1);
        socket.emit('user-videoOff', remoteMedia.id)
        remoteMedia.getVideoTracks()[0].enabled = false;
        document.getElementById(remoteMedia.id).classList.add('d-none');
        $("#can-state").css('color', 'red');

        cameraState = false;
    }
}

// Event listeners
signalLocal.onopen = async () => {
    clientLocal.join(ROOM_ID, USER_POINTER).then(() => {
        connectedToServer = true;
        console.log("[SFU]:   Joined room successfully")
    });
}

var i = 0;
function PerformAllTasks() {
    setTimeout(function () {
        tasks[i].performTask(tasks[i].track, tasks[i].stream);
        i++;
        if (i < tasks.length) {
            PerformAllTasks();
        }
    }, 100)
}

// @Listen event: ontrack
clientLocal.ontrack = (track, stream) => {
    // stream id => media id
    const performTask = function (track, stream) {
        let videoEl = document.createElement('video');
        if (track.kind == 'video') {
            console.log("[SFU]:   Got stream (track): ", track.id, "for stream: ", stream.id + "::video");
            if (audioConnected.includes(stream.id)) {
                // remove the audio block then init
                const removeAudio = document.querySelector(`div[data-stream-id='${stream.id}']`)
                videoGrid.removeChild(removeAudio);
                updateVideos();
            }
            videoConnected.push(stream.id);
            videoEl.controls = false;
            videoEl.srcObject = stream;
            videoEl.autoplay = true;
            videoEl.muted = false;
            videoEl.id = stream.id;
            let wrapper = document.createElement("div")
            wrapper.id = track.id; // track id
            wrapper.classList.add("box-container")
            wrapper.append(videoEl)
            videoGrid.append(wrapper);
            wrapper.setAttribute("data-stream-id", stream.id)
            updateVideos();
            stream.onremovetrack = (e) => {
                console.log("[SFU]:   Removing stream (track): ", track.id, "for stream: ", stream.id);
                if (e.track.kind == 'video') {
                    var index = videoConnected.indexOf(stream.id);
                    if (index > -1) videoConnected.splice(index, 1);
                    index = audioConnected.indexOf(stream.id);
                    if (index > -1) audioConnected.splice(index, 1);
                    const removeVideo = document.getElementById(e.track.id);
                    videoGrid.removeChild(removeVideo);
                    updateVideos();
                }
            }

        } else if (track.kind == 'audio') {
            console.log("[SFU]:   Got stream (track): ", track.id, "for stream: ", stream.id + "::audio");
            if (videoConnected.includes(stream.id)) return;
            CreateElement.CreateAudioBlock(track, stream, false);
            audioConnected.push(stream.id);
            stream.onremovetrack = (e) => {
                console.log("[SFU]:   Removing stream (track): ", track.id, "for stream: ", stream.id);
                if (e.track.kind == 'audio') {
                    const removeVideo = document.getElementById(e.track.id);
                    videoGrid.removeChild(removeVideo);
                    updateVideos();
                }
            }
        }
    }
    if (!connectedToAudio) {
        tasks.push({
            track: track,
            stream: stream,
            performTask: function (track, stream) {
                let videoEl = document.createElement('video');
                if (track.kind == 'video') {
                    console.log("[SFU]:   Got stream (track): ", track.id, "for stream: ", stream.id + "::video");
                    if (audioConnected.includes(stream.id)) {
                        // remove the audio block then init
                        const removeAudio = document.querySelector(`div[data-stream-id='${stream.id}']`)
                        videoGrid.removeChild(removeAudio);
                        updateVideos();
                    }
                    videoConnected.push(stream.id);
                    videoEl.controls = false;
                    videoEl.srcObject = stream;
                    videoEl.autoplay = true;
                    videoEl.muted = false;
                    videoEl.id = stream.id
                    let wrapper = document.createElement("div")
                    wrapper.id = track.id; // track id
                    wrapper.classList.add("box-container")
                    wrapper.append(videoEl)
                    videoGrid.append(wrapper);
                    wrapper.setAttribute("data-stream-id", stream.id)

                    updateVideos();
                    stream.onremovetrack = (e) => {
                        console.log("[SFU]:   Removing stream (track): ", track.id, "for stream: ", stream.id);
                        if (e.track.kind == 'video') {
                            var index = videoConnected.indexOf(stream.id);
                            if (index > -1) videoConnected.splice(index, 1);
                            index = audioConnected.indexOf(stream.id);
                            if (index > -1) audioConnected.splice(index, 1);
                            const removeVideo = document.getElementById(e.track.id);
                            videoGrid.removeChild(removeVideo);
                            updateVideos();
                        }
                    }

                } else if (track.kind == 'audio') {
                    console.log("[SFU]:   Got stream (track): ", track.id, "for stream: ", stream.id + "::audio");
                    if (videoConnected.includes(stream.id)) return;
                    audioConnected.push(stream.id);
                    CreateElement.CreateAudioBlock(track, stream, false);
                    stream.onremovetrack = (e) => {
                        console.log("[SFU]:   Removing stream (track): ", track.id, "for stream: ", stream.id);
                        if (e.track.kind == 'audio') {
                            const removeVideo = document.getElementById(e.track.id);
                            videoGrid.removeChild(removeVideo);
                            updateVideos();
                        }
                    }
                }
            }
        })
    } else performTask(track, stream);
}

const StartStreaming = (state) => {
    console.log("[SFU]:   Publishing local stream..");
    let videoEl = document.createElement('video');
    IonSDK.LocalStream.getUserMedia({
        resolution: "vga",
        video: state ? true : false,
        audio: true,
        codec: "vp8",
    }).then((media) => {
        if (state) PublishVideo(media, videoEl);
        else PublishAudio(media);
        socket.emit('sfu-user-connected', USER_POINTER, media.id, ROOM_ID);
        MY_MEDIA_STREAM = media.id;
        remoteMedia = media;
        clientLocal.publish(remoteMedia)
        console.log("[SFU]:   Published local stream..");
        updateVideos();
    }).catch(console.error);
}

const PublishVideo = (media, videoEl) => {
    RemoveNullElements();
    setTimeout(function () {
        videoEl.srcObject = media;
        videoEl.autoplay = true;
        videoEl.controls = false;
        videoEl.muted = true;
        videoEl.id = media.id;
        let wrapper = document.createElement("div")
        wrapper.classList.add("box-container")
        wrapper.innerHTML += `<div class="info-user">
        <p class="username">${F_NAME} ${L_NAME}</p>
        <p class="detail">XXXX/XXXX</p>
        <p class="detail">${MY_EMAIL}</p>
        <p class="detail">+91 XXX XXXX XXX</p>
    </div> `
        wrapper.id = null;
        wrapper.append(videoEl)
        videoGrid.append(wrapper);
        $("#volume").slider({
            min: 0,
            max: 100,
            value: 0,
            range: "min",
            slide: function (event, ui) {
                setVolume(ui.value / 100);
            }
        });
    }, 500)

}

const PublishAudio = (media) => {
    RemoveNullElements();
    setTimeout(function () {
        CreateElement.CreateAudioBlock({ id: null }, media, true);
    }, 500);
}

const RemoveNullElements = () => {
    if (remoteMedia != null) remoteMedia.unpublish();
    $("#null").remove();
}

const SetCooldown = (cooldown) => {
    inCooldown = true;
    setTimeout(function () {
        inCooldown = false;
    }, cooldown * 1000);
}


function ToggleMute() {
    if (muted) {
        remoteMedia.getAudioTracks().forEach(element => {
            element.enabled = true;
        });
        socket.emit('user-unmute', remoteMedia.id);
        $("#muted-state").css('color', 'green');
        muted = false;
    } else {
        remoteMedia.getAudioTracks().forEach(element => {
            element.enabled = false;
        });
        socket.emit('user-mute', remoteMedia.id);
        $("#muted-state").css('color', 'red');
        muted = true;
    }
}