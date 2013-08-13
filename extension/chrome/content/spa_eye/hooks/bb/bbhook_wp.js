(function backbone_eye(root) {

    console.log(root);
    if (root.Backbone && root._) {

        var proxyable = ['Model', 'Collection', 'View'];
        var operations = [
            {instance:[], proto:["save", "fetch", "set", "unset", "clear", "destroy", "sync"]},
            {instance:[], proto:["save", "fetch", "set", "unset", "clear", "destroy", "sync",
                "add", "remove", "reset", "sort", "create"]},
            {instance:["render", "remove"], proto:[]}
        ];
        var proxy = [root.Backbone.Model, root.Backbone.Collection, root.Backbone.View];
        var proxyproto = [
            root.Backbone.Model.prototype,
            root.Backbone.Collection.prototype,
            root.Backbone.View.prototype
        ];

        var recordEvent = function (entity, entity_type, post, args, operation_type) {
            try {
                var event = new CustomEvent(
                    'Backbone_Eye:RECORD',
                    {'detail':{
                        entity:entity,
                        entity_type:entity_type,
                        post:post,
                        args:args,
                        operation_type:operation_type
                    }}
                );
                root.dispatchEvent(event);
            } catch (e) {
                console.log(e);
            }
            ;
        };

        var womb = function (entity_type, operation_type) {

            return function (id, oldval, newval) {

                return function () {
                    recordEvent(this, entity_type, false, arguments, operation_type);
                    var result = newval.apply(this, arguments);
                    recordEvent(this, entity_type, true, arguments, operation_type);
                    return result;
                }
            }
        };

        for (var i = 0; i < proxyable.length; ++i) {
            (function (entity, proxy, proxyproto, operation) {
                if (proxy) {
                    console.log("came here...");
                    root.Backbone[entity] = function () {
                        var event = new CustomEvent('Backbone_Eye:ADD', {'detail':{data:this}});
                        root.dispatchEvent(event);
                        root._.each(operation.instance, function (key) {
                            if (this[key]) {
                                this.watch(key, womb(entity, key));
                                this[key] = this[key];
                            }
                        }, this);
                        return proxy.apply(this, arguments);
                    };

                    root.Backbone[entity].prototype = proxyproto;
                    root._.extend(root.Backbone[entity], proxy);

                    root._.each(operation.proto, function (key) {
                        if (proxyproto[key]) {
                            proxyproto.watch(key, womb(entity, key));
                            proxyproto[key] = proxyproto[key];
                        }
                    });
                }
            })(proxyable[i], proxy[i], proxyproto[i], operations[i]);
        }
    } else {
        root.console && root.console.log("Backbone not loaded...")
    }
})(window);

