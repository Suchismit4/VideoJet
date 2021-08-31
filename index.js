// REMINDER: TODO Fix meeting check method to check if a meeting is valid but not started. Implement waiting room.

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
// imports
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const fs = require('fs');
const { v4: uuidv4 } = require("uuid");
const utils = require('./utils.js')
const { ExpressPeerServer } = require("peer");

// importing essentials for login system
const bcrypt = require('bcrypt');
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session') // express session import
const {
  promisify
} = require('util')
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const initializePassport = require('./passport-config.js');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

// settings
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

let pending_meetings = [];
let started_meetings = [];
var users = [];
let rooms = []; // all socket rooms

// root route for login
app.get("/", CheckNotAuth, (req, res) => {
  res.render("index", { isLogin: false, err: 100 })
});

// dashboard 
app.get('/dashboard', CheckAuth, (req, res) => {
  res.render('dashboard', { user: req.user, loggedIn: true, err: 100, meetings: pending_meetings })
})

app.post('/user/login', CheckNotAuth, passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/',
  failureFlash: true
}));

// get request to handle displaying register
app.get('/admin/register', CheckAuth, (req, res) => {
  if (req.user.type != "admin") return res.redirect('/');
  res.render('register');
});

app.get('/share/meeting/:id', (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.params.id);
    res.render('joinmeeting.ejs', { user: req.user, loggedIn: true, id: req.params.id });
  } else {
    res.render('joinmeeting.ejs', { user: false, loggedIn: false, id: false });
  }
})

// post signal for login
app.post('/admin/register/server', CheckAuth, async (req, res) => {
  try {
    if (req.user.type != "admin") return res.redirect('/');
    const email = req.body.email;
    const password = req.body.password;
    const _hashedPassword = await bcrypt.hash(password, 10);
    const id = Date.now().toString();
    users.push({
      id: id,
      email: email,
      password: _hashedPassword,
      f_name: req.body.f_name,
      l_name: req.body.l_name,
      type: "student",
    })
    res.redirect('/');
    const TryUpload = async () => {
      const data = await readFile('./db/users_secure.json', 'utf-8');
      obj = JSON.parse(data);
      var _users = obj.users;
      _users.push({
        id: id,
        email: email,
        password: _hashedPassword,
        f_name: req.body.f_name,
        l_name: req.body.l_name,
        type: "student",
      });
      json = JSON.stringify(obj, 2, null);
      await writeFile('./db/users_secure.json', json, 'utf-8');
    }
    TryUpload();
  } catch {
    res.redirect('/admin/register?state=false&err=001');
  }
});

// create a meeting
app.post('/create/meeting/', CheckAuth, (req, res) => {
  const meeting_key = uuidv4();
  const pwd = Math.floor(Math.random() * 90000) + 10000;
  const meeting = {
    id: Date.now().toString(),
    key: meeting_key,
    hostID: req.user.id,
    pwd: pwd,
    topic: req.body.topic,
    type: req.body.type,
    desc: req.body.desc,
    start: false,
    max: 20,
    users: []
  }
  pending_meetings.push(meeting);
  res.send(meeting);
});

app.get('/err', (req, res) => res.render('err'));

app.post('/meeting/start/:id', CheckAuth ,(req, res) => {
  if(isOccupied(req.user.id)) return res.send('err');
  let meeting = pending_meetings.find(o => o.id == req.params.id);
  let data = {
    meeting_id: meeting.id,
    meeting_password: meeting.pwd
  }
  res.send(data);
  started_meetings.push(meeting);
  const i = pending_meetings.indexOf(meeting);
  if (i > -1) {
    pending_meetings.splice(i, 1);
  }
})

app.post('/join/meeting', CheckAuth, (req, res) => {
  if(isOccupied(req.user.id)) return res.send('err');
  let meeting = started_meetings.find(o => o.id == req.body.id);
  if (meeting == undefined || meeting.pwd != req.body.pwd) return res.send('err');;
  meeting.users.push(req.user.id);
  res.send(`/meeting/${meeting.key}`);
})

// getting the uuid room route
app.get("/meeting/:room", CheckAuth, (req, res) => {
  let meeting = started_meetings.find(o => o.key === req.params.room);
  if (meeting == undefined) res.redirect('/');
  else {
    if (meeting.users.includes(req.user.id)) {
      res.render("room", { roomId: req.params.room, id_user: req.user.id });
    }
  }
});


// when a new user connects to our network
io.on("connection", socket => {
  // when the event 'join-room' is triggered we are to listen to it.
  socket.on("join-room", (roomId, userId, userPointer) => {
    // joining with roomId from front-end (creating a socket room)
    const room = rooms.find(o => o.id === roomId); // find if a room already exists in our rooms array
    if (room == undefined) {
      rooms.push({
        id: roomId,
        host: userPointer,
        hostUserID: userId,
        hostsocketID: socket.id,
        connected: [
          {
            socketID: socket.id,
            userPointer: userPointer,
            userID: userId,
            isHost: true,
          }
        ]
      })
    } else {
      // room exists
      room.connected.push({
        socketID: socket.id,
        userPointer: userPointer,
        userID: userId,
        isHost: false,
      })
    }
    socket.join(roomId)
    console.log(`${userId} has joined this room ` + roomId + ` and userID is ${userPointer}`);
    // telling all others that a new user has joined
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on('message', message => {
      io.to(roomId).emit('createMessage', message);
    });

    socket.on("disconnect", reason => {
      io.to(roomId).emit("userDisconnected", userId);
      for (var i = 0; i < rooms.length; i++) {
        for (var j = 0; j < rooms[i].connected.length; j++) {
          if (rooms[i].connected[j].socketID == socket.id) {
            //found disconnected user
            console.log(`${rooms[i].connected[j].userID} has left this room ` + rooms[i].id + ` and userID is ${rooms[i].connected[j].userPointer}`);
            let meeting = started_meetings.find(o => o.key === rooms[i].id);
            const index = meeting.users.indexOf(rooms[i].connected[j].userPointer);
            if (index > -1) {
              meeting.users.splice(index, 1);
            }
            rooms[i].connected.splice(j, 1);
            console.log(rooms[i].connected);
          }
        }
      }
      const clients = io.sockets.adapter.rooms[`${roomId}`];
      const numClients = clients ? clients.size : 0;
      if (numClients <= 0) {
        pending_meetings.length = 0;
      }
    });

  });

});

console.log("Running...");

// Authentication Middleware functions

function CheckAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
}

function CheckNotAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  next();
}

async function LoadUsers() {
  const data = await readFile('./db/users_secure.json', 'utf-8');
  obj = JSON.parse(data);
  if (!obj) return;
  for (var i = 0; i < obj.users.length; i++) {
    users.push(obj.users[i]);
  }
}

LoadUsers();

const UpdateUsers = setInterval(async function () {
  const data = await readFile('./db/users_secure.json', 'utf-8');
  obj = JSON.parse(data);
  users = obj.users;
}, 25000);

function isOccupied(userID){
  for(var i = 0; i < started_meetings.length; i++){
    if(started_meetings[i].users.includes(userID)){
      return true;
    }
  }
  for(var i = 0; i < started_meetings.length; i++){
    if(started_meetings[i].users.includes(userID)){
      return true;
    }
  }
  return false;
}

server.listen(process.env.PORT || 3030);
