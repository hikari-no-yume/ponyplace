(function () {
    'use strict';
    var CV_WIDTH = 1000, CV_HEIGHT = 680;
    var CHAT_HEIGHT = 20;
    var PONY_WIDTH = 148, PONY_HEIGHT = 148;
    
    var ponies = [
        'media/derpy_left_hover.gif',
        'media/derpy_right_hover.gif',
        'media/derpy_left_hover_upsidedown.gif',
        'media/derpy_right_hover_upsidedown.gif',
        'media/spike_left.gif',
        'media/spike_right.gif',
        'media/spike_left_walk.gif',
        'media/spike_right_walk.gif',
        'media/doctorwhooves_left.gif',
        'media/doctorwhooves_right.gif',
        'media/doctorwhooves_left_walk.gif',
        'media/doctorwhooves_right_walk.gif',
        'media/rainbowdash_left.gif',
        'media/rainbowdash_right.gif',
        'media/rainbowdash_left_walk.gif',
        'media/rainbowdash_right_walk.gif',
        'media/rainbowdash_left_hover.gif',
        'media/rainbowdash_right_hover.gif',
        'media/fluttershy_left.gif',
        'media/fluttershy_right.gif',
        'media/fluttershy_left_walk.gif',
        'media/fluttershy_right_walk.gif',
        'media/fluttershy_left_hover.gif',
        'media/fluttershy_right_hover.gif',
        'media/luna_left.gif',
        'media/luna_right.gif',
        'media/luna_left_walk.gif',
        'media/luna_right_walk.gif',
        'media/luna_left_hover.gif',
        'media/luna_right_hover.gif',
        'media/luna2_left.gif',
        'media/luna2_right.gif',
        'media/luna2_left_walk.gif',
        'media/luna2_right_walk.gif',
        'media/twilight_left.gif',
        'media/twilight_right.gif',
        'media/twilight_left_walk.gif',
        'media/twilight_right_walk.gif',
        'media/rarity_left.gif',
        'media/rarity_right.gif',
        'media/rarity_left_walk.gif',
        'media/rarity_right_walk.gif',
        'media/pinkiepie_left.gif',
        'media/pinkiepie_right.gif',
        'media/pinkiepie_left_walk.gif',
        'media/pinkiepie_right_walk.gif',
        'media/crazypie_left.gif',
        'media/crazypie_right.gif',
        'media/crazypie_left_walk.gif',
        'media/crazypie_right_walk.gif',
        'media/applejack_left.gif',
        'media/applejack_right.gif',
        'media/applejack_left_walk.gif',
        'media/applejack_right_walk.gif',
        'media/scootaloo_left.gif',
        'media/scootaloo_right.gif',
        'media/scootaloo_left_walk.gif',
        'media/scootaloo_right_walk.gif',
        'media/trixie_left.gif',
        'media/trixie_right.gif',
        'media/trixie_left_walk.gif',
        'media/trixie_right_walk.gif',
        'media/trixie2_left.gif',
        'media/trixie2_right.gif',
        'media/trixie2_left_walk.gif',
        'media/trixie2_right_walk.gif'
    ];
    
    var socket, connected = false, me, users = {};
    
    var container, stage, chooser, chooserbutton, background, chatbox, chatbutton, chatlog;

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
    }
    
    function updatePony(obj) {
        var user = users[obj.nick];
        if (obj.alive) {
            user.elem.root.style.left = obj.x + 'px';
            user.elem.root.style.top = obj.y + 'px';
            user.elem.root.style.backgroundImage = 'url(' + obj.img + ')';
            
            user.elem.chat.innerHTML = '';
            user.elem.chat.appendChild(document.createTextNode(obj.chat));
            if (obj.chat !== user.obj.chat) {
                logInChat(obj.nick, obj.chat);
            }
            
            user.obj = obj;
        } else {
            stage.removeChild(user.elem.root);
            delete users[obj.nick];
        }
    }
    
    function pushState() {
        if (connected) {
            socket.send(JSON.stringify(me));
        }
    }
    
    function logInChat(nick, msg) {
        chatlog.appendChild(document.createElement('br'));
        chatlog.appendChild(document.createTextNode('<' + nick + '> ' + msg));
        while (chatlog.children.length > 8) {
            chatlog.removeChild(chatlog.firstChild);
        }
    }

    window.onload = function () {
        container = document.createElement('div');
        container.id = 'container';
        document.body.appendChild(container);
        
        stage = document.createElement('div');
        stage.id = 'stage';
        container.appendChild(stage);
        
        background = document.createElement('img');
        background.src = 'media/ponyville.png';
        background.id = 'background';
        background.onclick = function (e) {
            var newx = e.layerX - PONY_WIDTH / 2;
            var imgid = ponies.indexOf(me.img);
            me.img = ponies[(imgid|1) - (me.x<newx ? 0 : 1)];
            me.x = newx;
            me.y = e.layerY - PONY_HEIGHT / 2;
            updatePony(me);
            pushState();
        };
        background.ondragstart = function () {
            return false;
        };
        stage.appendChild(background);
        
        chatlog = document.createElement('div');
        chatlog.id = 'chatlog';
        container.appendChild(chatlog);
        
        chatbox = document.createElement('input');
        chatbox.type = 'text';
        chatbox.id = 'chatbox';
        chatbox.onkeypress = function (e) {
            if (e.which == 13) {
                me.chat = chatbox.value;
                logInChat(me.nick, me.chat);
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
            chooser.style.display = 'block';
        };
        container.appendChild(chooserbutton);

        chooser = document.createElement('div');
        chooser.id = 'chooser';
        chooser.style.display = 'none';
        for (var i = 0; i < ponies.length; i += 2) {
            var preview = document.createElement('img');
            preview.src = ponies[i];
            preview.className = 'chooser-preview';
            (function (url) {
                preview.onclick = function () {
                    me.img = url;
                    updatePony(me);
                    pushState();
                    chooser.style.display = 'none';
                };
            }(ponies[i]));
            chooser.appendChild(preview);
        }
        container.appendChild(chooser);
        
        socket = new WebSocket('ws://' + window.location.hostname + ':9001', 'ponyplace-broadcast');
        socket.onopen = function () {
            connected = true;
            me = {
                nick: prompt('Choose a nickname.', '') || ('Silly filly #' + Math.floor(Math.random()*100)),
                alive: true,
                img: ponies[Math.floor(Math.random() * ponies.length)],
                x: Math.floor(Math.random() * (CV_WIDTH - PONY_WIDTH)),
                y: Math.floor(Math.random() * (CV_HEIGHT - PONY_HEIGHT - CHAT_HEIGHT)),
                chat: ''
            };
            createPony(me);
            pushState();
        };
        socket.onclose = function (e) {
            connected = false;
            alert('Error, lost connection!\nThis may be because:\n- Failed to connect (server\'s down)\n- Server crashed');
            container.className = 'disconnected';
            container.innerHTML = '';
        };
        socket.onmessage = function (e) {
            if (e.data === 'nick_in_use') {
                alert('That nickname was already in use. Reload and choose a different one.');
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
