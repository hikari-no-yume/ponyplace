#!/usr/bin/env node

var WebSocketServer = require('websocket').server;
var http = require('http');

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

var MAP_MAX_X = Math.floor(7350 - 148 / 2);
var MAP_MIN_X = Math.floor(0 - 148 / 2);
var MAP_MAX_Y = Math.floor(660 - 168 / 2);
var MAP_MIN_Y = Math.floor(0 - 168 / 2);

function sanitise(obj) {
    if (obj.hasOwnProperty('chat')) {
        obj.chat = obj.chat.substr(0, 100);
        obj.chat = obj.chat.replace(badRegex, 'pony');
        // trim whitespace
        obj.chat = obj.chat.replace(/^\s+|\s+$/g, '');
    }
    if (obj.hasOwnProperty('x')) { 
        if (obj.x > MAP_MAX_X) {
            obj.x = MAP_MAX_X;
        } else if (obj.x < MAP_MIN_X) {
            obj.x = MAP_MIN_X;
        }
        if (obj.y < MAP_MIN_Y) {
            obj.y = MAP_MIN_Y;
        } else if (obj.y > MAP_MAX_Y) {
            obj.y = MAP_MAX_Y;
        }
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
                users[nick].conn.sendUTF({
                    type: 'kick',
                    reason: 'update'
                });
                users[nick].conn.close();
                console.log('Update-kicked ' + nick);
            }
        }
    } else if (key && key.name === 'j') {
        // open brief time window in which ajf can join
        ajfCanJoin = !ajfCanJoin;
        console.log('ajf can join: ' + ajfCanJoin);
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
                
                // make sure this user doesn't spoof other nicknames
                msg.obj.nick = user.obj.nick;
                
                // kicking
                if (msg.obj.hasOwnProperty('chat') && user.obj.nick === 'ajf') {
                    if (msg.obj.chat.substr(0, 6) === '/kick ') {
                        var kickee = msg.obj.chat.substr(6);
                        if (users.hasOwnProperty(kickee)) {
                            users[kickee].conn.close();
                            bannedList.push(kickee);
                            bannedIPList.push(users[kickee].conn.remoteAddress);
                            console.log('Kickbanned user with nick "' + kickee + '"');
                        }
                        // don't broadcast
                        return;
                    }
                }
                
                // update their stored state
                user.obj = msg.obj;
                
                // broadcast new state to other clients
                for (var nick in users) {
                    if (users.hasOwnProperty(nick)) {
                        if (users[nick].conn !== connection) {
                            users[nick].conn.sendUTF(JSON.stringify({
                                type: 'update',
                                obj: msg.obj
                            }));
                        }
                    }
                }
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
        
        msg.obj = sanitise(msg.obj);
        
        // Name banning and prevent nickname dupe/owner spoofing
        if (users.hasOwnProperty(msg.obj.nick) || msg.obj.nick === 'ajf' && !ajfCanJoin || bannedList.indexOf(msg.obj.nick) !== -1) {
            connection.sendUTF({
                type: 'kick',
                reason: 'nick_in_use'
            });
            connection.close();
            return;
        // Prefent profane/long  nicks
        } else if ((!!msg.obj.nick.match(badRegex)) || msg.obj.nick.length > 18) {
            connection.sendUTF({
                type: 'kick',
                reason: 'bad_nick'
            });
            connection.close();
            return;
        }
        
        for (var nick in users) {
            if (users.hasOwnProperty(nick)) {
                // tell client about other clients
                connection.sendUTF(JSON.stringify({
                    type: 'appear',
                    obj: users[nick].obj
                }));
                
                // tell other clients about client
                users[nick].conn.sendUTF(JSON.stringify({
                    type: 'appear',
                    obj: msg.obj
                }));
            }
        }
        
        user = {
            conn: connection,
            obj: msg.obj
        };
        
        // store in users map
        users[msg.obj.nick] = user;
        
        // call onMessage for subsequent messages
        connection.on('message', onMessage);
    });
    
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        if (user !== null) {
            // remove from users map
            delete users[user.obj.nick];
            
            // broadcast user leave to other clients
            for (var nick in users) {
                if (users.hasOwnProperty(nick)) {
                    users[nick].conn.sendUTF(JSON.stringify({
                        type: 'die',
                        nick: user.obj.nick
                    }));
                }
            }
        }
    });
});
