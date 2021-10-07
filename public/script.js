const socket = io("/");
let allConnectedInRoom = [];
let mediaTracks = [];
let MY_MEDIA_STREAM = null;
const root = document.documentElement

const updateVideos = () => {
  let numUsers = allConnectedInRoom.length;
  if (numUsers == 1) {
    root.style.setProperty("--vidWidth", '100%')
  } else if (numUsers > 1 && numUsers < 3) {
    root.style.setProperty("--vidWidth", '48%')
  } else if (numUsers > 2 && numUsers < 4) {
    root.style.setProperty("--vidWidth", '30%')
  } else if (numUsers > 3 && numUsers < 7) {
    root.style.setProperty("--vidWidth", '28%')
  } else if (numUsers > 6) {
    root.style.setProperty("--vidWidth", '18%')
  }
}

socket.emit("join-room", ROOM_ID, USER_POINTER);

socket.on('connected-users-list', (connectedUsers) => {
  allConnectedInRoom = connectedUsers;
})

socket.on("user-connected", (connectedUsers, socketIDConnect) => {
  allConnectedInRoom = connectedUsers;
});

socket.on('createMessage', (message, name) => {
  let today = new Date();
  let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  $('.messages').append(`<li class='message'><b>${name} </b><span class='time'>${time}</span><br/>${message}</li>`)
  scrollToBottom();
});

socket.on('userDisconnected', (userID, connectedUsers) => {
  console.log(connectedUsers)
  allConnectedInRoom = connectedUsers;
  updateVideos()
})

socket.on('user-videoOff', (remoteID) => {
  if(remoteMedia == null) return;
  document.getElementById(remoteID).classList.add('d-none');
})

socket.on('user-videoOn', (remoteID) => {
  if(remoteMedia == null) return;
  document.getElementById(remoteID).classList.remove('d-none');
})

const scrollToBottom = () => {
  let chat = $(".main__chat__window");
  chat.scrollTop(chat.prop("scrollHeight"))
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

socket.on('sfu-user-update', (data) => {
  mediaTracks = data;
  SetAllNamesInMeeting(data);
})

function SetAllNamesInMeeting(data) {
  mediaTracks = data;
  setTimeout(function () {
    $('.name-tag').each(function (i, obj) {
      var name_tag = $(obj).attr( 'data-id' );
      var mediaTrack = mediaTracks.find(m => m.media_id == name_tag);
      var user = undefined;
      if(mediaTrack != undefined) user = allConnectedInRoom.find(u => u.id == mediaTrack.user_id);
      if(user != undefined) $(obj).text(user.f_name + " " + user.l_name)
    });
  }, 500);
}

socket.on('user-unmute', (mediaID) => {
  console.log(mediaID);
  const user = document.querySelector(`div[data-stream-id='${mediaID}']`)
  user.classList.remove('muted');
})

socket.on('user-mute', (mediaID) => {
  console.log(mediaID)
  const user = document.querySelector(`div[data-stream-id='${mediaID}']`)
  user.classList.add('muted');
})

let isPanelVisible = false;
var sidepanel = document.getElementById("main__sidebar");
var lastX = -1;
var lastY = -1;
var pointerX = -1;
var pointerY = -1;
document.onmousemove = function(event) {
	pointerX = event.pageX;
	pointerY = event.pageY;
}
setInterval(pointerCheck, 100);
function pointerCheck() {
	if((pointerX == lastX && pointerY == lastY)) return;
  else{
    lastX = pointerX;
    lastY = pointerY;
    if(pointerX <= 170){
      if(!isPanelVisible){
        sidepanel.setAttribute('class', 'slide-in');
        isPanelVisible = true;
      }
    }else if(pointerX > 170){
      if(isPanelVisible){
        sidepanel.setAttribute('class', 'slide-out');
        isPanelVisible = false;
      }
    }
  }
}