// client.js is loaded by the page after you've authenticated to github
$(document).ready(function () {
  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();
    // emit an event  
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
});

//allow client to connect
//The comment below suppresses the error you would normally see since 'io' is not defined in the file.
/*global io*/
let socket = io();

// implement a way for your client to listen for event send by server!
socket.on('user', (data) => {
  $('#num-users').text(data.currentUsers + ' users online');
  let message =
    data.username +
    (data.connected ? ' has joined the chat.' : ' has left the chat.');
  $('#messages').append($('<li>').html('<b>' + message + '</b>'));
});

socket.on('chat message', (data) => {
  let message =
    data.username + ";" + data.message;
  $('#messages').append($('<li>').html(message));
});
