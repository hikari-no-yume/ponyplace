#!/usr/bin/env node

var WebSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(9001, function() {
    console.log((new Date()) + ' Server is listening on port 9001');
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // undefined origin (i.e. non-web clients) always allowed
    if (!origin) {
        return true;
    } else if (process.argv.hasOwnProperty('2') && process.argv[2] === '--debug') {
        return true;
    } else {
        return origin === 'http://ponyplace.ajf.me';
    }
}

var badRegex = /fuck|shit|milf|bdsm|fag|faggot|nigga|nigger|clop|(\[\]\(\/[a-zA-Z0-9\-_]+\))/gi;

var fs = require('fs');

function sanitise(obj) {
    if (obj.hasOwnProperty('chat')) {
        obj.chat = obj.chat.substr(0, 100);
        obj.chat = obj.chat.replace(badRegex, 'pony');
        // trim whitespace
        obj.chat = obj.chat.replace(/^\s+|\s+$/g, '');
    }
    return obj;
}

var User = require('./user.js');

var banManager = {
    bannedIPs: [],

    init: function () {
        try {
            var data = JSON.parse(fs.readFileSync('data/bans.json'));
        } catch (e) {
            console.log('Error loading banned users info, skipped');
            return;
        }
        this.bannedIPs = data.IPs;
        console.log('Loaded banned users info');
    },
    save: function () {
        fs.writeFileSync('data/bans.json', JSON.stringify({
            IPs: this.bannedIPs
        }));
        console.log('Saved banned users info');
    },
    addIPBan: function (IP) {
        if (!this.isIPBanned(IP)) {
            this.bannedIPs.push(IP);
            this.save();
        }
    },
    isIPBanned: function (IP) {
        return (this.bannedIPs.indexOf(IP) !== -1);
    }
};

banManager.init();

var roomManager = {
    rooms: [],
    ephemeralRooms: [],

    init: function () {
        var data = JSON.parse(fs.readFileSync('data/rooms.json'));
        this.rooms = data;
        console.log('Loaded rooms');
    },
    has: function (name) {
        for (var i = 0; i < this.rooms.length; i++) {
            // room exists
            if (this.rooms[i].name === name) {
                return true;
            }
        }
        return false;
    },
    get: function (name) {
        for (var i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].name === name) {
                return this.rooms[i];
            }
        }
        throw new Error('There is no room with the name: "' + name + '"');
    },
    onEphemeralJoin: function (name) {
        if (this.ephemeralRooms.hasOwnProperty(name)) {
            this.ephemeralRooms[name]++;
        } else {
            this.ephemeralRooms[name] = 1;
        }
    },
    onEphemeralLeave: function (name) {
        if (this.ephemeralRooms.hasOwnProperty(name)) {
            this.ephemeralRooms[name]--;
            if (this.ephemeralRooms[name] <= 0) {
                delete this.ephemeralRooms[name];
            }
        }
    },
    getList: function () {
        var list = [];
        for (var i = 0; i < this.rooms.length; i++) {
            if (!this.rooms[i].unlisted) {
                list.push({
                    type: this.rooms[i].type,
                    name: this.rooms[i].name,
                    name_full: this.rooms[i].name_full,
                    user_count: this.rooms[i].user_count,
                    user_noun: this.rooms[i].user_noun
                });
            }
        }
        for (var name in this.ephemeralRooms) {
            if (this.ephemeralRooms.hasOwnProperty(name)) {
                list.push({
                    type: 'ephemeral',
                    name: name,
                    user_count: this.ephemeralRooms[name]
                });
            }
        }
        return list;
    }
};

roomManager.init();

function doRoomChange(roomName, user) {
    var room;

    if (roomManager.has(roomName)) {
        room = roomManager.get(roomName);
    } else {
        room = {
            type: 'ephemeral',
            name: roomName
        };
    }

    var oldRoom = user.room;

    // don't if in null room (lobby)
    if (oldRoom !== null) {
        // tell clients in old room that client has left
        User.forEach(function (iterUser) {
            if (iterUser.room === oldRoom && iterUser.nick !== user.nick) {
                iterUser.send({
                    type: 'die',
                    nick: user.nick
                });
            }
        });
        // decrease user count of old room
        if (roomManager.has(oldRoom)) {
            roomManager.get(oldRoom).user_count--;
        } else {
            roomManager.onEphemeralLeave(oldRoom);
        }
    }
    
    // set current room to new room
    user.room = room.name;
    
    // tell client it has changed room and tell room details
    user.send({
        type: 'room_change',
        data: room
    });
    
    User.forEach(function (iterUser) {
        if (iterUser.room === user.room) {
            if (iterUser.nick !== user.nick) {
                // tell client about other clients in room
                user.send({
                    type: 'appear',
                    obj: iterUser.obj,
                    nick: iterUser.nick,
                    special: iterUser.special
                });
                // tell other clients in room about client
                iterUser.send({
                    type: 'appear',
                    obj: user.obj,
                    nick: user.nick,
                    special: user.special
                });
            }
        }
    });

    // increase user count of new room
    if (roomManager.has(room.name)) {
        room.user_count++;
    } else {
        roomManager.onEphemeralJoin(room.name);
    }
}

function handleCommand(cmd, myNick, user) {
    function sendLine(line, nick) {
        nick = nick || myNick;
        User.get(nick).send({
            type: 'console_msg',
            msg: line
        });
    }
    function sendMultiLine(lines) {
        for (var i = 0; i < lines.length; i++) {
            sendLine(lines[i]);
        }
    }

    var isMod = User.isModerator(myNick);
    
    // help
    if (cmd.substr(0, 4) === 'help') {
        if (isMod) {
            sendMultiLine([
                'Five moderator commands are available: 1) kick, 2) kickban, 3) broadcast, 4) aliases, 5) move',
                '1. kick - Takes the nick of someone, they (& any aliases) will be kicked, e.g. /kick sillyfilly',
                '2. kickban - Like /kick but also permabans by IP, e.g. /kickban stupidfilly',
                '3. broadcast - Sends a message to everyone on the server, e.g. /broadcast Hello all!',
                "4. aliases - Lists someone's aliases (people with same IP address), e.g. /aliases joebloggs",
                '5. move - Forcibly moves a user to a room, e.g. /move canterlot sillyfilly'
            ]);
            
        }
        sendMultiLine([
            'Five user commands are available: 1) whereis, 2) list, 3) join, 4) setpass, 5) rmpass',
            '1. whereis - Takes a nick, tells you what room someone is in, e.g. /whereis someguy',
            '2. list - Lists available rooms, e.g. /list',
            "3. join - Joins a room, e.g. /join library - if that room doesn't exist, an ephemeral room will be created",
            '4. setpass - Creates an account with given password or changes the password, e.g. /setpass opensesame',
            '5. rmpass - Deletes your account, e.g. /rmpass'
        ]);
    // where is
    } else if (cmd.substr(0, 8) === 'whereis ') {
        var unfound = cmd.substr(8);
        if (!User.has(unfound)) {
            sendLine('There is no user with nick: "' + unfound + '"');
            return;
        }
        var unfoundUser = User.get(unfound);
        if (unfoundUser.room === null) {
            sendLine('User "' + unfound + '" is not in a room.');
        } else {
            if (roomManager.has(unfoundUser.room)) {
                sendLine('User "' + unfound + '" is in ' + unfoundUser.room + ' ("' + roomManager.get(unfoundUser.room).name_full + '")');
            } else {
                sendLine('User "' + unfound + '" is in the ephemeral room "' + unfoundUser.room + '"');
            }
        }
    // join room
    } else if (cmd.substr(0, 5) === 'join ') {
        var roomName = cmd.substr(5);

        if (roomName.indexOf(' ') !== -1) {
            sendLine('Room names cannot contain spaces.');
        } else {
            doRoomChange(roomName, user);
        }
    // list rooms
    } else if (cmd.substr(0, 4) === 'list') {
        var roomList = roomManager.getList(), roomNames = [];
        for (var i = 0; i < roomList.length; i++) {
            if (roomList[i].type !== 'ephemeral') {
                roomNames.push(roomList[i].name);
            } else {
                roomNames.push(roomList[i].name + ' (ephemeral)');
            }
        }
        sendLine(roomList.length + ' rooms available: ' + roomNames.join(', '));
    // create account
    } else if (cmd.substr(0, 8) === 'setpass ') {
        var password = cmd.substr(8);

        if (password.length > 0) {
            if (User.hasPassword(myNick)) {
                sendLine('Changed password');
            } else {
                sendLine('Created account');
            }
            User.setPassword(myNick, password);
            user.send({
                type: 'have_bits',
                amount: User.hasBits(user.nick)
            });
        } else {
            sendLine('Password must be at least 1 characters in length');
        }
    // remove account
    } else if (cmd.substr(0, 10) === 'rmpass yes') {
        if (user.didConfirm) {
            User.removePassword(myNick);
            sendLine("Your account was deleted.");
            user.didConfirm = false;
            user.send({
                type: 'have_bits',
                amount: User.hasBits(user.nick)
            });
        } else {
            sendLine("You need to do /rmpass first to delete your account.");
        }
    // don't remove account
    } else if (cmd.substr(0, 9) === 'rmpass no') {
        user.didConfirm = false;
        sendLine("Your account was not deleted.");
    // remove account confirm
    } else if (cmd.substr(0, 6) === 'rmpass') {
        if (User.hasPassword(myNick)) {
            sendLine("Are you sure you want to delete your account?");
            sendLine("You'll lose all your bits and items, and your nickname will be unprotected.");
            sendLine("If you're sure, do: /rmpass yes");
            sendLine("Otherwise, do: /rmpass no");
            user.didConfirm = true;
        } else {
            sendLine("You don't have an account");
        }
    // kickbanning
    } else if (isMod && cmd.substr(0, 8) === 'kickban ') {
        var kickee = cmd.substr(8);
        if (!User.has(kickee)) {
            sendLine('There is no user with nick: "' + kickee + '"');
            return;
        }
        if (User.isModerator(kickee)) {
            sendLine('You cannot kickban other moderators');
            return;
        }
        var IP = User.get(kickee).conn.remoteAddress;
        banManager.addIPBan(IP);
        // Kick aliases
        User.forEach(function (iterUser) {
            if (iterUser.conn.remoteAddress === IP) {
                // kick
                iterUser.kick('ban');
                console.log('Kicked alias "' + iterUser.nick + '" of user with IP ' + IP);
                sendLine('Kicked alias "' + iterUser.nick + '" of user with IP ' + IP);
            }
        });
    // kicking
    } else if (isMod && cmd.substr(0, 5) === 'kick ') {
        var kickee = cmd.substr(5);
        if (!User.has(kickee)) {
            sendLine('There is no user with nick: "' + kickee + '"');
            return;
        }
        var IP = User.get(kickee).conn.remoteAddress;
        // Kick aliases
        User.forEach(function (iterUser) {
            if (iterUser.conn.remoteAddress === IP) {
                // kick
                iterUser.kick('kick');
                console.log('Kicked alias "' + iterUser.nick + '" of user with IP ' + IP);
                sendLine('Kicked alias "' + iterUser.nick + '" of user with IP ' + IP);
            }
        });
    // forced move
    } else if (isMod && cmd.substr(0, 5) === 'move ') {
        var pos = cmd.indexOf(' ', 5);
        if (pos !== -1) {
            var room = cmd.substr(5, pos-5);
            var movee = cmd.substr(pos+1);
            if (!User.has(movee)) {
                sendLine('There is no user with nick: "' + movee + '"');
                return;
            }
            if (User.isModerator(movee)) {
                sendLine('You cannot move other moderators');
                return;
            }
            doRoomChange(room, User.get(movee));
            sendLine('You were forcibly moved room by ' + myNick, movee);
        } else {
            sendLine('/move takes a room and a nickname');
            return;
        }
    // check alias
    } else if (isMod && cmd.substr(0, 8) === 'aliases ') {
        var checked = cmd.substr(8);
        if (!User.has(checked)) {
            sendLine('There is no user with nick: "' + checked + '"');
            return;
        }
        var IP = User.get(checked).conn.remoteAddress;
        // Find aliases
        var aliasCount = 0;
        sendLine('User with IP ' + IP + ' has the following aliases:');
        User.forEach(function (iterUser) {
            if (iterUser.conn.remoteAddress === IP) {
                sendLine((aliasCount+1) + '. Alias "' + iterUser.nick + '"');
                aliasCount++;
            }
        });
        sendLine('(' + aliasCount + ' aliases total)');
    // broadcast message
    } else if (isMod && cmd.substr(0, 10) === 'broadcast ') {
        var broadcast = cmd.substr(10);
        User.forEach(function (iterUser) {
            iterUser.send({
                type: 'broadcast',
                msg: broadcast
            });
        });
        console.log('Broadcasted message "' + broadcast + '" from user "' + myNick + '"');
        sendLine('Broadcasted message');
    // unknown
    } else {
        sendLine('Unknown command');
    }
}

var keypress = require('keypress');

keypress(process.stdin);

process.stdin.on('keypress', function (chunk, key) {
    if (key && key.name === 'u') {
        User.forEach(function (iterUser) {
            // kick for update
            iterUser.kick('update');
            console.log('Update-kicked ' + iterUser.nick);
        });
        wsServer.shutDown();
        console.log('Gracefully shut down server. Exiting.');
        process.exit();
    } else if (key && key.ctrl && key.name === 'c') {
        process.exit();
    }
});

process.stdin.setRawMode(true);
process.stdin.resume();

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    // IP ban
    if (banManager.isIPBanned(request.remoteAddress)) {
        request.reject();
        console.log((new Date()) + ' Connection from banned IP ' + request.remoteAddress + ' rejected.');
        return;
    }

    try {
        var connection = request.accept('ponyplace-broadcast', request.origin);
    } catch (e) {
        console.log('Caught error: ' + e);
        return;
    }
    console.log((new Date()) + ' Connection accepted from IP ' + connection.remoteAddress);    

    var amConnected = true;
    
    // this user
    var user = null, myNick = null;
    
    function onMessage(message) {
        if (!amConnected) {
            return;
        }

        // handle unexpected packet types
        // we don't use binary frames
        if (message.type !== 'utf8') {
            user.kick('protocol_error');
            return;
        }
        
        // every frame is a JSON-encoded packet
        try {
            var msg = JSON.parse(message.utf8Data);
        } catch (e) {
            user.kick('protocol_error');
            return;
        }
        
        switch (msg.type) {
            case 'console_command':
                if (msg.hasOwnProperty('cmd')) {
                    handleCommand(msg.cmd, myNick, user);
                    return;
                }
            break;
            case 'update':
                msg.obj = sanitise(msg.obj);
                
                // update their stored state
                user.obj = msg.obj;
                
                // broadcast new state to other clients in same room
                User.forEach(function (iterUser) {
                    if (iterUser.conn !== connection && iterUser.room === user.room) {
                        iterUser.send({
                            type: 'update',
                            obj: msg.obj,
                            nick: user.nick
                        });
                    }
                });
            break;
            case 'room_change':
                var roomExists = false, room = null;

                if (msg.name.indexOf(' ') === -1) {
                    doRoomChange(msg.name, user);
                } else {
                    user.kick('protocol_error');
                }
            break;
            case 'room_list':
                // tell client about rooms
                user.send({
                    type: 'room_list',
                    list: roomManager.getList(),
                    user_count: User.userCount
                });
            break;
            // handle unexpected packet types
            default:
                User.kick('protocol_error');
            break;
        }
    }
    
    // Deals with first message
    connection.once('message', function(message) {
        if (!amConnected) {
            return;
        }
        // handle unexpected packet types
        // we don't use binary frames
        if (message.type !== 'utf8') {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'protocol_error'
            }));
            connection.close();
            return;
        }

        console.log('Received Initial Message: ' + message.utf8Data);
        
        // every frame is a JSON-encoded packet
        try {
            var msg = JSON.parse(message.utf8Data);
        } catch (e) {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'protocol_error'
            }));
            connection.close();
            return;
        }
        
        // We're expecting an appear packet first
        // Anything else is unexpected
        if (msg.type !== 'appear') {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'protocol_error'
            }));
            connection.close();
            return;
        }

        // Prevent stupidity
        if (msg.password && !User.hasPassword(msg.nick)) {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'no_password'
            }));
            connection.close();
            return;
        }
        
        // Name banning and prevent nickname dupe
        if (User.has(msg.nick)) {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'nick_in_use'
            }));
            connection.close();
            return;
        // Prevent nick spoofing
        } else if (!User.isCorrectPassword(msg.nick, msg.password) && User.hasPassword(msg.nick)) {
            if (!msg.password) {
                connection.sendUTF(JSON.stringify({
                    type: 'kick',
                    reason: 'password_required'
                }));
            } else {
                connection.sendUTF(JSON.stringify({
                    type: 'kick',
                    reason: 'wrong_password'
                }));
            }
            connection.close();
            return;
        // Prefent profane/long/short/additional whitespace nicks
        } else if ((!!msg.nick.match(badRegex)) || msg.nick.length > 18 || msg.nick.length < 1 || /^\s+|\s+$/g.test(msg.nick)) {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'bad_nick'
            }));
            connection.close();
            return;
        }
        
        msg.obj = sanitise(msg.obj);
        
        // tell client about rooms
        connection.sendUTF(JSON.stringify({
            type: 'room_list',
            list: roomManager.getList(),
            user_count: User.userCount
        }));

        // tell client they have special status, if they do
        var special = User.getSpecialStatus(msg.nick);
        if (special) {
            connection.sendUTF(JSON.stringify({
                type: 'are_special',
                status: special
            }));
        }

        // tell client how many bits they have
        connection.sendUTF(JSON.stringify({
            type: 'have_bits',
            amount: User.hasBits(msg.nick)
        }));
        
        myNick = msg.nick;
        user = new User(msg.nick, connection, msg.obj, null);
        
        // call onMessage for subsequent messages
        connection.on('message', onMessage);
    });
    
    connection.on('close', function(reasonCode, description) {
        amConnected = false;
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        if (user !== null && User.has(myNick)) {
            // remove from users map
            user.kill();
            
            // don't if in null room (lobby)
            if (user.room !== null) {
                // broadcast user leave to other clients
                User.forEach(function (iterUser) {
                    if (iterUser.room === user.room) {
                        iterUser.send({
                            type: 'die',
                            nick: user.nick
                        });

                    }
                });
                // decrease user count of room
                if (roomManager.has(user.room)) {
                    roomManager.get(user.room).user_count--;
                } else {
                    roomManager.onEphemeralLeave(user.room);
                }
            }
        }
    });
});
