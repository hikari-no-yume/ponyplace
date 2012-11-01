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

var specialManager = {
    passwords: {},
    specialNicks: {},

    init: function () {
        var that = this;
        fs.readFile('special-users.json', 'utf8', function (err, data) {
            if (err) {
                throw err;
            }
            
            that.specialNicks = JSON.parse(data);
            console.log('Loaded special users info');
        });
        fs.readFile('passwords.json', 'utf8', function (err, data) {
            if (err) {
                throw err;
            }
            
            that.passwords = JSON.parse(data);
            console.log('Loaded passwords');
        });
    },
    savePasswords: function () {
        fs.writeFile('passwords.json', JSON.stringify(this.passwords), 'utf-8', function (err) {
            if (err) {
                throw err;
            };
        });
    },
    
    getSpecialStatus: function (nick) {
        if (this.specialNicks.hasOwnProperty(nick)) {
            return this.specialNicks[nick];
        }
        return false;
    },
    isModerator: function (nick) {
        var status = this.specialNicks[nick];
        return (status === 'moderator' || status === 'creator' || status === 'bot');
    },
    isCorrectPassword: function (nick, password) {
        if (!this.hasPassword(nick)) {
            return false;
        }
        return (this.passwords[nick] === password);
    },
    setPassword: function (nick, password) {
        this.passwords[nick] = password;
        this.savePasswords();
    },
    removePassword: function (nick) {
        delete this.passwords[nick];
        this.savePasswords();
    },
    hasPassword: function (nick) {
        return this.passwords.hasOwnProperty(nick);
    }
};

specialManager.init();

var userManager = {
    users: {},
    
    add: function (nick, conn, obj, special, room) {
        if (this.has(nick)) {
            throw new Error('There is already a user with the same nick "' + nick + '"');
        }
    
        var user = {
            conn: conn,
            obj: obj,
            nick: nick,
            room: room,
            special: special
        };
        
        // store in users map
        this.users[nick] = user;
        
        return user;
    },
    remove: function (nick) {
        this.hasCheck(nick);
    
        delete this.users[nick];
    },
    send: function (nick, msg) {
        this.hasCheck(nick);
        
        var conn = this.users[nick].conn;
        conn.sendUTF(JSON.stringify(msg));
    },
    disconnect: function (nick) {
        this.hasCheck(nick);
        
        var conn = this.users[nick].conn;
        conn.close();
    },
    kick: function (nick, reason) {
        this.hasCheck(nick);
        
        var conn = this.users[nick].conn;
        if (reason) {
            this.send(nick, {
                type: 'kick',
                reason: reason
            });
        }
        this.disconnect(nick);
    },
    get: function (nick) {
        this.hasCheck(nick);
        
        return this.users[nick];
    },
    has: function (nick) {
        return this.users.hasOwnProperty(nick);
    },
    hasCheck: function (nick) {
        if (!this.has(nick)) {
            throw new Error('There is no user with the nick: "' + nick + '"');
        }
    },
    forEach: function (callback) {
        for (var nick in this.users) {
            if (this.users.hasOwnProperty(nick)) {
                callback(nick, this.users[nick]);
            }
        }
    }
};

var banManager = {
    bannedIPs: [],

    init: function () {
        var that = this;
        fs.readFile('bans.json', 'utf8', function (err, data) {
            if (err) {
                return;
            }
            
            var data = JSON.parse(data);
            that.bannedIPs = data.IPs;
            console.log('Loaded banned users info');
        });
    },
    save: function () {
        fs.writeFile('bans.json', JSON.stringify({
            IPs: this.bannedIPs
        }), 'utf-8', function (err) {
            if (err) {
                throw err;
            };
        });
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

    init: function () {
        var that = this;
        fs.readFile('rooms.json', 'utf8', function (err, data) {
            if (err) {
                throw err;
            }
            
            var data = JSON.parse(data);
            that.rooms = data;
            console.log('Loaded rooms');
        });
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
    forEach: function (callback) {
        for (var i = 0; i < this.rooms.length; i++) {
            callback(this.rooms[i].name, this.rooms[i]);
        }
    }
};

roomManager.init();

function doRoomChange(myNick, room, user) {
    var oldRoom = user.room;

    // don't if in null room (lobby)
    if (oldRoom !== null) {
        // tell clients in old room that client has left
        userManager.forEach(function (nick, iterUser) {
            if (iterUser.room === oldRoom && nick !== myNick) {
                userManager.send(nick, {
                    type: 'die',
                    nick: myNick
                });
            }
        });
        // decrease user count of old room
        roomManager.get(oldRoom).user_count--;
    }
    
    // set current room to new room
    user.room = room.name;
    
    // tell client it has changed room and tell room details
    userManager.send(myNick, {
        type: 'room_change',
        data: room
    });
    
    userManager.forEach(function (nick, iterUser) {
        if (iterUser.room === user.room) {
            if (nick !== user.nick) {
                // tell client about other clients in room
                userManager.send(myNick, {
                    type: 'appear',
                    obj: iterUser.obj,
                    nick: nick,
                    special: iterUser.special
                });
                // tell other clients in room about client


                userManager.send(nick, {
                    type: 'appear',
                    obj: user.obj,
                    nick: user.nick,
                    special: user.special
                });
            }
        }
    });
    
    // increase user count of new room
    room.user_count++;
}

function handleCommand(cmd, myNick, user) {
    function sendLine(line, nick) {
        nick = nick || myNick;
        userManager.send(nick, {
            type: 'console_msg',
            msg: line
        });
    }
    function sendMultiLine(lines) {
        for (var i = 0; i < lines.length; i++) {
            sendLine(lines[i]);
        }
    }

    var isMod = specialManager.isModerator(myNick);
    
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
            '3. join - Takes a room name, joins that room, e.g. /join library',
            '4. setpass - Sets or changes a password on your nickname, e.g. /setpass opensesame',
            '5. rmpass - Removes the password on your nickname, e.g. /rmpass'
        ]);
    // where is
    } else if (cmd.substr(0, 8) === 'whereis ') {
        var unfound = cmd.substr(8);
        if (!userManager.has(unfound)) {
            sendLine('There is no user with nick: "' + unfound + '"');
            return;
        }
        var unfoundUser = userManager.get(unfound);
        if (unfoundUser.room === null) {
            sendLine('User "' + unfound + '" is not in a room.');
        } else {
            sendLine('User "' + unfound + '" is in ' + unfoundUser.room + ' ("' + roomManager.get(unfoundUser.room).name_full + '")');
        }
    // join room
    } else if (cmd.substr(0, 5) === 'join ') {
        var roomName = cmd.substr(5);
        
        // room doesn't exist
        if (!roomManager.has(roomName)) {
            sendLine('There is no room named "' + roomName + '". Try /list');
            return;
        } else {
            doRoomChange(myNick, roomManager.get(roomName), user);
        }
    // list rooms
    } else if (cmd.substr(0, 4) === 'list') {
        var roomCount = 0;
        
        sendLine('Available rooms:');
        roomManager.forEach(function (roomName, room) {
            sendLine('* ' + roomName + ' ("' + room.name_full + '")');
            roomCount++;
        });
        sendLine('(' + roomCount + ' rooms total)');
    // set password
    } else if (cmd.substr(0, 8) === 'setpass ') {
        var password = cmd.substr(8);

        if (password.length > 0) {
            if (specialManager.hasPassword(myNick)) {
                sendLine('Changed password');
            } else {
                sendLine('Set password');
            }
            specialManager.setPassword(myNick, password);
        } else {
            sendLine('Password must be at least 1 characters in length');
        }
    // set password
    } else if (cmd.substr(0, 6) === 'rmpass') {
        if (specialManager.hasPassword(myNick)) {
            specialManager.removePassword(myNick);
            sendLine('Removed password');
        } else {
            sendLine("You don't have a password set");
        }
    // kickbanning
    } else if (isMod && cmd.substr(0, 8) === 'kickban ') {
        var kickee = cmd.substr(8);
        if (!userManager.has(kickee)) {
            sendLine('There is no user with nick: "' + kickee + '"');
            return;
        }
        if (specialManager.isModerator(kickee)) {
            sendLine('You cannot kickban other moderators');
            return;
        }
        var IP = userManager.get(kickee).conn.remoteAddress;
        banManager.addIPBan(IP);
        // Kick aliases
        userManager.forEach(function (nick, iterUser) {
            if (iterUser.conn.remoteAddress === IP) {
                // kick
                userManager.kick(nick, 'ban');
                console.log('Kicked alias "' + nick + '" of user with IP ' + IP);
                sendLine('Kicked alias "' + nick + '" of user with IP ' + IP);
            }
        });
    // kicking
    } else if (isMod && cmd.substr(0, 5) === 'kick ') {
        var kickee = cmd.substr(5);
        if (!userManager.has(kickee)) {
            sendLine('There is no user with nick: "' + kickee + '"');
            return;
        }
        var IP = userManager.get(kickee).conn.remoteAddress;
        // Kick aliases
        userManager.forEach(function (nick, iterUser) {
            if (iterUser.conn.remoteAddress === IP) {
                // kick
                userManager.kick(nick, 'kick');
                console.log('Kicked alias "' + nick + '" of user with IP ' + IP);
                sendLine('Kicked alias "' + nick + '" of user with IP ' + IP);
            }
        });
    // forced move
    } else if (isMod && cmd.substr(0, 5) === 'move ') {
        var pos = cmd.indexOf(' ', 5);
        if (pos !== -1) {
            var room = cmd.substr(5, pos-5);
            var movee = cmd.substr(pos+1);
            if (!userManager.has(movee)) {
                sendLine('There is no user with nick: "' + movee + '"');
                return;
            }
            if (!roomManager.has(room)) {
                sendLine('There is no room named "' + room + '". Try /list');
                return;
            }
            if (specialManager.isModerator(movee)) {
                sendLine('You cannot move other moderators');
                return;
            }
            doRoomChange(movee, roomManager.get(room), userManager.get(movee));
            sendLine('You were forcibly moved room by ' + myNick, movee);
        } else {
            sendLine('/move takes a room and a nickname');
            return;
        }
    // check alias
    } else if (isMod && cmd.substr(0, 8) === 'aliases ') {
        var checked = cmd.substr(8);
        if (!userManager.has(checked)) {
            sendLine('There is no user with nick: "' + checked + '"');
            return;
        }
        var IP = userManager.get(checked).conn.remoteAddress;
        // Find aliases
        var aliasCount = 0;
        sendLine('User with IP ' + IP + ' has the following aliases:');
        userManager.forEach(function (nick, iterUser) {
            if (iterUser.conn.remoteAddress === IP) {
                sendLine((aliasCount+1) + '. Alias "' + nick + '"');
                aliasCount++;
            }
        });
        sendLine('(' + aliasCount + ' aliases total)');
    // broadcast message
    } else if (isMod && cmd.substr(0, 10) === 'broadcast ') {
        var broadcast = cmd.substr(10);
        userManager.forEach(function (nick) {
            userManager.send(nick, {
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
        userManager.forEach(function (nick) {
            // kick for update
            userManager.kick(nick, 'update');
            console.log('Update-kicked ' + nick);
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
            userManager.kick(myNick, 'protocol_error');
            return;
        }
        
        // every frame is a JSON-encoded packet
        try {
            var msg = JSON.parse(message.utf8Data);
        } catch (e) {
            userManager.kick(myNick, 'protocol_error');
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
                userManager.forEach(function (nick, iterUser) {
                    if (iterUser.conn !== connection && iterUser.room === user.room) {
                        userManager.send(nick, {
                            type: 'update',
                            obj: msg.obj,
                            nick: user.nick
                        });
                    }
                });
            break;
            case 'room_change':
                var roomExists = false, room = null;
                
                // room doesn't exist
                if (!roomManager.has(msg.name)) {
                    userManager.kick(myNick, 'no_such_room');
                    return;
                } else {
                    room = roomManager.get(msg.name);
                }
                
                doRoomChange(myNick, room, user);
                return;
            break;
            case 'room_list':
                // tell client about rooms
                userManager.send(myNick, {
                    type: 'room_list',
                    list: roomManager.rooms
                });
            break;
            // handle unexpected packet types
            default:
                userManager.kick(myNick, 'protocol_error');
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
        
        // Detect owner/mod/bot status
        var special = specialManager.getSpecialStatus(msg.nick);

        // Prevent stupidity
        if (msg.password && !specialManager.hasPassword(msg.nick)) {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'no_password'
            }));
            connection.close();
            return;
        }
        
        // Name banning and prevent nickname dupe
        if (userManager.has(msg.nick)) {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'nick_in_use'
            }));
            connection.close();
            return;
        // Prevent nick spoofing
        } else if (!specialManager.isCorrectPassword(msg.nick, msg.password) && specialManager.hasPassword(msg.nick)) {
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
            list: roomManager.rooms
        }));

        // tell client they have special status, if they do
        if (special) {
            connection.sendUTF(JSON.stringify({
                type: 'are_special',
                status: special
            }));
        }
        
        myNick = msg.nick;
        user = userManager.add(msg.nick, connection, msg.obj, special, null);
        
        // call onMessage for subsequent messages
        connection.on('message', onMessage);
    });
    
    connection.on('close', function(reasonCode, description) {
        amConnected = false;
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        if (user !== null && userManager.has(myNick)) {
            // remove from users map
            userManager.remove(myNick);
            
            // don't if in null room (lobby)
            if (user.room !== null) {
                // broadcast user leave to other clients
                userManager.forEach(function (nick, iterUser) {
                    if (iterUser.room === user.room) {
                        userManager.send(nick, {
                            type: 'die',
                            nick: user.nick
                        });
                    }
                });
                // decrease user count of room
                roomManager.get(user.room).user_count--;
            }
        }
    });
});
