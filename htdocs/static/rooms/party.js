(function () {
    'use strict';
    var ponyplace;
    window.onload = function () {
        ponyplace = parent.ponyplace;

        var vidwindow = document.createElement('div');
        vidwindow.style.position = 'absolute';
        vidwindow.style.right = 0;
        vidwindow.style.bottom = 0;
        vidwindow.innerHTML = '<iframe width="320" height="240" src="http://www.youtube.com/embed/videoseries?list=PLuyBiw2l8OdpAGly7cY6Ar5YgYovW2Ps7&amp;hl=en_US&amp;autoplay=1&amp;loop=1" frameborder="0" allowfullscreen></iframe>';
        document.body.appendChild(vidwindow);

        setInterval(function () {
            document.body.style.backgroundColor = 'rgba('
                + Math.floor(Math.random()*2)*255
                + ','
                + Math.floor(Math.random()*2)*255
                + ','
                + Math.floor(Math.random()*2)*255
                + ',0.5)';
        }, 400);
        document.onclick = function (e) {
           ponyplace.doMove(e.layerX, e.layerY);
        };
    };
}());
