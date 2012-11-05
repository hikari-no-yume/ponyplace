var fs = require('fs');

function User (nick, conn, obj, special, room) {
    if (User.has(nick)) {
        throw new Error('There is already a user with the same nick "' + nick + '"');
    }

    this.nick = nick;
    this.conn = conn;
    this.obj = obj;
    this.room = room;
    this.special = special;

    User.users[nick] = this;
    User.userCount++;
}
User.prototype.remove = function () {
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

User.init = function () {
    this.passwords = JSON.parse(fs.readFileSync('data/passwords.json'));
    console.log('Loaded account details');
    this.specialUsers = JSON.parse(fs.readFileSync('data/special-users.json'));
    console.log('Loaded special users info');

};
User.save = function () {
    fs.writeFileSync('data/passwords.json', JSON.stringify(this.passwords));
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
    this.save();
};
User.removePassword = function (nick) {
    delete this.passwords[nick];
    this.save();
};
User.hasPassword = function (nick) {
    return this.passwords.hasOwnProperty(nick);
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
