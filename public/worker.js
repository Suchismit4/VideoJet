const serverURL = "wss://zoomclone.ga/ws";
const videoGrid = document.getElementById("video-grid");
const root = document.documentElement
const signalLocal = new Signal.IonSFUJSONRPCSignal(serverURL);
const clientLocal = new IonSDK.Client(signalLocal, {});

// Event listeners
signalLocal.onopen = async () => {
    clientLocal.join(ROOM_ID, USER_POINTER).then(() => {
        console.log("[SFU]:   Joined room successfully")
    });
}
clientLocal.ontrack = (track, stream) => {
    let videoEl = document.createElement('video');
    console.log("[SFU]:   Got stream (track): ", track.id, "for stream: ", stream.id);
    if (track.kind == 'video') {
        track.onunmute = () => {
            videoEl.id = track.id;
            videoEl.controls = false;
            videoEl.srcObject = stream;
            videoEl.autoplay = true;
            videoEl.muted = false;
            let wrapper = document.createElement("div")
            wrapper.classList.add("video-wrapper")
            wrapper.append(videoEl)
            let nameTag = document.createElement('div')
            nameTag.classList.add('name-tag')
            const info = document.createTextNode(`Ribu pls gib name`)
            nameTag.append(info)
            wrapper.append(nameTag)
            videoGrid.append(wrapper);
            updateVideos();
            stream.onremovetrack = (e) => {
                console.log("[SFU]:   Removing stream (track): ", track.id, "for stream: ", stream.id);
                if (e.track.kind == 'video') {
                    const removeVideo = document.getElementById(e.track.id);
                    subVideo.removeChild(removeVideo);
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
        videoEl.srcObject = media;
        videoEl.autoplay = true;
        videoEl.controls = false;
        videoEl.muted = true;
        let wrapper = document.createElement("div")
        wrapper.classList.add("video-wrapper")
        wrapper.append(videoEl)
        let nameTag = document.createElement('div')
        nameTag.classList.add('name-tag')
        const info = document.createTextNode(`Ribu pls gib name`)
        nameTag.append(info)
        wrapper.append(nameTag)
        videoGrid.append(wrapper);
        clientLocal.publish(media);
        console.log("[SFU]:   Published local stream..");
        updateVideos();
    }).catch(console.error);
}



const updateVideos = () => {
    let numUsers = allConnectedInRoom.length;
    console.log(allConnectedInRoom)
    if (numUsers == 1) {
        root.style.setProperty("--vidWidth", '100%')
    } else if (numUsers > 1 && numUsers < 3) {
        root.style.setProperty("--vidWidth", '48%')
    } else if (numUsers > 2 && numUsers < 4) {
        root.style.setProperty("--vidWidth", '30%')
    } else if (numUsers > 5 && numUsers < 7) {
        root.style.setProperty("--vidWidth", '28%')
    } else if (numUsers > 6) {
        root.style.setProperty("--vidWidth", '18%')
    }
}