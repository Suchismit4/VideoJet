const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const connectedPeers = {}
let allConnectedInRoom = [];
const root = document.documentElement
myVideo.muted = true;
let myUser = {
  id: USER_POINTER,
  f_name: F_NAME,
  l_name: L_NAME
};
// creating a peer
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});


peer.on("open", (id) => {
  // broadcasting to all available server (to the server port and http already config)
  myVideo.setAttribute('id', id);
  // connectedUsers[USER_POINTER].peer_id = id
  socket.emit("join-room", ROOM_ID, id, USER_POINTER);
});

let videoStream; // global stream

// getting the available media from the browser
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
})
  .then((stream) => {
    // making the stream global to access it everywhere

    videoStream = stream;
    addVideoStream(myVideo, stream, peer.id);
    console.log("My video loaded with id " + peer.id);

    // answering a peer call
    peer.on("call", (call) => {
      call.answer(stream);
      let video = document.createElement("video");
      video.setAttribute('id', call.peer)
      call.on("stream", (userVideoStream) => {
        if (!connectedPeers[call.peer]) {
          connectedPeers[call.peer] = call
          addVideoStream(video, userVideoStream, call.peer);
        }
      });


    });

    // listening to a new user connection
    socket.on("user-connected", (userId) => {
      setTimeout(connectToNewUser, 5000, stream, userId);
    });
    
    socket.on('connected-users-list', (connectedUsers) => {
      allConnectedInRoom = connectedUsers;
      const user = allConnectedInRoom.find(o => o.id == myUser.id);
      const index = allConnectedInRoom.indexOf(user);
      if(index > -1) allConnectedInRoom.splice(index, 1);
    })

    let msg = $('input');

    $('html').keydown((e) => {
      if (e.which == 13 && msg.val().length !== 0) {
        socket.emit('message', msg.val(), USER_POINTER);
        msg.val('');
      }
    });

    socket.on('createMessage', (message, name) => {
      let today = new Date();
      let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      $('.messages').append(`<li class='message'><b>${name} </b><span class='time'>${time}</span><br/>${message}</li>`)
      scrollToBottom();
    });

    socket.on('userDisconnected', (userId, connectedUsers) => {
      removeVideoStream(userId);
      if (connectedPeers[userId]) {
        connectedPeers[userId].close()
        delete connectedPeers[userId]
        allConnectedInRoom = connectedUsers
      }
      updateVideo()
    })

    socket.on('removeVideo', userId => {
      console.log(userId)
      removeVideo(userId)
    })

    socket.on('addVideo', (userId) => {
      addVideo(userId)
    })
  });

// playing a video stream
const addVideoStream = (video, stream, userId) => {
  video.srcObject = stream; // assign the src to the stream
  // wait for video data to load then play
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });

  // let user = Object.values(connectedUsers).find(o => o.peer_id == userId)

  if (!(video && stream)) {
    console.log(stream)
    console.log("bobo moment")
    return;

  }
  let wrapper = document.createElement("div")
  wrapper.classList.add("video-wrapper")
  wrapper.append(video)
  let nameTag = document.createElement('div')
  nameTag.classList.add('name-tag')
  const info = document.createTextNode(`Ribu pls gib name`)
  nameTag.append(info)
  wrapper.append(nameTag)
  videoGrid.append(wrapper);

  updateVideo()

  console.log(`Added a video with id ${userId}`)

};

const removeVideoStream = userId => {
  document.getElementById(userId).parentElement.remove()
}

const removeVideo = userId => {
  let video = document.getElementById(userId);
  if (video) {
    video.classList.add("d-none")
    console.log(`Could not remove ${userId}`)
  }
  console.log(`Removing ${userId}`)
}

const addVideo = userId => {
  let video = document.getElementById(userId);
  video.classList.remove("d-none")
}

const updateVideo = () => {
  let numUsers = Object.keys(connectedPeers).length + 1
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

// router function to connect to a new user connection
const connectToNewUser = (stream, userId) => {
  let call = peer.call(userId, stream); // calling the user peer
  let video = document.createElement("video");
  video.setAttribute('id', userId);
  console.log("New user joined the room with id " + userId);
  call.on("stream", (userVideoStream) => {
    if (!connectedPeers[call.peer]) {
      connectedPeers[userId] = call
      addVideoStream(video, userVideoStream, call.peer);
    }

  });

  // connectedUsers[userObj.id] = userObj
};

const scrollToBottom = () => {
  let chat = $(".main__chat__window");
  chat.scrollTop(chat.prop("scrollHeight"))
}

const toggleMute = () => {
  let enabled = videoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    videoStream.getAudioTracks()[0].enabled = false;
    document.querySelector('.mute__button').innerHTML = `<i class="fas fa-microphone-slash"></i><span>Unmute</span>`;
  } else {
    videoStream.getAudioTracks()[0].enabled = true;
    document.querySelector('.mute__button').innerHTML = `<i class="fas fa-microphone mute"></i><span>Mute</span>`;
  }
}

const toggleVideo = () => {
  let enabled = videoStream.getVideoTracks()[0].enabled
  if (enabled) {
    videoStream.getVideoTracks()[0].enabled = false;
    socket.emit("reqVideoRemove", peer.id)
    removeVideo(peer.id)
    document.querySelector('.video__button').innerHTML = `<i class="fas fa-video-slash"></i><span>Start Video</span>`
  } else {
    videoStream.getVideoTracks()[0].enabled = true;
    socket.emit("reqVideoAdd", peer.id)
    addVideo(peer.id);
    document.querySelector('.video__button').innerHTML = `<i class="fas fa-video mute"></i><span>Stop Video</span>`
  }
}

const toggleChat = () => {
  let chat = document.getElementById("chat")
  if (!chat.classList.contains("d-none")) {
    chat.classList.add("d-none")
  }
  else {
    chat.classList.remove("d-none")
  }
}

const toggleParticipants = () => {
  let participants = document.getElementById("participant__list")
  if (!participants.classList.contains("d-none")) {
    participants.classList.add("d-none")
  } else {
    participants.classList.remove("d-none")
  }
}

const leaveMeeting = () => {
  window.location.href = "/post-meeting"
}

// $(window).on('beforeunload', function(){
//   socket.close();
// });

