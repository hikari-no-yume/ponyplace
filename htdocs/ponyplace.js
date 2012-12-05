(function () {
    'use strict';

    // get them before IE errors out
    if (!Object.prototype.hasOwnProperty.call(window, 'WebSocket')) {
        window.location = 'no-websocket.html';
        return;
    }

    var ROOM_HEIGHT = 660;
    var PONY_WIDTH = 168, PONY_HEIGHT = 168;

    var avatars = [], inventoryItems = [];

    var socket, connected = false, ignoreDisconnect = false, pageFocussed = false, unseenHighlights = 0,
        me, myNick, myRoom = null, mySpecialStatus, avatarInventory, inventory = [], friends = [], haveAccount = false,
        roomwidgetstate = [],
        currentUser = null,
        lastmove = (new Date().getTime()),
        globalUserCount = 0,
        catalogueCallback = null,
        openProfiles = {}, openPMLogs = {};

    var container,
        overlay,
        loginbox, nickbox, personasubmit, loginsubmit,
        accountsettings, accountsettingsbutton, createaccbutton, changepassbutton, rmpassbutton,
        outerstage, stage,
        bitcount,
        chooser, chooserbutton,
        inventorylist, inventorylistbutton,
        friendslist, friendslistbutton,
        roomlist, refreshbutton, homebutton,
        roomedit, roomeditbutton, roomeditreset, roomeditvisible,
        background, roomwidgets,
        chatbox, chatboxholder, chatbutton, chatlog, fullchatlog, fullchatlogcontent, fullchatlogbutton;

    var userManager = {
        users: {},
        userCount: 0,
        userCounter: null,

        initGUI: function () {
            this.userCounter = document.createElement('div');
            this.userCounter.id = 'usercounter';
            this.userCounter.style.display = 'none';
            this.updateCounter();
            overlay.appendChild(this.userCounter);
        },
        showUserCounter: function () {
            this.userCounter.style.display = 'block';
        },
        add: function (nick, obj, special, me) {
            if (this.has(nick)) {
                throw new Error("There is already a user with the same nick.");
            }

            var isOwnNick = nick === myNick;

            var elem = document.createElement('div');
            elem.className = 'pony';

            var chat = document.createElement('p');
            chat.className = 'chatbubble';
            elem.appendChild(chat);

            var nickTag = document.createElement('p');
            nickTag.className = 'nick-tag';

            var nickName = document.createElement('span');
            nickName.className = 'nickname' + (isOwnNick ? ' own' : '');
            appendText(nickName, nick);
            if (special) {
                nickName.className += ' ' + special;
            }
            if (!isOwnNick) {
                nickName.onclick = function () {
                    socket.send(JSON.stringify({
                        type: 'profile_get',
                        nick: nick
                    }));
                };
            }
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
                },
                special: special
            };

            this.update(nick, obj);
            this.userCount++;
            this.updateCounter();
            logJoinInChat(nick, special);
        },
        update: function (nick, obj) {
            this.hasCheck(nick);

            var user = this.users[nick];
            user.elem.root.style.left = obj.x + 'px';
            user.elem.root.style.top = obj.y + 'px';
            if (avatars.hasOwnProperty(obj.img_name)) {
                if (avatars[obj.img_name].hasOwnProperty(obj.img_index)) {
                    var imgURL = '/media/avatars/' + avatars[obj.img_name][obj.img_index];
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
            appendText(user.elem.chat, obj.chat);
            if (obj.chat !== user.obj.chat && obj.chat !== '') {
                logInChat(nick, obj.chat, user.special);
            }

            user.obj = obj;
        },
        kill: function (nick) {
            this.hasCheck(nick);

            var user = this.users[nick];
            this.userCount--;
            this.updateCounter();
            logLeaveInChat(nick, user.special);
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
                    appendText(this.userCounter, 'You are in ' + myRoom.name + ' ("' + myRoom.name_full + '")');
                } else if (myRoom.type === 'ephemeral') {
                    appendText(this.userCounter, 'You are in the ephemeral room "' + myRoom.name + '"');
                } else if (myRoom.type === 'house') {
                    if (myRoom.user_nick === myNick) {
                        appendText(this.userCounter, 'You are in your house');
                    } else {
                        appendText(this.userCounter, 'You are in the house of user with nick: "' + myRoom.user_nick + '"');
                    }
                }
                this.userCounter.appendChild(document.createElement('br'));
                appendText(this.userCounter, this.userCount + ' users in room');
            } else {
                appendText(this.userCounter, 'You are not in a room');
            }
            this.userCounter.appendChild(document.createElement('br'));
            appendText(this.userCounter, globalUserCount + ' users online total');
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

    function digitPad(n) {
        return n = (n < 10) ? ("0" + n) : n;
    }

    function appendText(parent, text) {
        parent.appendChild(document.createTextNode(text));
    }

    function appendTimestamp(parent) {
        var date = new Date();
        appendText(parent, '[' + digitPad(date.getHours()) + ':' + digitPad(date.getMinutes()) + '] ');
    }

    function appendNickname(parent, nick, special) {
        var nickname = document.createElement('span');
        nickname.className = 'nickname' + (nick === myNick ? ' own' : '');
        if (special !== false) {
            nickname.className += ' ' + special;
        }
        nickname.onclick = function () {
            socket.send(JSON.stringify({
                type: 'profile_get',
                nick: nick
            }));
        };
        appendText(nickname, nick);
        parent.appendChild(nickname);
    }

    function appendTextAutoLink(parent, text) {
        var pos;
        while (((pos = text.indexOf('http://')) !== -1) || ((pos = text.indexOf('https://')) !== -1)) {
            var pos2 = text.indexOf(' ', pos);
            var anchor = document.createElement('a');
            anchor.className = 'chat-link';
            anchor.target = '_blank';
            if (pos2 === -1) {
                appendText(span, text.substr(0, pos));
                anchor.href = text.substr(pos);
                appendText(anchor, text.substr(pos));

                text = '';
            } else {
                appendText(span, text.substr(0, pos));
                anchor.href = text.substr(pos, pos2 - pos);
                appendText(anchor, text.substr(pos, pos2 - pos));
                text = text.substr(pos2);
            }
            parent.appendChild(anchor);
        }
        appendText(parent, text);
    }

    function tabNotify() {
        if (!pageFocussed && (type === 'highlight' || type === 'privmsg')) {
            unseenHighlights++;
            document.title = '(' + unseenHighlights + ') ponyplace';
        }
    }

    function chatPrint(targets, bits, className) {
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];

            var span = document.createElement('span');
            span.className = 'chat-line';

            if (className) {
                span.className += ' ' + className;
            }

            appendTimestamp(span);
            for (var j = 0; j < bits.length; j++) {
                var bit = bits[j];

                if (bit[0] === 'nick') {
                    appendNickname(span, bit[1], bit[2]);
                } else if (bit[0] === 'text') {
                    appendTextAutoLink(span, bit[1]);
                }
            }

            span.appendChild(document.createElement('br'));

            if (target === 'chatlog') {
                chatlog.appendChild(span);
                while (chatlog.children.length > 12) {
                    chatlog.removeChild(chatlog.firstChild);
                }
            } else if (target === 'fullchatlog') {
                fullchatlog.content.appendChild(span);
            } else {
                target.appendChild(span);
            }
        }
    }

    function highlightCheck(msg) {
        if (msg.indexOf(myNick) !== -1) {
            tabNotify();
            return 'highlight';
        }
        return '';
    }

    function logMineInChat(nick, msg) {
        chatPrint(['chatlog', 'fullchatlog'], [
            ['nick', nick, mySpecialStatus],
            ['text', ': ' + msg]
        ], highlightCheck(msg));
    }

    function logInChat(nick, msg, special) {
        chatPrint(['chatlog', 'fullchatlog'], [
            ['nick', nick, special],
            ['text', ': ' + msg]
        ], highlightCheck(msg));
    }

    function logKickNoticeInChat(modNick, modSpecial, kickeeNick, kickeeSpecial, reason) {
        var lines = [
            ['nick', kickeeNick, kickeeSpecial],
            ['text', ' was kicked by '],
            ['nick', modNick, modSpecial]
        ];
        if (reason) {
            lines.push(['text', ' because: "' + reason + '"']);
        }
        chatPrint(['chatlog', 'fullchatlog'], lines, 'kick');
    }

    function logKickNoticeInChat(modNick, modSpecial, kickeeNick, kickeeSpecial, reason) {
        var lines = [
            ['nick', kickeeNick, kickeeSpecial],
            ['text', ' was kicked and banned by '],
            ['nick', modNick, modSpecial]
        ];
        if (reason) {
            lines.push(['text', ' because: "' + reason + '"']);
        }
        chatPrint(['chatlog', 'fullchatlog'], lines, 'kick');
    }

    function logBroadcastInChat(msg) {
        chatPrint(['chatlog', 'fullchatlog'], [
            ['text', '* BROADCAST: ' + msg]
        ], 'broadcast');
    }

    function logSentConsoleCommandInChat(msg) {
        chatPrint(['chatlog', 'fullchatlog'], [
            ['text', '* CONSOLE <- /' + msg]
        ], 'console');
    }

    function logConsoleMessageInChat(msg) {
        chatPrint(['chatlog', 'fullchatlog'], [
            ['text', '* CONSOLE -> ' + msg]
        ], 'console');
    }

    function logJoinInChat(nick, special) {
        chatPrint(['fullchatlog'], [
            ['nick', nick, special],
            ['text', ' joined']
        ]);
    }

    function logLeaveInChat(nick, special) {
        chatPrint(['fullchatlog'], [
            ['nick', nick, special],
            ['text', ' left']
        ]);
    }

    function logRoomJoinInChat(name, name_full) {
        chatPrint(['chatlog', 'fullchatlog'], [
            ['nick', myNick, mySpecialStatus],
            ['text', ' joined the room ' + name + ' ("' + name_full + '")']
        ]);
    }

    function logEphemeralRoomJoinInChat(name) {
        chatPrint(['chatlog', 'fullchatlog'], [
            ['nick', myNick, special],
            ['text', ' joined the ephemeral room "' + name + '"']
        ]);
    }

    function logHouseRoomJoinInChat(nick) {
        if (nick !== myNick) {
            chatPrint(['chatlog', 'fullchatlog'], [
                ['nick', myNick, special],
                ['text', ' entered the house of user with nick: "' + nick + '"']
            ]);
        } else {
            chatPrint(['chatlog', 'fullchatlog'], [
                ['nick', myNick, special],
                ['text', ' entered your house']
            ]);
        }
    }

    function updateRoomList(rooms) {
        var option;
        roomlist.innerHTML = '';

        // special, "blank" option
        option = document.createElement('option');
        option.value = '[no choice]';
        appendText(option, 'Choose a room...');
        roomlist.appendChild(option);

        for (var i = 0; i < rooms.length; i++) {
            var data = rooms[i];
            option = document.createElement('option');
            option.value = data.name;
            if (data.type !== 'ephemeral') {
                appendText(option, '⇨ ' + data.name_full + ' (' + data.user_count + ' ' + data.user_noun + ')');
            } else {
                appendText(option, '⇨ "' + data.name + '" (ephemeral; ' + data.user_count + ' users)');
            }
            roomlist.appendChild(option);
        }

        // special, "create new" option
        option = document.createElement('option');
        option.value = '[create new]';
        appendText(option, '[create new ephemeral room]');
        roomlist.appendChild(option);

        // show list, refresh buttons
        refreshbutton.disabled = false;
        roomlist.disabled = false;
    }

    function getCatalogue (name, callback) {
        socket.send(JSON.stringify({
            type: 'get_catalogue',
            name: name
        }));
        catalogueCallback = callback;
    }

    function haveAvatar (name) {
        return (avatarInventory.indexOf(name) !== -1);
    }
    function haveInventoryItem (name) {
        return (inventory.indexOf(name) !== -1);
    }

    function doBuy (catalogueName, itemIndex, itemName, itemPrice) {
        if (confirm('Do you want to buy the product "' + itemName + '" for ' + itemPrice + ' bits?')) {
            socket.send(JSON.stringify({
                type: 'buy_from_catalogue',
                name: catalogueName,
                index: itemIndex
            }));
        }
    }

    function createCatalogueWidget(config, root) {
        if (!haveAccount) {
            var p = document.createElement('p');
            p.id = 'no-account-note';
            appendText(p, "You need to create an account (top-right, Account Settings) to get avatars or items. You can get free bits in the dungeon, and you'll get a little each day if you keep coming back. :)");
            root.appendChild(p);
            return;
        }
        getCatalogue(config.catalogue_name, function (catalogue) {
            for (var i = 0; i < catalogue.length; i++) {
                var item = catalogue[i];

                var total = item.items.length;
                var alreadyHave = 0;
                for (var j = 0; j < item.items.length; j++) {
                    if (item.items[j].type === 'avatar'
                        && haveAvatar(item.items[j].avatar_name)) {
                        alreadyHave++;
                    } else if (item.items[j].type === 'inventory_item'
                        && haveInventoryItem(item.items[j].item_name)) {
                        alreadyHave++;
                    }
                }

                var catalogueitem = document.createElement('div');
                catalogueitem.className = 'catalogue-item';
                if (alreadyHave) {
                    catalogueitem.className += ' catalogue-item-have';
                }

                var img = document.createElement('img');
                img.className = 'chooser-preview';
                img.src = item.img;
                catalogueitem.appendChild(img);

                var h2 = document.createElement('h2');
                appendText(h2, item.name_full);
                catalogueitem.appendChild(h2);

                if (alreadyHave) {
                    var p = document.createElement('p');
                    appendText(p, 'You already have: ' + alreadyHave + '/' + total + ' items of this product');
                    catalogueitem.appendChild(p);
                }

                if (alreadyHave !== total || total === 0) {
                    var buy = document.createElement('input');
                    buy.type = 'submit';
                    buy.value = 'Buy for ' + item.price + ' bits';
                    (function (catalogueName, itemIndex, itemName, itemPrice) {
                        buy.onclick = function () {
                            doBuy(catalogueName, itemIndex, itemName, itemPrice);
                        };
                    }(config.catalogue_name, i, item.name_full, item.price));
                    catalogueitem.appendChild(buy);
                }

                root.appendChild(catalogueitem);
            }
        });
    }

    function createIframeWidget(config, root) {
        root.className += ' iframe-widget';

        var iframe = document.createElement('iframe');
        iframe.src = config.src;
        root.appendChild(iframe);
    }

    function createPortalWidget(config, root) {
        root.className += ' portal';
        root.onclick = function () {
            socket.send(JSON.stringify({
                type: 'room_change',
                name: config.to
            }));
        };
    }

    function createPartyWidget(config, root) {
        root.className += ' party-widget';

        root.innerHTML = '<iframe width="320" height="240" src="http://www.youtube.com/embed/videoseries?list=PLuyBiw2l8OdpAGly7cY6Ar5YgYovW2Ps7&amp;hl=en_US&amp;autoplay=1&amp;loop=1" frameborder="0" allowfullscreen></iframe>';

        // "graceful degredation" for those poor IE10 users :'(
        if (root.style.hasOwnProperty('pointerEvents')) {
            root.style.pointerEvents = 'none';

            var lastColor = '';
            setInterval(function () {
                do {
                    var newColor = 'rgba('
                        + Math.floor(Math.random()*2)*255
                        + ','
                        + Math.floor(Math.random()*2)*255
                        + ','
                        + Math.floor(Math.random()*2)*255
                        + ',0.5)'
                } while (lastColor === newColor)
                root.style.backgroundColor = newColor;
                lastColor = newColor;
            }, 400);
        }
    }

    function updateRoomWidgets(widgetdata) {
        widgetdata = widgetdata || roomwidgetstate;
        roomwidgets.innerHTML = '';
        for (var i = 0; i < widgetdata.length; i++) {
            var widget = widgetdata[i];
            var element = document.createElement('div');
            element.className = 'room-widget';
            element.style.left = widget.left + 'px';
            element.style.top = widget.top + 'px';
            element.style.width = widget.width + 'px';
            element.style.height = widget.height + 'px';
            switch (widget.type) {
                case 'catalogue':
                    createCatalogueWidget(widget, element);
                break;
                case 'iframe':
                    createIframeWidget(widget, element);
                break;
                case 'portal':
                    createPortalWidget(widget, element);
                break;
                case 'party':
                    createPartyWidget(widget, element);
                break;
                default:
                    console.log('Unknown widget type: ' + widget.type);
                    return;
                break;
            }
            roomwidgets.appendChild(element);
        }
        roomwidgetstate = widgetdata;
    }

    function changeRoom(room) {
        // change room background and widgets
        roomwidgets.innerHTML = '';
        roomwidgetstate = [];
        if (room.type !== 'ephemeral') {
            background.src = room.background.data;
            stage.style.width = room.background.width + 'px';
            stage.style.height = room.background.height + 'px';
            if (room.hasOwnProperty('widgets')) {
                updateRoomWidgets(room.widgets);
            }
        } else {
            background.src = '/media/rooms/cave.png';
            stage.style.width = '960px';
            stage.style.height = '660px';
        }

        // clear users
        userManager.forEach(function (nick) {
            userManager.kill(nick);
        });

        myRoom = room;

        // add me
        userManager.add(myNick, me, mySpecialStatus, true);

        // go to random position
        if (room.type === 'ephemeral') {
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

    function doMove(x, y) {
        var cur = (new Date().getTime());
        if (cur - lastmove > 400) {
            me.img_index = (me.img_index | 1) - (me.x < x ? 0 : 1);
            me.x = x;
            me.y = y;
            pushAndUpdateState(me);
            lastmove = cur;
        } else {
            chatPrint('You are doing that too often.');
        }
    }

    function showPMLog(nick) {
        function log (from, body, special) {
            chatPrint([messages], [
                ['nick', from, special],
                ['text', ': ' + body]
            ]);
            messages.scrollTop = messages.scrollHeight;
        }
        function logFail () {
            chatPrint([messages], [
                ['text', '* warning: sending the previous message failed - user is not online' + body]
            ]);
            messages.scrollTop = messages.scrollHeight;
        }
        function doSend () {
            if (replybox.value) {
                socket.send(JSON.stringify({
                    type: 'priv_msg',
                    nick: nick,
                    msg: replybox.value
                }));

                log(myNick, replybox.value, mySpecialStatus);

                replybox.value = '';
            }
        }

        if (openPMLogs.hasOwnProperty(nick)) {
            openPMLogs[nick].popup.show();
        } else {
            var popup = makePopup('.pm-log', 'PRIVMSG - ' + nick, true, 250, 250, true, function () {
                delete openPMLogs[nick];
                popup.destroy();
            });

            var messages = document.createElement('div');
            messages.className = 'pm-log-messages';
            popup.content.appendChild(messages);

            var replybox = document.createElement('input');
            replybox.className = 'pm-log-replybox';
            replybox.onkeypress = function (e) {
                // enter
                if (e.which === 13) {
                    doSend();
                    e.preventDefault();
                    return false;
                }
            };
            popup.content.appendChild(replybox);

            var replybtn = document.createElement('button');
            replybtn.className = 'pm-log-replybtn';
            appendText(replybtn, 'Send');
            replybtn.onclick = function () {
                doSend();
            };
            popup.content.appendChild(replybtn);

            var pmlog = {
                popup: popup,
                replybox: replybox,
                replybtn: replybtn,
                messages: messages,
                log: log,
                logFail: logFail
            };

            openPMLogs[nick] = pmlog;
        }
    }

    function logPrivmsgInChat(nick, msg, special) {
        showPMLog(nick);
        openPMLogs[nick].log(nick, msg, special);
        tabNotify();
    }

    function logPrivmsgFailInChat(nick) {
        showPMLog(nick);
        openPMLogs[nick].logFail();
    }

    function showProfile(profile, modMode) {
        if (openProfiles.hasOwnProperty(profile.nick)) {
            openProfiles[profile.nick].hide();
        }

        var popup = makePopup('.profile', 'Profile - ' + profile.nick, true, 250, 250, true, function () {
            delete openProfiles[profile.nick];
            popup.destroy();
        });

        var h3 = document.createElement('h3');
        appendText(h3, profile.nick);
        popup.content.appendChild(h3);

        if (profile.online) {
            appendText(popup.content, profile.nick + ' is online');
        } else {
            if (profile.has_account) {
                appendText(popup.content, profile.nick + " isn't online");
            } else {
                appendText(popup.content, 'There is no online user with the nick: "' + profile.nick + '"');
            }
        }

        var button;

        if (haveAccount) {
            if (friends.indexOf(profile.nick) !== -1) {
                button = document.createElement('button');
                appendText(button, 'Remove friend');
                button.onclick = function (e) {
                    socket.send(JSON.stringify({
                        type: 'friend_remove',
                        nick: profile.nick
                    }));
                    popup.hide();
                };
                popup.content.appendChild(button);
            } else {
                button = document.createElement('button');
                appendText(button, 'Add friend');
                button.onclick = function (e) {
                    socket.send(JSON.stringify({
                        type: 'friend_add',
                        nick: profile.nick
                    }));
                    popup.hide();
                };
                popup.content.appendChild(button);
            }
        }

        if (profile.has_account) {
            button = document.createElement('button');
            var icon = document.createElement('img');
            icon.src = '/media/icons/house.png';
            icon.className = 'house-link';
            button.appendChild(icon);
            appendText(button, 'Visit house');
            button.onclick = function (e) {
                socket.send(JSON.stringify({
                    type: 'room_change',
                    name: 'house ' + profile.nick
                }));
                popup.hide();
            };
            popup.content.appendChild(button);
        }

        if (profile.online) {
            button = document.createElement('button');
            appendText(button, 'Send private message');
            button.onclick = function (e) {
                showPMLog(profile.nick);
                popup.hide();
            };
            popup.content.appendChild(button);

            button = document.createElement('button');
            appendText(button, 'Go to current room');
            button.onclick = function (e) {
                socket.send(JSON.stringify({
                    type: 'room_change',
                    name: profile.room
                }));
                popup.hide();
            };
            if (profile.room === null) {
                button.disabled = true;
            }
            popup.content.appendChild(button);

            if (modMode) {
                popup.content.appendChild(document.createElement('hr'));

                button = document.createElement('button');
                appendText(button, 'Kick');
                button.onclick = function (e) {
                    socket.send(JSON.stringify({
                        type: 'console_command',
                        cmd: 'kick ' + profile.nick
                    }));
                    popup.hide();
                };
                popup.content.appendChild(button);

                button = document.createElement('button');
                appendText(button, 'Kickban');
                button.onclick = function (e) {
                    socket.send(JSON.stringify({
                        type: 'console_command',
                        cmd: 'kickban ' + profile.nick
                    }));
                    popup.hide();
                };
                popup.content.appendChild(button);

                button = document.createElement('button');
                appendText(button, 'List Aliases');
                button.onclick = function (e) {
                    socket.send(JSON.stringify({
                        type: 'console_command',
                        cmd: 'aliases ' + profile.nick
                    }));
                    popup.hide();
                };
                popup.content.appendChild(button);
            }
        }

        openProfiles[profile.nick] = popup;
    }

    function makePopup(tag, title, moveable, x, y, hideable, onhide, onshow) {
        var popup = {
            container: null,
            titlebar: null,
            title: null,
            closebutton: null,
            content: null,
            visible: true,
            hide: function () {
                if (this.visible) {
                    this.visible = false;
                    this.container.style.display = 'none';
                    if (onhide) {
                        onhide();
                    }
                }
            },
            show: function () {
                if (!this.visible) {
                    this.visible = true;
                    this.container.style.display = 'block';
                    if (onshow) {
                        onshow();
                    }
                }
            },
            destroy: function () {
                container.removeChild(this.container);
                var keys = Object.keys(this);
                for (var i = 0; i < keys.length; i++) {
                    delete this[keys];
                }
            }
        };

        popup.container = document.createElement('div');
        popup.container.className = 'popup';
        if (tag[0] === '.') {
            popup.container.className += ' ' + tag.substr(1);;
        } else if (tag[0] === '#') {
            popup.container.id = tag.substr(1);
        }

        popup.titlebar = document.createElement('div');
        popup.titlebar.className = 'popup-titlebar';
        popup.container.appendChild(popup.titlebar);

        popup.title = document.createElement('h2');
        appendText(popup.title, title);
        popup.titlebar.appendChild(popup.title);

        if (moveable) {
            var oX, oY, popupX, popupY, down = false;

            popup.container.style.left = x + 'px';
            popup.container.style.top = y + 'px';

            popup.titlebar.onmousedown = function (e) {
                down = true;
                oX = e.x;
                oY = e.y;
                popupX = parseInt(popup.container.style.left);
                popupY = parseInt(popup.container.style.top);
                document.body.onmousemove = popup.titlebar.onmousemove;
            };
            popup.titlebar.onmousemove = function (e) {
                if (down) {
                    popup.container.style.left = (e.x - oX) + popupX + 'px';
                    popup.container.style.top = (e.y - oY) + popupY + 'px';
                }
            };
            popup.titlebar.onmouseup = function () {
                down = false;
                document.body.onmousemove = null;
            };
        }

        if (hideable) {
            popup.hidebutton = document.createElement('button');
            popup.hidebutton.className = 'popup-hide';
            popup.hidebutton.title = 'Hide popup';
            popup.hidebutton.onclick = function () {
                popup.hide();
            };
            appendText(popup.hidebutton, 'x');
            popup.titlebar.appendChild(popup.hidebutton);
        }

        popup.content = document.createElement('div');
        popup.content.className = 'popup-content';
        popup.container.appendChild(popup.content);

        container.appendChild(popup.container);

        return popup;
    }

    function renderFriendsList() {
        friendslist.content.innerHTML = '';
        if (friends.length) {
            var ul = document.createElement('ul');
            for (var i = 0; i < friends.length; i++) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.className = 'friend';
                appendText(a, friends[i]);
                (function (friend) {
                    a.onclick = function () {
                        socket.send(JSON.stringify({
                            type: 'profile_get',
                            nick: friend
                        }));
                    };
                }(friends[i]));
                li.appendChild(a);
                ul.appendChild(li);
            }
            friendslist.content.appendChild(ul);
        } else {
            appendText(friendslist.content, 'You have no friends.');
        }
    }

    function renderChooser() {
        chooser.content.innerHTML = '';
        var ad = document.createElement('img');
        ad.src = '/media/store/buy-more.png';
        ad.className = 'chooser-preview';
        ad.title = 'Buy some avatars!';
        ad.onclick = function () {
            socket.send(JSON.stringify({
                type: 'room_change',
                name: 'carousel_boutique'
            }));
            chooser.hide();
        };
        chooser.content.appendChild(ad);
        for (var i = 0; i < avatarInventory.length; i++) {
            var name = avatarInventory[i];
            if (avatars.hasOwnProperty(name)) {
                var preview = document.createElement('img');
                preview.src = '/media/avatars/' + avatars[name][0];
                preview.className = 'chooser-preview';
                (function (images, name) {
                    preview.onclick = function () {
                        var subChooser = makePopup('.chooser', 'Change avatar - ' + name, true, 300, 300, true, function () {
                            subChooser.destroy();
                        }, null);
                        for (var i = 0; i < images.length; i++) {
                            var preview = document.createElement('img');
                            preview.src = '/media/avatars/' + images[i];
                            preview.className = 'chooser-preview';
                            (function (imgid) {
                                preview.onclick = function () {
                                    me.img_name = name;
                                    me.img_index = imgid;
                                    localStorage.setItem('last-avatar', name);
                                    pushAndUpdateState(me);
                                    subChooser.hide();
                                    if (images[imgid].indexOf('_upsidedown') !== -1) {
                                        container.className = 'upside-down';
                                    } else {
                                        container.className = '';
                                    }
                                };
                            }(i));
                            subChooser.content.appendChild(preview);
                        }
                    };

                }(avatars[name], name));
                chooser.content.appendChild(preview);
            }
        }
    }

    function renderInventoryList() {
        inventorylist.content.innerHTML = '';
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
                    inventorylist.content.appendChild(preview);
                }
            }
        } else {
            appendText(inventorylist.content, 'You have no inventory items.');
        }
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
        background.onclick = function (e) {
            doMove(e.layerX, e.layerY);
        };
        background.ondragstart = function () {
            return false;
        };
        stage.appendChild(background);

        roomwidgets = document.createElement('div');
        roomwidgets.id = 'background-widgets';
        stage.appendChild(roomwidgets);
    }

    function handleChatMessage() {
        // is command
        if (chatbox.value[0] === '/') {
            socket.send(JSON.stringify({
                type: 'console_command',
                cmd: chatbox.value.substr(1)
            }));
            logSentConsoleCommandInChat(chatbox.value.substr(1));
        // is chat message
        } else {
            me.chat = chatbox.value;
            if (me.chat !== '') {
                logMineInChat(myNick, me.chat, true);
            }
            pushAndUpdateState(me);
        }
        chatbox.value = '';
    }

    function initGUI_chatbar() {
        chatlog = document.createElement('div');
        chatlog.id = 'chatlog';
        overlay.appendChild(chatlog);

        fullchatlog = makePopup('#fullchatlog', 'Full chat log', true, 200, 200, true, null, function () {
            fullchatlog.content.scrollTop = fullchatlog.content.scrollHeight;
        });
        fullchatlog.hide();

        fullchatlogcontent = document.createElement('div');
        fullchatlogcontent.id = 'fullchatlog-content';
        fullchatlog.content.appendChild(fullchatlogcontent);

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
                e.preventDefault();
                var parts = chatbox.value.split(' ');
                var lastpart = parts[parts.length - 1];
                userManager.forEach(function (nick) {
                    if (nick === myNick) {
                        return;
                    }
                    if (nick.substr(0, lastpart.length) === lastpart) {
                        if (parts.length === 1) {
                            parts[parts.length - 1] = nick + ':';
                        } else {
                            parts[parts.length - 1] = nick;
                        }
                        parts.push('');
                        chatbox.value = parts.join(' ');
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
        overlay.appendChild(chatbutton);

        fullchatlogbutton = document.createElement('input');
        fullchatlogbutton.id = 'fullchatlog-button';
        fullchatlogbutton.type = 'submit';
        fullchatlogbutton.value = 'Full chatlog';
        fullchatlogbutton.onclick = function () {
            fullchatlog.show();
        };
        fullchatlogbutton.disabled = true;
        overlay.appendChild(fullchatlogbutton);

        chooserbutton = document.createElement('input');
        chooserbutton.id = 'chooser-button';
        chooserbutton.type = 'submit';
        chooserbutton.value = 'Avatars';
        chooserbutton.onclick = function () {
            chooser.show();
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

        homebutton = document.createElement('button');
        var icon = document.createElement('img');
        icon.src = 'media/icons/house.png';
        icon.alt = icon.title = 'My House';
        homebutton.appendChild(icon);
        homebutton.id = 'home-button';
        homebutton.onclick = function () {
            socket.send(JSON.stringify({
                type: 'room_change',
                name: 'house ' + myNick
            }));
        };
        homebutton.style.display = 'none';
        overlay.appendChild(homebutton);

        friendslistbutton = document.createElement('button');
        friendslistbutton.id = 'friends-list-button';
        appendText(friendslistbutton, 'Friends');
        friendslistbutton.onclick = function () {
            friendslist.show();
        };
        friendslistbutton.style.display = 'none';
        overlay.appendChild(friendslistbutton);

        inventorylistbutton = document.createElement('input');
        inventorylistbutton.id = 'inventory-list-button';
        inventorylistbutton.type = 'submit';
        inventorylistbutton.value = 'Inventory';
        inventorylistbutton.onclick = function () {
            inventorylist.show();
        };
        inventorylistbutton.style.display = 'none';
        overlay.appendChild(inventorylistbutton);

        bitcount = document.createElement('div');
        bitcount.id = 'bit-count';
        bitcount.title = 'bits';
        appendText(bitcount, '???');
        bitcount.style.display = 'none';
        overlay.appendChild(bitcount);

        accountsettingsbutton = document.createElement('input');
        accountsettingsbutton.id = 'account-settings-button';
        accountsettingsbutton.type = 'submit';
        accountsettingsbutton.value = 'Account Settings';
        accountsettingsbutton.onclick = function () {
            accountsettings.show();
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
            }
        };
        roomeditbutton.style.display = 'none';
        overlay.appendChild(roomeditbutton);

        roomedit = document.createElement('div');
        roomedit.id = 'room-edit';
        roomedit.style.display = 'none';
        appendText(roomedit, 'Buy house backgrounds from the Carousel Boutique. Change your house background by clicking one in your inventory.');
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

        accountsettings = makePopup('#account-settings', 'Account Settings', true, 300, 300, true);
        accountsettings.hide();

        createaccbutton = document.createElement('input');
        createaccbutton.type = 'submit';
        createaccbutton.value = 'Create account with Persona';
        createaccbutton.onclick = function () {
            accountsettings.hide();
            navigator.id.watch({
                loggedInUser: currentUser,
                onlogin: function (assertion) {
                    socket.send(JSON.stringify({
                        type: 'create_account',
                        assertion: assertion
                    }));
                },
                onlogout: function () {
                    // ???
                }
            });
            navigator.id.request();
        };
        accountsettings.content.appendChild(createaccbutton);

        changepassbutton = document.createElement('a');
        changepassbutton.href = 'https://login.persona.org';
        changepassbutton.className = 'button';
        changepassbutton.target = '_blank';
        appendText(changepassbutton, 'Change password etc.');
        changepassbutton.onclick = function () {
            accountsettings.hide();
            return true;
        };
        accountsettings.content.appendChild(changepassbutton);

        rmpassbutton = document.createElement('input');
        rmpassbutton.type = 'submit';
        rmpassbutton.value = 'Delete account';
        rmpassbutton.onclick = function () {
            if (confirm("Are you sure you want to delete your ponyplace account?\nYou'll loose all of your bits, items, avatars, your house, and your nickname!\nNote: This will *not* do anything to your Persona ID.")) {
                socket.send(JSON.stringify({
                    type: 'delete_account'
                }));
                accountsettings.hide();
            }
        };
        accountsettings.content.appendChild(rmpassbutton);

        chooser = makePopup('.chooser', 'Avatar inventory', true, 200, 200, true, null, function () {
            renderChooser();

        });
        chooser.hide();

        inventorylist = makePopup('.chooser', 'Item inventory', true, 200, 200, true, null, function () {
            renderInventoryList();
        });
        inventorylist.hide();

        friendslist = makePopup('#friends-list', 'Friends', true, 200, 200, true, null, function () {
            renderFriendsList();
        });
        friendslist.hide();
    }

    function doLogin(authenticated, assertion) {
        if (nickbox.value || authenticated) {
            nickbox.blur();
            loginbox.hide();
            initNetwork(authenticated, assertion);
        }
    }

    function initGUI_login() {
        loginbox = makePopup('#loginbox', 'Log in');
        loginbox.content.innerHTML = "<h1>Welcome to ponyplace!</h1>\
        <p>ponyplace is a My Little Pony-themed chatroom! You can hang out, play games and earn bits and customise your avatar and house. It's all free, forever. You'll never have to pay a cent!</p>\
        <p id=age-disclaimer>By logging in you assert that you are at least 13 years of age or have obtained parental permission, and understand that ponyplace is a public chatroom that may occasionally feature content unsuitable for children. Also, DO NOT ASK TO BECOME A MOD. YOU WILL BE KICKED.</p>\
        <p>If you already have a ponyplace and Persona account, log in. If you want to create a ponyplace account, sign in anonymously first, then go to Account Settings.</p>";

        personasubmit = document.createElement('input');
        personasubmit.type = 'submit';
        personasubmit.value = 'Log in with Persona';
        personasubmit.onclick = function () {
            navigator.id.watch({
                loggedInUser: currentUser,
                onlogin: function (assertion) {
                    doLogin(true, assertion);
                },
                onlogout: function () {
                    // ???
                }
            });
            navigator.id.request();
        };
        loginbox.content.appendChild(personasubmit);

        appendText(loginbox.content, "Otherwise, you can log in anonymously. Choose a nickname (3 to 18 characters; digits, letters and underscores (_) only).");

        nickbox = document.createElement('input');
        nickbox.type = 'text';
        nickbox.placeholder = 'nickname';
        nickbox.maxLength = 18;
        nickbox.onkeypress = function (e) {
            if (e.which === 13) {
                doLogin();
            }
        };
        loginbox.content.appendChild(nickbox);
        nickbox.focus();

        loginsubmit = document.createElement('input');
        loginsubmit.type = 'submit';
        loginsubmit.value = 'Anonymous Login';
        loginsubmit.onclick = function () {
            doLogin();
        };
        loginbox.content.appendChild(loginsubmit);

        var a = document.createElement('a');
        a.href = '/credits.html';
        a.target = '_blank';
        appendText(a, "Disclaimer and Credits");
        loginbox.content.appendChild(a);
    }

    function initGUI() {
        document.body.innerHTML = '';

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
        initGUI_login();

        window.onfocus = function () {
            pageFocussed = true;
            document.title = 'ponyplace';
            unseenHighlights = 0;
        };
        window.onblur = function () {
            pageFocussed = false;
        };
    }

    function initNetwork(authenticated, assertion) {
        if (window.location.hostname === 'localhost') {
            socket = new WebSocket('ws://localhost:9001', 'ponyplace');
        } else {
            socket = new WebSocket('ws://ajf.me:9001', 'ponyplace');
        }

        socket.onopen = function () {
            connected = true;
            me = {
                img_name: localStorage.getItem('last-avatar') || 'derpy',
                img_index: 0,
                x: 0,
                y: 0,
                chat: ''
            };

            if (authenticated) {
                socket.send(JSON.stringify({
                    type: 'appear',
                    obj: me,
                    assertion: assertion,
                    authenticated: true
                }));
            } else {
                // trim whitespace
                var nick = nickbox.value.replace(/^\s+|\s+$/g, '');
                socket.send(JSON.stringify({
                    type: 'appear',
                    obj: me,
                    nick: nick,
                    authenticated: false
                }));
            }
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
                case 'avatar_change':
                    me.img_name = msg.img_name;
                    me.img_index = msg.img_index;
                    if (myRoom !== null) {
                        userManager.update(myNick, me);
                        // erase last avatar
                        localStorage.setItem('last-avatar', '');
                    }
                break;
                case 'account_state':
                    chatbox.focus();

                    chatbox.disabled = false;
                    chatbutton.disabled = false;
                    fullchatlogbutton.disabled = false;

                    myNick = msg.nick;
                    mySpecialStatus = msg.special;
                    bitcount.innerHTML = '';
                    if (msg.bits !== null) {
                        appendText(bitcount, msg.bits);
                    }
                    avatarInventory = msg.avatar_inventory;
                    renderChooser();
                    inventory = msg.inventory;
                    friends = msg.friends;
                    chooserbutton.disabled = false;
                    haveAccount = msg.have_account;
                    accountsettingsbutton.disabled = false;
                    if (haveAccount) {
                        createaccbutton.style.display = 'none';
                        changepassbutton.style.display = 'block';
                        rmpassbutton.style.display = 'block';
                        inventorylistbutton.style.display = 'block';
                        renderInventoryList();
                        friendslistbutton.style.display = 'block';
                        renderFriendsList();
                        bitcount.style.display = 'block';
                        homebutton.style.display = 'block';
                    } else {
                        createaccbutton.style.display = 'block';
                        changepassbutton.style.display = 'none';
                        rmpassbutton.style.display = 'none';
                        inventorylistbutton.style.display = 'none';
                        inventorylist.hide();
                        friendslistbutton.style.display = 'none';
                        friendslist.hide();
                        bitcount.style.display = 'none';
                        homebutton.style.display = 'none';
                        localStorage.setItem('last-avatar', '');
                    }

                    stage.style.display = 'block';
                    if (myRoom === null) {
                        background.src = '/media/rooms/noroom.png';
                        stage.style.height = '660px';
                        stage.style.width = '1173px';
                        // ponyplace.ajf.me/#roomname shortcut
                        if (window.location.hash) {
                            socket.send(JSON.stringify({
                                type: 'room_change',
                                name: window.location.hash.substr(1)
                            }));
                        }
                    }

                    updateRoomWidgets();
                break;
                case 'broadcast':
                    logBroadcastInChat(msg.msg);
                break;
                case 'console_msg':
                    logConsoleMessageInChat(msg.msg);
                break;
                case 'mod_log':
                    var popup = makePopup('.mod-log', 'Moderation log', true, 250, 250, true, function () {
                        popup.destroy();
                    });
                    var ul = document.createElement('ul');
                    msg.items.reverse();
                    for (var i = 0; i < msg.items.length; i++) {
                        var item = msg.items[i];
                        var li = document.createElement('li');
                        var pre = document.createElement('pre');
                        appendText(li, {
                            ban: 'Ban',
                            kick: 'Kick',
                            move: 'Move room',
                            broadcast: 'Broadcast message',
                            bits_change: 'Bits balance change'
                        }[item.type] + ' by ' + item.mod + ' at ' + (new Date(item.date)).toLocaleString());
                        delete item.type;
                        delete item.date;
                        delete item.mod;
                        appendText(pre, JSON.stringify(item, null, 2));
                        li.appendChild(pre);
                        ul.appendChild(li);
                    }
                    popup.content.appendChild(ul);
                break;
                case 'profile':
                    showProfile(msg.data, msg.moderator_mode);
                break;
                case 'priv_msg':
                    logPrivmsgInChat(msg.from_nick, msg.msg, msg.from_special);
                break;
                case 'priv_msg_fail':
                    logPrivmsgFailInChat(msg.nick);
                break;
                case 'die':
                    userManager.kill(msg.nick);
                break;
                case 'room_list':
                    updateRoomList(msg.list);
                    globalUserCount = msg.user_count;
                    userManager.showUserCounter();
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
                case 'kick_notice':
                    logKickNoticeInChat(msg.mod_nick, msg.mod_special, msg.kickee_nick, msg.kickee_special, msg.reason);
                break;
                case 'ban_notice':
                    logBanNoticeInChat(msg.mod_nick, msg.mod_special, msg.kickee_nick, msg.kickee_special, msg.reason);
                break;
                case 'kick':
                    if (msg.reason === 'nick_in_use') {
                        alert('That nickname was already in use. Reload and choose a different one.');
                    } else if (msg.reason === 'bad_nick') {
                        alert('Bad nickname.\nNicknames must be between 3 and 18 characters long, and contain only letters, digits, and underscores (_).');
                    } else if (msg.reason === 'protected_nick') {
                        alert('That nickname is protected.\nChoose a different one, or if you own it, log in.');
                    } else if (msg.reason === 'bad_login') {
                        alert('Login failed.');
                    } else if (msg.reason === 'no_assoc_account') {
                        alert('There is no account associated with this email address.\nAre you sure you have a ponyplace account? You need to sign in anonymously, then go to the top-right, Account Settings, and click "Create Account with Persona" to create an account.');
                    } else if (msg.reason === 'account_deleted') {
                        alert('Your account was deleted.');
                        navigator.id.logout();
                        // erase last avatar
                        localStorage.setItem('last-avatar', '');
                        window.location.reload();
                    } else if (msg.reason === 'protocol_error') {
                        alert('There was a protocol error. This usually means your client sent a malformed packet. Your client is probably out of date, try clearing your cache and refreshing.');
                    } else if (msg.reason === 'no_such_room') {
                        alert("No such room. You tried to join a room that doesn't exist.");
                    } else if (msg.reason === 'dont_have_avatar') {
                        alert("You do not have the avatar you tried to wear. This is probably a bug.");
                        // erase last avatar
                        localStorage.setItem('last-avatar', '');
                    } else if (msg.reason === 'dont_have_item') {
                        alert("You do not have the item you tried to use. This is probably a bug.");
                    } else if (msg.reason === 'kick') {
                        if (msg.msg) {
                            alert('You were kicked!\nReason: "' + msg.msg + '"');
                        } else {
                            alert('You were kicked!');
                        }
                    } else if (msg.reason === 'ban') {
                        if (msg.msg) {
                            alert('You were banned!\nReason: "' + msg.msg + '"');
                        } else {
                            alert('You were banned!');
                        }
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
    };
}());
