if (window.Backbone) {
    window.spa_eye = {};

    //Fix : Duplicate with common.js
    window.spa_eye.Operations = {
        SAVE:"save", FETCH:"fetch", SET:"set", UNSET:"unset", CLEAR:"clear", ADD:"add", RESET:"reset", SORT:"sort",
        DESTROY:"destroy", SYNC:"sync", CREATE:"create"
    };

    window.spa_eye.proxyable = ['Model', 'Collection', 'View'];
    window.spa_eye.proxy = [window.Backbone.Model, window.Backbone.Collection, window.Backbone.View];
    window.spa_eye.proxyproto = [
        window.Backbone.Model.prototype,
        window.Backbone.Collection.prototype,
        window.Backbone.View.prototype
    ];
    window.spa_eye.womb = function (type) {

        return function (id, oldval, newval) {

            return function () {

                var event = new CustomEvent(
                    'Backbone_Eye:EXECUTE',
                    {'detail':{entity:this, post:false, args:arguments, type:type}}
                );
                window.dispatchEvent(event);

                var result = newval.apply(this, arguments);

                var event = new CustomEvent(
                    'Backbone_Eye:EXECUTE',
                    {'detail':{entity:this, post:true, args:arguments, type:type}}
                );

                window.dispatchEvent(event);

                return result;
            }
        }
    };

    for (var i = 0; i < window.spa_eye.proxyable.length; ++i) {
        (function (entity, proxy, proxyproto) {
            if (proxy) {
                window.Backbone[entity] = function () {
                    try {

                        var event = new CustomEvent('Backbone_Eye:ADD', {'detail':{data:this}});
                        window.dispatchEvent(event);

                        if (this instanceof window.Backbone.View) {
                            _.each(["remove", "render"], function (key) {
                                if (this[key]) {
                                    this.watch(key, window.spa_eye.womb(key));
                                    this[key] = this[key];
                                }
                            }, this);
                        }
                    } catch (e) {

                    }
                    return proxy.apply(this, arguments);
                };

                window.Backbone[entity].prototype = proxyproto;
                _.extend(window.Backbone[entity], proxy);

                if (proxy !== window.Backbone.View) {

                    _.each(window.spa_eye.Operations, function (key) {
                        if (proxyproto[key]) {
                            proxyproto.watch(key, window.spa_eye.womb(key));
                            proxyproto[key] = proxyproto[key];
                        }
                    }, this);
                }

            }
        })(window.spa_eye.proxyable[i], window.spa_eye.proxy[i], window.spa_eye.proxyproto[i]);
    }


}

