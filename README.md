ponyplace is a 2d pony chatroom powered by node.js and WebSocket.

Setup
=====

Configuration
-------------

1. Make sure you have a `special-users.json` file in the `server/data_config` directory. Make sure the usernames listed have accounts attached, otherwise anyone can create one with that name and use mod powers. Should be of format:

        {
            "joe": "creator",
            "fred": "moderator",
            "garry": "moderator",
            "tomatobot": "bot"
        }


2. You'll also need a `bypass.json` file in `server/data_config`. You can leave it empty (`{}`), but if you have any bots, this allows them to bypass login via Persona, and instead use a password, e.g.:

        {
            "somebot": "password123"
        }

3. Finally, set up a `config.json` file in `server/data_config`, to specify the port listened on for debugging and production modes, and the origins needed. `"allow_missing_origin"`, if `true`, allows clients to connect which don't provide an origin (i.e. non-web browser clients like bots). It doesn't really matter what you set this to, though, since if they can avoid providing an origin, they can also probably fake one. For example:

        {
            "origin": "http://pp.ajf.me",
            "origin_debug": "http://localhost:8000",
            "port": 8000,
            "port_debug": 8000,
            "allow_missing_origin": true
        }

Running Server
--------------

1. Obviously, make sure you have node.js.
2. `cd` into the `server` directory and do `npm install`. This is equivalent to `npm install websocket` to get [WebSocket-Node](https://github.com/Worlize/WebSocket-Node) (which itself requires node-gyp, do `sudo npm install -g node-gyp` first), `npm install keypress` to get the keypress module and `npm install express` to get express.
3. Make sure `server/data_user` is writeable.
4. Run `server.js` (add `--debug` switch if running locally)

ponyplace no longer requires a separate web server. To integrate as part of a site using vhosts, run ponyplace on a different port and reverse-proxy.
