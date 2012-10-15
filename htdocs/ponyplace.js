(function () {
    'use strict';
    var CV_WIDTH = 1000, CV_HEIGHT = 680;
    var CHAT_HEIGHT = 20;
    var PONY_WIDTH = 148, PONY_HEIGHT = 168;
    
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
        'media/tank_left_hover.gif',
        'media/tank_right_hover.gif',
        'media/fluttershy_left.gif',
        'media/fluttershy_right.gif',
        'media/fluttershy_left_walk.gif',
        'media/fluttershy_right_walk.gif',
        'media/fluttershy_left_hover.gif',
        'media/fluttershy_right_hover.gif',
        'media/fluttershy_left_sleep.gif',
        'media/fluttershy_right_sleep.gif',
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
        'media/celestia_left_hover.gif',
        'media/celestia_right_hover.gif',
        'media/celestia_left_sleep.gif',
        'media/celestia_right_sleep.gif',
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
        'media/luna2_left.gif',
        'media/luna2_right.gif',
        'media/luna2_left_walk.gif',
        'media/luna2_right_walk.gif',
        'media/twilight_left.gif',
        'media/twilight_right.gif',
        'media/twilight_left_walk.gif',
        'media/twilight_right_walk.gif',
        'media/twilight_left_run.gif',
        'media/twilight_right_run.gif',
        'media/twilight_left_crazy.gif',
        'media/twilight_right_crazy.gif',
        'media/rarity_left.gif',
        'media/rarity_right.gif',
        'media/rarity_left_walk.gif',
        'media/rarity_right_walk.gif',
        'media/rarity_left_hover.gif',
        'media/rarity_right_hover.gif',
        'media/rarity_left_sleep.gif',
        'media/rarity_right_sleep.gif',
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
        'media/gummy_left.gif',
        'media/gummy_right.gif',
        'media/gummy_left_walk.gif',
        'media/gummy_right_walk.gif',
        'media/gummy_left_bounce.gif',
        'media/gummy_right_bounce.gif',
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
        'media/applejack_left_gallop.gif',
        'media/applejack_right_gallop.gif',
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
    
    var socket, connected = false, ignoreDisconnect = false, me, users = {}, lastmove = (new Date().getTime());
    
    var container, stage, chooser, chooserbutton, background, chatbox, chatbutton, chatlog, fullchatlog, fullchatlogbutton, fullchatlogvisible;

    function createPony(obj) {
        var elem = document.createElement('div');
        elem.className = 'pony';
        
        var chat = document.createElement('p');
        chat.className = 'chatbubble';
        elem.appendChild(chat);
        
        var nick = document.createElement('p');
        nick.className = 'nickname';
        nick.appendChild(document.createTextNode(obj.nick));
        elem.appendChild(nick);
        
        stage.appendChild(elem);
        
        users[obj.nick] = {
            obj: obj,
            elem: {
                root: elem,
                chat: chat,
                nick: nick
            }
        };
        
        updatePony(obj);
        logJoinInChat(obj.nick);
    }
    
    function updatePony(obj) {
        var user = users[obj.nick];
        if (obj.alive) {
            user.elem.root.style.left = obj.x + 'px';
            user.elem.root.style.top = obj.y + 'px';
            if (ponies.hasOwnProperty(obj.img)) {
                user.elem.root.style.backgroundImage = 'url(' + ponies[obj.img] + ')';
            } else {
                user.elem.root.style.backgroundImage = 'none';
            }
            
            user.elem.chat.innerHTML = '';
            user.elem.chat.appendChild(document.createTextNode(obj.chat));
            if (obj.chat !== user.obj.chat && obj.chat !== '') {
                logInChat(obj.nick, obj.chat);
            }
            
            user.obj = obj;
        } else {
            logLeaveInChat(obj.nick);
            stage.removeChild(user.elem.root);
            delete users[obj.nick];
        }
    }
    
    function pushState() {
        if (connected) {
            socket.send(JSON.stringify(me));
        }
    }
    
    function chatPrint(line) {
        var span = document.createElement('span');
        span.className = 'chatline';
        span.appendChild(document.createTextNode(line));
        span.appendChild(document.createElement('br'));
        chatlog.appendChild(span);
        while (chatlog.children.length > 8) {
            chatlog.removeChild(chatlog.firstChild);
        }
        
        fullchatlog.appendChild(document.createTextNode(line));
        fullchatlog.appendChild(document.createElement('br'));
        fullchatlog.scrollTop = fullchatlog.scrollHeight;
    }
    
    function logInChat(nick, msg) {
        chatPrint('<' + nick + '> ' + msg);
    }
    
    function logJoinInChat(nick, msg) {
        chatPrint(nick + ' appeared');
    }
    
    function logLeaveInChat(nick, msg) {
        chatPrint(nick + ' left');
    }

    window.onload = function () {
        container = document.createElement('div');
        container.id = 'container';
        document.body.appendChild(container);
        
        stage = document.createElement('div');
        stage.id = 'stage';
        container.appendChild(stage);
        
        background = document.createElement('img');
        background.src = 'media/background.png';
        background.id = 'background';
        background.onclick = function (e) {
            var cur = (new Date().getTime());
            if (cur - lastmove > 400) {
                var newx = e.layerX - PONY_WIDTH / 2;
                me.img = (me.img|1) - (me.x<newx ? 0 : 1);
                me.x = newx;
                me.y = e.layerY - PONY_HEIGHT / 2;
                updatePony(me);
                pushState();
                lastmove = cur;
                chatbox.focus();
            } else {
                chatPrint('You are doing that too often.');
            }
        };
        background.ondragstart = function () {
            return false;
        };
        stage.appendChild(background);
        
        chatlog = document.createElement('div');
        chatlog.id = 'chatlog';
        container.appendChild(chatlog);
        
        fullchatlog = document.createElement('div');
        fullchatlog.id = 'fullchatlog';
        fullchatlog.style.display = 'none';
        fullchatlogvisible = false;
        container.appendChild(fullchatlog);
        
        chatPrint("Hey you! Scroll right to find the forest and cloudsdale!");
        
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
                fullchatlogbutton.value = 'Hide full chatlog';
            }
        };
        container.appendChild(fullchatlogbutton);
        
        chatbox = document.createElement('input');
        chatbox.type = 'text';
        chatbox.id = 'chatbox';
        chatbox.maxLength = 100;
        chatbox.onkeypress = function (e) {
            if (e.which == 13) {
                me.chat = chatbox.value;
                if (me.chat !== '') {
                    logInChat(me.nick, me.chat);
                }
                chatbox.value = '';
                pushState();
                updatePony(me);
            }
        };
        container.appendChild(chatbox);
        
        chatbutton = document.createElement('input');
        chatbutton.type = 'submit';
        chatbutton.value = 'Send';
        chatbutton.id = 'chatbutton';
        chatbutton.onclick = function (e) {
            me.chat = chatbox.value;
            logInChat(me.nick, me.chat);
            chatbox.value = '';
            pushState();
            updatePony(me);
        };
        container.appendChild(chatbutton);
        
        chooserbutton = document.createElement('input');
        chooserbutton.id = 'chooser-button';
        chooserbutton.type = 'submit';
        chooserbutton.value = 'Change Avatar';
        chooserbutton.onclick = function () {
            if (chooser) {
                chooser.style.display = 'block';
            } else {
                chooser = document.createElement('div');
                chooser.id = 'chooser';
                for (var i = 0; i < ponies.length; i += 2) {
                    var preview = document.createElement('img');
                    preview.src = ponies[i];
                    preview.className = 'chooser-preview';
                    (function (imgid) {
                        preview.onclick = function () {
                            me.img = imgid;
                            updatePony(me);
                            pushState();
                            chooser.style.display = 'none';
                        };
                    }(i));
                    chooser.appendChild(preview);
                }
                container.appendChild(chooser);
            }
        };
        container.appendChild(chooserbutton);
        
        if (!window.hasOwnProperty('WebSocket')) {
            alert('ponyplace requires WebSocket.\nUse a modern browser like Chrome, Firefox, Safari or Internet Explorer 10');
            container.className = 'disconnected';
            container.innerHTML = '';
            return;
        }
        
        socket = new WebSocket('ws://' + window.location.hostname + ':9001', 'ponyplace-broadcast');
        socket.onopen = function () {
            connected = true;
            me = {
                nick: prompt('Choose a nickname.', '') || ('Blank flank #' + Math.floor(Math.random()*100)),
                alive: true,
                img: Math.floor(Math.random() * ponies.length),
                x: Math.floor(Math.random() * (CV_WIDTH - PONY_WIDTH)),
                y: Math.floor(Math.random() * (CV_HEIGHT - PONY_HEIGHT - CHAT_HEIGHT)),
                chat: ''
            };
            createPony(me);
            pushState();
            chatbox.focus();
        };
        socket.onclose = function (e) {
            connected = false;
            if (!ignoreDisconnect) {
                alert('Error, lost connection!\nThis may be because:\n- Server shut down to be updated (try reloading)\n- Failed to connect (server\'s down)\n- Server crashed\n- You were kicked');
            }
            container.className = 'disconnected';
            container.innerHTML = '';
        };
        socket.onmessage = function (e) {
            if (e.data === 'nick_in_use') {
                alert('That nickname was already in use. Reload and choose a different one.');
            } else if (e.data === 'bad_nick') {
                alert('Bad nickname - nicknames can be a maximum of 18 characters.');
            } else if (e.data === 'update') {
                alert('ponyplace update happening - page will reload');
                ignoreDisconnect = true;
                window.location.reload();
            } else {
                var obj = JSON.parse(e.data);
                if (!users.hasOwnProperty(obj.nick)) {
                    createPony(obj);
                } else {
                    updatePony(obj);
                }
            }
        };
    };
}());
