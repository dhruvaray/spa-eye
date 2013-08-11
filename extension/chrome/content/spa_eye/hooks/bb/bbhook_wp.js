if (window.Backbone) {
    window.spa_eye = {};

    window.spa_eye.proxyable = ['Model', 'Collection', 'View'];
    window.spa_eye.proxy = [window.Backbone.Model, window.Backbone.Collection, window.Backbone.View];
    window.spa_eye.proxyproto = [
        window.Backbone.Model.prototype,
        window.Backbone.Collection.prototype,
        window.Backbone.View.prototype
    ];

    for (var i = 0; i < window.spa_eye.proxyable.length; ++i) {
        (function (entity, proxy, proxyproto) {
            if (proxy) {
                window.Backbone[entity] = function () {
                    var result = proxy.apply(this, arguments);
                    var event = new CustomEvent('Backbone_Eye:ADD', {'detail':{data:this}});
                    window.dispatchEvent(event);
                    return result;
                };
                window.Backbone[entity].prototype = proxyproto;
                _.extend(window.Backbone[entity], proxy);
            }
            ;
        })(window.spa_eye.proxyable[i], window.spa_eye.proxy[i], window.spa_eye.proxyproto[i]);
    }
}
;
