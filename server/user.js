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

module.exports = User;
