(function backbone_eye(root) {

    if ((typeof root.Backbone !== 'undefined') && (typeof root._ !== 'undefined')) {

        var Backbone = root.Backbone;
        var _ = root._;

        var proxyable = ['Model', 'Collection', 'View'];
        var operations = [
            {instance:[], proto:["save", "fetch", "set", "unset", "clear", "destroy", "sync"]},
            {instance:[], proto:["save", "fetch", "set", "unset", "clear", "destroy", "sync",
                "add", "remove", "reset", "sort", "create"]},
            {instance:["render", "remove"], proto:[]}
        ];
        var proxy = [Backbone.Model, Backbone.Collection, Backbone.View];
        var proxyproto = [
            Backbone.Model.prototype,
            Backbone.Collection.prototype,
            Backbone.View.prototype
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
                root.dispatchEvent(new CustomEvent('Backbone_Eye:ERROR', {'detail':{error:e}}));
            }
        };

        var womb = function (entity_type, operation_type) {

            return function (id, oldval, newval) {

                var wrapper = function () {
                    recordEvent(this, entity_type, false, arguments, operation_type);
                    var result;
                    try {
                        _.extend(newval, wrapper);
                        result = newval.apply(this, arguments);
                    } catch (e) {
                        root.dispatchEvent(new CustomEvent('Backbone_Eye:ERROR', {'detail':{error:e}}));
                    }
                    recordEvent(this, entity_type, true, arguments, operation_type);
                    return result;
                }
                return wrapper;
            }
        };


        var createDebuggableScript = function (id, oldval, newval) {
            var getMatchingNode = function (tag, tagbody) {
                var elements = root.document.getElementsByTagName(tag);

                for (var i = 0; i < elements.length; i++) {
                    var val = elements[i].textContent;
                    if (val == tagbody) {
                        return elements[i];
                    }
                }
                return undefined;
            }

            var wrapper = function (text, data, settings) {
                _.extend(newval, wrapper);
                if (text) {
                    var script = getMatchingNode("script", text)
                    var script_id = (script && script.id) ? script.id : _.uniqueId("template_");
                    var proxiedTemplateRef = '_t' + script_id;
                    var compiledTemplate = root[proxiedTemplateRef];
                    if (!compiledTemplate) {
                        root.dispatchEvent(new CustomEvent('Backbone_Eye:TEMPLATE:ADD', {
                            'detail':{
                                script_id:script_id,
                                text:text,
                                settings:_.defaults({}, settings ,_.templateSettings)
                            }
                        }));
                        compiledTemplate = newval.call(_, text, undefined, settings);
                    }
                    if (data) {//Data
                        root.dispatchEvent(
                            new CustomEvent('Backbone_Eye:TEMPLATE:INFER', {'detail':{script_id:script_id}}));
                        return compiledTemplate.call(_, data)
                    }
                    return function (tdata) {
                        root.dispatchEvent(
                            new CustomEvent('Backbone_Eye:TEMPLATE:INFER', {'detail':{script_id:script_id}}));

                        return root[proxiedTemplateRef] ?
                            root[proxiedTemplateRef].call(_, tdata) :
                            compiledTemplate.call(_, tdata);
                    }
                } else {
                    root.dispatchEvent(new CustomEvent('Backbone_Eye:ERROR',
                        {'detail':{error:"Template Text is empty"}}));
                    return newval.apply(_, arguments);
                }
            }
            return wrapper;
        };

        _.watch("template", createDebuggableScript);
        _["template"] = _["template"];

        for (var i = 0; i < proxyable.length; ++i) {
            (function (entity, proxy, proxyproto, operation) {
                if (proxy) {
                    Backbone[entity] = function () {
                        var event = new CustomEvent('Backbone_Eye:ADD', {'detail':{data:this, entity_type:entity}});
                        root.dispatchEvent(event);
                        _.each(operation.instance, function (key) {
                            if (this[key]) {
                                this.watch(key, womb(entity, key));
                                this[key] = this[key];
                            }
                        }, this);
                        return proxy.apply(this, arguments);
                    };

                    Backbone[entity].prototype = proxyproto;
                    Backbone[entity].prototype.constructor = Backbone[entity];
                    _.extend(Backbone[entity], proxy);

                    _.each(operation.proto, function (key) {
                        if (proxyproto[key]) {
                            proxyproto.watch(key, womb(entity, key));
                            proxyproto[key] = proxyproto[key];
                        }
                    });
                }
            })(proxyable[i], proxy[i], proxyproto[i], operations[i]);
        }
    } else {
        root.dispatchEvent(new CustomEvent('Backbone_Eye:ERROR', {'detail':{error:"Backbone not loaded..."}}));
    }
})(window);

