(function () {
    'use strict';
    var ponyplace;
    window.onload = function () {
        ponyplace = parent.ponyplace;

        var portal = document.createElement('div');
        portal.className = 'portal';
        portal.onclick = function () {
            ponyplace.changeRoom(roomName);
        };
        document.body.appendChild(portal);
    };
}());
