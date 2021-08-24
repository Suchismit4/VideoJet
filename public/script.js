const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

// creating a peer
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
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
    addVideoStream(myVideo, stream);

    // answering a peer call
    peer.on("call", (call) => {
      call.answer(stream);
      console.log("answered");
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // listening to a new user connection
    socket.on("user-connected", (userId) => {
      setTimeout(connecToNewUser,3000,userId,stream);
    });

    let msg = $('input');

    $('html').keydown((e) => {
      if(e.which == 13 && msg.val().length !== 0) {
        socket.emit('message', msg.val());
        msg.val('');
      }
    });

    socket.on('createMessage', message => {
      let today = new Date();
      let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      $('.messages').append(`<li class='message'><b>User </b><span class='time'>${time}</span><br/>${message}</li>`)
      scrollToBottom();
    });

  });

// playing a video stream
const addVideoStream = (video, stream) => {
  video.srcObject = stream; // assign the src to the stream
  // wait for video data to load then play
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

peer.on("open", (id) => {
  // broadcasting to all available server (to the server port and http already config)
  socket.emit("join-room", ROOM_ID, id);
});

// router function to connect to a new user connection
const connecToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream); // calling the user peer
  console.log("call made");
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

const scrollToBottom = () => {
  let chat = $(".main__chat__window");
  chat.scrollTop(chat.prop("scrollHeight"))
}


// $(window).on('beforeunload', function(){
//   socket.close();
// });
