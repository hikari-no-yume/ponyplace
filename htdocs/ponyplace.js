(function () {
    'use strict';

    // get them before IE errors out
    if (!window.hasOwnProperty('WebSocket')) {
        window.location = 'no-websocket.html';
        return;
    }
    
    var ROOM_HEIGHT = 660;
    var PONY_WIDTH = 168, PONY_HEIGHT = 168;
    
    var ponies = [
        'derpy_left.gif',
        'derpy_right.gif',
        'derpy_left_walk.gif',
        'derpy_right_walk.gif',
        'derpy_left_hover.gif',
        'derpy_right_hover.gif',
        'derpy_left_hover_upsidedown.gif',
        'derpy_right_hover_upsidedown.gif',
        'derpy_left_sleep.gif',
        'derpy_right_sleep.gif',
        'vinylscratch_left.gif',
        'vinylscratch_right.gif',
        'vinylscratch_left_walk.gif',
        'vinylscratch_right_walk.gif',
        'vinylscratch_left_dance.gif',
        'vinylscratch_right_dance.gif',
        'octavia_left.gif',
        'octavia_right.gif',
        'octavia_left_shades.gif',
        'octavia_right_shades.gif',
        'octavia_left_walk.gif',
        'octavia_right_walk.gif',
        'octavia_left_cello.gif',
        'octavia_right_cello.gif',
        'discord_left.gif',
        'discord_right.gif',
        'maredowell_left.gif',
        'maredowell_right.gif',
        'maredowell_left_walk.gif',
        'maredowell_right_walk.gif',
        'maredowell_left_run.gif',
        'maredowell_right_run.gif',
        'maredowell_left_hover.gif',
        'maredowell_right_hover.gif',
        'maredowell_left_fly.gif',
        'maredowell_right_fly.gif',
        'spike_left.gif',
        'spike_right.gif',
        'spike_left_walk.gif',
        'spike_right_walk.gif',
        'spike_left_float.gif',
        'spike_right_float.gif',
        'carrottop_left.gif',
        'carrottop_right.gif',
        'carrottop_left_walk.gif',
        'carrottop_right_walk.gif',
        'colgate_left.gif',
        'colgate_right.gif',
        'colgate_left_walk.gif',
        'colgate_right_walk.gif',
        'colgate_left_sit.gif',
        'colgate_right_sit.gif',
        'doctorwhooves_left.gif',
        'doctorwhooves_right.gif',
        'doctorwhooves_left_walk.gif',
        'doctorwhooves_right_walk.gif',
        'rainbowdash_left.gif',
        'rainbowdash_right.gif',
        'rainbowdash_left_walk.gif',
        'rainbowdash_right_walk.gif',
        'rainbowdash_left_conga.gif',
        'rainbowdash_right_conga.gif',
        'rainbowdash_left_dinosaur.gif',
        'rainbowdash_right_dinosaur.gif',
        'rainbowdash_left_run.gif',
        'rainbowdash_right_run.gif',
        'rainbowdash_left_hover.gif',
        'rainbowdash_right_hover.gif',
        'rainbowdash_left_hover_dizzy.gif',
        'rainbowdash_right_hover_dizzy.gif',
        'rainbowdash_left_fly.gif',
        'rainbowdash_right_fly.gif',
        'rainbowdash_left_sleep.gif',
        'rainbowdash_right_sleep.gif',
        'fillyrainbowdash_left.gif',
        'fillyrainbowdash_right.gif',
        'fillyrainbowdash_left_walk.gif',
        'fillyrainbowdash_right_walk.gif',
        'fillyrainbowdash_left_hover.gif',
        'fillyrainbowdash_right_hover.gif',
        'fillyrainbowdash_left_fly.gif',
        'fillyrainbowdash_right_fly.gif',
        'tank_left_hover.gif',
        'tank_right_hover.gif',
        'daringdo_left.gif',
        'daringdo_right.gif',
        'daringdo_left_walk.gif',
        'daringdo_right_walk.gif',
        'ironwill_left_walk.gif',
        'ironwill_right_walk.gif',
        'fluttershy_left.gif',
        'fluttershy_right.gif',
        'fluttershy_left_walk.gif',
        'fluttershy_right_walk.gif',
        'fluttershy_left_conga.gif',
        'fluttershy_right_conga.gif',
        'fluttershy_left_hover.gif',
        'fluttershy_right_hover.gif',
        'fluttershy_left_sleep.gif',
        'fluttershy_right_sleep.gif',
        'fillyfluttershy_left.gif',
        'fillyfluttershy_right.gif',
        'fillyfluttershy_left_walk.gif',
        'fillyfluttershy_right_walk.gif',
        'fillyfluttershy_left_hover.gif',
        'fillyfluttershy_right_hover.gif',
        'fillyfluttershy_left_sit.gif',
        'fillyfluttershy_right_sit.gif',
        'fillyfluttershy_left_sleep.gif',
        'fillyfluttershy_right_sleep.gif',
        'angel_left.gif',
        'angel_right.gif',
        'angel_left_hop.gif',
        'angel_right_hop.gif',
        'angel_left_happy.gif',
        'angel_right_happy.gif',
        'photofinish_left.png',
        'photofinish_right.png',
        'photofinish_left_walk.gif',
        'photofinish_right_walk.gif',
        'photofinish_left_run.gif',
        'photofinish_right_run.gif',
        'spitfire_left.gif',
        'spitfire_right.gif',
        'spitfire_left_walk.gif',
        'spitfire_right_walk.gif',
        'spitfire_left_hover.gif',
        'spitfire_right_hover.gif',
        'spitfire_left_fly.gif',
        'spitfire_right_fly.gif',
        'spitfire2_left.gif',
        'spitfire2_right.gif',
        'spitfire2_left_walk.gif',
        'spitfire2_right_walk.gif',
        'spitfire2_left_hover.gif',
        'spitfire2_right_hover.gif',
        'soarin_left.gif',
        'soarin_right.gif',
        'soarin_left_walk.gif',
        'soarin_right_walk.gif',
        'soarin_left_hover.gif',
        'soarin_right_hover.gif',
        'soarin_left_pie.gif',
        'soarin_right_pie.gif',
        'bigcelestia_left.gif',
        'bigcelestia_right.gif',
        'bigcelestia_left_walk.gif',
        'bigcelestia_right_walk.gif',
        'bigcelestia_left_hover.gif',
        'bigcelestia_right_hover.gif',
        'celestia_left.gif',
        'celestia_right.gif',
        'celestia_left_walk.gif',
        'celestia_right_walk.gif',
        'celestia_left_walk_troll.gif',
        'celestia_right_walk_troll.gif',
        'celestia_left_hover.gif',
        'celestia_right_hover.gif',
        'celestia_left_sleep.gif',
        'celestia_right_sleep.gif',
        'fillycelestia_left.gif',
        'fillycelestia_right.gif',
        'fillycelestia_left_walk.gif',
        'fillycelestia_right_walk.gif',
        'fillycelestia_left_sit.gif',
        'fillycelestia_right_sit.gif',
        'fillycelestia_left_sleep.gif',
        'fillycelestia_right_sleep.gif',
        'nightmaremoon_left.gif',
        'nightmaremoon_right.gif',
        'nightmaremoon_left_walk.gif',
        'nightmaremoon_right_walk.gif',
        'luna2_left.gif',
        'luna2_right.gif',
        'luna2_left_walk.gif',
        'luna2_right_walk.gif',
        'luna_left.gif',
        'luna_right.gif',
        'luna_left_walk.gif',
        'luna_right_walk.gif',
        'luna_left_hover.gif',
        'luna_right_hover.gif',
        'luna_left_jump.gif',
        'luna_right_jump.gif',
        'luna_left_sleep.gif',
        'luna_right_sleep.gif',
        'fillyluna_left.gif',
        'fillyluna_right.gif',
        'fillyluna_left_walk.gif',
        'fillyluna_right_walk.gif',
        'fillyluna_left_hover.gif',
        'fillyluna_right_hover.gif',
        'fillyluna_left_sleep.gif',
        'fillyluna_right_sleep.gif',
        'twilight_left.gif',
        'twilight_right.gif',
        'twilight_left_walk.gif',
        'twilight_right_walk.gif',
        'twilight_left_conga.gif',
        'twilight_right_conga.gif',
        'twilight_left_run.gif',
        'twilight_right_run.gif',
        'twilight_left_crazy.gif',
        'twilight_right_crazy.gif',
        'fillytwilight_left.gif',
        'fillytwilight_right.gif',
        'fillytwilight_left_walk.gif',
        'fillytwilight_right_walk.gif',
        'fillytwilight_left_dance.gif',
        'fillytwilight_right_dance.gif',
        'rarity_left.gif',
        'rarity_right.gif',
        'rarity_left_walk.gif',
        'rarity_right_walk.gif',
        'rarity_left_conga.gif',
        'rarity_right_conga.gif',
        'rarity_left_hover.gif',
        'rarity_right_hover.gif',
        'rarity_left_sleep.gif',
        'rarity_right_sleep.gif',
        'fillyrarity_left.gif',
        'fillyrarity_right.gif',
        'fillyrarity_left_walk.gif',
        'fillyrarity_right_walk.gif',
        'fillyrarity_left_sleep.gif',
        'fillyrarity_right_sleep.gif',
        'opalescence_left.gif',
        'opalescence_right.gif',
        'opalescence_left_walk.gif',
        'opalescence_right_walk.gif',
        'opalescence_left_roll.gif',
        'opalescence_right_roll.gif',
        'royalguard_left.gif',
        'royalguard_right.gif',
        'royalguard_left_walk.gif',
        'royalguard_right_walk.gif',
        'royalguard_left_hover.gif',
        'royalguard_right_hover.gif',
        'pinkiepie_left.gif',
        'pinkiepie_right.gif',
        'pinkiepie_left_walk.gif',
        'pinkiepie_right_walk.gif',
        'pinkiepie_left_walk_mask.gif',
        'pinkiepie_right_walk_mask.gif',
        'pinkiepie_left_conga.gif',
        'pinkiepie_right_conga.gif',
        'pinkiepie_left_run.gif',
        'pinkiepie_right_run.gif',
        'pinkiepie_left_hover.gif',
        'pinkiepie_right_hover.gif',
        'pinkiepie_left_hover2.gif',
        'pinkiepie_right_hover2.gif',
        'pinkiepie_left_bounce.gif',
        'pinkiepie_right_bounce.gif',
        'pinkiepie_left_bounce_happy.gif',
        'pinkiepie_right_bounce_happy.gif',
        'pinkiepie_left_dance.gif',
        'pinkiepie_right_dance.gif',
        'crazypie_left.gif',
        'crazypie_right.gif',
        'crazypie_left_walk.gif',
        'crazypie_right_walk.gif',
        'fillypinkiepie_left.gif',
        'fillypinkiepie_right.gif',
        'fillypinkiepie_left_walk.gif',
        'fillypinkiepie_right_walk.gif',
        'fillypinkiepie2_left.gif',
        'fillypinkiepie2_right.gif',
        'fillypinkiepie2_left_walk.gif',
        'fillypinkiepie2_right_walk.gif',
        'fillypinkiepie2_left_dance.gif',
        'fillypinkiepie2_right_dance.gif',
        'gummy_left.gif',
        'gummy_right.gif',
        'gummy_left_walk.gif',
        'gummy_right_walk.gif',
        'gummy_left_bounce.gif',
        'gummy_right_bounce.gif',
        'berrypunch_left.gif',
        'berrypunch_right.gif',
        'berrypunch_left_walk.gif',
        'berrypunch_right_walk.gif',
        'berrypunch_left_sit.gif',
        'berrypunch_right_sit.gif',
        'berrypunch_left_sleep.gif',
        'berrypunch_right_sleep.gif',
        'bigmacintosh_left.gif',
        'bigmacintosh_right.gif',
        'bigmacintosh_left_walk.gif',
        'bigmacintosh_right_walk.gif',
        'bigmacintosh_left_sleep.gif',
        'bigmacintosh_right_sleep.gif',
        'grannysmith_left.gif',
        'grannysmith_right.gif',
        'grannysmith_left_walk.gif',
        'grannysmith_right_walk.gif',
        'grannysmith_left_sleep.gif',
        'grannysmith_right_sleep.gif',
        'grannysmith_left_chair.gif',
        'grannysmith_right_chair.gif',
        'braeburn_left.gif',
        'braeburn_right.gif',
        'braeburn_left_walk.gif',
        'braeburn_right_walk.gif',
        'applejack_left.gif',
        'applejack_right.gif',
        'applejack_left_walk.gif',
        'applejack_right_walk.gif',
        'applejack_left_conga.gif',
        'applejack_right_conga.gif',
        'applejack_left_gallop.gif',
        'applejack_right_gallop.gif',
        'fillyapplejack_left.gif',
        'fillyapplejack_right.gif',
        'fillyapplejack_left_walk.gif',
        'fillyapplejack_right_walk.gif',
        'fillyapplejack_left_travel.gif',
        'fillyapplejack_right_travel.gif',
        'winona_left.gif',
        'winona_right.gif',
        'winona_left_run.gif',
        'winona_right_run.gif',
        'applebloom_left.gif',
        'applebloom_right.gif',
        'applebloom_left_walk.gif',
        'applebloom_right_walk.gif',
        'applebloom_left_skip.gif',
        'applebloom_right_skip.gif',
        'scootaloo_left.gif',
        'scootaloo_right.gif',
        'scootaloo_left_walk.gif',
        'scootaloo_right_walk.gif',
        'scootaloo_left_skip.gif',
        'scootaloo_right_skip.gif',
        'scootaloo_left_scoot.gif',
        'scootaloo_right_scoot.gif',
        'scootaloo_left_basket.gif',
        'scootaloo_right_basket.gif',
        'sweetiebelle_left.gif',
        'sweetiebelle_right.gif',
        'sweetiebelle_left_walk.gif',
        'sweetiebelle_right_walk.gif',
        'sweetiebelle_left_sit.gif',
        'sweetiebelle_right_sit.gif',
        'sweetiebelle_left_jump.gif',
        'sweetiebelle_right_jump.gif',
        'sweetiebelle_left_skip.gif',
        'sweetiebelle_right_skip.gif',
        'sweetiebelle_left_scoot.gif',
        'sweetiebelle_right_scoot.gif',
        'sweetiebelle_left_cloud.gif',
        'sweetiebelle_right_cloud.gif',
        'cheerilee_left.gif',
        'cheerilee_right.gif',
        'cheerilee_left_walk.gif',
        'cheerilee_right_walk.gif',
        'bonbon_left.gif',
        'bonbon_right.gif',
        'bonbon_left_walk.gif',
        'bonbon_right_walk.gif',
        'bonbon_left_sleep.gif',
        'bonbon_right_sleep.gif',        
        'lyra_left.gif',
        'lyra_right.gif',
        'lyra_left_walk.gif',
        'lyra_right_walk.gif',
        'lyra_left_jump.gif',
        'lyra_right_jump.gif',
        'lyra_left_sit.gif',
        'lyra_right_sit.gif',
        'lyra_left_sleep.gif',
        'lyra_right_sleep.gif',
        'trixie_left.gif',
        'trixie_right.gif',
        'trixie_left_walk.gif',
        'trixie_right_walk.gif',
        'trixie2_left.gif',
        'trixie2_right.gif',
        'trixie2_left_walk.gif',
        'trixie2_right_walk.gif',
        'zecora_left.gif',
        'zecora_right.gif',
        'zecora_left_walk.gif',
        'zecora_right_walk.gif'
    ];
    
    var socket, connected = false, ignoreDisconnect = false, me, myNick, myRoom = null, mySpecialStatus, lastmove = (new Date().getTime()), globalUserCount = 0;
    
    var container, loginbox, nickbox, passbox, loginsubmit, overlay, outerstage, stage, creditslink, steamgrouplink, chooser, chooserbutton, roomlist, refreshbutton, background, chatbox, chatboxholder, chatbutton, chatlog, fullchatlog, fullchatlogbutton, fullchatlogvisible;
    
    var userManager = {
        users: {},
        userCount: 0,
        userCounter: null,
        
        initGUI: function () {
            this.userCounter = document.createElement('div');
            this.userCounter.id = 'usercounter';
            this.updateCounter();
            overlay.appendChild(this.userCounter);
        },
        add: function (nick, obj, special, me) {
            if (this.has(nick)) {
                throw new Error("There is already a user with the same nick.");
            }

            var elem = document.createElement('div');
            elem.className = 'pony';
            if (me) {
                elem.className += ' my-pony';
            } else {
                elem.onclick = function () {
                    chatbox.value += nick;
                    chatbox.focus();
                };
            }
            
            var chat = document.createElement('p');
            chat.className = 'chatbubble';
            elem.appendChild(chat);
            
            var nickTag = document.createElement('p');
            nickTag.className = 'nickname';
            nickTag.appendChild(document.createTextNode(nick));
            if (special) {
                nickTag.className += ' ' + special;
            }
            elem.appendChild(nickTag);
            
            stage.appendChild(elem);
            
            this.users[nick] = {
                obj: obj,
                nick: nick,
                elem: {
                    root: elem,
                    chat: chat,
                    nickTag: nickTag,
                    img: null
                }
            };
            
            this.update(nick, obj);
            this.userCount++;
            this.updateCounter();
            logJoinInChat(nick);
        },
        update: function (nick, obj) {
            this.hasCheck(nick);
        
            var user = this.users[nick];
            user.elem.root.style.left = obj.x + 'px';
            user.elem.root.style.top = obj.y + 'px';
            if (ponies.hasOwnProperty(obj.img)) {
                user.elem.root.style.backgroundImage = 'url(media/' + ponies[obj.img] + ')';
                user.elem.img = document.createElement('img');
                user.elem.img.src = 'media/' + ponies[obj.img];
                user.elem.img.onload = function () {
                    var newHeight = user.elem.img.height;
                    var newWidth = user.elem.img.width;

                    // adjust bounding box size
                    user.elem.root.style.width = newWidth + 'px';
                    user.elem.root.style.height = newHeight + 'px';

                    // adjust bounding box margin (translate about image centre)
                    user.elem.root.style.marginLeft = -newWidth/2 + 'px';
                    user.elem.root.style.marginTop = -newHeight/2 + 'px';

                    // adjust positioning of nick tag and chat bubble
                    user.elem.chat.style.bottom = newHeight + 'px';
                    user.elem.chat.style.marginLeft = (newWidth - 168) / 2 + 'px';
                    user.elem.nickTag.style.top = newHeight + 'px';
                    user.elem.nickTag.style.marginLeft = (newWidth - 168) / 2 + 'px';
                };
            } else {
                user.elem.root.style.backgroundImage = 'none';
                user.elem.root.style.height = PONY_HEIGHT + 'px';
            }
            
            user.elem.chat.innerHTML = '';
            user.elem.chat.appendChild(document.createTextNode(obj.chat));
            if (obj.chat !== user.obj.chat && obj.chat !== '') {
                logInChat(nick, obj.chat);
            }
            
            user.obj = obj;
        },
        kill: function (nick) {
            this.hasCheck(nick);
        
            var user = this.users[nick];
            this.userCount--;
            this.updateCounter();
            logLeaveInChat(nick);
            stage.removeChild(user.elem.root);
            delete this.users[nick];
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
                    callback(nick);
                }
            }
        },
        updateCounter: function () {
            this.userCounter.innerHTML = '';
            if (myRoom !== null) {
                if (myRoom.type !== 'ephemeral') {
                    this.userCounter.appendChild(document.createTextNode('You are in ' + myRoom.name + ' ("' + myRoom.name_full + '")'));
                } else {
                    this.userCounter.appendChild(document.createTextNode('You are in the ephemeral room "' + myRoom.name + '"'));
                }
                this.userCounter.appendChild(document.createElement('br'));
                this.userCounter.appendChild(document.createTextNode(this.userCount + ' users in room'));
            } else {
                this.userCounter.appendChild(document.createTextNode('You are not in a room'));
            }
            this.userCounter.appendChild(document.createElement('br'));
            this.userCounter.appendChild(document.createTextNode(globalUserCount + ' users online total'));
        }
    };
    
    function pushState() {
        if (connected) {
            socket.send(JSON.stringify({
                type: 'update',
                obj: me
            }));
        }
    }
    
    function pushAndUpdateState(newState) {
        userManager.update(myNick, newState);
        pushState();
    }

    function chatPopulateLine(line, parent) {
        var pos;
        while (((pos = line.indexOf('http://')) !== -1) || ((pos = line.indexOf('https://')) !== -1)) {
            var pos2 = line.indexOf(' ', pos);
            var anchor = document.createElement('a');
            anchor.className = 'chat-link';
            anchor.target = '_blank';
            if (pos2 === -1) {
                parent.appendChild(document.createTextNode(line.substr(0, pos)));

                anchor.href = line.substr(pos);
                anchor.appendChild(document.createTextNode(line.substr(pos)));
                line = '';
            } else {
                parent.appendChild(document.createTextNode(line.substr(0, pos)));
                anchor.href = line.substr(pos, pos2 - pos);
                anchor.appendChild(document.createTextNode(line.substr(pos, pos2 - pos)));
                line = line.substr(pos2);
            }
            parent.appendChild(anchor);
        }
        parent.appendChild(document.createTextNode(line));
        parent.appendChild(document.createElement('br'));
    }
    
    function chatPrint(line, highlight, showInShortLog) {
        function digitPad(n) {
            return n = (n < 10) ? ("0" + n) : n;
        }
    
        var date = new Date()
        line = '[' + digitPad(date.getHours()) + ':' + digitPad(date.getMinutes()) + '] ' + line;
    
        if (showInShortLog) {
            var span = document.createElement('span');
            span.className = 'chatline';
            if (highlight) {
                span.className += ' highlight';
            }
            chatPopulateLine(line, span);
            chatlog.appendChild(span);
            while (chatlog.children.length > 12) {
                chatlog.removeChild(chatlog.firstChild);
            }
        }

        chatPopulateLine(line, fullchatlog);
    }
    
    function highlightCheck(msg) {
        return (msg.indexOf(myNick) !== -1);
    }
    
    function logInChat(nick, msg) {
        chatPrint('<' + nick + '> ' + msg, highlightCheck(msg), true);
    }
    
    function logBroadcastInChat(msg) {
        chatPrint('** BROADCAST: ' + msg, highlightCheck(msg), true);
    }
    
    function logConsoleMessageInChat(msg) {
        chatPrint('* CONSOLE: ' + msg, false, true);
    }
    
    function logJoinInChat(nick) {
        chatPrint(nick + ' appeared', false, false);
    }
    
    function logLeaveInChat(nick) {
        chatPrint(nick + ' left', false, false);
    }
    
    function logRoomJoinInChat(name, name_full) {
        chatPrint('You joined the room ' + name + ' ("' + name_full + '")', false, true);
    }

    function logEphemeralRoomJoinInChat(name) {
        chatPrint('You joined the ephemeral room "' + name + '"', false, true);
    }
    
    function updateRoomList(rooms) {
        var option;
        roomlist.innerHTML = '';

        // special, "blank" option
        option = document.createElement('option');
        option.value = '[no choice]';
        option.appendChild(document.createTextNode('Choose a room...'));
        roomlist.appendChild(option);

        for (var i = 0; i < rooms.length; i++) {
            var data = rooms[i];
            option = document.createElement('option');
            option.value = data.name;
            if (data.type !== 'ephemeral') {
                option.appendChild(document.createTextNode('⇨ ' + data.name_full + ' (' + data.user_count + ' ' + data.user_noun + ')'));
            } else {
                option.appendChild(document.createTextNode('⇨ "' + data.name + '" (ephemeral; ' + data.user_count + ' users)'));
            }
            roomlist.appendChild(option);
        }

        // special, "create new" option
        option = document.createElement('option');
        option.value = '[create new]';
        option.appendChild(document.createTextNode('[create new ephemeral room]'));
        roomlist.appendChild(option);
    }
    
    function changeRoom(room) {
        // change background
        if (room.type !== 'ephemeral') {
            background.src = room.img;
            stage.style.width = room.width + 'px';
        } else {
            background.src = 'media/background-cave.png';
            stage.style.width = '960px';
        }
        
        // clear users
        userManager.forEach(function (nick) {
            userManager.kill(nick);
        });

        myRoom = room;
        
        // add me
        userManager.add(myNick, me, mySpecialStatus, true);

        // go to random position
        if (room.type !== 'ephemeral') {
            me.x = me.x || Math.floor(Math.random() * 920);
        } else {
            me.x = me.x || Math.floor(Math.random() * room.width);
        }
        me.y = me.y || Math.floor(Math.random() * ROOM_HEIGHT);
        outerstage.scrollLeft = Math.floor(me.x + window.innerWidth / 2);
        
        // push state
        pushAndUpdateState(me);

        if (room.type !== 'ephemeral') {
            logRoomJoinInChat(room.name, room.name_full);
        } else {
            logEphemeralRoomJoinInChat(room.name);
        }

        // update URL hash
        window.location.hash = room.name;
    }
    
    function initGUI() {
        document.body.innerHTML = '';
    
        document.body.onkeypress = function (e) {
            if (e.which == 13) {
                chatbox.focus();
                e.preventDefault();
                return false;
            }
        };
    
        container = document.createElement('div');
        container.id = 'container';
        document.body.appendChild(container);

        outerstage = document.createElement('div');
        outerstage.id = 'outer-stage';
        container.appendChild(outerstage);

        stage = document.createElement('div');
        stage.id = 'stage';
        outerstage.appendChild(stage);

        background = document.createElement('img');
        background.id = 'background';
        background.src = 'media/background-noroom.png';
        background.onclick = function (e) {
            var cur = (new Date().getTime());
            if (cur - lastmove > 400) {
                var newx = e.layerX;
                me.img = (me.img|1) - (me.x<newx ? 0 : 1);
                me.x = newx;
                me.y = e.layerY;
                pushAndUpdateState(me);
                lastmove = cur;
            } else {
                chatPrint('You are doing that too often.');
            }
        };
        background.ondragstart = function () {
            return false;
        };
        stage.appendChild(background);
        
        overlay = document.createElement('div');
        overlay.id = 'overlay';
        container.appendChild(overlay);

        function doLogin() {
            loginbox.style.display = 'none';
            localStorage.setItem('login-details', JSON.stringify({
                nick: nickbox.value,
                pass: passbox.value
            }));
            initNetwork();
        }
        
        loginbox = document.createElement('div');
        loginbox.id = 'loginbox';
        loginbox.appendChild(document.createTextNode("Choose a nickname. (You'll only need a password if it has been protected)"));
        overlay.appendChild(loginbox);

        nickbox = document.createElement('input');
        nickbox.type = 'text';
        nickbox.placeholder = 'nickname';
        nickbox.onkeypress = function (e) {
            if (e.which === 13) {
                doLogin();
            }
        };
        loginbox.appendChild(nickbox);
        nickbox.focus();

        passbox = document.createElement('input');
        passbox.type = 'password';
        passbox.placeholder = 'password';
        passbox.onkeypress = nickbox.onkeypress;
        loginbox.appendChild(passbox);

        // prepopulate from local storage
        var data = localStorage.getItem('login-details');
        if (data) {
            data = JSON.parse(data);
            nickbox.value = data.nick;
            passbox.value = data.pass;
        }

        loginsubmit = document.createElement('input');
        loginsubmit.type = 'submit';
        loginsubmit.value = 'Connect';
        loginsubmit.onclick = doLogin;
        loginbox.appendChild(loginsubmit);
        
        creditslink = document.createElement('a');
        creditslink.id = 'credits-link';
        creditslink.className = 'button';
        creditslink.href = 'credits.html';
        creditslink.target = '_blank';
        creditslink.appendChild(document.createTextNode('Credits'));
        overlay.appendChild(creditslink);
        
        steamgrouplink = document.createElement('a');
        steamgrouplink.id = 'steamgroup-link';
        steamgrouplink.className = 'button';
        steamgrouplink.href = 'http://steamcommunity.com/groups/ponyplace';
        steamgrouplink.target = '_blank';
        steamgrouplink.appendChild(document.createTextNode('Steam Group'));
        overlay.appendChild(steamgrouplink);
        
        chatlog = document.createElement('div');
        chatlog.id = 'chatlog';
        overlay.appendChild(chatlog);
        
        fullchatlog = document.createElement('div');
        fullchatlog.id = 'fullchatlog';
        fullchatlog.style.display = 'none';
        fullchatlogvisible = false;
        overlay.appendChild(fullchatlog);
        
        fullchatlogbutton = document.createElement('input');
        fullchatlogbutton.id = 'fullchatlog-button';
        fullchatlogbutton.type = 'submit';
        fullchatlogbutton.value = 'Full chatlog';
        fullchatlogbutton.onclick = function () {
            if (fullchatlogvisible) {
                fullchatlog.style.display = 'none';
                fullchatlogvisible = false;
            } else {
                fullchatlog.style.display = 'block'
                fullchatlogvisible = true;
                fullchatlog.scrollTop = fullchatlog.scrollHeight;
            }
        };
        overlay.appendChild(fullchatlogbutton);

        refreshbutton = document.createElement('input');
        refreshbutton.type = 'submit';
        refreshbutton.value = 'Refresh list';
        refreshbutton.id = 'room-refresh-button';
        refreshbutton.onclick = function () {
            socket.send(JSON.stringify({
                type: 'room_list'
            }));
        };
        overlay.appendChild(refreshbutton);

        roomlist = document.createElement('select');
        roomlist.id = 'room-list';
        roomlist.onchange = function () {
            if (roomlist.value === '[create new]') {
                var roomName = prompt('Choose a room name (cannot contain spaces)', '');
                if (roomName.indexOf(' ') === -1) {
                    socket.send(JSON.stringify({
                        type: 'room_change',
                        name: roomName
                    }));
                } else {
                    alert('Room names cannot contain spaces.');
                }
            } else if (roomlist.value !== '[no choice]') {
                socket.send(JSON.stringify({
                    type: 'room_change',
                    name: roomlist.value
                }));
            }
            roomlist.value = '[no choice]';
        };
        roomlist.value = '[no choice]';
        overlay.appendChild(roomlist);
        
        function handleChatMessage() {
            // is command
            if (chatbox.value[0] === '/') {
                socket.send(JSON.stringify({
                    type: 'console_command',
                    cmd: chatbox.value.substr(1)
                }));
            // is chat message
            } else {
                me.chat = chatbox.value;
                if (me.chat !== '') {
                    logInChat(myNick, me.chat, true);
                }
                pushAndUpdateState(me);
            }
            chatbox.value = '';
        }

        chatboxholder = document.createElement('div');
        chatboxholder.id = 'chatbox-holder';
        container.appendChild(chatboxholder);
        
        chatbox = document.createElement('input');
        chatbox.type = 'text';
        chatbox.id = 'chatbox';
        chatbox.maxLength = 100;
        chatbox.onkeypress = function (e) {
            if (e.which === 13) {
                handleChatMessage();
            }
        };
        chatboxholder.appendChild(chatbox);
        
        chatbutton = document.createElement('input');
        chatbutton.type = 'submit';
        chatbutton.value = 'Send';
        chatbutton.id = 'chatbutton';
        chatbutton.onclick = function (e) {
            handleChatMessage();
        };
        container.appendChild(chatbutton);

        chooser = document.createElement('div');
        chooser.id = 'chooser';
        chooser.style.display = 'none';
        
        chooserbutton = document.createElement('input');
        chooserbutton.id = 'chooser-button';
        chooserbutton.type = 'submit';
        chooserbutton.value = 'Change Avatar';
        chooserbutton.onclick = function () {
            chooser.style.display = 'block';
            chooser.innerHTML = '';
            var last = '', cur = '';
            for (var i = 0; i < ponies.length; i++) {
                // split pony name prefix
                cur = ponies[i].split('_', 1)[0];
                if (cur === last) {
                    // only show first avatar
                    continue;
                } else {
                    last = cur;
                }

                var preview = document.createElement('img');
                preview.src = 'media/' + ponies[i];
                preview.className = 'chooser-preview';
                (function (imgid, prefix) {
                    preview.onclick = function () {
                        chooser.innerHTML = '';
                        for (var i = imgid; i < ponies.length; i++) {
                            // split pony name prefix
                            if (ponies[i].split('_', 1)[0] !== prefix) {
                                // only show avatars for that pony
                                break;
                            }
                            var preview = document.createElement('img');
                            preview.src = 'media/' + ponies[i];
                            preview.className = 'chooser-preview';
                            (function (imgid) {
                                preview.onclick = function () {
                                    me.img = imgid;
                                    pushAndUpdateState(me);
                                    chooser.style.display = 'none';
                                    if (ponies[imgid].indexOf('_upsidedown') !== -1) {
                                        container.className = 'upside-down';
                                    } else {
                                        container.className = '';
                                    }
                                };
                            }(i));
                            chooser.appendChild(preview);
                        }
                    };
                }(i, cur));
                chooser.appendChild(preview);
            }
            container.appendChild(chooser);
        };
        overlay.appendChild(chooserbutton);
        
        userManager.initGUI();
    }

    function initNetwork() {
        if (window.location.hostname === 'localhost') {
            socket = new WebSocket('ws://localhost:9001', 'ponyplace-broadcast');
        } else {
            socket = new WebSocket('ws://ajf.me:9001', 'ponyplace-broadcast');
        }
        
        socket.onopen = function () {
            connected = true;
            myNick = nickbox.value || ('Blank flank #' + Math.floor(Math.random()*100));
            // trim whitespace
            myNick = myNick.replace(/^\s+|\s+$/g, '');
            mySpecialStatus = false;
            me = {
                img: Math.floor(Math.random() * ponies.length),
                x: 0,
                y: 0,
                chat: ''
            };
            
            socket.send(JSON.stringify({
                type: 'appear',
                obj: me,
                nick: myNick,
                password: passbox.value || null
            }));

            // ponyplace.ajf.me/#roomname shortcut
            if (window.location.hash) {
                socket.send(JSON.stringify({
                    type: 'room_change',
                    name: window.location.hash.substr(1)
                }));
            }

            chatbox.focus();
        };
        socket.onclose = function (e) {
            connected = false;
            if (!ignoreDisconnect) {
                alert('Error, lost connection!\nThis may be because:\n- Server shut down to be updated (try reloading)\n- Failed to connect (server\'s down)\n- Server crashed\n- You were kicked');
                container.className = 'disconnected';
                container.innerHTML = '';
            }
        };
        socket.onmessage = function (e) {
            var msg = JSON.parse(e.data);
            switch (msg.type) {
                case 'appear':
                    userManager.add(msg.nick, msg.obj, msg.special, false);
                break;
                case 'update':
                    if (msg.nick !== myNick) {
                        userManager.update(msg.nick, msg.obj);
                    }
                break;
                case 'are_special':
                    mySpecialStatus = msg.status;
                break;
                case 'broadcast':
                    logBroadcastInChat(msg.msg);
                break;
                case 'console_msg':
                    logConsoleMessageInChat(msg.msg);
                break;
                case 'die':
                    userManager.kill(msg.nick);
                break;
                case 'room_list':
                    updateRoomList(msg.list);
                    globalUserCount = msg.user_count;
                    userManager.updateCounter();
                break;
                case 'room_change':
                    changeRoom(msg.data);
                break;
                case 'kick':
                    if (msg.reason === 'nick_in_use') {
                        alert('That nickname was already in use. Reload and choose a different one.');
                    } else if (msg.reason === 'bad_nick') {
                        alert('Bad nickname - nicknames must be between 1 and 18 characters, and have no trailing or leading whitespace.');
                    } else if (msg.reason === 'wrong_password') {
                        alert('Incorect password.');
                        // erase login details
                        localStorage.setItem('login-details', '');
                    } else if (msg.reason === 'password_required') {
                        alert('This nickname is password protected.');
                        // erase login details
                        localStorage.setItem('login-details', '');
                    } else if (msg.reason === 'no_password') {
                        alert('This nickname has no password set.');
                        // erase login details
                        localStorage.setItem('login-details', '');
                    } else if (msg.reason === 'protocol_error') {
                        alert('There was a protocol error. This usually means your client sent a malformed packet. Your client is probably out of date, try clearing your cache and refreshing.');
                    } else if (msg.reason === 'no_such_room') {
                        alert("No such room. You tried to join a room that doesn't exist.");
                    } else if (msg.reason === 'kick') {
                        alert('You were kicked!');
                    } else if (msg.reason === 'ban') {
                        alert('You were banned!');
                    } else if (msg.reason === 'update') {
                        ignoreDisconnect = true;
                        window.setTimeout(function () {
                            alert('ponyplace update happening - page will reload');
                            window.location.reload();
                        }, (5+Math.floor(Math.random() * 5)) * 1000);
                    }
                break;
                default:
                    alert('There was a protocol error. This usually means the server sent a malformed packet. Your client is probably out of date, try clearing your cache and refreshing.');
                    socket.close();
                break;
            }
        };
    }

    window.onload = function () {
        initGUI();
    };
}());
