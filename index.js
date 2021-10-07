if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

/*
  ---- EXPRESS ----
  We are using Express framework for running our 
  web application and then starting an http server with it
*/
const express = require("express");
const app = express();
const routes = require('./src/routes/router.js');
const server = require("http").Server(app);

/*  
  ---- WEBSOCKETS ----
  We are using socket.io to run websockets
  between peers in our application. 
*/
const io = require("socket.io")(server);

/*
  ---- Misc. dependency imports followed -----
*/
const bodyParser = require("body-parser");
const fs = require('fs');
const {
  ExpressPeerServer
} = require("peer");


/*
  ---- Initializing PASSPORT and FLASH ---- 
*/
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session') // express session import
const {
  promisify
} = require('util')
const readFile = promisify(fs.readFile)
const initializePassport = require('./passport-config.js');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

/*
  ---- APP USAGE ----
*/
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(express.static("public"));
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
app.use(express.urlencoded({
  extended: false
}))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.json());
app.use('/peerjs', peerServer);
app.use('/', routes);

/**
 * <<------- SOURCE ------->> 
 */

let pending_meetings = require('./src/container/meetings').pending_meetings;
let started_meetings = require('./src/container/meetings').started_meetings;
var users = [];
let rooms = []; // all socket rooms


io.on("connection", socket => {
  // when the event 'join-room' is triggered we are to listen to it.
  socket.on("join-room", (roomId, userPointer) => {

      // joining with roomId from front-end (creating a socket room)
      let room = rooms.find(o => o.id === roomId); // find if a room already exists in our rooms array
      if (room == undefined) {
          rooms.push({
              id: roomId,
              host: userPointer,
              hostsocketID: socket.id,
              connected: [{
                  socketID: socket.id,
                  userPointer: userPointer,
                  isHost: true,
              }],
              tracks: []
          })
      } else {
          // room exists
          room.connected.push({
              socketID: socket.id,
              userPointer: userPointer,
              isHost: false,
          })
          room = rooms.find(o => o.id === roomId);
      }
      socket.join(roomId)

      console.log(`${userPointer} has joined this room ` + roomId);

      // telling all others that a new user has joined 
      room = rooms.find(o => o.id == roomId);
      const _connectedUsers = room.connected;
      let connectedUsers = [];
      _connectedUsers.forEach(element => {
          const user = users.find(o => o.id == element.userPointer);
          connectedUsers.push({
              id: user.id,
              f_name: user.f_name,
              l_name: user.l_name,
              email: user.email,
          })
      });
      room = rooms.find(o => o.id === roomId);
      io.sockets.in(roomId).emit('sfu-user-update', room.tracks);
      io.sockets.in(roomId).emit('connected-users-list', connectedUsers);
      socket.to(roomId).broadcast.emit("user-connected", connectedUsers, socket.id);

      socket.on('user-mute', (remoteMedia) => socket.to(roomId).broadcast.emit('user-mute', remoteMedia));
      socket.on('user-unmute', (remoteMedia) => socket.to(roomId).broadcast.emit('user-unmute', remoteMedia));


      socket.on('user-videoOff', (remoteMediaID) => {
          socket.to(roomId).broadcast.emit('user-videoOff', remoteMediaID);
      })

      socket.on('user-videoOn', (remoteMediaID) => {
          socket.to(roomId).broadcast.emit('user-videoOn', remoteMediaID);
      })

      socket.on('message', (message, whoSentID) => {
          const user = users.find(o => o.id == whoSentID);
          const name = user.f_name;
          io.to(roomId).emit('createMessage', message, name);
      });

      socket.on('reqVideoRemove', id => {
          io.to(roomId).emit('removeVideo', id);
      })

      socket.on('reqVideoAdd', id => {
          io.to(roomId).emit('addVideo', id);
      })

      socket.on('sfu-user-connected', (user_id, media_id, room_id) => {
          room = rooms.find(o => o.id === room_id);
          const media = room.tracks.find(o => o.user_id == user_id);
          if (media == undefined) room.tracks.push({
              media_id: media_id,
              user_id: user_id
          })
          else {
              const index = room.tracks.indexOf(media);
              if (index > -1) room.tracks.splice(index, 1);
              room.tracks.push({
                  media_id: media_id,
                  user_id: user_id
              })
          }
          io.sockets.in(room_id).emit('sfu-user-update', room.tracks);
      })

      socket.on("disconnect", reason => {
          room = rooms.find(o => o.id === roomId);
          io.sockets.in(roomId).emit('sfu-user-update', room.tracks);
          for (var i = 0; i < rooms.length; i++) {
              for (var j = 0; j < rooms[i].connected.length; j++) {
                  if (rooms[i].connected[j].socketID == socket.id) {
                      // found disconnected user (guaranteed to be only one)
                      console.log(`${rooms[i].connected[j].userPointer} has left this room ` + rooms[i].id);
                      let meeting = started_meetings.find(o => o.key === rooms[i].id);
                      const index = meeting.users.indexOf(rooms[i].connected[j].userPointer);
                      if (index > -1) {
                          meeting.users.splice(index, 1);
                      }
                      rooms[i].connected.splice(j, 1);
                  }
              }
          }
          const clients = io.sockets.adapter.rooms[`${roomId}`];
          const numClients = clients ? clients.size : 0;
          if (numClients <= 0) {
              let meeting = started_meetings.find(o => o.key == roomId);
              const index = started_meetings.indexOf(meeting);
              if (index > -1) {
                  started_meetings.splice(index, 1);
              }
          }
          room = rooms.find(o => o.id == roomId)
          const _connectedUsers = room.connected;
          let connectedUsers = [];
          _connectedUsers.forEach(element => {
              const user = users.find(o => o.id == element.userPointer);
              connectedUsers.push({
                  id: user.id,
                  f_name: user.f_name,
                  l_name: user.l_name,
                  email: user.email,
              })
          });
          io.to(roomId).emit("userDisconnected", userPointer, connectedUsers);
      });
  });

});


async function LoadUsers() {
  const data = await readFile('./db/users_secure.json', 'utf-8');
  obj = JSON.parse(data);
  if (!obj) return;
  for (var i = 0; i < obj.users.length; i++) {
      users.push(obj.users[i]);
  }
}

LoadUsers();

const UpdateUsers = setInterval(async function() {
  const data = await readFile('./db/users_secure.json', 'utf-8');
  obj = JSON.parse(data);
  users = obj.users;
}, 25000);


server.listen(process.env.PORT || 3030)
console.log("Server now running on http://localhost:3030")
