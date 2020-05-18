var express = require("express");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var path = require("path");
var url = require("url");
var querystring = require("querystring");
var socket = require("socket.io");

// App setup
var app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.set("views", path.join(__dirname, "views"));
const PORT = process.env.PORT || 5000;
var server = app.listen(PORT, function () {
  console.log(`listening to request on port ${PORT}`);
});

// Static files
app.use(express.static("public"));

// Socket setup
var io = socket(server);

var roomUserMap = new Map();
var socketUsernameMap = new Map();
var socketRoomMap = new Map();
io.on("connection", (socket) => {
  console.log("made socket connection", socket.id);

  socket.on("disconnect", () => {
    console.log("socket disconnected", socket.id);
    const username = socketUsernameMap.get(socket.id);
    const room = socketRoomMap.get(socket.id);
    if (roomUserMap.has(room))
      roomUserMap.set(
        room,
        roomUserMap.get(room).filter((val) => val != username)
      );
    socketUsernameMap.delete(socket.id);
    socketRoomMap.delete(socket.id);
    console.log(username + " has left room " + room);
    io.to(room).emit("joined", {
      users: roomUserMap.get(room)
    });
  });

  socket.on("join", (data) => {
    const room = data.room;
    const username = data.username;
    socketUsernameMap.set(socket.id, username);
    socketRoomMap.set(socket.id, room);
    socket.join(room);
    console.log(username + " joined room " + room);
    io.to(data.room).emit("joined", {
      users: roomUserMap.get(room)
    });
  });

  socket.on("play", (data) => {
    console.log(socketUsernameMap.get(socket.id) + ' play ', data.currentTime)
    socket.broadcast.to(socketRoomMap.get(socket.id)).emit("play", data);
  });

  socket.on("pause", (data) => {
    console.log(socketUsernameMap.get(socket.id) + ' pause ', data.currentTime)
    socket.broadcast.to(socketRoomMap.get(socket.id)).emit("pause", data);
  });
});

function checkUsernameExists(room, username) {
  return roomUserMap.has(room) && roomUserMap.get(room).includes(username);
}

app.get("/", function (req, res, next) {
  res.render("index.ejs", {
    room: req.query.room,
    username: req.query.username,
    inRoom: false,
    duplicateUsername: false,
  });
});

app.post("/", function (req, res, next) {
  const room = req.body.room;
  const username = req.body.username;
  if (!roomUserMap.has(room)) roomUserMap.set(room, []);

  const duplicateUser = checkUsernameExists(room, username);
  if (!duplicateUser) roomUserMap.get(room).push(username);
  res.render("index.ejs", {
    room: room,
    username: username,
    inRoom: !duplicateUser,
    duplicateUsername: duplicateUser,
  });
});