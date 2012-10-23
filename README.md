ponyplace is a 2d pony chatroom powered by node.js and WebSocket.

Setup
=====

Configuration
-------------

1. Make sure you have a (carefully guarded) `special-users.json` file in the `server` directory. Should be of format:

        {
            "creator": "joe",
            "moderators": ["fred", "garry"],
            "passwords": {
                "joe": "foobar",
                "fred": "barfoo",
                "garry": "foofoobarbar"
            }
        }

2. Might want to modify `ponyplace.js`'s `specialNicks` map to match `special-users.json`

Running Server
--------------

1. Obviously, make sure you have node.js.
2. `cd` into the `server` directory and do `npm install websocket` to get [WebSocket-Node](https://github.com/Worlize/WebSocket-Node) (which itself requires node-gyp, do `sudo npm install -g node-gyp` first) and `npm install keypress` to get the keypress module
3. Run `server.js` (add `--debug` switch if running locally)
4. Run a web server at the same hostname
