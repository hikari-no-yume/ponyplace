var fs = require('fs');
var https = require('https');

function User (nick, conn, obj, room) {
    if (User.has(nick)) {
        throw new Error('There is already a user with the same nick "' + nick + '"');
    }

    this.nick = nick;
    this.conn = conn;
    this.obj = obj;
    this.room = room;
    this.special = User.getSpecialStatus(nick);

    User.users[nick] = this;
    User.userCount++;
}
User.prototype.sendAccountState = function () {
    this.send({
        type: 'account_state',
        nick: this.nick,
        special: User.getSpecialStatus(this.nick),
        bits: User.hasBits(this.nick),
        avatar_inventory: User.getAvatarInventory(this.nick),
        inventory: User.getInventory(this.nick),
        have_account: User.hasAccount(this.nick)
    });
};
User.prototype.kill = function () {
    delete User.users[this.nick];

    User.userCount--;
};
User.prototype.send = function (msg) {
    this.conn.sendUTF(JSON.stringify(msg));
};
User.prototype.kick = function (reason) {
    this.send({
        type: 'kick',
        reason: reason
    });
    this.conn.close();
};

User.users = [];
User.userCount = 0;
User.specialUsers = {};
User.accounts = {};
User.emails = {};
User.avatars = {};
User.inventoryItems = {};
User.catalogues = {};
User.bypass = {};

User.init = function () {
    this.avatars = JSON.parse(fs.readFileSync('data/avatars.json'));
    console.log('Loaded avatars list');
    this.inventoryItems = JSON.parse(fs.readFileSync('data/inventory_items.json'));
    console.log('Loaded inventory items list');
    this.catalogues = JSON.parse(fs.readFileSync('data/catalogues.json'));
    console.log('Loaded catalogues');
    this.specialUsers = JSON.parse(fs.readFileSync('data/special-users.json'));
    console.log('Loaded special users info');
    this.bypass = JSON.parse(fs.readFileSync('data/bypass.json'));
    console.log('Loaded login bypass exceptions');
    try {
        var data1 = fs.readFileSync('data/accounts.json');
        var data2 = fs.readFileSync('data/emails.json');
    } catch (e) {
        console.log('Error loading accounts, skipped');
        return;
    }
    this.accounts = JSON.parse(data1);
    this.emails = JSON.parse(data2);
    console.log('Loaded accounts');
};
User.save = function () {
    fs.writeFileSync('data/accounts.json', JSON.stringify(this.accounts));
    fs.writeFileSync('data/emails.json', JSON.stringify(this.emails));
    console.log('Saved accounts');
};
User.getSpecialStatus = function (nick) {
    if (this.specialUsers.hasOwnProperty(nick)) {
        return this.specialUsers[nick];
    }
    return false;
};
User.isModerator = function (nick) {
    var status = this.getSpecialStatus(nick);
    return (status === 'moderator' || status === 'creator' || status === 'bot');
};
User.checkBypass = function (nick, bypass) {
    if (!this.bypass.hasOwnProperty(nick)) {
        return false;
    }
    return (this.bypass[nick] === bypass);
};
User.assert = function (assertion, callback) {
    var postdata;
    
    if (process.argv.hasOwnProperty('2') && process.argv[2] === '--debug') {
        postdata = 'assertion=' + assertion + '&audience=http://localhost:8000';
    } else {
        postdata = 'assertion=' + assertion + '&audience=http://ponyplace.ajf.me';
    }
    
    var req = https.request({
        hostname: 'verifier.login.persona.org',
        method: 'POST',
        path: '/verify',
        headers: {
            'Content-Length': postdata.length,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            var data = JSON.parse(chunk);
            if (data.status === 'okay') {
                callback(true, data.email);
                return;
            }
            callback(false);
        });
    });

    req.on('error', function (e) {
        callback(false);
    });

    req.write(postdata);
    req.end();
};
User.createAccount = function (nick, email) {
    if (this.hasAccount(nick)) {
        throw new Error('Account with given nick already exists.');
    }
    if (this.emails.hasOwnProperty(email)) {
        throw new Error('Account with given email already exists.');
    }
    this.accounts[nick] = {
        email: email
    };
    this.emails[email] = nick;
    this.save();
};
User.deleteAccount = function (nick) {
    if (!this.hasAccount(nick)) {
        throw new Error('No account with given nick exists.');
    }
    delete this.emails[this.accounts[nick].email];
    delete this.accounts[nick];
    this.save();
};
User.hasAccount = function (nick) {
    return this.accounts.hasOwnProperty(nick);
};
User.hasEmail = function (email) {
    return this.emails.hasOwnProperty(email);
};
User.getAccountForEmail = function (email) {
    if (this.hasEmail(email)) {
        return User.emails[email];
    }
    return null;
};

User.hasBits = function (nick) {
    if (this.hasAccount(nick)) {
        return this.getUserData(nick, 'bits', 0);
    } else {
        return null;
    }
};
User.getUserData = function (nick, property, defaultValue) {
    if (this.accounts.hasOwnProperty(nick)) {
        if (this.accounts[nick].hasOwnProperty(property)) {
            return this.accounts[nick][property];
        }
    }
    return defaultValue;
};
User.setUserData = function (nick, property, value) {
    if (!this.hasAccount(nick)) {
        throw new Error('There is no account with the given nick.');
    }
    this.accounts[nick][property] = value;
    this.save();
};
User.changeBits = function (nick, amount) {
    if (this.hasAccount(nick)) {
        var bits = this.getUserData(nick, 'bits', 0);
        
        bits += amount;

        if (bits >= 0 && Number.isFinite(bits) && !Number.isNaN(bits)) {
            this.setUserData(nick, 'bits', bits);

            if (User.has(nick)) {
                User.get(nick).sendAccountState();
            }
            return true;
        }
    }
    return false;
};

User.getHouse = function (nick) {
    return this.getUserData(nick, 'house', {
        type: 'house',
        name: 'house ' + nick,
        user_nick: nick,
        locked: false,
        background: {
            data: '/media/rooms/cave.png',
            width: 960,
            height: 660,
            iframe: false
        }
    });
};
User.setHouse = function (nick, data) {
    return this.setUserData(nick, 'house', data);
};
User.isHouseLocked = function (nick) {
    return this.getHouse(nick).locked;
};

User.getAvatarInventory = function (nick) {
    return this.getUserData(nick, 'avatarInventory', ['derpy', 'applejack', 'fluttershy', 'pinkiepie', 'rainbowdash', 'rarity', 'twilight']);
};
User.hasAvatar = function (nick, avatar) {
    return this.getAvatarInventory(nick).indexOf(avatar) !== -1;
};
User.giveAvatar = function (nick, avatar) {
    inventory = this.getAvatarInventory(nick);
    if (inventory.indexOf(avatar) === -1) {
        inventory.push(avatar);
    }
    this.setUserData(nick, 'avatarInventory', inventory);
};
User.getInventory = function (nick) {
    return this.getUserData(nick, 'inventory', []);
};
User.hasInventoryItem = function (nick, item) {
    return this.getInventory(nick).indexOf(item) !== -1;
};
User.giveInventoryItem = function (nick, item) {
    inventory = this.getInventory(nick);
    if (inventory.indexOf(item) === -1) {
        inventory.push(item);
    }
    this.setUserData(nick, 'inventory', inventory);
};
User.getCatalogue = function (name) {
    if (this.catalogues.hasOwnProperty(name)) {
        return this.catalogues[name];
    }
    return false;
};
User.buyFromCatalogue = function (nick, name, index) {
    var catalogue = this.getCatalogue(name);
    if (catalogue !== null) {
        if (catalogue.hasOwnProperty(index)) {
            var product = catalogue[index];
            if (this.changeBits(nick, -product.price)) {
                var total = product.items.length;
                var alreadyHave = 0;
                for (var i = 0; i < product.items.length; i++) {
                    var item = product.items[i];
                    if (product.items[0].type === 'avatar'
                        && this.hasAvatar(nick, item.avatar_name)) {
                        alreadyHave++;
                    } else if (product.items[0].type === 'inventory_item'
                        && this.hasInventoryItem(nick, item.item_name)) {
                        alreadyHave++;
                    }
                }
                if (alreadyHave === total && total !== 0) {
                    return false;
                }
                for (var i = 0; i < product.items.length; i++) {
                    var item = product.items[i];
                    if (item.type === 'avatar') {
                        this.giveAvatar(nick, item.avatar_name);
                    } else if (item.type === 'inventory_item') {
                        this.giveInventoryItem(nick, item.item_name);
                    } else {
                        console.log('Unknown product item type: "' + item.type + '"!');
                    }
                }
                if (User.has(nick)) {
                    User.get(nick).sendAccountState();
                }
                return {
                    name_full: product.name_full,
                    price: product.price
                };
            }
        }
    }
    return false;
};

User.get = function (nick) {
    if(!this.has(nick)) {
        throw new Error("There is no user named: " + nick);
    }
    
    return this.users[nick];
};
User.has = function (nick) {
    return this.users.hasOwnProperty(nick);
};
User.forEach = function (callback) {
    for (var nick in this.users) {
        if (this.users.hasOwnProperty(nick)) {
            callback(this.users[nick]);
        }
    }
};

User.init();

module.exports = User;
