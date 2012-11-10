(function () {
    'use strict';

    // get them before IE errors out
    if (!Object.prototype.hasOwnProperty.call(window,'WebSocket')) {
        window.location = 'no-websocket.html';
        return;
    }
    
    var ROOM_HEIGHT = 660;
    var PONY_WIDTH = 168, PONY_HEIGHT = 168;
    
    var avatars = [], inventoryItems = [];
    
    var socket, connected = false, ignoreDisconnect = false, pageFocussed = false, unseenHighlights = 0,
        me, myNick, myRoom = null, mySpecialStatus, avatarInventory, inventory = [], haveAccount = false,
        lastmove = (new Date().getTime()), 
        globalUserCount = 0,
        catalogueCallback = null;
    
    var container,
        overlay,
        loginbox, nickbox, passbox, loginsubmit,
        accountsettings, accountsettingsbutton, accountsettingsvisible, changepassbox, changepassbutton, rmpassbutton,
        outerstage, stage,
        bitcount,
        chooser, chooserbutton, chooservisible,
        inventorylist, inventorylistbutton, inventorylistvisible,
        roomlist, refreshbutton, homebutton,
        roomedit, roomeditbutton, roomeditreset, roomeditiframe, roomeditvisible,
        background, backgroundIframe,
        chatbox, chatboxholder, chatbutton, chatlog, fullchatlog, fullchatlogbutton, fullchatlogvisible;
    
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
        add: function (nick, obj, special, hasHouse, me) {
            if (this.has(nick)) {
                throw new Error("There is already a user with the same nick.");
            }

            var elem = document.createElement('div');
            elem.className = 'pony';
            
            var chat = document.createElement('p');
            chat.className = 'chatbubble';
            elem.appendChild(chat);
            
            var nickTag = document.createElement('p');
            nickTag.className = 'nick-tag';
            if (hasHouse) {
                var houseLink = document.createElement('img');
                houseLink.src = '/media/icons/house.png';
                houseLink.className = 'house-link';
                houseLink.title = 'Go to their house';
                houseLink.onclick = function (e) {
                    socket.send(JSON.stringify({
                        type: 'room_change',
                        name: 'house ' + nick
                    }));
                };
                nickTag.appendChild(houseLink);
            }

            var nickName = document.createElement('span');
            nickName.className = 'nickname';
            nickName.appendChild(document.createTextNode(nick));
            if (special) {
                nickName.className += ' ' + special;
            }
            nickName.onclick = function () {
                chatbox.value += nick;
                chatbox.focus();
            };
            nickTag.appendChild(nickName);

            elem.appendChild(nickTag);
            
            stage.appendChild(elem);
            
            this.users[nick] = {
                obj: obj,
                nick: nick,
                elem: {
                    root: elem,
                    chat: chat,
                    nickTag: nickTag,
                    nickName: nickName,
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
            if (avatars.hasOwnProperty(obj.img_name)) {
                if (avatars[obj.img_name].hasOwnProperty(obj.img_index)) {
                    var imgURL = '/media/' + avatars[obj.img_name][obj.img_index];
                    user.elem.root.style.backgroundImage = 'url(' + imgURL + ')';
                    user.elem.img = document.createElement('img');
                    user.elem.img.src = imgURL;
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
                        user.elem.nickTag.style.marginLeft = (newWidth - 188) / 2 + 'px';
                    };
                }
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
                    if (callback(nick) === 'stop') {
                        return;
                    }
                }
            }
        },
        updateCounter: function () {
            this.userCounter.innerHTML = '';
            if (myRoom !== null) {
                if (myRoom.type === 'real') {
                    this.userCounter.appendChild(document.createTextNode('You are in ' + myRoom.name + ' ("' + myRoom.name_full + '")'));
                } else if (myRoom.type === 'ephemeral') {
                    this.userCounter.appendChild(document.createTextNode('You are in the ephemeral room "' + myRoom.name + '"'));
                } else if (myRoom.type === 'house') {
                    if (myRoom.user_nick === myNick) {
                        this.userCounter.appendChild(document.createTextNode('You are in your house'));
                    } else {
                        this.userCounter.appendChild(document.createTextNode('You are in the house of user with nick: "' + myRoom.user_nick + '"'));
                    }
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

        if (!pageFocussed && highlight) {
            unseenHighlights++;
            document.title = '(' + unseenHighlights + ') ponyplace';
        }
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

    function logHouseRoomJoinInChat(nick) {
        if (nick !== myNick) {
            chatPrint('You entered the house of user with nick: "' + nick + '"', false, true);
        } else {
            chatPrint('You entered your house', false, true);
        }
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

        // show list and refresh button
        refreshbutton.disabled = false;
        roomlist.disabled = false;
    }
    
    function changeRoom(room) {
        // change background
        if (room.type !== 'ephemeral') {
            background.src = room.background.data;
            stage.style.width = room.background.width + 'px';
            stage.style.height = room.background.height + 'px';
            if (room.background.iframe) {
                backgroundIframe.src = room.background.iframe.src;
                backgroundIframe.width = room.background.iframe.width;
                backgroundIframe.height = room.background.iframe.height;
                backgroundIframe.style.left = room.background.iframe.left + 'px';
                backgroundIframe.style.top = room.background.iframe.top + 'px';
                backgroundIframe.style.display = 'block';
            } else {
                backgroundIframe.src = 'about:blank';
                backgroundIframe.style.display = 'none';
            }
        } else {
            background.src = '/media/rooms/cave.png';
            stage.style.width = '960px';
            stage.style.height = '660px';
            backgroundIframe.src = 'about:blank';
            backgroundIframe.style.display = 'none';
        }
        
        // clear users
        userManager.forEach(function (nick) {
            userManager.kill(nick);
        });

        myRoom = room;
        
        // add me
        userManager.add(myNick, me, mySpecialStatus, false, true);

        // go to random position
        if (room.type !== 'ephemeral') {
            me.x = me.x || Math.floor(Math.random() * 920);
        } else {
            me.x = me.x || Math.floor(Math.random() * room.background.width);
        }
        me.y = me.y || Math.floor(Math.random() * ROOM_HEIGHT);
        outerstage.scrollLeft = Math.floor(me.x + window.innerWidth / 2);
        
        // push state
        pushAndUpdateState(me);

        if (room.type === 'real') {
            logRoomJoinInChat(room.name, room.name_full);
        } else if (room.type === 'house') {
            logHouseRoomJoinInChat(room.user_nick);
        } else if (room.type === 'ephemeral') {
            logEphemeralRoomJoinInChat(room.name);
        }

        // update URL hash
        window.location.hash = room.name;

        // hide/show room edit button
        if (room.type === 'house' && myNick === room.user_nick) {
            roomeditbutton.style.display = 'block';
        } else {
            roomeditbutton.style.display = 'none';
            roomedit.style.display = 'none';
            roomeditvisible = false;
        }
    }

    function handleItemClick(name, obj) {
        if (obj.type === 'house_background') {
            if (confirm('Do you want to change your house background to: "' + obj.name_full + '"?')) {
                socket.send(JSON.stringify({
                    type: 'change_house_background',
                    bg_name: name
                }));
            }
        }
    }

    // show GUI elements hidden pre-connection
    function onConnect() {
        chatbox.focus();

        chatbox.disabled = false;
        chatbutton.disabled = false;
        fullchatlogbutton.disabled = false;
        
        stage.style.display = 'block';
    }

    function initGUI_stage() {
        outerstage = document.createElement('div');
        outerstage.id = 'outer-stage';
        container.appendChild(outerstage);

        stage = document.createElement('div');
        stage.id = 'stage';
        stage.style.display = 'none';
        outerstage.appendChild(stage);

        background = document.createElement('img');
        background.id = 'background';
        background.src = '/media/rooms/noroom.png';
        background.onclick = function (e) {
            var cur = (new Date().getTime());
            if (cur - lastmove > 400) {
                var newx = e.layerX;
                me.img_index = (me.img_index | 1) - (me.x < newx ? 0 : 1);
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

        backgroundIframe = document.createElement('iframe');
        backgroundIframe.id = 'background-iframe';
        backgroundIframe.src = 'about:blank';
        backgroundIframe.style.display = 'none';
        stage.appendChild(backgroundIframe);
    }

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

    function initGUI_chatbar() {
        chatlog = document.createElement('div');
        chatlog.id = 'chatlog';
        overlay.appendChild(chatlog);
        
        fullchatlog = document.createElement('div');
        fullchatlog.id = 'fullchatlog';
        fullchatlog.style.display = 'none';
        fullchatlogvisible = false;
        overlay.appendChild(fullchatlog);

        chatboxholder = document.createElement('div');
        chatboxholder.id = 'chatbox-holder';
        overlay.appendChild(chatboxholder);
        
        chatbox = document.createElement('input');
        chatbox.type = 'text';
        chatbox.id = 'chatbox';
        chatbox.maxLength = 100;
        chatbox.onkeypress = function (e) {
            // enter
            if (e.which === 13) {
                handleChatMessage();
            }
        };
        chatbox.onkeydown = function (e) {
            var kc = e.keyCode || e.which;

            // tab completion
            if (kc === 9) {
                var stop = false;
                e.preventDefault();
                userManager.forEach(function (nick) {
                    if (nick.substr(0, chatbox.value.length) === chatbox.value) {
                        chatbox.value = nick + ': ';
                        return 'stop';
                    }
                });
                return false;
            }
        };
        chatbox.disabled = true;
        chatboxholder.appendChild(chatbox);
        
        chatbutton = document.createElement('input');
        chatbutton.type = 'submit';
        chatbutton.value = 'Send';
        chatbutton.id = 'chatbutton';
        chatbutton.onclick = function (e) {
            handleChatMessage();
        };
        chatbutton.disabled = true;
        container.appendChild(chatbutton);

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
        fullchatlogbutton.disabled = true;
        overlay.appendChild(fullchatlogbutton);
        
        chooserbutton = document.createElement('input');
        chooserbutton.id = 'chooser-button';
        chooserbutton.type = 'submit';
        chooserbutton.value = 'Change Avatar';
        chooserbutton.onclick = function () {
            if (chooservisible) {
                chooser.style.display = 'none';
                chooservisible = false;
            } else {
                chooservisible = true;
                chooser.style.display = 'block';
                chooser.innerHTML = '';
                var ad = document.createElement('img');
                ad.src = '/media/store/buy-more.png';
                ad.className = 'chooser-preview';
                ad.title = 'Buy some avatars!';
                ad.onclick = function () {
                    socket.send(JSON.stringify({
                        type: 'room_change',
                        name: 'carousel_boutique'
                    }));
                    chooser.style.display = 'none';
                    chooservisible = false;
                };
                chooser.appendChild(ad);
                for (var i = 0; i < avatarInventory.length; i++) {
                    var name = avatarInventory[i];
                    if (avatars.hasOwnProperty(name)) {
                        var preview = document.createElement('img');
                        preview.src = '/media/' + avatars[name][0];
                        preview.className = 'chooser-preview';
                        (function (images, name) {
                            preview.onclick = function () {
                                chooser.innerHTML = '';
                                for (var i = 0; i < images.length; i++) {
                                    var preview = document.createElement('img');
                                    preview.src = 'media/' + images[i];
                                    preview.className = 'chooser-preview';
                                    (function (imgid) {
                                        preview.onclick = function () {
                                            me.img_name = name;
                                            me.img_index = imgid;
                                            pushAndUpdateState(me);
                                            chooser.style.display = 'none';
                                            chooservisible = false;
                                            if (images[imgid].indexOf('_upsidedown') !== -1) {
                                                container.className = 'upside-down';
                                            } else {
                                                container.className = '';
                                            }
                                        };
                                    }(i));
                                    chooser.appendChild(preview);
                                }
                            };
                        }(avatars[name], name));
                        chooser.appendChild(preview);
                    }
                }
            }
        };
        chooserbutton.disabled = true;;
        overlay.appendChild(chooserbutton);
    }

    function initGUI_topbar() {
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
        roomlist.disabled = true;
        overlay.appendChild(roomlist);

        refreshbutton = document.createElement('input');
        refreshbutton.type = 'submit';
        refreshbutton.value = 'Refresh list';
        refreshbutton.id = 'room-refresh-button';
        refreshbutton.onclick = function () {
            socket.send(JSON.stringify({
                type: 'room_list'
            }));
        };
        refreshbutton.disabled = true;
        overlay.appendChild(refreshbutton);

        homebutton = document.createElement('input');
        homebutton.type = 'submit';
        homebutton.value = 'My House';
        homebutton.id = 'home-button';
        homebutton.onclick = function () {
            socket.send(JSON.stringify({
                type: 'room_change',
                name: 'house ' + myNick
            }));
        };
        homebutton.style.display = 'none';
        overlay.appendChild(homebutton);

        inventorylistbutton = document.createElement('input');
        inventorylistbutton.id = 'inventory-list-button';
        inventorylistbutton.type = 'submit';
        inventorylistbutton.value = 'Inventory';
        inventorylistbutton.onclick = function () {
            if (inventorylistvisible) {
                inventorylist.style.display = 'none';
                inventorylistvisible = false;
            } else {
                inventorylistvisible = true;
                inventorylist.style.display = 'block';
                inventorylist.innerHTML = '';
                if (inventory.length) {
                    for (var i = 0; i < inventory.length; i++) {
                        var name = inventory[i];
                        if (inventoryItems.hasOwnProperty(name)) {
                            var preview = document.createElement('img');
                            preview.src = inventoryItems[name].img;
                            preview.title = inventoryItems[name].name_full;
                            preview.className = 'inventory-item-preview';
                            if (inventoryItems[name].type !== 'useless') {
                                preview.className += ' inventory-item-clickable';
                                (function (itemName, item) {
                                    preview.onclick = function () {
                                        handleItemClick(itemName, item);
                                    };
                                }(name, inventoryItems[name]));
                            }
                            inventorylist.appendChild(preview);
                        }
                    }
                } else {
                    inventorylist.appendChild(document.createTextNode('You have no inventory items.'));
                }
            }
        };
        inventorylistbutton.style.display = 'none';
        overlay.appendChild(inventorylistbutton);

        bitcount = document.createElement('div');
        bitcount.id = 'bit-count';
        bitcount.title = 'bits';
        bitcount.appendChild(document.createTextNode('???'));
        bitcount.style.display = 'none';
        overlay.appendChild(bitcount);

        accountsettingsbutton = document.createElement('input');
        accountsettingsbutton.id = 'account-settings-button';
        accountsettingsbutton.type = 'submit';
        accountsettingsbutton.value = 'Account Settings';
        accountsettingsbutton.onclick = function () {
            if (accountsettingsvisible) {
                accountsettings.style.display = 'none';
                accountsettingsvisible = false;
            } else {
                accountsettings.style.display = 'block'
                accountsettingsvisible = true;
            }
        };
        accountsettingsbutton.disabled = true;
        overlay.appendChild(accountsettingsbutton);

        roomeditbutton = document.createElement('input');
        roomeditbutton.id = 'room-edit-button';
        roomeditbutton.type = 'submit';
        roomeditbutton.value = 'Edit House';
        roomeditbutton.onclick = function () {
            if (roomeditvisible) {
                roomedit.style.display = 'none';
                roomeditvisible = false;
            } else {
                roomedit.style.display = 'block'
                roomeditvisible = true;
                roomeditiframe.contentDocument.location.reload(true);
            }
        };
        roomeditbutton.style.display = 'none';
        overlay.appendChild(roomeditbutton);

        roomedit = document.createElement('div');
        roomedit.id = 'room-edit';
        roomedit.style.display = 'none';
        roomedit.appendChild(document.createTextNode('Change your house background by clicking one in your inventory.'));
        roomeditvisible = false;
        overlay.appendChild(roomedit);

        roomeditreset = document.createElement('input');
        roomeditreset.type = 'submit';
        roomeditreset.value = 'Reset to default';
        roomeditreset.onclick = function () {
            socket.send(JSON.stringify({
                type: 'change_house_background',
                bg_name: null
            }));
        };
        roomedit.appendChild(roomeditreset);

        roomeditiframe = document.createElement('iframe');
        roomeditiframe.src = '/static/rooms/edit-shop.html';
        roomeditiframe.width = 260;
        roomeditiframe.height = 260;
        roomedit.appendChild(roomeditiframe);

        accountsettings = document.createElement('div');
        accountsettings.id = 'account-settings';
        accountsettings.style.display = 'none';
        accountsettingsvisible = false;
        overlay.appendChild(accountsettings);

        rmpassbutton = document.createElement('input');
        rmpassbutton.type = 'submit';
        rmpassbutton.value = 'Delete account';
        rmpassbutton.onclick = function () {
            socket.send(JSON.stringify({
                type: 'console_command',
                cmd: 'rmpass'
            }));
            if (confirm("Are you sure you want to delete your account?\nYou'll lose all your bits and items, and your nickname will be unprotected.")) {
                socket.send(JSON.stringify({
                    type: 'console_command',
                    cmd: 'rmpass yes'
                }));
                accountsettings.style.display = 'none';
                accountsettingsvisible = false;
            } else {
                socket.send(JSON.stringify({
                    type: 'console_command',
                    cmd: 'rmpass no'
                }));
            }
        };
        accountsettings.appendChild(rmpassbutton);

        changepassbox = document.createElement('input');
        changepassbox.type = 'password';
        changepassbox.placeholder = 'new password';
        accountsettings.appendChild(changepassbox);

        changepassbutton = document.createElement('input');
        changepassbutton.type = 'submit';
        changepassbutton.value = 'Create account/change password';
        changepassbutton.onclick = function () {
            if (changepassbox.value.length > 0) {
                socket.send(JSON.stringify({
                    type: 'console_command',
                    cmd: 'setpass ' + changepassbox.value
                }));
                changepassbox.value = '';
                accountsettings.style.display = 'none';
                accountsettingsvisible = false;
            }
        };
        accountsettings.appendChild(changepassbutton);

        chooser = document.createElement('div');
        chooser.id = 'chooser';
        chooservisible = false;
        chooser.style.display = 'none';
        overlay.appendChild(chooser);

        inventorylist = document.createElement('div');
        inventorylist.id = 'inventory-list';
        inventorylistvisible = false;
        inventorylist.style.display = 'none';
        overlay.appendChild(inventorylist);
    }

    function doLogin() {
        loginbox.style.display = 'none';
        localStorage.setItem('login-details', JSON.stringify({
            nick: nickbox.value,
            pass: passbox.value
        }));
        initNetwork();
    }

    function initGUI_loginbox() {
        loginbox = document.createElement('div');
        loginbox.id = 'loginbox';
        loginbox.appendChild(document.createTextNode("Choose a nickname. (You'll only need a password if that nickname is protected)"));
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

        initGUI_stage();
        
        overlay = document.createElement('div');
        overlay.id = 'overlay';
        container.appendChild(overlay);

        userManager.initGUI();

        initGUI_topbar();
        initGUI_chatbar();
        initGUI_loginbox();

        window.onfocus = function () {
            pageFocussed = true;
            document.title = 'ponyplace';
            unseenHighlights = 0;
        };
        window.onblur = function () {
            pageFocussed = false;
        };
    }

    function initGlobals() {
        window.ponyplace = {
            buy: function (catalogueName, itemIndex, itemName, itemPrice) {
                if (confirm('Do you want to buy the product "' + itemName + '" for ' + itemPrice + ' bits?')) {
                    socket.send(JSON.stringify({
                        type: 'buy_from_catalogue',
                        name: catalogueName,
                        index: itemIndex
                    }));
                }
            },
            getCatalogue: function (name, callback) {
                socket.send(JSON.stringify({
                    type: 'get_catalogue',
                    name: name
                }));
                catalogueCallback = callback;
            },
            hasAvatar: function (name) {
                return (avatarInventory.indexOf(name) !== -1);
            },
            hasInventoryItem: function (name) {
                return (inventory.indexOf(name) !== -1);
            },
            hasAccount: function () {
                return haveAccount;
            },
            changeRoom: function (name) {
                socket.send(JSON.stringify({
                    type: 'room_change',
                    name: name
                }));
            }
        };
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
                img_name: 'derpy',
                img_index: 0,
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

            onConnect();
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
                    userManager.add(msg.nick, msg.obj, msg.special, msg.has_house, false);
                break;
                case 'update':
                    if (msg.nick !== myNick) {
                        userManager.update(msg.nick, msg.obj);
                    }
                break;
                case 'account_state':
                    mySpecialStatus = msg.special;
                    bitcount.innerHTML = '';
                    if (msg.bits !== null) {
                        bitcount.appendChild(document.createTextNode(msg.bits));
                    }
                    avatarInventory = msg.avatar_inventory;
                    inventory = msg.inventory;
                    chooserbutton.disabled = false;
                    haveAccount = msg.have_account;
                    accountsettingsbutton.disabled = false;
                    if (haveAccount) {
                        rmpassbutton.style.display = 'block';
                        changepassbutton.value = 'Change password';
                        inventorylistbutton.style.display = 'block';
                        bitcount.style.display = 'block';
                        homebutton.style.display = 'block';
                    } else {
                        rmpassbutton.style.display = 'none';
                        changepassbutton.value = 'Create account';
                        inventorylistbutton.style.display = 'none';
                        inventorylist.style.display = 'none';
                        inventorylistvisible = false;
                        bitcount.style.display = 'none';
                        homebutton.style.display = 'none';
                    }
                    backgroundIframe.contentDocument.location.reload(true);
                    if (roomeditvisible) {
                        roomeditiframe.contentDocument.location.reload(true);
                    }
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
                case 'avatar_list':
                    avatars = msg.list;
                break;
                case 'inventory_item_list':
                    inventoryItems = msg.list;
                break;
                case 'room_change':
                    changeRoom(msg.data);
                break;
                case 'catalogue_content':
                    if (catalogueCallback) {
                        catalogueCallback(msg.data);
                        catalogueCallback = null;
                    }
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
                    } else if (msg.reason === 'dont_have_avatar') {
                        alert("You do not have the avatar you tried to wear. This is probably a bug.");
                    } else if (msg.reason === 'dont_have_item') {
                        alert("You do not have the item you tried to use. This is probably a bug.");
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
                    } else {
                        alert('You were kicked for an unrecognised reason: "' + msg.reason + '"');
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
        initGlobals();
    };
}());
