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
        console.log('Origin: ' + origin);
        return origin === 'http://ponyplace.ajf.me/';
    }
}

var badRegex = /drug|milf|bdsm|tits|penis|fap|butt|ass|shit|fuck|fag|faggot|bitch|cunt|dick|cock|nigga|nigger|homosexual|gay|clopclop|clopping|(\[\]\(\/[a-zA-Z0-9\-_]+\))/gi;

var MAP_MAX_X = Math.floor(3831 - 148 / 2);

function sanitise(obj) {
    if (obj.hasOwnProperty('chat')) {
        obj.chat = obj.chat.substr(0, 100);
        obj.chat = obj.chat.replace(badRegex, 'pony');
    }
    if (obj.hasOwnProperty('x')) { 
        if (obj.x > MAP_MAX_X) {
            obj.x = MAP_MAX_X;
        }
    }
    return obj;
}

var users = {};

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
        if (message.type === 'utf8') {
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
