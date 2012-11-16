ponyplace is a 2d pony chatroom powered by node.js and WebSocket.

Setup
=====

Configuration
-------------

1. Make sure you have a `special-users.json` file in the `server/data` directory. Make sure the usernames listed have accounts attached, otherwise anyone can log in with that name and use mod powers. Should be of format:

        {
            "joe": "creator",
            "fred": "moderator",
            "garry": "moderator",
            "tomatobot": "bot"
        }


2. You'll also need a `bypass.json` file in `server/data`. You can leave it empty (`{}`), but if you have any bots, this allows them to bypass login via Persona, and instead use a password, e.g.:

        {
            "somebot": "password123"
        }

Running Server
--------------

1. Obviously, make sure you have node.js.
2. `cd` into the `server` directory and do `npm install`. This is equivalent to `npm install websocket` to get [WebSocket-Node](https://github.com/Worlize/WebSocket-Node) (which itself requires node-gyp, do `sudo npm install -g node-gyp` first) and `npm install keypress` to get the keypress module.
3. Run `server.js` (add `--debug` switch if running locally)
4. Run a web server at the same hostname. When debugging, run one at `localhost:8000`. Note that it expects, for login verification purposes, the production server to always be called `ponyplace.ajf.me` and be on port 80.
