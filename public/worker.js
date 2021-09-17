const serverURL = "wss://zoomclone.ga/ws";
const videoGrid = document.getElementById("video-grid");
const signalLocal = new Signal.IonSFUJSONRPCSignal(serverURL);
const clientLocal = new IonSDK.Client(signalLocal, {});

let myVideoPublished = false;

// Event listeners
signalLocal.onopen = async () => {
    clientLocal.join(ROOM_ID, USER_POINTER).then(() => {
        console.log("[SFU]:   Joined room successfully")
    });
}

// @Listen event: ontrack
clientLocal.ontrack = (track, stream) => {
    // stream id => media id
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
                console.log(e)
                console.log("[SFU]:   Removing stream (track): ", track.id, "for stream: ", stream.id);
                if (e.track.kind == 'video') {
                    const removeVideo = document.getElementById(e.track.id);
                    videoGrid.removeChild(removeVideo);
                    updateVideos();
                }
            }
        }
    }
}

// main functions
async function init() {
    $("#--flag-imp-important").addClass('d-none')
    StartStreaming();
}

const StartStreaming = () => {
    console.log("[SFU]:   Publishing local stream..");
    let videoEl = document.createElement('video');
    IonSDK.LocalStream.getUserMedia({
        resolution: "vga",
        audio: true,
        codec: "vp8",
    }).then((media) => {
        socket.emit('sfu-user-connected', USER_POINTER, media.id, ROOM_ID);
        videoEl.srcObject = media;
        videoEl.autoplay = true;
        videoEl.controls = false;
        videoEl.muted = true;
        let wrapper = document.createElement("div")
        wrapper.classList.add("video-wrapper")
        wrapper.append(videoEl)
        let nameTag = document.createElement('div')
        nameTag.classList.add('name-tag-mine')
        const info = document.createTextNode(F_NAME + " " + L_NAME);
        nameTag.append(info)
        wrapper.append(nameTag)
        videoGrid.append(wrapper);
        MY_MEDIA_STREAM = media.id;
        clientLocal.publish(media)
        console.log("[SFU]:   Published local stream..");
        updateVideos();
    }).catch(console.error);
}

