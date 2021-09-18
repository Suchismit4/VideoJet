const serverURL = "wss://zoomclone.ga/ws";
const videoGrid = document.getElementById("video-grid");
let signalLocal = new Signal.IonSFUJSONRPCSignal(serverURL);
let clientLocal = new IonSDK.Client(signalLocal, {});
let connectedToAudio = false;
let tasks = [];
let connectedToServer = false;
let myVideoPublished = false;

// initialize user
async function init() {
    if (!connectedToServer) return;
    $("#--flag-imp-important").addClass('d-none')
    StartStreaming();
    connectedToAudio = true;
    PerformAllTasks();
}

// Event listeners
signalLocal.onopen = async () => {
    clientLocal.join(ROOM_ID, USER_POINTER).then(() => {
        connectedToServer = true;
        console.log("[SFU]:   Joined room successfully")
    });
}

const PerformAllTasks = () => {
    for (var i = 0; i < tasks.length; i++)
        tasks[i].performTask(tasks[i].track, tasks[i].stream);
}

// @Listen event: ontrack
clientLocal.ontrack = (track, stream) => {
    // stream id => media id
    const performTask = function (track, stream) {
        let videoEl = document.createElement('video');
        console.log("[SFU]:   Got stream (track): ", track.id, "for stream: ", stream.id);
        if (track.kind == 'video') {
            track.onunmute = () => {
                videoEl.controls = false;
                videoEl.srcObject = stream;
                videoEl.autoplay = true;
                videoEl.muted = false;
                let wrapper = document.createElement("div")
                wrapper.id = track.id; // track id
                wrapper.classList.add("video-wrapper")
                wrapper.append(videoEl)
                let nameTag = document.createElement('div')
                nameTag.classList.add('name-tag')
                const info = document.createTextNode(`{name}`)
                nameTag.setAttribute('data-id', stream.id);
                nameTag.append(info)
                wrapper.append(nameTag)
                videoGrid.append(wrapper);
                updateVideos();
                stream.onremovetrack = (e) => {
                    console.log("[SFU]:   Removing stream (track): ", track.id, "for stream: ", stream.id);
                    if (e.track.kind == 'video') {
                        const removeVideo = document.getElementById(e.track.id);
                        videoGrid.removeChild(removeVideo);
                        updateVideos();
                    }
                }
            }
        } else if (track.kind == 'audio') {
            CreateElement.CreateAudioBlock(track, stream, false);
            stream.onremovetrack = (e) => {
                console.log("[SFU]:   Removing stream (track): ", track.id, "for stream: ", stream.id);
                if (e.track.kind == 'video') {
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
                        videoEl.controls = false;
                        videoEl.srcObject = stream;
                        videoEl.autoplay = true;
                        videoEl.muted = false;
                        let wrapper = document.createElement("div")
                        wrapper.id = track.id; // track id
                        wrapper.classList.add("video-wrapper")
                        wrapper.append(videoEl)
                        let nameTag = document.createElement('div')
                        nameTag.classList.add('name-tag')
                        const info = document.createTextNode(`{name}`)
                        nameTag.setAttribute('data-id', stream.id);
                        nameTag.append(info)
                        wrapper.append(nameTag)
                        videoGrid.append(wrapper);
                        updateVideos();
                        stream.onremovetrack = (e) => {
                            console.log("[SFU]:   Removing stream (track): ", track.id, "for stream: ", stream.id);
                            if (e.track.kind == 'video') {
                                const removeVideo = document.getElementById(e.track.id);
                                videoGrid.removeChild(removeVideo);
                                updateVideos();
                            }
                        }
                    }
                } else if (track.kind == 'audio') {
                    CreateElement.CreateAudioBlock(track, stream, false);
                    stream.onremovetrack = (e) => {
                        console.log("[SFU]:   Removing stream (track): ", track.id, "for stream: ", stream.id);
                        if (e.track.kind == 'video') {
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

const StartStreaming = () => {
    console.log("[SFU]:   Publishing local stream..");
    let videoEl = document.createElement('video');
    IonSDK.LocalStream.getUserMedia({
        resolution: "vga",
        audio: true,
        video: false,
        codec: "vp8",
    }).then((media) => {
        socket.emit('sfu-user-connected', USER_POINTER, media.id, ROOM_ID);
        // videoEl.srcObject = media;
        // videoEl.autoplay = true;
        // videoEl.controls = false;
        // videoEl.muted = true;
        // let wrapper = document.createElement("div")
        // wrapper.classList.add("video-wrapper")
        // wrapper.append(videoEl)
        // let nameTag = document.createElement('div')
        // nameTag.classList.add('name-tag-mine')
        // const info = document.createTextNode(F_NAME + " " + L_NAME);
        // nameTag.append(info)
        // wrapper.append(nameTag)
        // videoGrid.append(wrapper);
        CreateElement.CreateAudioBlock({id: null}, media, true);
        MY_MEDIA_STREAM = media.id;
        clientLocal.publish(media)
        console.log("[SFU]:   Published local stream..");
        updateVideos();
    }).catch(console.error);
}

