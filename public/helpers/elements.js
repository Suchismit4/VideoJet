let elementCount = 99999;
const _videoGrid = document.getElementById("--video-grid");

const CreateElement = {
    CreateAudioBlock: (track, stream, muted) => {
        elementCount++;
        DOM = document.createElement('div');
        DOM.setAttribute('data-stream-id', stream.id);
        DOM.classList.add('box-container');
        DOM.id = track.id;
        let audio_content = document.createElement('div');
        audio_content.classList.add('audio-block-content');
        DOM.append(audio_content);
        let pfp = document.createElement('div');
        pfp.classList.add('pfp')
        audio_content.append(pfp);
        _videoGrid.appendChild(DOM);
        DOM = document.getElementById(track.id);
        var sound = document.createElement('audio');
        sound.autoplay = 'true'
        if(!muted) sound.srcObject      = stream;
        audio_content.appendChild(sound);
        updateVideos();
        return true;
    }

}