var express = require("express");
var socket = require("socket.io");

// App setup
var app = express();
var server = app.listen(process.env.PORT, function () {
    console.log(`listening to request on port ${process.env.PORT}`);
});

// Static files
app.use(express.static("public"));

// Socket setup
var io = socket(server);

io.on("connection", (socket) => {
    console.log("made socket connection", socket.id);

    socket.on('play', (data) => {
        io.sockets.emit('play', data);
    });

    socket.on('pause', (data) => {
        io.sockets.emit('pause', data);
    });
});