(function () {
    'use strict';
    var ponyplace;
    window.onload = function () {
        ponyplace = parent.ponyplace;

        if (!ponyplace.hasAccount()) {
            var p = document.createElement('p');
            p.appendChild(document.createTextNode('You need to create an account (see top-right, Account Settings) to be able to buy more avatars.'));
            document.body.appendChild(p);
            return;
        }
        ponyplace.getCatalogue(catalogueName, function (catalogue) {
            for (var i = 0; i < catalogue.length; i++) {
                var item = catalogue[i];

                var have = 0;
                for (var j = 0; j < item.items.length; j++) {
                    if (item.items[0].type === 'avatar' && ponyplace.hasAvatar(item.items[0].avatar_name)) {
                        have++;
                    }
                }

                var catalogueitem = document.createElement('div');
                catalogueitem.className = 'catalogue-item';
                if (have) {
                    catalogueitem.className += ' catalogue-item-have';
                }

                var img = document.createElement('img');
                img.className = 'chooser-preview';
                img.src = item.img;
                catalogueitem.appendChild(img);

                var h2 = document.createElement('h2');
                h2.appendChild(document.createTextNode(item.name_full));
                catalogueitem.appendChild(h2);

                if (have) {
                    var p = document.createElement('p');
                    p.appendChild(document.createTextNode('You already have: ' + have + '/' + item.items.length + ' items of this product'));
                    catalogueitem.appendChild(p);
                }

                if (have !== item.items.length) {
                    var buy = document.createElement('input');
                    buy.type = 'submit';
                    buy.value = 'Buy for ' + item.price + ' bits';
                    (function (catalogueName, itemIndex, itemName, itemPrice) {
                        buy.onclick = function () {
                            ponyplace.buy(catalogueName, itemIndex, itemName, itemPrice);
                        };
                    }(catalogueName, i, item.name_full, item.price));
                    catalogueitem.appendChild(buy);
                }
                
                document.body.appendChild(catalogueitem);
            }
        });
    };
}());
