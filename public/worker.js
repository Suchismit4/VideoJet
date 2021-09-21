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
let tasks = [];
let videoConnected = []
let audioConnected = []


// initialize user
async function init() {
    if (!connectedToServer) return;
    $("#--flag-imp-important").addClass('d-none')
    StartStreaming(false);
    connectedToAudio = true;
    PerformAllTasks();
}

async function ToggleCamera() {
    if (inCooldown) return;
    if (!connectedToServer || !connectedToAudio) return;
    if (!cameraState) {
        SetCooldown();
        remoteMedia.unpublish();
        StartStreaming(true);
        cameraState = true;
        $("#toggleVideoText").text('Disable Video');
    } else {
        SetCooldown();
        StartStreaming(false);
        cameraState = false;
        $("#toggleVideoText").text('Enable Video');
    }
}

// Event listeners
signalLocal.onopen = async () => {
    clientLocal.join(ROOM_ID, USER_POINTER).then(() => {
        connectedToServer = true;
        console.log("[SFU]:   Joined room successfully")
    });
}

const PerformAllTasks = () => {
    for (var i = tasks.length - 1; i >= 0; i--) {
        tasks[i].performTask(tasks[i].track, tasks[i].stream);
    }
}

// @Listen event: ontrack
clientLocal.ontrack = (track, stream) => {
    // stream id => media id
    const performTask = function (track, stream) {
        let videoEl = document.createElement('video');
        console.log("[SFU]:   Got stream (track): ", track.id, "for stream: ", stream.id);
        if (track.kind == 'video') {
            track.onunmute = () => {
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
                let wrapper = document.createElement("div")
                wrapper.id = track.id; // track id
                wrapper.classList.add("box-container")
                wrapper.append(videoEl)
                // let nameTag = document.createElement('div')
                // nameTag.classList.add('name-tag')
                // const info = document.createTextNode(`{name}`)
                // nameTag.setAttribute('data-id', stream.id);
                // nameTag.append(info)
                // wrapper.append(nameTag)
                videoGrid.append(wrapper);
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
            }
        } else if (track.kind == 'audio') {
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
                console.log("[SFU]:   Got stream (track): ", track.id, "for stream: ", stream.id);
                if (track.kind == 'video') {
                    track.onunmute = () => {
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
                        let wrapper = document.createElement("div")
                        wrapper.id = track.id; // track id
                        wrapper.classList.add("box-container")
                        wrapper.append(videoEl)
                        // let nameTag = document.createElement('div')
                        // nameTag.classList.add('name-tag')
                        // const info = document.createTextNode(`{name}`)
                        // nameTag.setAttribute('data-id', stream.id);
                        // nameTag.append(info)
                        // wrapper.append(nameTag)
                        videoGrid.append(wrapper);
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
                    }
                } else if (track.kind == 'audio') {
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
        clientLocal.publish(media)
        remoteMedia = media;
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
        let wrapper = document.createElement("div")
        wrapper.classList.add("box-container")
        wrapper.id = null;
        wrapper.append(videoEl)
        // let nameTag = document.createElement('div')
        // nameTag.classList.add('name-tag-mine')
        // const info = document.createTextNode(F_NAME + " " + L_NAME);
        // nameTag.append(info)
        // wrapper.append(nameTag)
        videoGrid.append(wrapper);
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

const SetCooldown = () => {
    inCooldown = true;
    setTimeout(function () {
        inCooldown = false;
    }, 5000);
}