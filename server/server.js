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
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var badRegex = /milf|bdsm|tits|penis|fap|butt|ass|shit|fuck|fag|faggot|bitch|cunt|cock|nigga|nigger|homosexual|gay|clopclop|clopping|(\[\]\(\/[a-zA-Z0-9\-_]+\))/gi;

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

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
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
            // Prefent long/profane nicks
            } else if (badRegex.test(obj.nick) || obj.nick.length > 18) {
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
