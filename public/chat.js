// Make Connection
var socket = io.connect("https://cryptic-atoll-44901.herokuapp.com/");

// Query DOM
var player = document.querySelector('.video-player');
var inputFile = document.querySelector('.video-input');

var URL = window.URL || window.webkitURL;
var displayMessage = function (message, isError) {
    var element = document.querySelector('#message')
    element.innerHTML = message
    element.className = isError ? 'error' : 'info'
};
var socketPause = false;
var socketPlay = false;

// Emit events
inputFile.addEventListener('change', (event) => {
    var file = event.target.files[0];
    var type = file.type;
    var canPlay = player.canPlayType(type);
    if (canPlay === '') canPlay = 'no';
    var message = 'Can play type "' + type + '": ' + canPlay;
    var isError = canPlay === 'no';
    displayMessage(message, isError);

    if (isError) {
        return;
    }

    var fileURL = URL.createObjectURL(file)
    player.src = fileURL;
});
player.addEventListener('play', (event) => {
    console.log('play', socketPlay);
    if (!socketPlay) {
        socket.emit('play', {
            socketId: socket.id,
            currentTime: event.target.currentTime
        });
    }
    socketPlay = false;
    socketPause = false;
});
player.addEventListener('pause', (event) => {
    console.log('pause', socketPause, event.target.seeking);
    if (!socketPause && !event.target.seeking && !event.target.ended) {
        socket.emit('pause', {
            socketId: socket.id,
            currentTime: event.target.currentTime
        });
    }
    socketPause = false;
});

// Listen for events
socket.on('play', (data) => {
    if (data.socketId != socket.id && !!player.src) {
        player.currentTime = (data.currentTime > player.duration) ? player.duration : data.currentTime;
        socketPlay = true;
        player.play();
    }
});
socket.on('pause', (data) => {
    socketPause = true;
    player.pause();
});