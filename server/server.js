#!/usr/bin/env node

var WebSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');

var debugMode = (process.argv.hasOwnProperty('2') && process.argv[2] === '--debug');
var config = require('./data_config/config.json');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen((debugMode ? config.port_debug : config.port), function() {
    console.log((new Date()) + ' Server is listening on port ' + (debugMode ? config.port_debug : config.port));
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // undefined origin (i.e. non-web clients) always allowed
    if (!origin) {
        return config.allow_missing_origin;
    } else if (debugMode) {
        return origin === config.origin_debug;
    } else {
        return origin === config.origin;
    }
}

var badRegex = /fuck|shit|milf|bdsm|fag|faggot|nigga|nigger|clop|(\[\]\(\/[a-zA-Z0-9\-_]+\))/gi;

var validNickRegex = /^[a-zA-Z0-9_]+$/g;

var globalMute = false;

var fs = require('fs');

function sanitiseChat(chat) {
    chat = chat.substr(0, 100);
    chat = chat.replace(badRegex, 'pony');
    // trim whitespace
    chat = chat.replace(/^\s+|\s+$/g, '');
    return chat;
}

function sanitisePosition(obj, roomName) {
    if (roomName !== null) {
        var room;
        if (roomManager.has(roomName)) {
            room = roomManager.get(roomName);
        } else if (roomName.substr(0, 6) === 'house ') {
            room = User.getHouse(roomName.substr(6));
        } else if (roomManager.hasEphemeral(roomName)) {
            room = roomManager.getEphemeral(roomName);
        } else {
            room = { background: { width: 0, height: 0 } };
        }

        obj.x = Math.max(Math.min(obj.x, room.background.width), 0);
        obj.y = Math.max(Math.min(obj.y, room.background.height), 0);
    }
    return obj;
}

var User = require('./user.js');

var banManager = {
    bannedIPs: [],

    init: function () {
        try {
            var data = require('./data_user/bans.json');
        } catch (e) {
            console.log('Error loading banned users info, skipped');
            return;
        }
        this.bannedIPs = data.IPs;
        console.log('Loaded banned users info');
    },
    save: function () {
        fs.writeFileSync('./data_user/bans.json', JSON.stringify({
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
    unbanIP: function (IP) {
        if (this.isIPBanned(IP)) {
            this.bannedIPs.splice(this.bannedIPs.indexOf(IP), 1);
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
        var data = require('./data/rooms.json');
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
    hasEphemeral: function (name) {
        return this.ephemeralRooms.hasOwnProperty(name);
    },
    get: function (name) {
        for (var i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].name === name) {
                return this.rooms[i];
            }
        }
        throw new Error('There is no room with the name: "' + name + '"');
    },
    getEphemeral: function (name) {
        if (this.hasEphemeral(name)) {
            return this.ephemeralRooms[name];
        }
        throw new Error('There is no ephemeral room with the name: "' + name + '"');
    },
    createEphemeral: function (name, owner) {
        if (this.hasEphemeral(name)) {
            throw new Error('There is already an ephemeral room with the name: "' + name + '"');
        }
        return this.ephemeralRooms[name] = {
            type: 'ephemeral',
            name: name,
            user_count: 0,
            user_noun: " ghosts",
            user_nick: owner,
            locked: false,
            thumbnail: "/media/rooms/cave-thumb.png",
            background: {
                data: '/media/rooms/cave.png',
                width: 960,
                height: 660
            }
        };
    },
    onEphemeralJoin: function (name) {
        if (this.hasEphemeral(name)) {
            this.ephemeralRooms[name].user_count++;
        }
    },
    onEphemeralLeave: function (name) {
        if (this.ephemeralRooms.hasOwnProperty(name)) {
            this.ephemeralRooms[name].user_count--;
            if (this.ephemeralRooms[name].user_count <= 0) {
                delete this.ephemeralRooms[name];
            }
        }
    },
    getList: function () {
        var list = [], that = this;
        function iterate(room) {
            if (!room.unlisted) {
                list.push({
                    type: room.type,
                    name: room.name,
                    name_full: room.name_full,
                    user_count: room.user_count,
                    user_noun: room.user_noun,
                    thumbnail: room.thumbnail
                });
            }
        }
        this.rooms.forEach(iterate);
        Object.keys(this.ephemeralRooms).forEach(function (name) {
            iterate(that.ephemeralRooms[name]);
        });
        return list;
    }
};

roomManager.init();

var modLogger = {
    log: [],

    init: function () {
        try {
            var data = require('./data_user/mod-log.json');
        } catch (e) {
            console.log('Error loading moderation log, skipped.');
            return;
        }
        this.log = data.log;
        console.log('Loaded moderation log');
    },
    save: function () {
        fs.writeFileSync('./data/mod-log.json', JSON.stringify({
            log: this.log
        }));
        console.log('Saved moderation log');
    },
    getLast: function (count, filter) {
        var retrieved = 0;
        var slice = [];
        for (var i = this.log.length - 1; i >= 0; i--) {
            if (!filter || this.log[i].type === filter) {
                slice.push(this.log[i]);
                if (++retrieved === count) {
                    break;
                }
            }
        }
        return slice;
    },

    timestamp: function () {
        return (new Date()).toISOString();
    },

    logBan: function (mod, IP, aliases, reason) {
        this.log.push({
            type: 'ban',
            date: this.timestamp(),
            mod: mod,
            IP: IP,
            aliases: aliases,
            reason: reason
        });
        this.save();
    },
    logUnban: function (mod, IP) {
        this.log.push({
            type: 'unban',
            date: this.timestamp(),
            mod: mod,
            IP: IP
        });
        this.save();
    },
    logKick: function (mod, IP, aliases, reason) {
        this.log.push({
            type: 'kick',
            date: this.timestamp(),
            mod: mod,
            IP: IP,
            aliases: aliases,
            reason: reason
        });
        this.save();
    },
    logWarn: function (mod, nick, reason) {
        this.log.push({
            type: 'warn',
            date: this.timestamp(),
            mod: mod,
            nick: nick,
            reason: reason
        });
        this.save();
    },
    logMove: function (mod, nick, oldRoom, newRoom, state) {
        this.log.push({
            type: 'move',
            date: this.timestamp(),
            mod: mod,
            nick: nick,
            old_room: oldRoom,
            new_room: newRoom,
            state: state
        });
        this.save();
    },
    logBroadcast: function (mod, msg) {
        this.log.push({
            type: 'broadcast',
            date: this.timestamp(),
            mod: mod,
            msg: msg
        });
        this.save();
    }
};

modLogger.init();

var modMessages = {
    messages: [],

    init: function () {
        try {
            var data = require('./data_user/mod-messages.json');
        } catch (e) {
            console.log('Error loading moderator messages, skipped.');
            return;
        }
        this.messages = data.messages;
        console.log('Loaded moderator messages');
    },
    save: function () {
        fs.writeFileSync('./data/mod-messages.json', JSON.stringify({
            messages: this.messages
        }));
        console.log('Saved moderator messages');
    },
    getLast: function (count, filter) {
        var retrieved = 0;
        var slice = [];
        for (var i = this.messages.length - 1; i >= 0; i--) {
            if (!filter || this.messages[i].nick === filter || this.messages[i].from === filter) {
                slice.push(this.messages[i]);
                if (++retrieved === count) {
                    break;
                }
            }
        }
        return slice;
    },

    timestamp: function () {
        return (new Date()).toISOString();
    },

    reportUser: function (from, nick, reason) {
        this.messages.push({
            type: 'user_report',
            date: this.timestamp(),
            from: from,
            nick: nick,
            reason: reason
        });
        this.save();
        User.forEach(function (iterUser) {
            if (User.isModerator(iterUser.nick)) {
                iterUser.send({
                    type: 'console_msg',
                    msg: 'There is a new moderator report. View it with /modmsgs'
                });
            }
        });
    },
    logWarn: function (mod, nick, reason) {
        this.messages.push({
            type: 'warn',
            date: this.timestamp(),
            from: mod,
            nick: nick,
            reason: reason
        });
        this.save();
    }
};

modMessages.init();

function doRoomChange(roomName, user) {
    var room;

    if (roomManager.has(roomName)) {
        room = roomManager.get(roomName);
    } else if (roomName.substr(0, 6) === 'house ') {
        room = User.getHouse(roomName.substr(6));
    } else if (roomManager.hasEphemeral(roomName)) {
        room = roomManager.getEphemeral(roomName);
    } else {
        room = roomManager.createEphemeral(roomName, user.nick);
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
    }

    // set current room to new room
    user.room = room.name;

    // tell client it has changed room and tell room details
    user.send({
        type: 'room_change',
        data: room
    });

    // bounds check position
    user.obj = sanitisePosition(user.obj, user.room);

    User.forEach(function (iterUser) {
        if (iterUser.room === user.room) {
            if (iterUser.nick !== user.nick) {
                // tell client about other clients in room
                user.send({
                    type: 'appear',
                    obj: iterUser.obj,
                    nick: iterUser.nick,
                    special: iterUser.special,
                    joining: false
                });
                // tell other clients in room about client
                iterUser.send({
                    type: 'appear',
                    obj: user.obj,
                    nick: user.nick,
                    special: user.special,
                    joining: true
                });
            }
        }
    });

    // increase user count of new room
    if (roomManager.has(room.name)) {
        room.user_count++;
    } else if (room.name.substr(0, 6) !== 'house ') {
        roomManager.onEphemeralJoin(room.name);
    }

    // decrease user count of old room
    if (oldRoom !== null) {
        if (roomManager.has(oldRoom)) {
            roomManager.get(oldRoom).user_count--;
        } else if (oldRoom.substr(0, 6) !== 'house ') {
            roomManager.onEphemeralLeave(oldRoom);
        }
    }

    // tell client about room list & user count
    user.send({
        type: 'room_list',
        list: roomManager.getList(),
        user_count: User.userCount,
        mod_count: User.modCount
    });
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
    var isCreator = User.getSpecialStatus(myNick) === 'creator';
    var canMod = (isMod && !globalMute) || isCreator;

    // help
    if (cmd.substr(0, 4) === 'help') {
        user.send({
            type: 'help',
            lines: [
                'Three user commands are available: 1) profile, 2) list, 3) join',
                "1. profile - Brings up someone's profile, e.g. /profile someguy",
                '2. list - Lists available rooms, e.g. /list',
                "3. join - Joins a room, e.g. /join library - if room doesn't exist, an ephemeral room will be created - you can also enter people's houses, e.g. /join house ajf",
                'Three house commands are available: 1) empty, 2) lock, 3) unlock',
                '1. empty - Removes everyone else from your house, e.g. /empty',
                '2. lock - Prevents anyone else from joining your house, e.g. /lock',
                '3. unlock - Lets other people join your house again, e.g. /unlock'
            ]
        });
        if (isMod) {
            sendLine('See also: /modhelp');
        }
    // profile
    } else if (cmd.substr(0, 8) === 'profile ') {
        var nick = cmd.substr(8);
        if (User.hasAccount(nick)) {
            user.send({
                type: 'profile',
                data: User.getProfile(nick),
                moderator_mode: isMod
            });
        } else {
            sendLine('There is no user with nick: "' + nick + '"');
        }
    // join room
    } else if (cmd.substr(0, 5) === 'join ') {
        var roomName = cmd.substr(5);

        if (roomName.indexOf(' ') !== -1) {
            if (roomName.substr(0, 6) === 'house ') {
                var houseName = roomName.substr(6);
                if (User.isHouseLocked(houseName) && myNick !== houseName && !User.isModerator(myNick)) {
                    sendLine('That house is locked.');
                } else {
                    doRoomChange(roomName, user);
                }
            } else {
                sendLine('Room names cannot contain spaces.');
            }
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
    // empty house
    } else if (cmd.substr(0, 5) === 'empty') {
        var count = 0;
        User.forEach(function (iterUser) {
            if (iterUser.room === 'house ' + myNick && iterUser.nick !== myNick) {
                doRoomChange('ponyville', iterUser);
                sendLine('Removed user with nick: "' + iterUser.nick + '" from your house.');
                sendLine('The user with nick: "' + myNick + '" removed you from their house.', iterUser.nick);
                count++;
            }
        });
        if (count) {
            sendLine('Removed ' + count + ' users from your house.');
        } else {
            sendLine('There are no other users in your house.');
        }
    // lock house
    } else if (cmd.substr(0, 4) === 'lock') {
        var house = User.getHouse(myNick);
        if (house.locked) {
            sendLine('Your house is already locked. Use /unlock to unlock it.');
        } else {
            house.locked = true;
            User.setHouse(myNick, house);
            sendLine('Your house was locked. Use /unlock to unlock it.');
        }
    // unlock house
    } else if (cmd.substr(0, 6) === 'unlock') {
        var house = User.getHouse(myNick);
        if (!house.locked) {
            sendLine('Your house is already unlocked. Use /lock to lock it.');
        } else {
            house.locked = false;
            User.setHouse(myNick, house);
            sendLine('Your house was unlocked. Use /lock to lock it.');
        }
    // mod help
    } else if (canMod && cmd.substr(0, 7) === 'modhelp') {
        user.send({
            type: 'help',
            lines: [
                'Nine mod commands available: 1) kick, 2) kickban, 3) warn, 4) unban, 5) broadcast, 6) aliases, 7) move, 8) modlog, 9) modmsgs',
                "1. kick & 2. kickban - kick takes the nick of someone, they (& any aliases) will be kicked, e.g. /kick sillyfilly. kickban is like kick but also permabans by IP. kick and kickban can also take a second parameter for a reason message, e.g. /kick sillyfilly Don't spam the chat!",
                '3. warn - formally warns someone (shown immediately if online or upon next login if not), e.g. /warn somefilly Stop spamming. Final warning.',
                '4. unban - Unbans an IP, e.g. /unban 192.168.1.1',
                '5. broadcast - Sends a message to everyone on the server, e.g. /broadcast Hello all!',
                "6. aliases - Lists someone's aliases (people with same IP address), e.g. /aliases joebloggs",
                '7. move - Forcibly moves a user to a room, e.g. /move canterlot sillyfilly',
                "8. modlog - Shows moderator activity log. Optionally specify count (default 10), e.g. /modlog 15. You can also specify filter (ban/unban/kick/move/broadcast), e.g. /modlog 25 unban",
                "9. modmsgs - Shows messages/reports to mods. Optionally specify count (default 10), e.g. /modmsgs 10. You can also specify nick filter to see messages concerning or by someone, e.g. /modmsgs 25 somefilly",
                'See also: /help'

            ]
        });
    // unbanning
    } else if (canMod && cmd.substr(0, 6) === 'unban ') {
        var IP = cmd.substr(6);
        if (!banManager.isIPBanned(IP)) {
            sendLine('The IP ' + IP + ' is not banned.');
            return;
        }
        banManager.unbanIP(IP);
        sendLine('Unbanned IP ' + IP);
        modLogger.logUnban(myNick, IP);
    // kickbanning
    } else if (canMod && cmd.substr(0, 8) === 'kickban ') {
        var pos = cmd.indexOf(' ', 8);
        var kickee, reason = null;
        if (pos !== -1) {
            kickee = cmd.substr(8, pos-8);
            reason = cmd.substr(pos+1);
        } else {
            kickee = cmd.substr(8);
        }
        if (!User.has(kickee)) {
            sendLine('There is no online user with nick: "' + kickee + '"');
            return;
        }
        if (User.isModerator(kickee)) {
            sendLine('You cannot kickban other moderators');
            return;
        }
        var IP = User.get(kickee).conn.remoteAddress;
        banManager.addIPBan(IP);
        sendLine('Banned IP ' + IP);
        var aliases = [];
        // Kick aliases
        User.forEach(function (iterUser) {
            if (iterUser.conn.remoteAddress === IP) {
                // kick
                iterUser.kick('ban', reason);
                console.log('Kicked alias "' + iterUser.nick + '" of user with IP ' + IP);
                sendLine('Kicked alias "' + iterUser.nick + '" of user with IP ' + IP);
                aliases.push({
                    nick: iterUser.nick,
                    room: iterUser.room,
                    state: iterUser.obj
                });
                // broadcast kickban message
                if (iterUser.room !== null) {
                    User.forEach(function (other) {
                        if (other.room === iterUser.room) {
                            other.send({
                                type: 'kickban_notice',
                                mod_nick: user.nick,
                                mod_special: user.special,
                                kickee_nick: iterUser.nick,
                                kickee_special: iterUser.special,
                                reason: reason
                            })
                        }
                    });
                }
            }
        });
        modLogger.logBan(myNick, IP, aliases, reason);
    // kicking
    } else if (canMod && cmd.substr(0, 5) === 'kick ') {
        var pos = cmd.indexOf(' ', 5);
        var kickee, reason = null;
        if (pos !== -1) {
            kickee = cmd.substr(5, pos-5);
            reason = cmd.substr(pos+1);
        } else {
            kickee = cmd.substr(5);
        }
        if (!User.has(kickee)) {
            sendLine('There is no online user with nick: "' + kickee + '"');
            return;
        }
        var IP = User.get(kickee).conn.remoteAddress;
        var aliases = [];
        // Kick aliases
        User.forEach(function (iterUser) {
            if (iterUser.conn.remoteAddress === IP) {
                // kick
                iterUser.kick('kick', reason);
                console.log('Kicked alias "' + iterUser.nick + '" of user with IP ' + IP);
                sendLine('Kicked alias "' + iterUser.nick + '" of user with IP ' + IP);
                aliases.push({
                    nick: iterUser.nick,
                    room: iterUser.room,
                    state: iterUser.obj
                });
                // broadcast kick message
                if (iterUser.room !== null) {
                    User.forEach(function (other) {
                        if (other.room === iterUser.room) {
                            other.send({
                                type: 'kick_notice',
                                mod_nick: user.nick,
                                mod_special: user.special,
                                kickee_nick: iterUser.nick,
                                kickee_special: iterUser.special,
                                reason: reason
                            })
                        }
                    });
                }
            }
        });
        modLogger.logKick(myNick, IP, aliases, reason);
    // warning
    } else if (canMod && cmd.substr(0, 5) === 'warn ') {
        var pos = cmd.indexOf(' ', 5);
        var warnee, reason = null;
        if (pos !== -1) {
            warnee = cmd.substr(5, pos-5);
            reason = cmd.substr(pos+1);
        } else {
            sendLine('Two parameters required for /warn.');
            return;
        }
        if (!User.hasAccount(warnee)) {
            sendLine('There is no user with nick: "' + kickee + '"');
            return;
        }

        if (User.has(warnee)) {
            User.get(warnee).send({
                type: 'mod_warning',
                mod_nick: user.nick,
                mod_special: user.special,
                reason: reason
            });
            sendLine('"' + warnee + '" was warned and will see the warning immediately.');
        } else {
            User.addWarning(warnee, user.nick, user.special, reason);
            sendLine('"' + warnee + '" was warned and will see the warning upon their next login.');
        }
        modLogger.logWarn(myNick, warnee, reason);
        modMessages.logWarn(myNick, warnee, reason);
    // forced move
    } else if (canMod && cmd.substr(0, 5) === 'move ') {
        var pos = cmd.indexOf(' ', 5);
        if (pos !== -1) {
            var room = cmd.substr(5, pos-5);
            var movee = cmd.substr(pos+1);
            if (!User.has(movee)) {
                sendLine('There is no online user with nick: "' + movee + '"');
                return;
            }
            if (User.isModerator(movee)) {
                sendLine('You cannot move other moderators');
                return;
            }
            modLogger.logMove(myNick, movee, User.get(movee).room, room, User.get(movee).obj);
            doRoomChange(room, User.get(movee));
            sendLine('You were forcibly moved room by ' + myNick, movee);
        } else {
            sendLine('/move takes a room and a nickname');
            return;
        }
    // check alias
    } else if (canMod && cmd.substr(0, 8) === 'aliases ') {
        var checked = cmd.substr(8);
        if (!User.has(checked)) {
            sendLine('There is no online user with nick: "' + checked + '"');
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
    } else if (canMod && cmd.substr(0, 10) === 'broadcast ') {
        var broadcast = cmd.substr(10);
        User.forEach(function (iterUser) {
            iterUser.send({
                type: 'broadcast',
                msg: broadcast
            });
        });
        console.log('Broadcasted message "' + broadcast + '" from user "' + myNick + '"');
        sendLine('Broadcasted message');
        modLogger.logBroadcast(myNick, broadcast);
    // moderation log
    } else if (canMod && cmd.substr(0, 6) === 'modlog') {
        var pos = cmd.indexOf(' ', 7);
        var count, filter;
        if (pos !== -1) {
            count = cmd.substr(6, pos-6);
            filter = cmd.substr(pos+1);
        } else {
            count = cmd.substr(6);
        }
        count = parseInt(count) || 10;
        var items = modLogger.getLast(count, filter);
        sendLine('Showing ' + items.length + ' log items' + (filter ? ' filtered by type "' + filter + '"' : ''));
        user.send({
            type: 'mod_log',
            cmd: cmd,
            items: items
        });
    // moderator messages
    } else if (canMod && cmd.substr(0, 7) === 'modmsgs') {
        var pos = cmd.indexOf(' ', 8);
        var count, filter;
        if (pos !== -1) {
            count = cmd.substr(7, pos-7);
            filter = cmd.substr(pos+1);
        } else {
            count = cmd.substr(7);
        }
        count = parseInt(count) || 10;
        var messages = modMessages.getLast(count, filter);
        sendLine('Showing ' + messages.length + ' messages' + (filter ? ' filtered by nick "' + filter + '"' : ''));
        user.send({
            type: 'mod_msgs',
            cmd: cmd,
            messages: messages
        });
    // royal canterlot voice
    } else if (isCreator && cmd.substr(0,4) === 'mute') {
        if (globalMute) {
            User.forEach(function (iterUser) {
                iterUser.send({
                    type: 'broadcast',
                    msg: '** ' + user.nick.toUpperCase() + ' HAS DISENGAGED THE ROYAL CANTERLOT VOICE - YOU MAY NOW SPEAK, AND BE HEARD **'
                });
            });
            globalMute = false;
        } else {
            User.forEach(function (iterUser) {
                iterUser.send({
                    type: 'broadcast',
                    msg: '** NOTE: ' + user.nick.toUpperCase() + ' HAS ENGAGED THE ROYAL CANTERLOT VOICE - YOU MAY SPEAK, BUT YOU SHALL NOT BE HEARD **'
                });
            });
            globalMute = true;
        }
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
        var connection = request.accept('ponyplace', request.origin);
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

        if (user === null) {
            connection.sendUTF(JSON.stringify({
                type: 'console_msg',
                msg: 'Not yet logged in.'
            }));
            connection.close();
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
                // sanitise chat message
                if (msg.obj.hasOwnProperty('chat')) {
                    msg.obj.chat = sanitiseChat(msg.obj.chat);
                }

                // bounds check position
                if (msg.hasOwnProperty('obj')) {
                    msg.obj = sanitisePosition(msg.obj, user.room);
                }

                // global mute
                if (globalMute) {
                    msg.obj.chat = user.obj.chat;
                }

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
            case 'delete_account':
                User.deleteAccount(myNick);
                user.kick('account_deleted');
            break;
            case 'room_change':
                if (msg.name.indexOf(' ') === -1) {
                    doRoomChange(msg.name, user);
                } else {
                    if (msg.name.substr(0, 6) === 'house ') {
                        var houseName = msg.name.substr(6);
                        if (User.isHouseLocked(houseName) && myNick !== houseName) {
                            user.send({
                                type: 'console_msg',
                                msg: 'That house is locked.'
                            });
                        } else {
                            doRoomChange(msg.name, user);
                        }
                    } else {
                        user.kick('protocol_error');
                    }
                }
            break;
            case 'room_list':
                // tell client about rooms
                user.send({
                    type: 'room_list',
                    list: roomManager.getList(),
                    user_count: User.userCount,
                    mod_count: User.modCount
                });
            break;
            case 'profile_get':
                if (User.hasAccount(msg.nick)) {
                    user.send({
                        type: 'profile',
                        data: User.getProfile(msg.nick),
                        moderator_mode: User.isModerator(myNick)
                    });
                } else {
                    user.send({
                        type: 'console_msg',
                        msg: 'There is no user with nick: "' + msg.nick + '"'
                    });
                }
            break;
            case 'priv_msg':
                if (!User.has(msg.nick)) {
                    user.send({
                        type: 'priv_msg_fail',
                        nick: msg.nick
                    });
                    return;
                } else {
                    User.get(msg.nick).send({
                        type: 'priv_msg',
                        from_nick: myNick,
                        from_special: user.special,
                        msg: msg.msg
                    });
                }
            break;
            case 'user_report':
                modMessages.reportUser(myNick, msg.nick, msg.reason);
            break;
            case 'friend_add':
                User.addFriend(myNick, msg.nick);
                user.sendAccountState();
            break;
            case 'friend_remove':
                User.removeFriend(myNick, msg.nick);
                user.sendAccountState();
            break;
            case 'change_room_background':
                var room = null, isHouse = false;
                if (roomManager.has(msg.room)) {
                    user.send({
                        type: 'console_msg',
                        msg: 'You cannot change the backgrounds of default rooms.'
                    });
                } else if (roomManager.hasEphemeral(msg.room)) {
                    room = roomManager.getEphemeral(msg.room);
                    if (room.user_nick !== myNick) {
                        user.send({
                            type: 'console_msg',
                            msg: 'You can only change the backgrounds of rooms you own.'
                        });
                        room = null;
                    }
                } else if (msg.room.substr(0, 6) === 'house ') {
                    if (msg.room.substr(6) !== myNick) {
                        user.send({
                            type: 'console_msg',
                            msg: 'You can only change the backgrounds of rooms you own.'
                        });
                    } else {
                        room = User.getHouse(msg.room.substr(6));
                        isHouse = true;
                    }
                } else {
                    user.kick('no_such_room');
                }

                if (room !== null) {
                    // default
                    if (msg.bg_name === null) {
                        room.background = {
                            data: '/media/rooms/cave.png',
                            width: 960,
                            height: 660,
                            iframe: false
                        };
                    } else {
                        if (User.inventoryItems.hasOwnProperty(msg.bg_name)) {
                            room.background = User.inventoryItems[msg.bg_name].background_data;
                            if (!isHouse) {
                                room.thumbnail = User.inventoryItems[msg.bg_name].img;
                            }
                        } else {
                            user.kick('protocol_error');
                        }
                    }
                    if (isHouse) {
                        User.setHouse(myNick, room);
                        user.send({
                            type: 'console_msg',
                            msg: 'House background ' + (msg.bg_name ? 'changed.' : 'reset.')
                        });
                    } else {
                        user.send({
                            type: 'console_msg',
                            msg: 'Room background ' + (msg.bg_name ? 'changed.' : 'reset.')
                        });
                    }
                    User.forEach(function (iterUser) {
                        if (iterUser.room === msg.room) {
                            doRoomChange(msg.room, iterUser);
                        }
                    });
                }
            break;
            // handle unexpected packet types
            default:
                user.kick('protocol_error');
            break;
        }
    }

    function completeRequest(nick, msg) {
        if (!amConnected) {
            return;
        }

        // sanitise chat message
        if (msg.obj.hasOwnProperty('chat')) {
            msg.obj.chat = sanitiseChat(msg.obj.chat);
        }

        // tell client about rooms
        connection.sendUTF(JSON.stringify({
            type: 'room_list',
            list: roomManager.getList(),
            user_count: User.userCount,
            mod_count: User.modCount
        }));

        // tell client about avatars
        connection.sendUTF(JSON.stringify({
            type: 'avatar_list',
            list: User.avatars
        }));

        // tell client about inventory items
        connection.sendUTF(JSON.stringify({
            type: 'inventory_item_list',
            list: User.inventoryItems
        }));

        myNick = nick;
        user = new User(nick, connection, msg.obj, null);
        user.sendAccountState();

        // send warnings, if any
        var warnings = User.getUnseenWarnings(nick);
        for (var i = 0; i < warnings.length; i++) {
            user.send({
                type: 'mod_warning',
                mod_nick: warnings[i].mod_nick,
                mod_special: warnings[i].mod_special,
                reason: warnings[i].reason
            });
        }
        User.clearUnseenWarnings(nick);

        console.log((new Date()) + ' User with nick: "' + myNick + '" connected.');
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

        // We're expecting a login packet first
        // Anything else is unexpected
        if (msg.type !== 'login') {
            connection.sendUTF(JSON.stringify({
                type: 'kick',
                reason: 'protocol_error'
            }));
            connection.close();
            return;
        }

        switch (msg.mode) {
            case 'create':
                // Prefent profane/long/short/additional whitespace nicks
                if ((!!msg.nick.match(badRegex)) || msg.nick.length > 18 || msg.nick.length < 3 || !msg.nick.match(validNickRegex)) {
                    connection.sendUTF(JSON.stringify({
                        type: 'kick',
                        reason: 'bad_nick'
                    }));
                    connection.close();
                    return;
                }

                // Check if already account with nick
                if (User.hasAccount(msg.nick)) {
                    connection.sendUTF(JSON.stringify({
                        type: 'kick',
                        reason: 'already_account'
                    }));
                    connection.close();
                    return;
                }

                // check with mozilla
                User.assert(msg.assertion, function (good, email) {
                    if (good) {
                        if (!User.hasEmail(email)) {
                            User.createAccount(msg.nick, email);
                            completeRequest(msg.nick, msg);
                        } else {
                            connection.sendUTF(JSON.stringify({
                                type: 'kick',
                                reason: 'already_email'
                            }));
                            connection.close();
                        }
                    } else {
                        connection.sendUTF(JSON.stringify({
                            type: 'kick',
                            reason: 'bad_login'
                        }));
                        connection.close();
                    }
                });
            break;
            case 'bypass':
                if (User.has(msg.nick)) {
                    connection.sendUTF(JSON.stringify({
                        type: 'kick',
                        reason: 'account_in_use'
                    }));
                    connection.close();
                    return;
                }
                if (User.checkBypass(msg.nick, msg.bypass)) {
                    completeRequest(msg.nick, msg);
                } else {
                    connection.sendUTF(JSON.stringify({
                        type: 'kick',
                        reason: 'bad_login'
                    }));
                    connection.close();
                }
            break;
            case 'existing':
                // check with mozilla
                User.assert(msg.assertion, function (good, email) {
                    var nick;
                    if (good) {
                        if (nick = User.getAccountForEmail(email)) {
                            if (User.has(nick)) {
                                connection.sendUTF(JSON.stringify({
                                    type: 'kick',
                                    reason: 'account_in_use'
                                }));
                                connection.close();
                            } else {
                                completeRequest(nick, msg);
                            }
                        } else {
                            connection.sendUTF(JSON.stringify({
                                type: 'kick',
                                reason: 'no_assoc_account'
                            }));
                            connection.close();
                        }
                    } else {
                        connection.sendUTF(JSON.stringify({
                            type: 'kick',
                            reason: 'bad_login'
                        }));
                        connection.close();
                    }
                });
            break;
        }

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
                } else if (user.room.substr(0, 6) !== 'house '){
                    roomManager.onEphemeralLeave(user.room);
                }
            }
        }
    });
});
