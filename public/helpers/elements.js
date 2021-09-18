let elementCount = 99999;
const _videoGrid = document.getElementById("video-grid");

const CreateElement = {
    CreateAudioBlock: (track, stream, muted) => {
        elementCount++;
        let DOM = `  <div class="audio-block" id="${track.id}">
                            <div class="pfp"></div>
                    </div>`
        DOM = document.createElement('div');
        DOM.classList.add('audio-block');
        DOM.id = track.id;
        let pfp = document.createElement('div');
        pfp.classList.add('pfp')
        DOM.append(pfp);
        _videoGrid.appendChild(DOM);
        DOM = document.getElementById(track.id);
        var sound = document.createElement('audio');
        sound.autoplay = 'true'
        if(!muted) sound.srcObject      = stream;
        DOM.appendChild(sound);
        updateVideos();
        return true;
    }

}