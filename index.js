// imports
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
const utils = require('./utils.js')
const { ExpressPeerServer } = require("peer");
// const { Console } = require("console");

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
app.use('/peerjs', peerServer);

let pending_meeting = [];

// root route for creating rooms.
app.get("/", (req, res) => {
  res.render("index", { isLogin: false, err: 100, meetings: pending_meeting[0] })
});

// posted signal for logging in 
app.post('/login-check', async (req, res) => {
  const status = await utils.manager.CheckLogin(req);
  if (status) {
    res.redirect('/success/login');
  } else {
    res.render('index',  { isLogin: false, err: 69420, meetings: pending_meeting[0] });
  }
});

// create a meeting
app.get('/admin/create', (req, res) => {
  res.render('create.ejs', {createMeeting: false, login: false, err: 69420})
})

// create a meeting
app.post('/create/meeting/', (req, res) => {
  if(utils.manager.CheckAdmin(req.body)){
    const meeting_key = uuidv4();
    pending_meeting.push(meeting_key);
    res.redirect(`/${meeting_key}`);
    res.render('create.ejs', {createMeeting: true, login: true, err: 100})
  }
})

// after login
app.get('/success/login', (req, res) => {
  res.render("index", { isLogin: true, err: 100, meetings: pending_meeting })

})

// getting the uuid room route
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
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
    });

  });

});

console.log("Running...");

server.listen(process.env.PORT || 3030);
