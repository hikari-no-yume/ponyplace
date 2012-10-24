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
    if (process.argv.hasOwnProperty('2') && process.argv[2] === '--debug') {
        return true;
    } else {
        return origin === 'http://ponyplace.ajf.me';
    }
}

var badRegex = /desu|rape|cum|wank|9gag|noob|porn|yolo|hash|weed|drug|milf|bdsm|tits|penis|fap|butt|ass|shit|fuck|fag|faggot|bitch|cunt|dick|cock|nigga|nigger|homosexual|gay|clopclop|clopping|(\[\]\(\/[a-zA-Z0-9\-_]+\))/gi;

var fs = require('fs');

var creatorNick, moderatorNicks, passwords;

fs.readFile('special-users.json', 'utf8', function (err, data) {
    if (err) {
        throw err;
    }
    
    data = JSON.parse(data);
    creatorNick = data.creator;
    moderatorNicks = data.moderators;
    passwords = data.passwords;
    console.log('Loaded special users info');
});

function sanitise(obj) {
    if (obj.hasOwnProperty('chat')) {
        obj.chat = obj.chat.substr(0, 100);
        obj.chat = obj.chat.replace(badRegex, 'pony');
        // trim whitespace
        obj.chat = obj.chat.replace(/^\s+|\s+$/g, '');
    }
    return obj;
}

var users = {};

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
    bannedNicks: [],
    bannedIPs: [],
    
    addIPBan: function (IP) {
        if (!this.isIPBanned(IP)) {
            this.bannedIPs.push(IP);
        }
    },
    addNickBan: function (nick) {
        if (!this.isIPBanned(nick)) {
            this.bannedIPs.push(nick);
        }
    },
    isIPBanned: function (IP) {
        return (this.bannedIPs.indexOf(IP) !== -1);
    },
    isNickBanned: function (nick) {
        return (this.bannedNicks.indexOf(nick) !== -1);
    }
};

var roomManager = {
    rooms: [
        {
            name: 'library_es',
            button_label: 'Ir a la biblioteca de Twilight (en español)',
            img: 'media/background-library.png',
            width: 1173,
            user_count: 0,
            user_noun: 'españoles'
        },
        {
            name: 'ponyville',
            button_label: 'Go to Ponyville',
            img: 'media/background-ponyville.png',
            width: 1445,
            user_count: 0,
            user_noun: 'ponies'
        },
        {
            name: "library",
            button_label: "Go to Twilight's Library",
            img: 'media/background-library.png',
            width: 1173,
            user_count: 0,
            user_noun: 'bright sparks'
        },
        {
            name: 'sugarcube_corner',
            button_label: 'Go to Sugarcube Corner',
            img: 'media/background-sugarcubecorner.png',
            width: 1173,
            user_count: 0,
            user_noun: 'party animals'
        },
        {
            name: 'everfree_forest',
            button_label: 'Go to Everfree Forest',
            img: 'media/background-everfreeforest.png',
            width: 1173,
            user_count: 0,
            user_noun: 'rhyming zebras'
        },
        {
            name: 'cloudsdale',
            button_label: 'Go to Cloudsdale',
            img: 'media/background-cloudsdale.png',
            width: 1213,
            user_count: 0,
            user_noun: 'wonderbolts'
        },
        {
            name: 'Canterlot',
            button_label: 'Go to Canterlot',
            img: 'media/background-canterlot.png',
            width: 1173,
            user_count: 0,
            user_noun: 'posh ponies'
        }
    ],
    
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
    }
};

function handleCommand(cmd, myNick, user) {
    // mod powers
    if (user.special === 'moderator' || user.special === 'creator') {
        // kicking
        if (cmd.substr(0, 5) === 'kick ') {
            var kickee = cmd.substr(5);
            if (!userManager.has(kickee)) {
                userManager.send(myNick, {
                    type: 'console_msg',
                    msg: 'There is no user with nick: "' + kickee + '"'
                });
                return;
            }
            if (kickee === creatorNick || moderatorNicks.indexOf(kickee) !== -1) {
                userManager.send(myNick, {
                    type: 'console_msg',
                    msg: 'You cannot kick other moderators or the creator'
                });
                return;
            }
            var IP = userManager.get(kickee).conn.remoteAddress;
            banManager.addIPBan(IP);
            banManager.addNickBan(kickee);
            userManager.kick(kickee);
            console.log('Kickbanned user with nick "' + kickee + '"');
            userManager.send(myNick, {
                type: 'console_msg',
                msg: 'Kickbanned user with nick "' + kickee + '"'
            });
            // Kick other aliases
            userManager.forEach(function (nick, iterUser) {
                if (iterUser.conn.remoteAddress === IP) {
                    // kick
                    userManager.kick(nick);
                    console.log('Kicked alias "' + nick + '" of user with nick "' + kickee + '"');
                    userManager.send(myNick, {
                        type: 'console_msg',
                        msg: 'Kicked alias "' + nick + '" of user with nick "' + kickee + '"'
                    });
                }
            });
        // broadcast message
        } else if (cmd.substr(0, 10) === 'broadcast ') {
            var broadcast = cmd.substr(10);
            userManager.forEach(function (nick) {
                userManager.send(nick, {
                    type: 'broadcast',
                    msg: broadcast
                });
            });
            console.log('Broadcasted message "' + broadcast + '" from user "' + myNick + '"');
            userManager.send(myNick, {
                type: 'console_msg',
                msg: 'Broadcasted message'
            });
        } else if (cmd.substr(0, 4) === 'help') {
            var helpMsg = [
                'Two commands are available:',
                'kick and broadcast.',
                'kick takes a single parameter, the name of someone, e.g. /kick sillyfilly',
                'That person will be kicked, and their name and IP address will be banned.',
                'Also, any of their aliases with the same IP address will be kicked.',
                'Bans only last as long as the life of the server (i.e until it crashes or restarts).',
                'broadcast takes a message as its parameter. It sends it to everyone on the server.',
                'e.g. /kick Meet me in the library!'
            ];
            for (var i = 0; i < helpMsg.length; i++) {
                userManager.send(myNick, {
                    type: 'console_msg',
                    msg: helpMsg[i]
                });
            }
        // unknown
        } else {
            userManager.send(myNick, {
                type: 'console_msg',
                msg: 'Unknown command'
            });
        }
    } else {
        userManager.send(myNick, {
            type: 'console_msg',
            msg: 'Commands require moderator or creator privileges'
        });
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

    var connection = request.accept('ponyplace-broadcast', request.origin);
    console.log((new Date()) + ' Connection accepted.');    
    
    // IP ban
    if (banManager.isIPBanned(connection.remoteAddress)) {
        connection.close();
        return;
    }
    
    // this user
    var user = null, myNick = null;
    
    function onMessage(message) {
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
                
                // don't if in null room (lobby)
                if (user.room !== null) {
                    // tell clients in old room that client has left
                    userManager.forEach(function (nick, iterUser) {
                        if (iterUser.room === user.room && nick !== myNick) {
                            userManager.send(nick, {
                                type: 'die',
                                nick: myNick
                            });
                        }
                    });
                    // decrease user count of old room
                    roomManager.get(user.room).user_count--;
                }
                
                // set current room to new room
                user.room = msg.name;
                
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
        
        var special = false;
        
        // Prevent owner/mod spoofing
        if (msg.nick === creatorNick) {
            special = 'creator';
        } else if (moderatorNicks.indexOf(msg.nick) !== -1) {
            special = 'moderator';
        }
        
        // Name banning and prevent nickname dupe
        if (userManager.has(msg.nick) || banManager.isNickBanned(msg.nick)) {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'nick_in_use'
            }));
            connection.close();
            return;
        // Prevent moderator/creator spoofing
        } else if (special && passwords[msg.nick] !== msg.password) {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'wrong_password'
            }));
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
        
        myNick = msg.nick;
        user = userManager.add(msg.nick, connection, msg.obj, special, null);
        
        // call onMessage for subsequent messages
        connection.on('message', onMessage);
    });
    
    connection.on('close', function(reasonCode, description) {
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
