if (window.Backbone) {

    (function backbone_eye() {

        //Fix : Duplicate with common.js
        var operations = {
            SAVE:"save", FETCH:"fetch", SET:"set", UNSET:"unset", CLEAR:"clear", ADD:"add", RESET:"reset", SORT:"sort",
            DESTROY:"destroy", SYNC:"sync", CREATE:"create"
        };

        proxyable = ['Model', 'Collection', 'View'];
        proxy = [window.Backbone.Model, window.Backbone.Collection, window.Backbone.View];
        proxyproto = [
            window.Backbone.Model.prototype,
            window.Backbone.Collection.prototype,
            window.Backbone.View.prototype
        ];
        womb = function (type) {

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

        for (var i = 0; i < proxyable.length; ++i) {
            (function (entity, proxy, proxyproto) {
                if (proxy) {
                    window.Backbone[entity] = function () {
                        try {

                            var event = new CustomEvent('Backbone_Eye:ADD', {'detail':{data:this}});
                            window.dispatchEvent(event);

                            if (this instanceof window.Backbone.View) {
                                _.each(["remove", "render"], function (key) {
                                    if (this[key]) {
                                        this.watch(key, womb(key));
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

                        _.each(operations, function (key) {
                            if (proxyproto[key]) {
                                proxyproto.watch(key, womb(key));
                                proxyproto[key] = proxyproto[key];
                            }
                        }, this);
                    }

                }
            })(proxyable[i], proxy[i], proxyproto[i]);
        }
    }).call(this);

}

