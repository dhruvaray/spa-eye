if (window.Backbone) {
    window.spa_eye = {};
    window.spa_eye.idCounter = 0;

    window.spa_eye.uniqueId = function (prefix) {
        var id = ++this.idCounter + '';
        return prefix ? prefix + id : id;
    };

    window.spa_eye.proxyable = ['Model', 'Collection', 'View'];
    window.spa_eye.proxy = {};
    window.spa_eye.proxyproto = {};
    window.spa_eye.store = ['models', 'collections', 'views'];
    window.spa_eye.prefix = ['c', 'col', 'view'];
    for (var i = 0; i < window.spa_eye.store.length; ++i)
        window.spa_eye[window.spa_eye.store[i]] = [];

    for (var i = 0; i < window.spa_eye.proxyable.length; ++i) {
        (function (key, entity, prefix) {
            window.spa_eye.proxy[entity] = window.Backbone[entity];
            if (window.spa_eye.proxy[entity]) {
                window.spa_eye.proxyproto[entity] = window.Backbone[entity].prototype;
                window.Backbone[entity] = function (attributes, options) {
                    this.cid = this.cid || (typeof(window._) === "undefined")
                        ? window.spa_eye.uniqueId(prefix)
                        : window._.uniqueId(prefix);

                    window.spa_eye[key].push(this);
                    var result = window.spa_eye.proxy[entity].apply(this, arguments);
                    var event = new CustomEvent('Backbone_Eye:ADD', {'detail':{'type':entity, data:this}});
                    window.dispatchEvent(event);
                    return result;
                };
                window.Backbone[entity].prototype = window.spa_eye.proxyproto[entity];
                _.extend(window.Backbone[entity], window.spa_eye.proxy[entity]);
            }
            ;
        })(window.spa_eye.store[i], window.spa_eye.proxyable[i], window.spa_eye.prefix[i]);
    }
}
;
