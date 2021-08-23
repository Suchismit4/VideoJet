// imports
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");

// settings
app.set("view engine", "ejs");
app.use(express.static("public"));
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
app.use('/peerjs', peerServer);

// root route for creating rooms.
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});


// getting the uuid room route
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// when a new user connects to our network
io.on("connection", (socket) => {
  // when the event 'join-room' is triggered we are to listen to it.
  socket.on("join-room", (roomId, userId) => {
    // joining with roomId from front-end (creating a socket room)
    socket.join(roomId);
    // telling all others that a new user has joined
    socket.to(roomId).emit("user-connected", userId);
  });
});

server.listen(3030);
