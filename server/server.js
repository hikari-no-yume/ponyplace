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

var rooms = [
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
];

function sanitise(obj) {
    if (obj.hasOwnProperty('chat')) {
        obj.chat = obj.chat.substr(0, 100);
        obj.chat = obj.chat.replace(badRegex, 'pony');
        // trim whitespace
        obj.chat = obj.chat.replace(/^\s+|\s+$/g, '');
    }
    return obj;
}

var users = {}, bannedList = [], bannedIPList = [], ajfCanJoin = false;

var keypress = require('keypress');

keypress(process.stdin);

process.stdin.on('keypress', function (chunk, key) {
    if (key && key.name === 'u') {
        for (var nick in users) {
            if (users.hasOwnProperty(nick)) {
                // kick for update
                users[nick].conn.sendUTF(JSON.stringify({
                    type: 'kick',
                    reason: 'update'
                }));
                users[nick].conn.close();
                console.log('Update-kicked ' + nick);
            }
        }
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
    
    // this user
    var user = null;
    
    function onMessage(message) {
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
        
        switch (msg.type) {
            case 'update':
                msg.obj = sanitise(msg.obj);
                
                // mod powers
                if (msg.obj.hasOwnProperty('chat') && (user.special === 'moderator' || user.special === 'creator')) {
                    // kicking
                    if (msg.obj.chat.substr(0, 6) === '/kick ') {
                        var kickee = msg.obj.chat.substr(6);
                        if (users.hasOwnProperty(kickee) && kickee !== creatorNick && moderatorNicks.indexOf(kickee) === -1) {
                            users[kickee].conn.close();
                            bannedList.push(kickee);
                            bannedIPList.push(users[kickee].conn.remoteAddress);
                            console.log('Kickbanned user with nick "' + kickee + '"');
                            // Kick other aliases
                            for (var nick in users) {
                                if (users.hasOwnProperty(nick) && users[nick].conn.remoteAddress === users[kickee].conn.remoteAddress) {
                                    // kick
                                    users[nick].conn.close();
                                    console.log('Kickbanned alias "' + nick + '" of user with nick "' + kickee + '"');
                                }
                            }
                        }
                        // don't broadcast
                        return;
                    // broadcast message
                    } else if (msg.obj.chat.substr(0, 11) === '/broadcast ') {
                        var broadcast = msg.obj.chat.substr(11);
                        for (var nick in users) {
                            if (users.hasOwnProperty(nick) ) {
                                users[nick].conn.sendUTF(JSON.stringify({
                                    type: 'broadcast',
                                    msg: broadcast
                                }));
                            }
                        }
                        console.log('Broadcasted message "' + broadcast + '" from user "' + user.nick + '"');
                    }
                }
                
                // update their stored state
                user.obj = msg.obj;
                
                // broadcast new state to other clients in same room
                for (var nick in users) {
                    if (users.hasOwnProperty(nick)) {
                        if (users[nick].conn !== connection && users[nick].room === user.room) {
                            users[nick].conn.sendUTF(JSON.stringify({
                                type: 'update',
                                obj: msg.obj,
                                nick: user.nick
                            }));
                        }
                    }
                }
            break;
            case 'room_change':
                for (var i = 0; i < rooms.length; i++) {
                    // room exists
                    if (rooms[i].name === msg.name) {
                        // tell clients in old room that client has left
                        for (var nick in users) {
                            if (users.hasOwnProperty(nick) && users[nick].room === user.room && nick !== user.nick && user.room !== null) {
                                users[nick].conn.sendUTF(JSON.stringify({
                                    type: 'die',
                                    nick: user.nick
                                }));
                            }
                        }
                        
                        // decrease user count of old room
                        for (var j = 0; j < rooms.length; j++) {
                            if (rooms[j].name === user.room) {
                                rooms[j].user_count--;
                                break;
                            }
                        }
                    
                        user.room = msg.name;
                        
                        // tell client it has changed room and tell room details
                        connection.sendUTF(JSON.stringify({
                            type: 'room_change',
                            data: rooms[i]
                        }));
                        
                        for (var nick in users) {
                            if (users.hasOwnProperty(nick) && users[nick].room === user.room) {
                                if (nick !== user.nick) {
                                    // tell client about other clients in room
                                    connection.sendUTF(JSON.stringify({
                                        type: 'appear',
                                        obj: users[nick].obj,
                                        nick: nick,
                                        special: users[nick].special
                                    }));
                                    // tell other clients in room about client
                                    users[nick].conn.sendUTF(JSON.stringify({
                                        type: 'appear',
                                        obj: user.obj,
                                        nick: user.nick,
                                        special: user.special
                                    }));
                                }
                            }
                        }
                        
                        // increase user count of new room
                        rooms[i].user_count++;
                        
                        return;
                    }
                }
                // room doesn't exist
                connection.sendUTF(JSON.stringify({
                    type: 'kick',
                    reason: 'no_such_room'
                }));
                connection.close();
            break;
            case 'room_list':
                // tell client about rooms
                connection.sendUTF(JSON.stringify({
                    type: 'room_list',
                    list: rooms
                }));
            break;
            // handle unexpected packet types
            default:
                connection.sendUTF(JSON.stringify({
                    type: 'kick',
                    reason: 'protocol_error'
                }));
                connection.close();
            break;
        }
    }
    
    // Deals with first message
    connection.once('message', function(message) {
        // IP ban
        if (bannedIPList.indexOf(connection.remoteAddress) !== -1) {
            connection.close();
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
        
        var special = false;
        
        // Prevent owner/mod spoofing
        if (msg.nick === creatorNick) {
            special = 'creator';
        } else if (moderatorNicks.indexOf(msg.nick) !== -1) {
            special = 'moderator';
        }
        
        // Name banning and prevent nickname dupe
        if (users.hasOwnProperty(msg.nick) || bannedList.indexOf(msg.nick) !== -1) {
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
            list: rooms
        }));
        
        user = {
            conn: connection,
            obj: msg.obj,
            nick: msg.nick,
            room: null,
            special: special
        };
        
        // store in users map
        users[msg.nick] = user;
        
        // call onMessage for subsequent messages
        connection.on('message', onMessage);
    });
    
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        if (user !== null) {
            // remove from users map
            delete users[user.nick];
            
            // broadcast user leave to other clients
            for (var nick in users) {
                if (users.hasOwnProperty(nick) && users[nick].room === user.room && user.room !== null) {
                    users[nick].conn.sendUTF(JSON.stringify({
                        type: 'die',
                        nick: user.nick
                    }));
                }
            }
            
            // decrease user count of old room
            for (var i = 0; i < rooms.length; i++) {
                if (rooms[i].name === user.room) {
                    rooms[i].user_count--;
                    break;
                }
            }
        }
    });
});
