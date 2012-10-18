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

var badRegex = /desu|rape|cum|wank|9gag|noob|porn|swag|yolo|hash|weed|drug|milf|bdsm|tits|penis|fap|butt|ass|shit|fuck|fag|faggot|bitch|cunt|dick|cock|nigga|nigger|homosexual|gay|clopclop|clopping|(\[\]\(\/[a-zA-Z0-9\-_]+\))/gi;

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
                users[nick].conn.sendUTF('update');
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
    
    connection.once('message', function(message) {
        // Bans are bans
        if (bannedIPList.indexOf(connection.remoteAddress) !== -1) {
            connection.close();
        } else if (message.type === 'utf8') {
            console.log('Received Initial Message: ' + message.utf8Data);
            
            // every frame is a JSON-encoded state object
            try {
                var obj = JSON.parse(message.utf8Data);
            } catch (e) {
                connection.close();
                return;
            }
            obj = sanitise(obj);
            
            // Prevent nickname duplication
            if (users.hasOwnProperty(obj.nick)) {
                connection.sendUTF('nick_in_use');
                connection.close();
                return;
            // Prefent profane/long  nicks
            } else if ((!!obj.nick.match(badRegex)) || obj.nick.length > 18) {
                connection.sendUTF('bad_nick');
                connection.close();
                return;
            // Prevent ajf spoofing
            } else if (obj.nick === 'ajf' && !ajfCanJoin) {
                connection.sendUTF('nick_in_use');
                connection.close();
                return;
            // Bans are bans
            } else if (bannedList.indexOf(obj.nick) !== -1) {
                connection.sendUTF('nick_in_use');
                connection.close();
            } else {
                for (var nick in users) {
                    if (users.hasOwnProperty(nick)) {
                        // tell client about other clients
                        connection.sendUTF(JSON.stringify(users[nick].obj));
                        
                        // tell other clients about client
                        users[nick].conn.sendUTF(JSON.stringify(obj));
                    }
                }
                
                user = {
                    conn: connection,
                    obj: obj
                };
                
                // store in users map
                users[obj.nick] = user;
                
                connection.on('message', function(message) {
                    if (message.type === 'utf8') {
                        // every frame is a JSON-encoded state object
                        try {
                            var obj = JSON.parse(message.utf8Data);
                        } catch (e) {
                            connection.close();
                            return;
                        }
                        
                        obj = sanitise(obj);
                        
                        // make sure this user doesn't spoof other nicknames
                        obj.nick = user.obj.nick;
                        
                        // kicking
                        if (obj.hasOwnProperty('chat') && user.obj.nick === 'ajf') {
                            if (obj.chat.substr(0, 6) === '/kick ') {
                                var kickee = obj.chat.substr(6);
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
                        user.obj = obj;
                        for (var nick in users) {
                            if (users.hasOwnProperty(nick)) {
                                if (users[nick].conn != connection) {
                                    // broadcast message to other clients
                                    users[nick].conn.sendUTF(JSON.stringify(obj));
                                }
                            }
                        }
                    }
                });
            }
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        if (user !== null) {
            // remove from users map
            delete users[user.obj.nick];
            
            // special alive value specifies user's existence
            // (a hack, but I love this one, so elegant! :D)
            user.obj.alive = false;
            for (var nick in users) {
                if (users.hasOwnProperty(nick)) {
                    // broadcast user leave to other clients
                    users[nick].conn.sendUTF(JSON.stringify(user.obj));
                }
            }
        }
    });
});
