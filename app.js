var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

//ROUTING
app.use(express.static(__dirname + '/public'));

var userMessages = {
	nick: [],
	msg: []
};

var userList = {};

//CONSOLE LOG CONNECT AND DISCONNECT TO SERVER
io.on('connection', function(client) {
	console.log('Client connected.....')
	client.on('disconnect', function(data) {
		if(!client.nickname) return;
		delete userList[client.nickname];
		io.emit('leave', client.nickname);
		updateUserNames();
		console.log('Client disconnected....');
	});
});


io.on('connection', function(client) {
	var nickname;
	var message;
	//ON CLIENT JOIN UPDATE ACTIVE USER LIST AND EMIT MESSAGES TO USER WHO JOINED
	client.on('join', function(data, callback) {
		io.emit('newuser', data);
		console.log(data);
		if(data in userList) {	
			callback(false);
		} else {
			callback(true);
			client.nickname = data;
			userList[client.nickname] = data;
			updateUserNames();
			updateMessages();
		}
	});
	//ON EVERY SENT MESSAGE STORE THE DATA IN THE userMessages{} AND EMIT THE DATA BACK TO THE CLIENT
	client.on('messages', function(data, callback) {
		// console.log(data);
		var msgArr = [];
		var msg = data.trim();
		if(msg.substring(0,2) === '/w') {
			msgArr = msg.split(' ');
			var newMsg = msgArr.splice(2, msgArr.length - 1);
			newMsg = newMsg.join(' ');
			var name = msgArr[1];
			client.join(name);
			// console.log('newMsg: ' + newMsg);
			// console.log('name: ' + name);
			if(name in userList) {
				console.log('name found');
				io.broadcast.to(name).emit('whisper', {nick: client.nickname, msg: newMsg});
			} else {
				alert('user not found');
			}
		} else {
			var name = client.nickname;
			storeMessage(name, msg);
			io.emit('messages', {nick: name, msg: msg});
		}
	});
});

function storeMessage(name, msg) {
	userMessages.nick.push(name);
	userMessages.msg.push(msg);
}

function updateUserNames() {
	console.log(userList);
	io.emit('usernames', Object.keys(userList));
}

function updateMessages() {
	io.emit('allMessages', {nick: userMessages.nick, msg: userMessages.msg});
}

server.listen(3000)



