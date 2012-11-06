var fs = require('fs');

function User (nick, conn, obj, special, room) {
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
        special: User.getSpecialStatus(this.nick),
        bits: User.hasBits(this.nick),
        have_avatars: User.avatars
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
User.passwords = {};
User.specialUsers = {};
User.userData = {};
User.avatars = {};

User.init = function () {
    this.avatars = JSON.parse(fs.readFileSync('data/avatars.json'));
    console.log('Loaded avatars list');
    this.passwords = JSON.parse(fs.readFileSync('data/passwords.json'));
    console.log('Loaded passwords');
    this.specialUsers = JSON.parse(fs.readFileSync('data/special-users.json'));
    console.log('Loaded special users info');
    try {
        this.userData = JSON.parse(fs.readFileSync('data/user-data.json'));
    } catch (e) {
        console.log('Error loading user data, skipped');
        return;
    }
    console.log('Loaded user data');
};
User.save = function () {
    fs.writeFileSync('data/passwords.json', JSON.stringify(this.passwords));
    console.log('Saved passwords');
    fs.writeFileSync('data/user-data.json', JSON.stringify(this.userData));
    console.log('Saved user data');
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
User.isCorrectPassword = function (nick, password) {
    if (!this.hasPassword(nick)) {
        return false;
    }
    return (this.passwords[nick] === password);
};
User.setPassword = function (nick, password) {
    this.passwords[nick] = password;
    if (!this.userData.hasOwnProperty(nick)) {
        this.userData[nick] = {
            bits: 0
        };
    }
    this.save();
};
User.removePassword = function (nick) {
    delete this.passwords[nick];
    delete this.userData[nick];
    this.save();
};
User.hasPassword = function (nick) {
    return this.passwords.hasOwnProperty(nick);
};

User.hasBits = function (nick) {
    if (this.hasPassword(nick)) {
        if (this.userData.hasOwnProperty(nick)) {
            return this.userData[nick].bits;
        } else {
            return 0;
        }
    } else {
        return null;
    }
};
User.changeBits = function (nick, amount) {
    if (this.hasPassword(nick)) {
        if (this.userData.hasOwnProperty(nick)) {
            if (this.userData[nick].bits + amount < 0) {
                return false;
            }
            this.userData[nick].bits += amount;
        } else {
            if (amount < 0) {
                return false;
            }
            this.userData[nick] = {
                bits: amount
            }
        }
        this.save();
        if (User.has(nick)) {
            User.get(nick).sendAccountState();
        }
        return true;
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
