(function () {
    'use strict';

    // get them before IE errors out
    if (!window.hasOwnProperty('WebSocket')) {
        window.location = 'no-websocket.html';
        return;
    }
    
    var CV_HEIGHT = 680;
    var CHAT_HEIGHT = 20;
    var PONY_WIDTH = 168, PONY_HEIGHT = 168;
    
    var ponies = [
        'media/derpy_left.gif',
        'media/derpy_right.gif',
        'media/derpy_left_walk.gif',
        'media/derpy_right_walk.gif',
        'media/derpy_left_hover.gif',
        'media/derpy_right_hover.gif',
        'media/derpy_left_hover_upsidedown.gif',
        'media/derpy_right_hover_upsidedown.gif',
        'media/derpy_left_sleep.gif',
        'media/derpy_right_sleep.gif',
        'media/vinylscratch_left.gif',
        'media/vinylscratch_right.gif',
        'media/vinylscratch_left_walk.gif',
        'media/vinylscratch_right_walk.gif',
        'media/vinylscratch_left_dance.gif',
        'media/vinylscratch_right_dance.gif',
        'media/octavia_left.gif',
        'media/octavia_right.gif',
        'media/octavia_left_walk.gif',
        'media/octavia_right_walk.gif',
        'media/octavia_left_cello.gif',
        'media/octavia_right_cello.gif',
        'media/maredowell_left.gif',
        'media/maredowell_right.gif',
        'media/maredowell_left_walk.gif',
        'media/maredowell_right_walk.gif',
        'media/maredowell_left_run.gif',
        'media/maredowell_right_run.gif',
        'media/maredowell_left_hover.gif',
        'media/maredowell_right_hover.gif',
        'media/maredowell_left_fly.gif',
        'media/maredowell_right_fly.gif',
        'media/spike_left.gif',
        'media/spike_right.gif',
        'media/spike_left_walk.gif',
        'media/spike_right_walk.gif',
        'media/spike_left_float.gif',
        'media/spike_right_float.gif',
        'media/carrottop_left.gif',
        'media/carrottop_right.gif',
        'media/carrottop_left_walk.gif',
        'media/carrottop_right_walk.gif',
        'media/colgate_left.gif',
        'media/colgate_right.gif',
        'media/colgate_left_walk.gif',
        'media/colgate_right_walk.gif',
        'media/colgate_left_sit.gif',
        'media/colgate_right_sit.gif',
        'media/doctorwhooves_left.gif',
        'media/doctorwhooves_right.gif',
        'media/doctorwhooves_left_walk.gif',
        'media/doctorwhooves_right_walk.gif',
        'media/rainbowdash_left.gif',
        'media/rainbowdash_right.gif',
        'media/rainbowdash_left_walk.gif',
        'media/rainbowdash_right_walk.gif',
        'media/rainbowdash_left_conga.gif',
        'media/rainbowdash_right_conga.gif',
        'media/rainbowdash_left_dinosaur.gif',
        'media/rainbowdash_right_dinosaur.gif',
        'media/rainbowdash_left_run.gif',
        'media/rainbowdash_right_run.gif',
        'media/rainbowdash_left_hover.gif',
        'media/rainbowdash_right_hover.gif',
        'media/rainbowdash_left_hover_dizzy.gif',
        'media/rainbowdash_right_hover_dizzy.gif',
        'media/rainbowdash_left_fly.gif',
        'media/rainbowdash_right_fly.gif',
        'media/rainbowdash_left_sleep.gif',
        'media/rainbowdash_right_sleep.gif',
        'media/fillyrainbowdash_left.gif',
        'media/fillyrainbowdash_right.gif',
        'media/fillyrainbowdash_left_walk.gif',
        'media/fillyrainbowdash_right_walk.gif',
        'media/fillyrainbowdash_left_hover.gif',
        'media/fillyrainbowdash_right_hover.gif',
        'media/fillyrainbowdash_left_fly.gif',
        'media/fillyrainbowdash_right_fly.gif',
        'media/tank_left_hover.gif',
        'media/tank_right_hover.gif',
        'media/daringdo_left.gif',
        'media/daringdo_right.gif',
        'media/daringdo_left_walk.gif',
        'media/daringdo_right_walk.gif',
        'media/ironwill_left_walk.gif',
        'media/ironwill_right_walk.gif',
        'media/fluttershy_left.gif',
        'media/fluttershy_right.gif',
        'media/fluttershy_left_walk.gif',
        'media/fluttershy_right_walk.gif',
        'media/fluttershy_left_conga.gif',
        'media/fluttershy_right_conga.gif',
        'media/fluttershy_left_hover.gif',
        'media/fluttershy_right_hover.gif',
        'media/fluttershy_left_sleep.gif',
        'media/fluttershy_right_sleep.gif',
        'media/fillyfluttershy_left.gif',
        'media/fillyfluttershy_right.gif',
        'media/fillyfluttershy_left_walk.gif',
        'media/fillyfluttershy_right_walk.gif',
        'media/fillyfluttershy_left_hover.gif',
        'media/fillyfluttershy_right_hover.gif',
        'media/fillyfluttershy_left_sit.gif',
        'media/fillyfluttershy_right_sit.gif',
        'media/fillyfluttershy_left_sleep.gif',
        'media/fillyfluttershy_right_sleep.gif',
        'media/angel_left.gif',
        'media/angel_right.gif',
        'media/angel_left_hop.gif',
        'media/angel_right_hop.gif',
        'media/angel_left_happy.gif',
        'media/angel_right_happy.gif',
        'media/spitfire_left.gif',
        'media/spitfire_right.gif',
        'media/spitfire_left_walk.gif',
        'media/spitfire_right_walk.gif',
        'media/spitfire_left_hover.gif',
        'media/spitfire_right_hover.gif',
        'media/spitfire_left_fly.gif',
        'media/spitfire_right_fly.gif',
        'media/spitfire2_left.gif',
        'media/spitfire2_right.gif',
        'media/spitfire2_left_walk.gif',
        'media/spitfire2_right_walk.gif',
        'media/spitfire2_left_hover.gif',
        'media/spitfire2_right_hover.gif',
        'media/soarin_left.gif',
        'media/soarin_right.gif',
        'media/soarin_left_walk.gif',
        'media/soarin_right_walk.gif',
        'media/soarin_left_hover.gif',
        'media/soarin_right_hover.gif',
        'media/soarin_left_pie.gif',
        'media/soarin_right_pie.gif',
        'media/celestia_left.gif',
        'media/celestia_right.gif',
        'media/celestia_left_walk.gif',
        'media/celestia_right_walk.gif',
        'media/celestia_left_walk_troll.gif',
        'media/celestia_right_walk_troll.gif',
        'media/celestia_left_hover.gif',
        'media/celestia_right_hover.gif',
        'media/celestia_left_sleep.gif',
        'media/celestia_right_sleep.gif',
        'media/fillycelestia_left.gif',
        'media/fillycelestia_right.gif',
        'media/fillycelestia_left_walk.gif',
        'media/fillycelestia_right_walk.gif',
        'media/fillycelestia_left_sit.gif',
        'media/fillycelestia_right_sit.gif',
        'media/fillycelestia_left_sleep.gif',
        'media/fillycelestia_right_sleep.gif',
        'media/luna_left.gif',
        'media/luna_right.gif',
        'media/luna_left_walk.gif',
        'media/luna_right_walk.gif',
        'media/luna_left_hover.gif',
        'media/luna_right_hover.gif',
        'media/luna_left_jump.gif',
        'media/luna_right_jump.gif',
        'media/luna_left_sleep.gif',
        'media/luna_right_sleep.gif',
        'media/fillyluna_left.gif',
        'media/fillyluna_right.gif',
        'media/fillyluna_left_walk.gif',
        'media/fillyluna_right_walk.gif',
        'media/fillyluna_left_hover.gif',
        'media/fillyluna_right_hover.gif',
        'media/fillyluna_left_sleep.gif',
        'media/fillyluna_right_sleep.gif',
        'media/luna2_left.gif',
        'media/luna2_right.gif',
        'media/luna2_left_walk.gif',
        'media/luna2_right_walk.gif',
        'media/twilight_left.gif',
        'media/twilight_right.gif',
        'media/twilight_left_walk.gif',
        'media/twilight_right_walk.gif',
        'media/twilight_left_conga.gif',
        'media/twilight_right_conga.gif',
        'media/twilight_left_run.gif',
        'media/twilight_right_run.gif',
        'media/twilight_left_crazy.gif',
        'media/twilight_right_crazy.gif',
        'media/fillytwilight_left.gif',
        'media/fillytwilight_right.gif',
        'media/fillytwilight_left_walk.gif',
        'media/fillytwilight_right_walk.gif',
        'media/fillytwilight_left_dance.gif',
        'media/fillytwilight_right_dance.gif',
        'media/rarity_left.gif',
        'media/rarity_right.gif',
        'media/rarity_left_walk.gif',
        'media/rarity_right_walk.gif',
        'media/rarity_left_conga.gif',
        'media/rarity_right_conga.gif',
        'media/rarity_left_hover.gif',
        'media/rarity_right_hover.gif',
        'media/rarity_left_sleep.gif',
        'media/rarity_right_sleep.gif',
        'media/fillyrarity_left.gif',
        'media/fillyrarity_right.gif',
        'media/fillyrarity_left_walk.gif',
        'media/fillyrarity_right_walk.gif',
        'media/fillyrarity_left_sleep.gif',
        'media/fillyrarity_right_sleep.gif',
        'media/opalescence_left.gif',
        'media/opalescence_right.gif',
        'media/opalescence_left_walk.gif',
        'media/opalescence_right_walk.gif',
        'media/opalescence_left_roll.gif',
        'media/opalescence_right_roll.gif',
        'media/pinkiepie_left.gif',
        'media/pinkiepie_right.gif',
        'media/pinkiepie_left_walk.gif',
        'media/pinkiepie_right_walk.gif',
        'media/pinkiepie_left_conga.gif',
        'media/pinkiepie_right_conga.gif',
        'media/pinkiepie_left_run.gif',
        'media/pinkiepie_right_run.gif',
        'media/pinkiepie_left_hover.gif',
        'media/pinkiepie_right_hover.gif',
        'media/pinkiepie_left_bounce.gif',
        'media/pinkiepie_right_bounce.gif',
        'media/pinkiepie_left_dance.gif',
        'media/pinkiepie_right_dance.gif',
        'media/crazypie_left.gif',
        'media/crazypie_right.gif',
        'media/crazypie_left_walk.gif',
        'media/crazypie_right_walk.gif',
        'media/fillypinkiepie_left.gif',
        'media/fillypinkiepie_right.gif',
        'media/fillypinkiepie_left_walk.gif',
        'media/fillypinkiepie_right_walk.gif',
        'media/fillypinkiepie2_left.gif',
        'media/fillypinkiepie2_right.gif',
        'media/fillypinkiepie2_left_walk.gif',
        'media/fillypinkiepie2_right_walk.gif',
        'media/fillypinkiepie2_left_dance.gif',
        'media/fillypinkiepie2_right_dance.gif',
        'media/gummy_left.gif',
        'media/gummy_right.gif',
        'media/gummy_left_walk.gif',
        'media/gummy_right_walk.gif',
        'media/gummy_left_bounce.gif',
        'media/gummy_right_bounce.gif',
        'media/berrypunch_left.gif',
        'media/berrypunch_right.gif',
        'media/berrypunch_left_walk.gif',
        'media/berrypunch_right_walk.gif',
        'media/berrypunch_left_sit.gif',
        'media/berrypunch_right_sit.gif',
        'media/berrypunch_left_sleep.gif',
        'media/berrypunch_right_sleep.gif',
        'media/bigmacintosh_left.gif',
        'media/bigmacintosh_right.gif',
        'media/bigmacintosh_left_walk.gif',
        'media/bigmacintosh_right_walk.gif',
        'media/bigmacintosh_left_sleep.gif',
        'media/bigmacintosh_right_sleep.gif',
        'media/grannysmith_left.gif',
        'media/grannysmith_right.gif',
        'media/grannysmith_left_walk.gif',
        'media/grannysmith_right_walk.gif',
        'media/grannysmith_left_sleep.gif',
        'media/grannysmith_right_sleep.gif',
        'media/grannysmith_left_chair.gif',
        'media/grannysmith_right_chair.gif',
        'media/braeburn_left.gif',
        'media/braeburn_right.gif',
        'media/braeburn_left_walk.gif',
        'media/braeburn_right_walk.gif',
        'media/applejack_left.gif',
        'media/applejack_right.gif',
        'media/applejack_left_walk.gif',
        'media/applejack_right_walk.gif',
        'media/applejack_left_conga.gif',
        'media/applejack_right_conga.gif',
        'media/applejack_left_gallop.gif',
        'media/applejack_right_gallop.gif',
        'media/fillyapplejack_left.gif',
        'media/fillyapplejack_right.gif',
        'media/fillyapplejack_left_walk.gif',
        'media/fillyapplejack_right_walk.gif',
        'media/fillyapplejack_left_travel.gif',
        'media/fillyapplejack_right_travel.gif',
        'media/applebloom_left.gif',
        'media/applebloom_right.gif',
        'media/applebloom_left_walk.gif',
        'media/applebloom_right_walk.gif',
        'media/applebloom_left_skip.gif',
        'media/applebloom_right_skip.gif',
        'media/scootaloo_left.gif',
        'media/scootaloo_right.gif',
        'media/scootaloo_left_walk.gif',
        'media/scootaloo_right_walk.gif',
        'media/scootaloo_left_skip.gif',
        'media/scootaloo_right_skip.gif',
        'media/scootaloo_left_scoot.gif',
        'media/scootaloo_right_scoot.gif',
        'media/scootaloo_left_basket.gif',
        'media/scootaloo_right_basket.gif',
        'media/sweetiebelle_left.gif',
        'media/sweetiebelle_right.gif',
        'media/sweetiebelle_left_walk.gif',
        'media/sweetiebelle_right_walk.gif',
        'media/sweetiebelle_left_sit.gif',
        'media/sweetiebelle_right_sit.gif',
        'media/sweetiebelle_left_jump.gif',
        'media/sweetiebelle_right_jump.gif',
        'media/sweetiebelle_left_skip.gif',
        'media/sweetiebelle_right_skip.gif',
        'media/sweetiebelle_left_scoot.gif',
        'media/sweetiebelle_right_scoot.gif',
        'media/sweetiebelle_left_cloud.gif',
        'media/sweetiebelle_right_cloud.gif',
        'media/cheerilee_left.gif',
        'media/cheerilee_right.gif',
        'media/cheerilee_left_walk.gif',
        'media/cheerilee_right_walk.gif',
        'media/bonbon_left.gif',
        'media/bonbon_right.gif',
        'media/bonbon_left_walk.gif',
        'media/bonbon_right_walk.gif',
        'media/bonbon_left_sleep.gif',
        'media/bonbon_right_sleep.gif',        
        'media/lyra_left.gif',
        'media/lyra_right.gif',
        'media/lyra_left_walk.gif',
        'media/lyra_right_walk.gif',
        'media/lyra_left_jump.gif',
        'media/lyra_right_jump.gif',
        'media/lyra_left_sit.gif',
        'media/lyra_right_sit.gif',
        'media/lyra_left_sleep.gif',
        'media/lyra_right_sleep.gif',
        'media/trixie_left.gif',
        'media/trixie_right.gif',
        'media/trixie_left_walk.gif',
        'media/trixie_right_walk.gif',
        'media/trixie2_left.gif',
        'media/trixie2_right.gif',
        'media/trixie2_left_walk.gif',
        'media/trixie2_right_walk.gif',
        'media/zecora_left.gif',
        'media/zecora_right.gif',
        'media/zecora_left_walk.gif',
        'media/zecora_right_walk.gif'
    ];
    
    var socket, connected = false, ignoreDisconnect = false, me, myNick, myRoom, mySpecialStatus, lastmove = (new Date().getTime());
    
    var container, loginbox, nickbox, passbox, loginsubmit, overlay, stage, title, creditslink, steamgrouplink, chooser, chooserbutton, roomlist, refreshbutton, background, chatbox, chatbutton, chatlog, fullchatlog, fullchatlogbutton, fullchatlogvisible, music;
    
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
        add: function (nick, obj, special) {
            if (this.has(nick)) {
                throw new Error("There is already a user with the same nick.");
            }
        
            var elem = document.createElement('div');
            elem.className = 'pony';
            
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
                user.elem.root.style.backgroundImage = 'url(' + ponies[obj.img] + ')';
                user.elem.img = document.createElement('img');
                user.elem.img.src = ponies[obj.img];
                user.elem.img.onload = function () {
                    var newHeight = user.elem.img.height;

                    // adjust bounding box height
                    user.elem.root.style.height = newHeight + 'px';

                    // adjust bounding box margin (translate about image centre)
                    user.elem.root.style.marginTop = -newHeight/2 + 'px';

                    // adjust positioning of nick tag and chat bubble
                    user.elem.chat.style.bottom = newHeight + 'px';
                    user.elem.nickTag.style.top = newHeight + 'px';
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
            this.userCounter.appendChild(document.createTextNode(this.userCount + ' users in room'));
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
            span.appendChild(document.createTextNode(line));
            span.appendChild(document.createElement('br'));
            chatlog.appendChild(span);
            while (chatlog.children.length > 12) {
                chatlog.removeChild(chatlog.firstChild);
            }
        }
        
        // clickable links
        var pos;
        while (((pos = line.indexOf('http://')) !== -1) || ((pos = line.indexOf('https://')) !== -1)) {
            var pos2 = line.indexOf(' ', pos);
            var anchor = document.createElement('a');
            anchor.className = 'chat-link';
            anchor.target = '_blank';
            if (pos2 === -1) {
                fullchatlog.appendChild(document.createTextNode(line.substr(0, pos)));
                anchor.href = line.substr(pos);
                anchor.appendChild(document.createTextNode(line.substr(pos)));
                line = '';
            } else {
                fullchatlog.appendChild(document.createTextNode(line.substr(0, pos)));
                anchor.href = line.substr(pos, pos2 - pos);
                anchor.appendChild(document.createTextNode(line.substr(pos, pos2 - pos)));
                line = line.substr(pos2);
            }
            fullchatlog.appendChild(anchor);
        }

        fullchatlog.appendChild(document.createTextNode(line));
        fullchatlog.appendChild(document.createElement('br'));
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
    
    function updateRoomList(rooms) {
        roomlist.innerHTML = '';
        var headcount = 0;
        for (var i = 0; i < rooms.length; i++) {
            var data = rooms[i];
            var option = document.createElement('option');
            option.value = data.name;
            option.appendChild(document.createTextNode('⇨ ' + data.name_full + ' (' + data.user_count + ' ' + data.user_noun + ')'));
            roomlist.appendChild(option);
            headcount += data.user_count;
        }

        refreshbutton.value = 'Refresh room list (' + headcount + ' users online)';
    }
    
    function changeRoom(room) {
        // change background
        background.src = room.img;
        stage.scrollLeft = 0;
        
        // clear users
        userManager.forEach(function (nick) {
            userManager.kill(nick);
        });
        
        // add me
        userManager.add(myNick, me, mySpecialStatus);
        
        // go to random position
        me.x = me.x || Math.floor(Math.random() * (room.width - PONY_WIDTH));
        me.y = me.y || Math.floor(Math.random() * (CV_HEIGHT - PONY_HEIGHT - CHAT_HEIGHT));
        stage.scrollLeft = Math.floor(me.x + PONY_WIDTH / 2 - window.innerWidth / 2);
        
        // push state
        pushAndUpdateState(me);
        
        logRoomJoinInChat(room.name, room.name_full);
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
        
        stage = document.createElement('div');
        stage.id = 'stage';
        stage.onscroll = function () {
            userManager.updateCounter();
        };
        container.appendChild(stage);
        
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
        loginsubmit.value = 'connect';
        loginsubmit.onclick = doLogin;
        loginbox.appendChild(loginsubmit);
        
        title = document.createElement('h1');
        title.id = 'title';
        title.appendChild(document.createTextNode('ponyplace'));
        overlay.appendChild(title);
        
        creditslink = document.createElement('a');
        creditslink.id = 'credits-link';
        creditslink.href = 'credits.html';
        creditslink.target = '_blank';
        creditslink.appendChild(document.createTextNode('Credits'));
        overlay.appendChild(creditslink);
        
        steamgrouplink = document.createElement('a');
        steamgrouplink.id = 'steamgroup-link';
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
        fullchatlogbutton.value = 'Show full chatlog';
        fullchatlogbutton.onclick = function () {
            if (fullchatlogvisible) {
                fullchatlog.style.display = 'none';
                fullchatlogvisible = false;
                fullchatlogbutton.value = 'Show full chatlog';
            } else {
                fullchatlog.style.display = 'block'
                fullchatlogvisible = true;
                fullchatlog.scrollTop = fullchatlog.scrollHeight;
                fullchatlogbutton.value = 'Hide full chatlog';
            }
        };
        overlay.appendChild(fullchatlogbutton);

        refreshbutton = document.createElement('input');
        refreshbutton.type = 'submit';
        refreshbutton.value = 'Refresh room list';
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
            socket.send(JSON.stringify({
                type: 'room_change',
                name: roomlist.value
            }));
        };
        roomlist.value = '';
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
        
        chatbox = document.createElement('input');
        chatbox.type = 'text';
        chatbox.id = 'chatbox';
        chatbox.maxLength = 100;
        chatbox.onkeypress = function (e) {
            if (e.which === 13) {
                handleChatMessage();
            }
        };
        container.appendChild(chatbox);
        
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
                preview.src = ponies[i];
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
                            preview.src = ponies[i];
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
        
        music = document.createElement('audio');
        music.id = 'music';
        music.controls = true;
        music.loop = true;
        music.volume = 0.5;
        
        var source = document.createElement('source');
        source.src = 'media/music.ogg';
        source.type = 'audio/ogg';
        music.appendChild(source);
        
        source = document.createElement('source');
        source.src = 'media/music.mp3';
        source.type = 'audio/mpeg';
        music.appendChild(source);
        
        overlay.appendChild(music);
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
            myRoom = null;
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
                    userManager.add(msg.nick, msg.obj, msg.special);
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
