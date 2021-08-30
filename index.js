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
const e = require("express");
// const { Console } = require("console");

// importing essentials for login system 
const bcrypt = require('bcrypt');
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session') // joks session
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
  if(req.isAuthenticated()){
    res.render('joinmeeting.ejs', {user: req.user, loggedIn: true, id: req.params.id});
  }else{
    res.render('joinmeeting.ejs', {user: null, loggedIn: false, id: null});
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

/* ----------------------------------
*         Deprecated [OLD]
*
*  Seperate page to create a meeting
*

  app.get('/admin/create', CheckAuth, (req, res) => {
    if (req.user.type != "auth") return res.redirect('/');
    if (pending_meeting.length >= 1) {
      res.render('create.ejs', { createMeeting: false, login: false, err: 500, })
    } else {
      res.render('create.ejs', { createMeeting: false, login: false, err: 100 })
    }
  })

*  ----------------------------------
*/

// create a meeting
app.post('/create/meeting/', CheckAuth, (req, res) => {
  const meeting_key = uuidv4();
  const pwd = req.body.pwd == null ? Math.floor(Math.random() * 90000) + 10000 : req.params.pwd;
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

app.post('/meeting/start/:id', (req, res) => {
  let meeting = pending_meetings.find(o => o.id == req.params.id);
  meeting.users.push(req.user.id);
  res.send(`/meeting/${meeting.key}`);
  started_meetings.push(meeting);
  const i = pending_meetings.indexOf(meeting);
  if (i > -1) {
    pending_meetings.splice(i, 1);
  }
})

app.post('/join/meeting', CheckAuth, (req, res) => {
  let meeting = started_meetings.find(o => o.id == req.body.id);
  if(meeting == undefined || meeting.pwd != req.body.pwd) return res.send(500);
  meeting.users.push(req.user.id);
  res.send(`/meeting/${meeting.key}`);
})

// getting the uuid room route
app.get("/meeting/:room", CheckAuth, (req, res) => {
  let meeting = started_meetings.find(o => o.key === req.params.room);
  if(meeting == undefined) res.redirect('/');
  else{
    if(meeting.users.includes(req.user.id)){
      res.render("room", { roomId: req.params.room });
    }
  }
});

// when a new user connects to our network
io.on("connection", socket => {
  // when the event 'join-room' is triggered we are to listen to it.
  socket.on("join-room", (roomId, userId) => {
    // joining with roomId from front-end (creating a socket room)
    socket.join(roomId)
    console.log(`${userId} has joined this room ` + roomId);
    // telling all others that a new user has joined
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on('message', message => {
      io.to(roomId).emit('createMessage', message);
    });

    socket.on("disconnect", reason => {
      io.to(roomId).emit("userDisconnected", userId);
      const clients = io.sockets.adapter.rooms[`${roomId}`];
      const numClients = clients ? clients.size : 0;
      if (numClients <= 0) {
        pending_meeting.length = 0;
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

server.listen(process.env.PORT || 3030);
